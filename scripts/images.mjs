// Image pipeline: assets/img/source/* -> public/img/{id}-{w}.{avif,webp,jpg}
// plus a 24px blurred placeholder, recorded in src/content/images.json.
import sharp from 'sharp';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const SRC = join(ROOT, 'assets/img/source');
const OUT = join(ROOT, 'public/img');
const WIDTHS = [640, 960, 1280, 1920];
const EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff']);

await mkdir(OUT, { recursive: true });
const manifest = JSON.parse(await readFile(join(SRC, 'manifest.json'), 'utf8').catch(() => '{}'));
const files = (await readdir(SRC)).filter(f => EXT.has(extname(f).toLowerCase()));
const images = {};

for (const file of files) {
  const meta = manifest[file] ?? {};
  if (meta.skip) continue;
  const id = meta.id ?? basename(file, extname(file));
  if (!meta.alt) console.warn(`! ${file}: no alt text in manifest.json — add one before shipping.`);
  const input = sharp(join(SRC, file)).rotate();
  const { width, height } = await input.metadata();
  const widths = WIDTHS.filter(w => w <= width);
  if (widths.length === 0) widths.push(width);
  const lowRes = width < 1280;
  if (lowRes) console.warn(`! ${file}: only ${width}px wide. Use it small; never as a hero.`);

  let outW = 0, outH = 0;
  for (const w of widths) {
    const pipe = input.clone().resize({ width: w, withoutEnlargement: true });
    const [a, b, c] = await Promise.all([
      pipe.clone().avif({ quality: 55, effort: 4 }).toFile(join(OUT, `${id}-${w}.avif`)),
      pipe.clone().webp({ quality: 78 }).toFile(join(OUT, `${id}-${w}.webp`)),
      pipe.clone().jpeg({ quality: 80, mozjpeg: true, progressive: true }).toFile(join(OUT, `${id}-${w}.jpg`)),
    ]);
    outW = c.width; outH = c.height;
    process.stdout.write(`${id}-${w}: avif ${kb(a.size)} webp ${kb(b.size)} jpg ${kb(c.size)}\n`);
  }
  const ph = await input.clone().resize({ width: 24 }).blur(1).jpeg({ quality: 50 }).toBuffer();
  images[id] = {
    alt: meta.alt ?? id.replace(/[-_]/g, ' '),
    width: outW, height: outH, widths, formats: ['avif', 'webp', 'jpg'],
    placeholder: `data:image/jpeg;base64,${ph.toString('base64')}`,
    source: file, lowRes, origin: meta.origin ?? '', approved: meta.approved ?? false,
  };
}

// favicon set from public/favicon.svg
const svg = join(ROOT, 'public/favicon.svg');
if (await stat(svg).catch(() => null)) {
  for (const [name, size] of [['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
    await sharp(svg, { density: 384 }).resize(size, size).png().toFile(join(ROOT, 'public', name));
  }
}

await writeFile(join(ROOT, 'src/content/images.json'), JSON.stringify(images, null, 2) + '\n');
console.log(`wrote src/content/images.json (${Object.keys(images).length} images)`);
function kb(n) { return `${(n / 1024).toFixed(0)}k`; }
