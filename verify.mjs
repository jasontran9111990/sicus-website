// Verify that every asset referenced by built HTML pages actually exists in dist/.
// Run after `node build.mjs`. Exits non-zero if any reference is broken.
//
// Catches: missing brand_assets, images, audio files, mistyped paths, missing
// blog posts in nav links, etc. Run this before pushing.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

if (!fs.existsSync(DIST)) {
  console.error('dist/ does not exist. Run `node build.mjs` first.');
  process.exit(1);
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(f));
    else out.push(f);
  }
  return out;
}

const HTML_FILES = walk(DIST).filter(f => f.endsWith('.html'));

// Patterns that may reference local files
const REF_PATTERNS = [
  /\bsrc="([^"]+)"/g,
  /\bhref="([^"]+)"/g,
  // Asset-extension paths inside any quoted string (catches onclick handlers,
  // JS string literals, etc.)
  /'([^']+\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp3|mp4|webm|woff|woff2|pdf|json))'/gi,
  /"([^"]+\.(?:png|jpg|jpeg|gif|svg|webp|ico|mp3|mp4|webm|woff|woff2|pdf|json))"/gi,
];

function extractRefs(html) {
  const out = new Set();
  for (const re of REF_PATTERNS) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(html))) out.add(m[1]);
  }
  return [...out];
}

function isExternal(ref) {
  return /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(ref);
}

const errors = [];
let refCount = 0;

for (const file of HTML_FILES) {
  const html = fs.readFileSync(file, 'utf8');
  const refs = extractRefs(html);
  const pageDir = path.dirname(file);

  for (const raw of refs) {
    if (isExternal(raw)) continue;
    // Strip query string and fragment
    const clean = raw.split('#')[0].split('?')[0];
    if (!clean) continue;
    refCount++;

    // Resolve to absolute path on disk
    let resolved;
    if (clean.startsWith('/')) {
      resolved = path.join(DIST, clean);
    } else {
      resolved = path.resolve(pageDir, clean);
    }

    // Directory? Try its index.html
    try {
      const st = fs.statSync(resolved);
      if (st.isDirectory()) resolved = path.join(resolved, 'index.html');
    } catch {}

    if (!fs.existsSync(resolved)) {
      errors.push({
        file: path.relative(DIST, file),
        ref: raw,
        resolved: path.relative(DIST, resolved),
      });
    }
  }
}

if (errors.length === 0) {
  console.log(`✓ verified ${HTML_FILES.length} HTML files, ${refCount} references — all good`);
} else {
  console.error(`\n✗ ${errors.length} broken reference(s) in ${HTML_FILES.length} HTML files (${refCount} checked):\n`);
  for (const e of errors) {
    console.error(`  ${e.file}`);
    console.error(`    ref:      ${e.ref}`);
    console.error(`    resolved: ${e.resolved} (missing)`);
  }
  process.exit(1);
}
