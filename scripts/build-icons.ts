import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

// Home Screen icons from public/brand/favicon.svg (re-run when the brand logo arrives):
// npx tsx scripts/build-icons.ts
// The mark sits inside the central 60% so Android's round "maskable" crop never clips it.

const root = join(import.meta.dirname, '..');
const svg = readFileSync(join(root, 'public/brand/favicon.svg'), 'utf8');
const SURFACE = '#F5F7F2'; // --surface in src/styles/tokens.css

const sizes: [string, number][] = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [name, size] of sizes) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<html><body style="margin:0;background:${SURFACE};display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">
      <div style="width:${size * 0.6}px;height:${size * 0.6}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
    </body></html>`,
  );
  await page.screenshot({ path: join(root, 'public/brand', name), omitBackground: false });
  console.log(`Wrote public/brand/${name}`);
}
await browser.close();
