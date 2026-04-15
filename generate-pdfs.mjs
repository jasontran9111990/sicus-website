// Generate lead-magnet PDFs locally using Puppeteer.
// Run: node generate-pdfs.mjs
//
// Renders built HTML pages (from dist/) to PDF using Chrome's print engine,
// applying the @media print CSS already in the articles. The generated PDFs
// are written to downloads/ and committed to the repo, where build.mjs
// auto-copies them to dist/downloads/.
//
// Requires the dev server running in the background OR dist/ built first.
// This script will build dist/ if needed, start a temporary server, render,
// and shut down.

import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const OUT_DIR = path.join(ROOT, 'downloads');
const PORT = 3030;

// Which built pages to render → output PDF filename
const TARGETS = [
  {
    sourceUrl: `http://localhost:${PORT}/blog/salon-business-plan-template.html`,
    outFile: 'salon-business-plan-template.pdf',
    label: 'Salon Business Plan Template',
  },
  // Add future magnets here
];

// --- Simple HTTP server (reuses the same logic as serve.mjs) ---
function startServer() {
  const MIME = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon', '.webp': 'image/webp', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.pdf': 'application/pdf',
  };

  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = req.url.split('?')[0];
      let filePath = path.join(DIST, urlPath);
      try {
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
      } catch {}
      const ext = path.extname(filePath);
      const contentType = MIME[ext] || 'application/octet-stream';
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
      });
    });
    server.listen(PORT, () => resolve(server));
  });
}

// --- Ensure dist/ is built ---
function runBuild() {
  return new Promise((resolve, reject) => {
    const proc = spawn('node', ['build.mjs'], { stdio: 'inherit', cwd: ROOT });
    proc.on('close', (code) => code === 0 ? resolve() : reject(new Error('build failed')));
  });
}

// --- Main ---
async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Building dist/ first...');
  await runBuild();

  console.log(`Starting temporary server on :${PORT}...`);
  const server = await startServer();

  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  try {
    for (const target of TARGETS) {
      console.log(`\n→ Rendering "${target.label}"...`);
      const page = await browser.newPage();
      await page.goto(target.sourceUrl, { waitUntil: 'networkidle2', timeout: 60000 });
      // Force print media so the print CSS applies
      await page.emulateMediaType('print');

      const outPath = path.join(OUT_DIR, target.outFile);
      await page.pdf({
        path: outPath,
        format: 'Letter',
        printBackground: true,
        margin: { top: '0.5in', bottom: '0.55in', left: '0.5in', right: '0.5in' },
        displayHeaderFooter: true,
        headerTemplate: '<div></div>',
        footerTemplate: '<div style="font-size:9px;color:#9ca3af;width:100%;text-align:center;padding:0 0.5in;">SICUS Media &middot; sicusmedia.com &middot; Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>',
      });
      await page.close();

      const size = (fs.statSync(outPath).size / 1024).toFixed(0);
      console.log(`  ✓ ${target.outFile} (${size} KB)`);
    }
  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n✓ All PDFs generated. Commit the downloads/ folder and push.');
}

main().catch((err) => {
  console.error('PDF generation failed:', err);
  process.exit(1);
});
