// Server-side templating for index.html and menu.html.
// Called by the Vite plugin in vite.config.ts. Pure functions, no DOM.
// Tokens:
//   {{ path.to.value }}       simple value from site.json (html-escaped)
//   <!--@ blockName -->       rendered HTML block (see `blocks` below)

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Values wrapped as { value, confirmed, note } unwrap to value.
export function val(x) {
  return x && typeof x === 'object' && 'value' in x ? x.value : x;
}

function get(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_LABEL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
const DAY_SHORT = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };
const SCHEMA_DAY = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

export function fmtTime(hhmm) {
  let [h, m] = hhmm.split(':').map(Number);
  if (h === 24) h = 0;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m ? `${h12}:${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`;
}

function fmtRanges(ranges) {
  if (!ranges || ranges.length === 0) return 'Closed';
  return ranges.map(([a, b]) => `${fmtTime(a)} – ${fmtTime(b)}`).join(', ');
}

// Groups consecutive days with identical hours: [{days:'Mon – Thu', hours:'12 pm – 10 pm'}]
export function groupedHours(weekly) {
  const rows = [];
  for (const d of DAYS) {
    const h = fmtRanges(weekly[d]);
    const last = rows[rows.length - 1];
    if (last && last.hours === h) { last.to = d; } else { rows.push({ from: d, to: d, hours: h }); }
  }
  return rows.map(r => ({
    days: r.from === r.to ? DAY_LABEL[r.from] : `${DAY_SHORT[r.from]} – ${DAY_SHORT[r.to]}`,
    hours: r.hours,
  }));
}

export function fullAddress(site) {
  const a = site.address;
  return `${a.street}, ${a.city}, ${a.region} ${val(a.postalCode)}`;
}

export function directionsUrl(site) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(site.address.mapsQuery)}`;
}

export function mapEmbedUrl(site) {
  return `https://www.google.com/maps?q=${encodeURIComponent(site.address.mapsQuery)}&output=embed`;
}

export function price(p) {
  if (p == null) return '<span class="menu-item__price menu-item__price--tbc">Ask</span>';
  return `<span class="menu-item__price">$${p.toFixed(2)}</span>`;
}

export function allItems(site) {
  return site.menu.categories.flatMap(c => c.items.map(i => ({ ...i, category: c })));
}

// ---------- images ----------
// images.json: { id: { alt, width, height, widths:[...], formats:[...], placeholder, ... } }
export function picture(images, id, opts = {}) {
  const img = images[id];
  if (!img) return '';
  const sizes = opts.sizes || '100vw';
  const loading = opts.eager ? '' : ' loading="lazy" decoding="async"';
  const prio = opts.eager ? ' fetchpriority="high"' : '';
  const cls = opts.className ? ` class="${opts.className}"` : '';
  const styles = [];
  if (opts.position) styles.push(`object-position:${opts.position}`);
  if (img.placeholder) styles.push(`background:url(${img.placeholder}) center/cover no-repeat`);
  const pos = styles.length ? ` style="${styles.join(';')}"` : '';
  const srcset = fmt => img.widths.map(w => `/img/${id}-${w}.${fmt} ${w}w`).join(', ');
  const largest = img.widths[img.widths.length - 1];
  const sources = img.formats.filter(f => f !== 'jpg')
    .map(f => `<source type="image/${f === 'jpg' ? 'jpeg' : f}" srcset="${srcset(f)}" sizes="${sizes}">`)
    .join('');
  return `<picture${cls ? ` class="${opts.className}-wrap"` : ''}>${sources}<img${cls} src="/img/${id}-${largest}.jpg" srcset="${srcset('jpg')}" sizes="${sizes}" width="${img.width}" height="${img.height}" alt="${esc(img.alt)}"${loading}${prio}${pos}${opts.attrs ? ' ' + opts.attrs : ''}></picture>`;
}

// ---------- blocks ----------
export const blocks = {
  heroPoster(site, images) {
    if (!images['hero-poster']) return '<div class="hero__poster" aria-hidden="true"></div>';
    return `<div class="hero__poster">${picture(images, 'hero-poster', { eager: true, sizes: '(min-width: 64em) 58vw, 100vw', className: 'hero__img' })}</div>`;
  },

  preloadPoster(site, images) {
    const img = images['hero-poster'];
    if (!img) return '';
    const fmt = img.formats.includes('avif') ? 'avif' : (img.formats.includes('webp') ? 'webp' : 'jpg');
    const srcset = img.widths.map(w => `/img/hero-poster-${w}.${fmt} ${w}w`).join(', ');
    return `<link rel="preload" as="image" type="image/${fmt}" imagesrcset="${srcset}" imagesizes="(min-width: 64em) 58vw, 100vw" fetchpriority="high">`;
  },

  hoursTable(site) {
    const rows = groupedHours(site.hours.weekly)
      .map(r => `<tr><th scope="row">${esc(r.days)}</th><td>${esc(r.hours)}</td></tr>`).join('');
    return `<table class="hours"><caption class="sr-only">Opening hours</caption><tbody>${rows}</tbody></table>`;
  },

  status(site) {
    // Filled in by hours.ts on the client. Server-rendered fallback keeps the layout stable.
    return `<span class="status" data-status aria-live="polite"><span class="status__dot" aria-hidden="true"></span><span data-status-text>Open daily from ${esc(fmtTime(site.hours.weekly.mon[0][0]))}</span></span>`;
  },

  signatures(site, images) {
    const byId = Object.fromEntries(allItems(site).map(i => [i.id, i]));
    const items = site.signatures.map(id => byId[id]).filter(Boolean);
    return items.map((it, i) => {
      const pic = it.image ? picture(images, it.image, { sizes: '(min-width: 64em) 40vw, 100vw', className: 'sig__img' }) : '';
      return `<li class="sig${pic ? ' sig--photo' : ''}" data-reveal>
        <span class="sig__num" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span>
        ${pic ? `<figure class="sig__figure" data-tilt data-wipe>${pic}</figure>` : ''}
        <div class="sig__body">
          <h3 class="sig__name">${esc(it.name)}</h3>
          <p class="sig__desc">${esc(it.description)}</p>
          <p class="sig__meta"><span class="sig__cat">${esc(it.category.name)}</span>${it.price != null ? `<span class="sig__price">$${it.price.toFixed(2)}</span>` : ''}</p>
        </div>
      </li>`;
    }).join('\n');
  },

  menuJump(site) {
    return site.menu.categories.map(c => `<a href="#menu-${c.id}">${esc(c.name)}</a>`).join('');
  },

  menu(site, images, { headingLevel = 3 } = {}) {
    const H = `h${headingLevel}`, Hi = `h${headingLevel + 1}`;
    return site.menu.categories.map(c => `
      <section class="menu-group" id="menu-${c.id}" aria-labelledby="menu-${c.id}-title" data-reveal>
        <header class="menu-group__head">
          <${H} class="menu-group__title" id="menu-${c.id}-title">${esc(c.name)}</${H}>
          ${c.blurb ? `<p class="menu-group__blurb">${esc(c.blurb)}</p>` : ''}
        </header>
        <ul class="menu-list">
          ${c.items.map(it => `<li class="menu-item" id="item-${it.id}">
            <div class="menu-item__row">
              <${Hi} class="menu-item__name">${esc(it.name)}${it.serves ? ` <span class="menu-item__serves">serves ${esc(it.serves)}</span>` : ''}</${Hi}>
              <span class="menu-item__leader" aria-hidden="true"></span>
              ${price(it.price)}
            </div>
            ${it.description ? `<p class="menu-item__desc">${esc(it.description)}</p>` : ''}
          </li>`).join('')}
        </ul>
      </section>`).join('\n');
  },

  story(site) {
    return site.story.paragraphs.map(p => `<p>${esc(p)}</p>`).join('');
  },

  gallery(site, images) {
    const ids = site.gallery.images.filter(id => images[id]);
    if (ids.length === 0) {
      return site.buildNotes
        ? `<p class="placeholder">Photos will appear here once the owner approves them. See <a href="#build-notes">build notes</a>.</p>`
        : '';
    }
    return `<ul class="gallery__grid">${ids.map((id, i) => `
      <li class="gallery__item" data-wipe>
        <button type="button" class="gallery__btn" data-lightbox="${i}" aria-label="Open photo: ${esc(images[id].alt)}">
          ${picture(images, id, { sizes: '(min-width: 64em) 33vw, (min-width: 40em) 50vw, 100vw', className: 'gallery__img', position: '50% 30%' })}
        </button>
      </li>`).join('')}</ul>`;
  },

  orderLink(site, _images, { className = 'btn btn--ghost' } = {}) {
    const o = site.ordering;
    if (!o || !o.url) return '';
    return `<a class="${className}" href="${esc(o.url)}" rel="noopener" target="_blank">${esc(o.label)}<span class="sr-only"> (opens in a new tab)</span></a>`;
  },

  social(site) {
    if (!site.social?.length) return '';
    return `<ul class="footer__social">${site.social.map(s =>
      `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.platform)}<span class="sr-only"> (opens in a new tab)</span></a></li>`).join('')}</ul>`;
  },

  buildNotes(site) {
    if (!site.buildNotes) return '';
    const notes = collectUnconfirmed(site);
    return `<section class="build-notes" id="build-notes" aria-labelledby="build-notes-title">
      <div class="container">
        <h2 id="build-notes-title" class="build-notes__title">Build notes</h2>
        <p class="build-notes__lede">Items still to confirm with the owner before launch. Set <code>buildNotes</code> to <code>false</code> in <code>src/content/site.json</code> to remove this section.</p>
        <ol class="build-notes__list">${notes.map(n => `<li><strong>${esc(n.path)}</strong> ${esc(n.note)}</li>`).join('')}</ol>
      </div>
    </section>`;
  },

  jsonLdRestaurant(site, images) {
    const url = val(site.siteUrl);
    const spec = DAYS.filter(d => site.hours.weekly[d]?.length).flatMap(d =>
      site.hours.weekly[d].map(([o, c]) => ({
        '@type': 'OpeningHoursSpecification', dayOfWeek: SCHEMA_DAY[d], opens: o, closes: c === '24:00' ? '00:00' : c,
      })));
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Restaurant',
      name: site.name,
      url,
      image: [`${url}/og.jpg`],
      telephone: site.phone.e164,
      servesCuisine: site.cuisine,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address.street,
        addressLocality: site.address.city,
        addressRegion: site.address.region,
        postalCode: val(site.address.postalCode),
        addressCountry: site.address.country,
      },
      hasMenu: `${url}/menu.html`,
      openingHoursSpecification: spec,
    };
    if (val(site.priceRange)) data.priceRange = val(site.priceRange);
    if (site.social?.length) data.sameAs = site.social.map(s => s.url);
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  },

  jsonLdMenu(site) {
    const url = val(site.siteUrl);
    const data = {
      '@context': 'https://schema.org',
      '@type': 'Menu',
      name: `${site.name} menu`,
      url: `${url}/menu.html`,
      inLanguage: 'en-US',
      hasMenuSection: site.menu.categories.map(c => ({
        '@type': 'MenuSection',
        name: c.name,
        description: c.blurb,
        hasMenuItem: c.items.map(it => {
          const mi = { '@type': 'MenuItem', name: it.name, description: it.description };
          if (it.price != null) mi.offers = { '@type': 'Offer', price: it.price.toFixed(2), priceCurrency: 'USD' };
          return mi;
        }),
      })),
    };
    return `<script type="application/ld+json">${JSON.stringify(data)}</script>`;
  },
};

export function collectUnconfirmed(obj, path = '', out = []) {
  if (!obj || typeof obj !== 'object') return out;
  if (Array.isArray(obj)) { obj.forEach((v, i) => collectUnconfirmed(v, `${path}[${i}]`, out)); return out; }
  if (obj.confirmed === false) out.push({ path: path || 'site', note: obj.note || 'Confirm with owner.' });
  for (const [k, v] of Object.entries(obj)) {
    if (k === '$comment') continue;
    collectUnconfirmed(v, path ? `${path}.${k}` : k, out);
  }
  return out;
}

// ---------- template driver ----------
export function renderTemplate(html, { site, images, page }) {
  const ctx = {
    ...site,
    siteUrlValue: val(site.siteUrl),
    fullAddress: fullAddress(site),
    postalCode: val(site.address.postalCode),
    directionsUrl: directionsUrl(site),
    mapEmbedUrl: mapEmbedUrl(site),
    year: String(new Date().getFullYear()),
    nameArabicText: site.nameArabic.text,
    page,
  };
  html = html.replace(/<!--@\s*([\w.]+)(?:\s+(\{.*?\}))?\s*-->/g, (_, name, json) => {
    const fn = blocks[name];
    if (!fn) throw new Error(`Unknown block <!--@ ${name} -->`);
    return fn(site, images, json ? JSON.parse(json) : {});
  });
  html = html.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const v = val(get(ctx, path));
    if (v === undefined) throw new Error(`Unknown template value {{ ${path} }}`);
    return esc(v);
  });
  html = html.replace(/\{\{\{\s*([\w.]+)\s*\}\}\}/g, (_, path) => String(val(get(ctx, path)) ?? ''));
  return html;
}
