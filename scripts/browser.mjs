import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';

const candidates = [
  process.env.CHROME_PATH,
  '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome',
].filter(Boolean);

export const chromePath = candidates.find(p => existsSync(p));

export async function launch() {
  return chromium.launch({
    executablePath: chromePath,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'],
  });
}
