# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Open Items &amp; To-Do

Outstanding work, ranked by priority. Update this section when items are completed or new items emerge.

### 🔴 Blockers — require Jason's action (not a code task)
- [ ] **Complete Resend setup** so the 4 lead magnets actually deliver emails:
  - [ ] Verify `sicusmedia.com` domain in Resend (add SPF, DKIM, DMARC DNS records)
  - [ ] Create Resend API key named `SICUS Lead Magnets`
  - [ ] Add `RESEND_API_KEY` env var in Vercel project settings (Production + Preview + Development)
  - [ ] Trigger a Vercel redeploy (any git push will do)
  - [ ] Test by submitting a form on `/blog/salon-business-plan-template.html` with a real email
- [ ] **Verify Twilio domain** by visiting https://sicusmedia.com/b624e91e8571e42c3efa1ce24dbf6918.html and clicking Verify in Twilio dashboard
- [ ] **Submit `sitemap.xml` to Google Search Console** to speed up indexing of the content clusters

### 🟡 Enhancements — can wait, relatively low effort
- [ ] **Resend Audiences integration** — store every lead-magnet subscriber in a named Resend audience so they can receive broadcast newsletters and nurture sequences later. ~15 min once needed.
- [ ] **Email nurture sequence** — 5-7 automated emails that go to everyone who downloads any magnet, gently warming them toward "Schedule a Demo". Requires Resend Audiences first.
- [ ] **Vietnamese Salon Bundle magnet** — translate 1-2 existing PDFs into Vietnamese for the Vietnamese-Canadian niche. Uncontested market. ~1 hour.
- [ ] **Lead magnets for the insurance cluster** — Canada insurance cheatsheet + WCB Alberta quick reference. ~30 min total (duplicate pattern from existing magnets).
- [ ] **Lead magnet for Calgary zoning article** — "Calgary Salon Zoning Checklist" PDF. ~15 min.
- [ ] **Delete legacy root `.html` files** — the pre-migration duplicates at the project root. Safe to remove via `git rm`. ~2 min.
- [ ] **Analytics on magnet performance** — surface Resend delivery/open events in a simple dashboard or Slack notification.

### 🟢 Content roadmap — next SEO build-outs
- [ ] **Salon Digital Marketing content cluster** (5-8 articles) — complements the `/services/digital-marketing.html` page. Keywords: salon SEO, salon Instagram marketing, Google Business Profile for salons, salon Google reviews, salon paid ads, salon email marketing, salon content marketing, salon reputation management.
- [ ] **Operations keyword cluster** — salon staff scheduling, salon payroll, salon inventory management, salon tip split, salon commission structure.
- [ ] **Marketing tactics keyword cluster** — salon Google reviews, salon SMS marketing, salon loyalty programs, salon Instagram growth.
- [ ] **Geographic expansion** — Edmonton, Vancouver, Toronto salon licensing clusters (mirror the Alberta one).
- [ ] **Interactive tool: Salon Business Plan Generator** — long-tail follow-on to the Salon Business Plan Template article. Multi-step wizard that generates a fillable plan from user inputs. Different intent than the template (long-tail).
- [ ] **Interactive tool: Salon Tip Split Calculator** — simple tool targeting the "salon tip split" operational keyword.
- [ ] **About Us page** — trust-building founder-narrative page. Jason deferred earlier, but still worth building once ready. Needs founder bio, origin story, team details, metrics.

### 🔵 Phase 3 SEO roadmap — authority building (from the original plan)
- [ ] Guest posts on `thesalonbusiness.com` and `salontoday.com`
- [ ] HARO / Connectively — respond to journalist queries about the salon industry
- [ ] Product listings — Software Advice, G2, Capterra, GetApp, Product Hunt
- [ ] YouTube demos — AI Receptionist, booking flow walkthrough — embed on blog
- [ ] Local SEO — Calgary business directories, nail salon associations
- [ ] Vietnamese community outreach — directories, forums, Facebook groups

## Build System & Page Creation

This site uses a templated build system. **Do not create new `.html` files at the project root** — they will not be served. All pages live in `src/pages/` and are built into `dist/` by `build.mjs`.

### Repository layout
- `src/pages/` — page sources. Mirrors live URL structure (e.g. `src/pages/blog/foo.html` → `/blog/foo.html`).
- `src/partials/` — shared markup. Pages include partials via `<!-- @include partials/X.html -->` markers that `build.mjs` resolves at build time.
  - `head-common.html` — GTM head script, charset, viewport, Tailwind CDN, Google Fonts, Tailwind config (brand colors). Use on every standard page.
  - `gtm-head.html` — GTM head script only. Use on pages with their own non-standard head/font setup (privacy-policy, terms-of-service).
  - `gtm-noscript.html` — GTM `<noscript>` iframe. Goes immediately after `<body>`.
  - `nav.html` — top navbar (logo, language toggle, Blog/Tools/Demo). Uses root-relative paths.
  - `footer.html` — dark site footer. Uses root-relative paths.
- `build.mjs` — resolves include markers, writes to `dist/`, copies static assets (`brand_assets/`, `robots.txt`, `sitemap.xml`, root `*.png` mockups, 32-hex-char `*.html` domain verification files).
- `dist/` — generated output. **Never edit files here directly — they are overwritten on every build.** Gitignored.
- `vercel.json` — tells Vercel to run `node build.mjs` and serve from `dist/`.

### Creating a new page
1. Create the file in the right `src/pages/` location:
   - Landing page → `src/pages/foo.html`
   - Blog post → `src/pages/blog/foo.html`
   - Tool → `src/pages/tools/foo.html`
2. Use this skeleton (page-specific bits in `<head>` and the body content; everything else inherited from partials):
   ```html
   <!DOCTYPE html>
   <html lang="en" id="htmlRoot">
   <head>
   <!-- @include partials/head-common.html -->

     <title>...</title>
     <meta name="description" content="...">
     <link rel="canonical" href="https://sicusmedia.com/foo.html">
     <!-- OG, Twitter, JSON-LD as needed (page-specific) -->

     <style>
       /* page-specific styles only — shared CSS lives in head-common */
     </style>
   </head>
   <body class="bg-white text-gray-900 overflow-x-hidden">
   <!-- @include partials/gtm-noscript.html -->
   <!-- @include partials/nav.html -->

   <!-- ...page content... -->

   <!-- @include partials/footer.html -->
   </body>
   </html>
   ```
3. Build, verify, and test locally:
   ```bash
   node build.mjs        # generate dist/
   node verify.mjs       # confirm every referenced asset exists
   node serve.mjs dist   # serve dist/ at localhost:3000
   ```
   Open `http://localhost:3000/foo.html` in a browser to verify visually.
4. Commit `src/pages/foo.html` and push. Vercel auto-builds and deploys.

### Pre-push checklist
**Always run before pushing:**
```bash
node build.mjs && node verify.mjs
```
`verify.mjs` walks every built HTML file in `dist/`, extracts every `src=`/`href=`/asset reference, and checks that the file exists. If anything 404s, it exits non-zero and prints the offending references. Catches missing assets, mistyped paths, broken nav links — exactly the class of bug that's hard to spot by eye.

### Preview deploys (recommended for big changes)
Vercel auto-creates a preview deploy for every git branch. For non-trivial changes (new section, refactor, multi-page work), push to a branch instead of `main`:
```bash
git checkout -b feature-x
git push origin feature-x
```
Vercel will give you a preview URL like `https://sicus-website-git-feature-x-<user>.vercel.app`. Click around, verify, then merge to `main`. For routine "add a blog post" work, direct-to-main is fine.

### Editing shared markup (nav, footer, GTM, etc.)
Edit the relevant file in `src/partials/`. Run `node build.mjs` to regenerate `dist/`. Every page picks up the change automatically — no per-file edits.

### Lead magnets (email capture + PDF delivery)
Lead magnets are wired via **Resend** (transactional email) + a Vercel serverless function. The pattern:

1. **`api/subscribe.js`** — Vercel serverless function. Receives `POST { email, magnet }`, validates, looks up the magnet in a config map, calls the Resend API with an HTML email containing the PDF download link. Uses native `fetch` (no npm dependencies). Requires `RESEND_API_KEY` environment variable set in the Vercel project.
2. **`generate-pdfs.mjs`** — Local Puppeteer script that renders built HTML pages as PDFs using the existing `@media print` CSS. Run manually: `node generate-pdfs.mjs`. Generated PDFs are written to `downloads/` and committed to the repo. `build.mjs` auto-copies `downloads/` to `dist/downloads/`.
3. **Form on the article** — Inline email capture form with initial/loading/success/error states. Submits to `/api/subscribe` via fetch. See `src/pages/blog/salon-business-plan-template.html` for the reference implementation.

**To add a new lead magnet:**
1. Add a new entry to the `MAGNETS` map in `api/subscribe.js` with `{ subject, title, blurb, pdfUrl }`
2. Add the target article/source to the `TARGETS` array in `generate-pdfs.mjs`
3. Run `node generate-pdfs.mjs` locally to produce the PDF
4. Commit the generated PDF in `downloads/`
5. Add the inline email form to the article (copy-paste from the business plan template and change the `magnet` value in the form JS)
6. Push — Vercel deploys the function + the new PDF

**Required Resend setup (one-time):**
- Verify `sicusmedia.com` domain in Resend dashboard (DNS records: SPF, DKIM, DMARC)
- Create API key
- Add `RESEND_API_KEY` environment variable in Vercel project settings (Production + Preview + Development)
- `from` address in `api/subscribe.js` uses `hello@sicusmedia.com` — must be on the verified domain

### Hard rules for the build system
- **Never create or edit `.html` files at the project root.** Only static assets (`robots.txt`, `sitemap.xml`, domain verification files, image mockups) belong at root.
- **Never edit files in `dist/`** — they are generated and will be overwritten.
- **Never duplicate GTM, nav, or footer markup in a page.** Always use the `<!-- @include partials/X.html -->` markers.
- **Always test with `node build.mjs && node serve.mjs dist`** before committing.
- The 21 legacy `.html` files still at the project root (other than `index.html`-style entry points) are dead duplicates from the migration. Do not edit them. They will be removed in a future cleanup commit.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Compare visually with the reference and iterate until it matches. Be specific about deltas ("heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"). Check spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing.

## Local Server
- Standard local test flow: `node build.mjs && node verify.mjs && node serve.mjs dist` — builds, checks all referenced assets exist, then serves `dist/` at `http://localhost:3000`.
- For ad-hoc checks of the source repo (rare), `node serve.mjs` with no arg serves the project root.
- `serve.mjs` resolves directory paths to `index.html` automatically (so `/blog/` works).
- If the server is already running, do not start a second instance.

## Output Defaults
- New pages go in `src/pages/` and use the templated structure (see "Build System & Page Creation" above) — never single self-contained files at root.
- Tailwind CSS via CDN is already loaded by `head-common.html`. Page-specific styles go in the page's own `<style>` block.
- Brand colors (`brand-green`, `brand-green-dark`, `surface-*`) are already configured in `head-common.html`'s Tailwind config — use them, do not redefine.
- Placeholder images (only for unfinished mockups): `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive.

## Brand Assets
- Always check the `brand_assets/` folder before designing. It may contain logos, color guides, style guides, or images.
- If assets exist there, use them. Do not use placeholders where real assets are available.
- If a logo is present, use it. If a color palette is defined, use those exact values — do not invent brand colors.

## Anti-Generic Guardrails
- **Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a custom brand color and derive from it.
- **Shadows:** Never use flat `shadow-md`. Use layered, color-tinted shadows with low opacity.
- **Typography:** Never use the same font for headings and body. Pair a display/serif with a clean sans. Apply tight tracking (`-0.03em`) on large headings, generous line-height (`1.7`) on body.
- **Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filter for depth.
- **Animations:** Only animate `transform` and `opacity`. Never `transition-all`. Use spring-style easing.
- **Interactive states:** Every clickable element needs hover, focus-visible, and active states. No exceptions.
- **Images:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`.
- **Spacing:** Use intentional, consistent spacing tokens — not random Tailwind steps.
- **Depth:** Surfaces should have a layering system (base → elevated → floating), not all sit at the same z-plane.

## SEO Roadmap

### Strategy
Own niches first (AI + Vietnamese salon), then expand to competitive head terms. SICUS differentiators: AI-first positioning, Vietnamese salon niche (uncontested).

### Phase 1 — Foundation (Weeks 1–4)
- [x] Meta tags, structured data, OG tags
- [ ] Add `/blog` section (static HTML pages)
- [ ] Create dedicated landing pages per salon type:
  - `/nail-salon-booking-app`
  - `/hair-salon-booking-system`
  - `/beauty-salon-booking-app`
  - `/vietnamese-salon-software`
  - Each page targets 1 keyword cluster with unique copy, H1, meta
- [ ] Google Search Console — verify domain, submit sitemap
- [ ] Google Business Profile — set up for Calgary location
- [ ] Create `sitemap.xml` and `robots.txt`
- [ ] Page speed optimization (compress images, lazy loading)

### Phase 2 — Content Attack (Weeks 5–12)
Publish 8–12 articles targeting mid/long-tail keywords (1,500–2,500 words each, biweekly):
1. "Best Salon Booking Apps in 2026 (Compared)" → salon booking app
2. "Best Nail Salon Software for Small Businesses" → nail app
3. "How to Set Up Online Booking for Your Salon" → online booking system for salons
4. "AI Salon Management: How Smart Booking Changes Everything" → AI salon booking system
5. "Best Beauty Salon Appointment Apps (Free & Paid)" → beauty salon appointment app
6. "Hair Salon Booking System: Complete Guide" → hair salon booking system
7. "Salon Booking System vs. Manual Scheduling" → salon booking system
8. "Vietnamese Nail Salon Software — Built for Your Business" → vietnamese nail salon software

### Phase 3 — Authority Building (Weeks 8–16)
- [ ] Guest posts on salon industry blogs (thesalonbusiness.com, salontoday.com)
- [ ] HARO / Connectively — respond to journalist queries
- [ ] Product listings — Software Advice, G2, Capterra, GetApp, Product Hunt
- [ ] YouTube demos (AI Receptionist, booking flow) — embed on blog
- [ ] Local SEO — Calgary business directories, nail salon associations
- [ ] Vietnamese community outreach — directories, forums, Facebook groups

### Phase 4 — Compound & Scale (Weeks 16–24)
- [ ] Optimize pages with impressions but low clicks (Search Console data)
- [ ] Update comparison articles with fresh data
- [ ] Add FAQ schema to every landing page and blog post
- [ ] Create free tools (Salon Revenue Calculator, No-Show Cost Calculator)
- [ ] Build content hub/silo interlinking structure
- [ ] Target head terms aggressively with beefed-up pages

### Keyword Priority
- **P0 — Own now (1–3 mo):** "vietnamese nail salon software", "AI salon booking"
- **P1 — Win early (3–6 mo):** "nail app", "hair salon booking app", "beauty salon appointment app"
- **P2 — Build toward (6–12 mo):** "salon booking app", "online booking system for salons", "salon appointment app"
- **P3 — Long game (12–18 mo):** "salon booking system", "beauty salon booking system"

### Top Competitors
Fresha, GlossGenius, Vagaro, Booksy, Square, Mangomint, Boulevard, Zenoti

### Blog Page Layout (UI/UX Standard)
All blog articles must follow the layout in `src/pages/blog/best-nail-salon-software.html` (the templated source — never reference files in `dist/` or the legacy root `blog/` folder):

1. **Navbar** — Fixed `bg-white/80 backdrop-blur-xl`. Includes: logo, language toggle, "Blog" link, "Schedule a Demo" CTA button.
2. **Hero Section** — `pt-28 sm:pt-32 pb-16` with radial gradient bg (`#fff 50% → brand-green/12`). Contains breadcrumb → category badge (pill with green dot) → H1 (`text-3xl sm:text-4xl lg:text-[46px]`) → subtitle → author card (avatar + name + date + read time).
3. **Article Body** — `max-w-3xl mx-auto px-6`. TOC is a **content box** (`bg-surface-50 border border-gray-200 rounded-2xl p-6 sm:p-8 mb-12`) with numbered `<ol>` list — **not a sidebar**. Article content inside `<div class="article-body">`.
4. **CTA** — Green gradient (`linear-gradient(135deg, #8CB82B, #6A9A10)`) with SVG noise texture. **White button** (`bg-white text-brand-green-dark`). Not dark bg.
5. **Related Articles** — 3-col grid of flat cards (`bg-surface-50 rounded-xl p-5 border border-gray-100 hover:border-brand-green/30`). Each card: category label + title. No image/icon area.
6. **Footer** — Dark `#0F0F11`, 4-column grid, consistent across all pages.

**Article body typography:**
- h2: `1.75rem` (sm: `2rem`), h3: `1.35rem` (sm: `1.5rem`)
- p/li: `1.065rem` (sm: `1.125rem`), line-height `1.75`
- Links: `color: #8CB82B; text-decoration: underline; text-underline-offset: 2px`
- Blockquotes: green left border, `#f9fdf2` bg

**Landing pages** (`/nail-salon-booking-app`, `/hair-salon-booking-system`, etc.) follow a different layout from blogs — they are product pages with their own hero, features, comparison, and CTA sections.

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
- Never create new `.html` files at the project root (use `src/pages/` — see "Build System & Page Creation")
- Never edit files in `dist/` (they are generated)
