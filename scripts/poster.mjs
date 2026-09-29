// Renders the hero 3D scene to assets/img/source/hero-poster.png (4:3, 2400px)
// and public/og.jpg (1200×630) using the dev server and headless Chromium.
import { createServer } from 'vite';
import sharp from 'sharp';
import { join, resolve } from 'node:path';
import { launch } from './browser.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const server = await createServer({ root: ROOT, server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const base = 'http://localhost:5199';
const browser = await launch();
const t0 = Date.now();
const log = m => console.log(`[${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

try {
  // Hero poster: scene fills the viewport at 2400×1800.
  const page = await browser.newPage({ viewport: { width: 1920, height: 1440 }, deviceScaleFactor: 1 });
  await page.goto(`${base}/?poster=1`, { waitUntil: 'load' });
  log('poster page loaded');
  await page.waitForFunction(() => window.__sceneReady === true, null, { timeout: 60_000 });
  log('scene ready'); await page.waitForTimeout(400);
  const png = await page.screenshot({ type: 'png' });
  await sharp(png).png({ compressionLevel: 9 }).toFile(join(ROOT, 'assets/img/source/hero-poster.png'));
  log('wrote assets/img/source/hero-poster.png');
  await page.close();

  // OG image: the real hero layout at 1200×630.
  const og = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await og.goto(`${base}/?scene=1`, { waitUntil: 'load' });
  await og.waitForFunction(() => window.__sceneReady === true, null, { timeout: 60_000 });
  await og.evaluate(() => document.fonts.ready);
  log('og scene ready'); await og.waitForTimeout(1200);
  const ogPng = await og.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  await sharp(ogPng).jpeg({ quality: 82, mozjpeg: true }).toFile(join(ROOT, 'public/og.jpg'));
  await sharp(ogPng).png().toFile(join(ROOT, 'assets/img/source/og-source.png'));
  log('wrote public/og.jpg');
} finally {
  await browser.close();
  await server.close();
}
