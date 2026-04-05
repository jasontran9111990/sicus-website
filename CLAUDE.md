# CLAUDE.md — Frontend Website Rules

## Always Do First
- **Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions.

## Reference Images
- If a reference image is provided: match layout, spacing, typography, and color exactly. Swap in placeholder content (images via `https://placehold.co/`, generic copy). Do not improve or add to the design.
- If no reference image: design from scratch with high craft (see guardrails below).
- Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do at least 2 comparison rounds. Stop only when no visible differences remain or user says so.

## Local Server
- **Always serve on localhost** — never screenshot a `file:///` URL.
- Start the dev server: `node serve.mjs` (serves the project root at `http://localhost:3000`)
- `serve.mjs` lives in the project root. Start it in the background before taking any screenshots.
- If the server is already running, do not start a second instance.

## Screenshot Workflow
- Puppeteer is installed at `C:/Users/nateh/AppData/Local/Temp/puppeteer-test/`. Chrome cache is at `C:/Users/nateh/.cache/puppeteer/`.
- **Always screenshot from localhost:** `node screenshot.mjs http://localhost:3000`
- Screenshots are saved automatically to `./temporary screenshots/screenshot-N.png` (auto-incremented, never overwritten).
- Optional label suffix: `node screenshot.mjs http://localhost:3000 label` → saves as `screenshot-N-label.png`
- `screenshot.mjs` lives in the project root. Use it as-is.
- After screenshotting, read the PNG from `temporary screenshots/` with the Read tool — Claude can see and analyze the image directly.
- When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap is 16px but should be 24px"
- Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment, border-radius, shadows, image sizing

## Output Defaults
- Single `index.html` file, all styles inline, unless user says otherwise
- Tailwind CSS via CDN: `<script src="https://cdn.tailwindcss.com"></script>`
- Placeholder images: `https://placehold.co/WIDTHxHEIGHT`
- Mobile-first responsive

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

## Hard Rules
- Do not add sections, features, or content not in the reference
- Do not "improve" a reference design — match it
- Do not stop after one screenshot pass
- Do not use `transition-all`
- Do not use default Tailwind blue/indigo as primary color
