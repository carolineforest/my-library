// Turns public/favicon.svg into the PNG app icons iPhone and Android need.
// Run with: npm run icons (needs Playwright, which Claude's cloud machine has).
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/favicon.svg', 'utf8');
const sizes = [
  ['public/apple-touch-icon.png', 180, false],
  ['public/icon-192.png', 192, false],
  ['public/icon-512.png', 512, false],
  ['public/icon-maskable-512.png', 512, true],
];
const browser = await chromium.launch();
const page = await browser.newPage();
for (const [file, size, maskable] of sizes) {
  // iOS adds its own rounded corners, so draw a square, full-bleed icon.
  const body = svg.replace('rx="112"', 'rx="0"');
  const inner = maskable ? size * 0.8 : size;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:#b4532a;display:grid;place-items:center;height:${size}px">
    <div style="width:${inner}px;height:${inner}px">${body.replace('<svg ', `<svg width="${inner}" height="${inner}" `)}</div></body></html>`);
  await page.screenshot({ path: file, omitBackground: false });
  console.log('wrote', file);
}
await browser.close();
