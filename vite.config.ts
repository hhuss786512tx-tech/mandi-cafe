import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { renderTemplate } from './scripts/render.mjs';

const root = __dirname;
const SITE = resolve(root, 'src/content/site.json');
const IMAGES = resolve(root, 'src/content/images.json');

function loadContent() {
  const site = JSON.parse(readFileSync(SITE, 'utf8'));
  const images = existsSync(IMAGES) ? JSON.parse(readFileSync(IMAGES, 'utf8')) : {};
  return { site, images };
}

// Fills index.html / menu.html from site.json at build and dev time so the
// output is fully static HTML (menu, hours and JSON-LD need no JavaScript).
function contentPlugin() {
  return {
    name: 'mandi-content',
    configureServer(server: any) {
      server.watcher.add([SITE, IMAGES]);
      server.watcher.on('change', (f: string) => {
        if (f === SITE || f === IMAGES) server.ws.send({ type: 'full-reload' });
      });
    },
    transformIndexHtml: {
      order: 'pre' as const,
      handler(html: string, ctx: { filename: string }) {
        const page = ctx.filename.endsWith('menu.html') ? 'menu' : 'home';
        return renderTemplate(html, { ...loadContent(), page });
      },
    },
  };
}

export default defineConfig({
  plugins: [contentPlugin()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 600,
    modulePreload: { polyfill: false },
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        menu: resolve(root, 'menu.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/gsap')) return 'gsap';
        },
      },
    },
  },
});
