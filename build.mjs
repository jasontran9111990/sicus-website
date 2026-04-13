import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC_PAGES = path.join(ROOT, 'src', 'pages');
const SRC_PARTIALS = path.join(ROOT, 'src', 'partials');
const DIST = path.join(ROOT, 'dist');

const INCLUDE_RE = /<!--\s*@include\s+partials\/([\w./-]+)\s*-->/g;

const partialCache = new Map();
function loadPartial(name) {
  if (partialCache.has(name)) return partialCache.get(name);
  const p = path.join(SRC_PARTIALS, name);
  if (!fs.existsSync(p)) throw new Error(`Missing partial: ${name}`);
  const body = fs.readFileSync(p, 'utf8').replace(/\n$/, '');
  partialCache.set(name, body);
  return body;
}

function resolveIncludes(html, depth = 0) {
  if (depth > 5) throw new Error('Include nesting too deep');
  return html.replace(INCLUDE_RE, (_, name) => resolveIncludes(loadPartial(name), depth + 1));
}

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function copyFileIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Clean & rebuild dist/
fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(DIST, { recursive: true });

// Build pages
let pageCount = 0;
for (const file of walk(SRC_PAGES)) {
  if (!file.endsWith('.html')) continue;
  const rel = path.relative(SRC_PAGES, file);
  const outPath = path.join(DIST, rel);
  const built = resolveIncludes(fs.readFileSync(file, 'utf8'));
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, built);
  console.log(`built ${rel}`);
  pageCount++;
}

// Copy static assets
copyDir(path.join(ROOT, 'brand_assets'), path.join(DIST, 'brand_assets'));
copyFileIfExists(path.join(ROOT, 'robots.txt'), path.join(DIST, 'robots.txt'));
copyFileIfExists(path.join(ROOT, 'sitemap.xml'), path.join(DIST, 'sitemap.xml'));

// Domain verification files (Twilio, etc.) — any 32-hex-char .html at root
for (const entry of fs.readdirSync(ROOT)) {
  if (/^[a-f0-9]{32}\.html$/.test(entry)) {
    fs.copyFileSync(path.join(ROOT, entry), path.join(DIST, entry));
  }
}

// Copy root .png mockups (referenced by index hero etc.)
for (const entry of fs.readdirSync(ROOT)) {
  if (/^\d+\.png$/.test(entry)) {
    fs.copyFileSync(path.join(ROOT, entry), path.join(DIST, entry));
  }
}

console.log(`\nbuild complete: ${pageCount} page(s) → dist/`);
