import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3000;
const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
// Optional positional arg: directory to serve from (relative to script dir)
const ROOT = process.argv[2]
  ? path.resolve(SCRIPT_DIR, process.argv[2])
  : SCRIPT_DIR;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  // Strip query string
  const urlPath = req.url.split('?')[0];
  let filePath = path.join(ROOT, urlPath);

  // If path is a directory (or ends with /), serve its index.html
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
}).listen(PORT, () => console.log(`Serving ${ROOT} on http://localhost:${PORT}`));
