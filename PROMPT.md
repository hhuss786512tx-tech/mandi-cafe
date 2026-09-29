# Build Prompt — Mandi Cafe & Grill Website

Paste this whole prompt into the builder (Claude Code or similar). Fill in the `[CONFIRM]` items first, or leave them as clearly-marked placeholders. Do not invent facts.

---

## 1. Role and standard

You are a senior front-end engineer and art director building a production marketing website for a real, local restaurant. The bar is a studio-grade restaurant site: restrained, editorial, fast, accessible. It must **not** look like a template or AI-generated page. No purple-to-blue gradients, no emoji, no generic "Welcome to our website" copy, no stock-photo hero, no lorem ipsum, no glassmorphism cards stacked in a grid, no centered-everything layout.

## 2. Business facts (source of truth)

| Field | Value |
|---|---|
| Name | Mandi Cafe & Grill |
| Cuisine | Halal Yemeni / Middle Eastern |
| Address | 734 Crabb River Rd, Richmond, TX `[CONFIRM ZIP — likely 77469]` |
| Phone | (832) 867-3737 → `tel:+18328673737` |
| Hours | `[CONFIRM from Google Business Profile]` |
| Dine-in / takeout / delivery | `[CONFIRM]` |
| Online ordering link | `[CONFIRM — else omit; do not fake a checkout]` |
| Social links | `[CONFIRM — else omit]` |

Rules:
- Use **only** confirmed facts. Anything unconfirmed is a visible `TODO` in a build note, never invented copy.
- Menu items and prices must come from the restaurant's real menu (Google listing, menu photos, or the owner). Do not fabricate dishes or prices. Typical Yemeni dishes (e.g. mandi, haneeth, saltah, fahsa, zurbian, shakshouka, Yemeni chai/karak) may be used only if confirmed on their menu.
- Do not claim awards, years in business, "family recipe", or reviews unless verified. Real review quotes only, with source, or omit.

## 3. Photography (their Google photos)

- Source: the restaurant's Google Business Profile / Maps photos. **Only use images the owner has approved.** Google Maps images are user-uploaded and copyrighted; get owner sign-off (ideally originals from the owner directly) before shipping.
- Place originals in `assets/img/source/`. Do not hotlink Google URLs.
- Pipeline: audit every photo → keep only the sharp, well-lit ones → color-correct consistently → export AVIF + WebP + JPEG fallback at 640 / 1280 / 1920 wide → generate a 24px blurred placeholder for each.
- Use `<picture>` with `srcset`/`sizes`, explicit `width`/`height`, `loading="lazy"` (hero: `fetchpriority="high"`), meaningful `alt` text describing the actual dish or space.
- Art-direct crops per breakpoint with `object-position`. If a photo is low-res, use it small; never upscale-blur it into a hero.
- Include an `assets/img/CREDITS.md` listing each image, its origin, and approval status.

## 4. Design direction

- **Concept:** warm, confident, hospitable. Reference the food — copper serving trays, saffron/turmeric, charred rice, cardamom, cream stone, deep coffee brown. Not a "generic Middle Eastern" costume (no clip-art arches, no fake calligraphy, no magic-carpet fonts).
- **Palette (tokens in CSS variables):** deep espresso `#1B120D`, warm cream `#F4EBDD`, saffron `#C98A1B`, burnt copper `#A4552B`, muted olive `#5B6135`. Verify WCAG AA contrast for every text/background pair.
- **Type:** one refined serif for display (e.g. Fraunces or Cormorant Garamond), one clean grotesk for text (e.g. Inter Tight / Manrope). Self-host WOFF2, `font-display: swap`, subset to Latin. Fluid type scale with `clamp()`.
- **Layout:** 12-col grid, generous whitespace, asymmetric editorial compositions, large full-bleed photography, hairline rules, consistent 8px spacing scale. Mobile-first; most visitors are on phones looking for hours, directions, and the menu.
- **Arabic:** include the name in Arabic script `[CONFIRM spelling with owner]` as a small typographic accent using Noto Naskh Arabic / Amiri. Do not invent Arabic copy.

## 5. Pages / sections

Single-page site with anchored sections plus a dedicated menu page, or a small multi-page site — choose whichever loads and navigates faster.

1. **Header:** wordmark, anchor nav (Menu, Story, Gallery, Visit), persistent `Call` and `Directions` actions on mobile (sticky bottom bar).
2. **Hero:** one strong real photo (or the 3D scene, see §6), name, one-line descriptor ("Halal Yemeni & Middle Eastern kitchen in Richmond, TX"), primary CTA `View menu`, secondary `Get directions`. Open/closed status computed from real hours.
3. **Signature dishes:** 3–5 dishes with real photos, name, short honest description, price if confirmed.
4. **Menu:** full menu grouped by category, filterable/anchored, prices aligned, dietary notes (halal statement, spice level) only where true. Also provide a downloadable/printable version `[CONFIRM]`.
5. **Story / about:** short, specific, human. Written from facts provided by the owner; placeholder block if none.
6. **Gallery:** curated 8–12 images, keyboard-navigable lightbox, no autoplay carousel.
7. **Visit:** address, embedded map (click-to-load to avoid third-party weight), hours table, phone, parking notes `[CONFIRM]`, delivery/order links.
8. **Footer:** NAP (name, address, phone) identical to Google listing, social links, © line.

## 6. 3D and motion

Goal: tasteful depth that makes the food feel tangible, never gimmicky, never blocking content.

**Hero 3D (Three.js, or React Three Fiber if using React):**
- A slowly rotating, physically lit 3D scene of a **copper mandi serving tray with a mound of rice, spices and a lamb/chicken cut**, or floating saffron threads/cardamom pods drifting in a warm light volume, whichever can be built convincingly.
- Preferred asset path: a compressed **glTF/GLB** (Draco or Meshopt, KTX2 textures, **< 1.5 MB**). If no model is available, build a stylized procedural scene (lathe geometry tray, instanced rice grains, particle spices) rather than a poor pre-made model.
- Lighting: one warm key, one soft fill, subtle HDRI environment for copper reflections, soft contact shadow. Tone mapping ACES, sRGB output.
- Interaction: subtle parallax to pointer/gyroscope; scroll-linked camera dolly and dish rotation between sections. No orbit controls that hijack scroll.
- **Performance budget:** hero LCP < 2.5s on mid-range mobile; 3D lazy-initialised after first paint; total JS < 250 KB gzip excluding the lazily-loaded three chunk; cap DPR at 2; pause rendering when off-screen (`IntersectionObserver`) or tab hidden.
- **Fallbacks:** feature-detect WebGL; on failure, `prefers-reduced-motion`, or Save-Data, show the static hero photo. Poster image must be the LCP element so the page is fast even without 3D.

**Scroll and UI motion (GSAP + ScrollTrigger, or CSS scroll-driven animations):**
- Section reveals with masked text lines and image clip-path wipes; 400–700 ms, custom cubic-bezier easing, staggered.
- Menu photos get a gentle 3D tilt on hover (pointer devices only) with soft specular highlight.
- Smooth, non-jacking scrolling. Do not override native scroll speed; if using Lenis, keep defaults conservative and disable under reduced-motion.
- Everything animates `transform`/`opacity` only. No layout thrash.
- Respect `prefers-reduced-motion: reduce` globally: no parallax, no auto-rotation, instant reveals.

## 7. Technical requirements

- Stack: Vite + vanilla TypeScript (or Astro) with Three.js and GSAP; static output deployable to Vercel/Netlify/Cloudflare Pages. No heavy framework unless justified.
- Semantic HTML5 landmarks, one `h1`, logical heading order, skip link, visible focus states, ≥44px touch targets.
- WCAG 2.2 AA. Test with keyboard and screen reader. Lightbox traps focus and closes on Esc.
- SEO: unique `<title>` and meta description, canonical, Open Graph/Twitter cards with a real 1200×630 image, `robots.txt`, `sitemap.xml`.
- **Structured data (JSON-LD):** `Restaurant` with `servesCuisine` (Yemeni, Middle Eastern), `address`, `telephone`, `openingHoursSpecification`, `hasMenu`, `image`, `priceRange` `[CONFIRM]`, `url`. Data must match the Google listing exactly.
- Local SEO copy naturally includes "Richmond, TX", "Crabb River Rd", "halal", "Yemeni" without keyword stuffing.
- Performance targets (mobile Lighthouse): Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, SEO 100. CLS < 0.05, INP < 200 ms.
- Privacy: no tracking cookies. If analytics, use cookieless (Plausible/Umami). Map embed loads on click.
- No form unless needed; if a catering/inquiry form is included, validate server-side, add honeypot + rate limit, and route to an email `[CONFIRM]`.

## 8. Repository layout

```
mandi-cafe/
  PROMPT.md
  index.html
  src/ (main.ts, scene/, styles/, content/)
  public/ (fonts/, models/, img/, favicon set, og.jpg)
  assets/img/source/  assets/img/CREDITS.md
  README.md  (how to run, build, replace photos/menu, deploy)
```

Menu and hours live in a single `src/content/site.json` so the owner can update them without touching code.

## 9. Quality gates before "done"

1. Run Lighthouse (mobile + desktop) and report scores.
2. Test on real widths: 360, 390, 768, 1024, 1440, 1920; iOS Safari and Chrome Android behaviour for the 3D scene.
3. Verify reduced-motion and no-WebGL fallbacks visually.
4. Validate JSON-LD in Google's Rich Results Test.
5. Confirm phone, directions, and map links work.
6. Self-review against the "not AI-looking" checklist: no gradient-text headlines, no identical three-card rows, no emoji icons, no filler copy, no unexplained decorative blobs, every image real and cropped on purpose.

## 10. Deliverables

- Working site in `mandi-cafe/`, built output, README, credits file.
- A short list of every `[CONFIRM]` item still open.
- Screenshots (mobile + desktop) of each section and a Lighthouse summary.
