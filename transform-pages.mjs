// One-shot migration: converts existing root .html files into src/pages/ templated sources.
// Replaces GTM/nav/footer/head-common blocks with @include markers.
//
// 19 standard pages → use head-common (full bundle) + nav + footer + gtm-noscript
//  2 legal pages    → use gtm-head only + nav + gtm-noscript (skip footer + head dedup)
//
// Run: node transform-pages.mjs

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC_PAGES = path.join(ROOT, 'src', 'pages');

const STANDARD_PAGES = [
  'nail-salon-booking-app.html',
  'beauty-salon-booking-app.html',
  'hair-salon-booking-system.html',
  'vietnamese-salon-software.html',
  'blog/index.html',
  'blog/ai-salon-management.html',
  'blog/best-beauty-salon-appointment-apps.html',
  'blog/best-nail-salon-software.html',
  'blog/best-salon-booking-apps.html',
  'blog/hair-salon-booking-system-guide.html',
  'blog/how-much-does-it-cost-to-open-a-nail-salon.html',
  'blog/online-booking-system-for-salons.html',
  'blog/salon-booking-system-vs-manual.html',
  'blog/salon-licences-alberta.html',
  'blog/vietnamese-nail-salon-software.html',
  'tools/no-show-calculator.html',
  'tools/salon-breakeven-calculator.html',
  'tools/salon-idea-validator.html',
  'tools/salon-startup-calculator.html',
];

const LEGAL_PAGES = ['privacy-policy.html', 'terms-of-service.html'];

const GTM_HEAD_BLOCK = `<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-NPX9ZK3R');</script>
<!-- End Google Tag Manager -->`;

const GTM_NOSCRIPT_BLOCK = `<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-NPX9ZK3R"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->`;

// --- helpers ---------------------------------------------------------------

function mustReplace(html, needle, replacement, label) {
  if (!html.includes(needle)) throw new Error(`[${label}] anchor not found`);
  return html.replace(needle, replacement);
}

function tryRemoveAll(html, patterns) {
  for (const p of patterns) {
    if (typeof p === 'string') {
      while (html.includes(p)) html = html.replace(p, '');
    } else {
      html = html.replace(p, '');
    }
  }
  return html;
}

function replaceBlock(html, openRe, closeStr, replacement, label) {
  const m = html.match(openRe);
  if (!m) throw new Error(`[${label}] open tag not found`);
  const start = m.index;
  const end = html.indexOf(closeStr, start + m[0].length);
  if (end === -1) throw new Error(`[${label}] close tag not found after open`);
  return html.slice(0, start) + replacement + html.slice(end + closeStr.length);
}

function collapseBlankLines(html) {
  return html.replace(/(\n[ \t]*){3,}/g, '\n\n');
}

// --- common transforms used by both kinds ---------------------------------

function applyGtm(html) {
  html = mustReplace(html, GTM_HEAD_BLOCK, '<!-- @include partials/HEAD_PLACEHOLDER -->', 'gtm-head');
  html = mustReplace(html, GTM_NOSCRIPT_BLOCK, '<!-- @include partials/gtm-noscript.html -->', 'gtm-noscript');
  return html;
}

function applyNav(html) {
  return replaceBlock(
    html,
    /<nav class="fixed top-0 left-0 right-0 z-50 bg-white\/80 backdrop-blur-xl border-b border-gray-100[^"]*">/,
    '</nav>',
    '<!-- @include partials/nav.html -->',
    'nav'
  );
}

function applyFooter(html) {
  return replaceBlock(
    html,
    /<footer class="relative overflow-hidden rounded-3xl m-4 sm:m-8[^"]*" style="background: #0F0F11;">/,
    '</footer>',
    '<!-- @include partials/footer.html -->',
    'footer'
  );
}

// --- standard page (full head-common dedup) -------------------------------

function transformStandard(html) {
  html = applyGtm(html);
  // Replace HEAD_PLACEHOLDER with head-common.html for standard pages
  html = html.replace(
    '<!-- @include partials/HEAD_PLACEHOLDER -->',
    '<!-- @include partials/head-common.html -->'
  );

  // Remove duplicated head bits that are now provided by head-common
  // (using string includes, so optional bits are fine if absent)
  const removableLines = [
    /\s*<meta charset="UTF-8">/,
    /\s*<meta name="viewport" content="width=device-width, initial-scale=1\.0">/,
    /\s*<meta name="author" content="Sicus Media Inc\.">/,
    /\s*<meta name="robots" content="index, follow[^"]*">/,
    /\s*<link rel="preload" href="https:\/\/fonts\.googleapis\.com\/css2\?family=Be\+Vietnam\+Pro[^"]*" as="style">/,
    /\s*<link rel="preload" href="(?:\.\.\/)?brand_assets\/topbar\.png" as="image">/,
    /\s*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/,
    /\s*<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">/,
    /\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Be\+Vietnam\+Pro[^"]*" rel="stylesheet">/,
    // The big tailwind.config script (multiline)
    /\s*<script>\s*tailwind\.config\s*=\s*\{[\s\S]*?\}\s*<\/script>/,
  ];
  html = tryRemoveAll(html, removableLines);

  html = applyNav(html);
  html = applyFooter(html);
  html = collapseBlankLines(html);
  return html;
}

// --- legal page (GTM + nav only) ------------------------------------------

function transformLegal(html) {
  html = applyGtm(html);
  html = html.replace(
    '<!-- @include partials/HEAD_PLACEHOLDER -->',
    '<!-- @include partials/gtm-head.html -->'
  );
  html = applyNav(html);
  html = collapseBlankLines(html);
  return html;
}

// --- main ------------------------------------------------------------------

let ok = 0, fail = 0;
const errors = [];

function processFile(file, fn) {
  const srcPath = path.join(ROOT, file);
  const dstPath = path.join(SRC_PAGES, file);
  if (!fs.existsSync(srcPath)) {
    console.log(`SKIP (not found): ${file}`);
    return;
  }
  try {
    const html = fs.readFileSync(srcPath, 'utf8');
    const out = fn(html);
    fs.mkdirSync(path.dirname(dstPath), { recursive: true });
    fs.writeFileSync(dstPath, out);
    console.log(`ok   ${file}`);
    ok++;
  } catch (e) {
    console.log(`FAIL ${file}  → ${e.message}`);
    errors.push({ file, message: e.message });
    fail++;
  }
}

for (const f of STANDARD_PAGES) processFile(f, transformStandard);
for (const f of LEGAL_PAGES) processFile(f, transformLegal);

console.log(`\n${ok} succeeded, ${fail} failed`);
if (fail) process.exit(1);
