// Full-page and per-section screenshots of the built site at the review widths,
// plus reduced-motion and no-WebGL fallbacks. Output: docs/screenshots/.
import { preview } from 'vite';
import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { launch } from './browser.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'docs/screenshots');
await mkdir(OUT, { recursive: true });
const server = await preview({ root: ROOT, preview: { port: 4199, strictPort: true }, logLevel: 'error' });
const base = 'http://localhost:4199';
const browser = await launch();
const WIDTHS = [360, 390, 768, 1024, 1440, 1920];
const SECTIONS = ['hero', 'signatures', 'menu', 'story', 'gallery', 'visit', 'footer'];

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.querySelector('[data-scene]')?.classList.contains('is-3d') || !document.querySelector('[data-scene]'), null, { timeout: 30_000 }).catch(() => {});
  // Step through the page with instant scrolls (the site uses scroll-behavior: smooth,
  // which would swallow programmatic jumps) so every IntersectionObserver reveal has fired.
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y < document.body.scrollHeight; y += step) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise(r => setTimeout(r, 120)); }
    await new Promise(r => setTimeout(r, 900));
    window.scrollTo({ top: 0, behavior: 'instant' });
  });
  await page.waitForFunction(() => ![...document.querySelectorAll('[data-reveal]')].some(e => getComputedStyle(e).opacity !== '1'), null, { timeout: 15_000 }).catch(() => console.warn('! some reveals still hidden'));
  await page.waitForTimeout(600);
}

try {
  for (const w of WIDTHS) {
    const page = await browser.newPage({ viewport: { width: w, height: Math.round(w < 768 ? w * 2.05 : w * 0.62) }, deviceScaleFactor: 1 });
    await page.goto(`${base}/?scene=1`, { waitUntil: "load" });
    await settle(page);
    await page.screenshot({ path: join(OUT, `home-${w}.png`), fullPage: true });
    if (w === 390 || w === 1440) {
      for (const s of SECTIONS) {
        const el = s === 'hero' ? page.locator('[data-hero]') : s === 'footer' ? page.locator('footer.footer') : page.locator(`#${s}`);
        await el.evaluate(e => e.scrollIntoView({ behavior: 'instant', block: 'start' }));
        await page.waitForTimeout(1000);
        await el.screenshot({ path: join(OUT, `${s}-${w}.png`) });
      }
      await page.goto(`${base}/menu.html`, { waitUntil: "load" });
      await settle(page);
      await page.screenshot({ path: join(OUT, `menu-page-${w}.png`), fullPage: true });
    }
    await page.close();
    console.log(`home-${w}.png`);
  }
  // Fallbacks
  const rm = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await rm.goto(`${base}/`, { waitUntil: "load" });
  await rm.evaluate(() => document.fonts.ready); await rm.waitForTimeout(800);
  await rm.locator('[data-hero]').screenshot({ path: join(OUT, 'hero-1440-reduced-motion.png') });
  const nw = await browser.newPage({ viewport: { width: 390, height: 800 } });
  await nw.goto(`${base}/?nowebgl=1`, { waitUntil: "load" });
  await nw.evaluate(() => document.fonts.ready); await nw.waitForTimeout(800);
  await nw.locator('[data-hero]').screenshot({ path: join(OUT, 'hero-390-no-webgl.png') });
  console.log('fallback screenshots done');
} finally {
  await browser.close();
  await server.close();
}
