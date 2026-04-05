import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || 'http://localhost:3000';
const dir = './temporary screenshots';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.startsWith('screenshot-')).length;
const num = existing + 1;
const filename = `screenshot-${num}-dashboard-zoom.png`;

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 1200 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// Scroll to comparison section and screenshot
await page.evaluate(() => {
  const el = document.querySelector('section:has(.border-brand-green\\/40)');
  if (el) el.scrollIntoView({ block: 'start' });
});
await new Promise(r => setTimeout(r, 300));
await page.screenshot({ path: path.join(dir, filename), clip: { x: 0, y: 0, width: 1440, height: 900 } });
await browser.close();
console.log(`Saved: ${path.join(dir, filename)}`);
