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
  // scroll through so scroll-triggered reveals have fired
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
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
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(800);
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
