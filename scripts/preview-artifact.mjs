// Builds a self-contained preview bundle for publishing as a claude.ai artifact:
// relative asset paths, CSS inlined, page body without its own document wrapper.
import { build } from 'vite';
import { readFile, writeFile, readdir, mkdir, cp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'dist-preview');
await rm(OUT, { recursive: true, force: true });
await build({ root: ROOT, base: './', logLevel: 'error', build: { outDir: OUT, emptyOutDir: true } });

const cssFile = (await readdir(join(OUT, 'assets'))).find(f => f.endsWith('.css'));
let css = await readFile(join(OUT, 'assets', cssFile), 'utf8');
css = css.replace(/url\((['"]?)(?:\.\.\/|\/)(fonts|img)\//g, 'url($1$2/');

const relativize = html => html
  .replace(/(href|src|srcset|imagesrcset|content|data-src)="\/(?!\/)/g, '$1="')
  .replace(/, \/(img\/)/g, ', $1')
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>${css}</style>`)
  .replace(/<link rel="preload" href="\/fonts/g, '<link rel="preload" href="fonts')
  .replace(/href="\/"/g, 'href="index.html"');

// index.html -> page body only (the artifact wraps it in its own skeleton)
let index = await readFile(join(OUT, 'index.html'), 'utf8');
const title = index.match(/<title>(.*?)<\/title>/)[1].split(' · ')[0];
const body = index.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
const head = index.match(/<head>([\s\S]*)<\/head>/)[1];
const keep = head.split('\n').filter(l => /rel="preload"|rel="stylesheet"|rel="modulepreload"|<script type="module"/.test(l)).join('\n');
const page = relativize(`<title>${title}</title>\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n${keep}\n${body}`);
await writeFile(join(OUT, 'page.html'), page);

// menu.html stays a full document (served as-is), CSS inlined, paths relative
let menu = await readFile(join(OUT, 'menu.html'), 'utf8');
await writeFile(join(OUT, 'menu.html'), relativize(menu));
await rm(join(OUT, 'index.html'));
await rm(join(OUT, 'assets', cssFile));

const files = {};
for (const dir of ['assets', 'img', 'fonts']) for (const f of await readdir(join(OUT, dir))) files[`${dir}/${f}`] = `dist-preview/${dir}/${f}`;
for (const f of ['menu.html', 'favicon.svg', 'og.jpg']) files[f] = `dist-preview/${f}`;
await writeFile(join(OUT, 'files.json'), JSON.stringify(files, null, 2));
console.log(Object.keys(files).length, 'files;', 'page', (page.length / 1024).toFixed(0), 'KB');
console.log([...page.matchAll(/(src|href|srcset|imagesrcset)="([^"]+)"/g)].map(m => m[2].split(',')[0]).filter(u => !u.startsWith('#') && !u.startsWith('http') && !u.startsWith('tel')).slice(0, 12).join('\n'));
