// Lighthouse (mobile + desktop) against the built site. Output: docs/lighthouse/.
import lighthouse from 'lighthouse';
import { launch as launchChrome } from 'chrome-launcher';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromePath } from './browser.mjs';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = join(ROOT, 'docs/lighthouse');
await mkdir(OUT, { recursive: true });
const server = await preview({ root: ROOT, preview: { port: 4198, strictPort: true }, logLevel: 'error' });
const chrome = await launchChrome({ chromePath, chromeFlags: ['--headless=new', '--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const summary = {};
try {
  for (const [name, formFactor] of [['mobile', 'mobile'], ['desktop', 'desktop']]) {
    for (const [path, suffix] of [['/', ''], ['/?nowebgl=1', '-poster'], ['/menu.html', '-menu']]) {
      const label = `${name}${suffix}`;
      const res = await lighthouse(`http://localhost:4198${path}`, {
        port: chrome.port, output: ['html', 'json'], logLevel: 'error', formFactor,
        screenEmulation: formFactor === 'desktop' ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false } : undefined,
        throttlingMethod: 'simulate',
      });
      const cats = res.lhr.categories;
      const a = res.lhr.audits;
      summary[label] = {
        performance: Math.round(cats.performance.score * 100),
        accessibility: Math.round(cats.accessibility.score * 100),
        bestPractices: Math.round(cats['best-practices'].score * 100),
        seo: Math.round(cats.seo.score * 100),
        lcp: a['largest-contentful-paint'].displayValue,
        cls: a['cumulative-layout-shift'].displayValue,
        tbt: a['total-blocking-time'].displayValue,
        fcp: a['first-contentful-paint'].displayValue,
      };
      await writeFile(join(OUT, `${label}.html`), res.report[0]);
      await writeFile(join(OUT, `${label}.json`), res.report[1]);
      console.log(label, JSON.stringify(summary[label]));
    }
  }
  await writeFile(join(OUT, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
} finally {
  await chrome.kill();
  await server.close();
}
