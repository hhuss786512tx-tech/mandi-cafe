// After `vite build`: write robots.txt + sitemap.xml, and check the JS budget.
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const site = JSON.parse(await readFile(join(ROOT, 'src/content/site.json'), 'utf8'));
const url = site.siteUrl.value.replace(/\/$/, '');
if (site.siteUrl.confirmed === false) console.warn(`! siteUrl is unconfirmed (${url}). Fix src/content/site.json before launch.`);

const today = new Date().toISOString().slice(0, 10);
await writeFile(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${url}/sitemap.xml\n`);
await writeFile(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${url}/</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>
  <url><loc>${url}/menu.html</loc><lastmod>${today}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>
</urlset>
`);

// JS budget: everything except the lazily-loaded three chunk must stay under 250 KB gzip.
const assets = join(DIST, 'assets');
let core = 0, three = 0;
for (const f of await readdir(assets)) {
  if (!f.endsWith('.js')) continue;
  const gz = gzipSync(await readFile(join(assets, f))).length;
  const isThree = /^(three|hero)[-.]/.test(f);
  if (isThree) three += gz; else core += gz;
  console.log(`${f.padEnd(28)} ${(gz / 1024).toFixed(1).padStart(7)} KB gzip${isThree ? '  (lazy)' : ''}`);
}
console.log(`core JS: ${(core / 1024).toFixed(1)} KB gzip (budget 250) · lazy 3D: ${(three / 1024).toFixed(1)} KB gzip`);
if (core > 250 * 1024) { console.error('JS budget exceeded'); process.exit(1); }
const s = await stat(join(DIST, 'index.html'));
console.log(`index.html ${(s.size / 1024).toFixed(1)} KB`);

// docs/CONFIRM.md: every open [CONFIRM] item, generated from site.json
import { collectUnconfirmed } from './render.mjs';
import { mkdir } from 'node:fs/promises';
const open = collectUnconfirmed(site);
await mkdir(join(ROOT, 'docs'), { recursive: true });
await writeFile(join(ROOT, 'docs/CONFIRM.md'), `# Open items to confirm with the owner

Generated from \`src/content/site.json\` on ${today}. Each item is a field with
\`"confirmed": false\`; set the value, flip the flag, rebuild.

${open.map((n, i) => `${i + 1}. **\`${n.path}\`** — ${n.note}`).join('\n')}
`);
console.log(`docs/CONFIRM.md: ${open.length} open items`);
