# Eric Gravely — Personal Brand Site & Lead Funnel

## Overview

Personal brand website for Eric Gravely (Sales Manager/Coach) with a lead-magnet funnel. Visitors browse free resources on /products, answer a 5-question opt-in questionnaire, provide their contact info, and receive the resource by email only (tokenized download links — no public downloads). An optional checkbox opts them into an automated nurture email sequence. Brand: ivory/near-black/gold (#C9A227); no fabricated social proof.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS + custom CSS variables (--c-bg, --c-fg, --c-accent, etc.) with light/dark themes; shadcn/ui available
- **Build Tool**: Vite

Pages under `client/src/pages/`:
- Home (`/`), About (`/about`), Coaching (`/coaching`) — brand/marketing pages
- Products (`/products`) — resource cards with multi-step questionnaire (auto-advance selects, progress bar), contact step with nurture-sequence opt-in checkbox (unchecked by default), and view-only preview lightbox (renders `previewImages` when present). The signup flow lives in `components/ProductSignupFlow.tsx` (shared with detail pages).
- Product detail (`/products/:slug`) — per-product page with its own meta tags; slug is derived from the title via `shared/slug.ts` (renaming a product changes its URL). Records a view on open.
- Thank you (`/thank-you`), Unsubscribe (`/unsubscribe`)
- Admin (`/admin`) — five tabs: Dashboard (stat tiles, 30-day signups chart, per-product conversion table), Signups (expandable questionnaire answers), Products (create/edit products, active toggle, resource file upload), Sequence (CRUD editor), Questions (per-resource questionnaire editor)
- Per-page SEO titles/descriptions via `usePageMeta` in `client/src/lib/seo.ts`; `robots.txt` + `sitemap.xml` served by Express (sitemap includes product slugs)

### Backend Architecture
- **Runtime**: Node.js with Express, TypeScript ESM
- **API Pattern**: RESTful JSON API under `/api/`

Key API endpoints:
- `POST /api/subscribe` — Main funnel endpoint: accepts email, firstName, leadMagnetId, questionnaireAnswers, sequenceOptIn. Creates subscriber + lead, sends delivery email with tokenized download link.
- `GET /api/download?lm=&email=&token=` — HMAC-validated download; refuses unsubscribed users, missing files, bad tokens. Files live in `server/private/downloads/` (outside web root).
- `GET /api/unsubscribe` — Token-validated unsubscribe
- `GET /api/lead-magnets` — Active resources (public)
- `POST /api/lead-magnets/:id/view` — View tracking (fired from detail pages and card signup opens; powers dashboard conversion stats)
- `GET /api/admin/stats` — Dashboard aggregates (totals, 7-day deltas, 30-day daily signups, per-product conversion)
- `GET /api/admin/leads` — Signups joined with subscriber state + resource title
- `GET/POST/PATCH /api/admin/lead-magnets` — Resource management incl. questionnaireFields editing; GET adds `fileUploaded` per product
- `POST /api/admin/upload` — multipart file upload (multer, 25MB cap, extension allowlist); stores the file in the Postgres `resource_files` table so it survives redeploys. `/api/download` serves the DB copy first and falls back to `server/private/downloads/` on disk. Pass `kind=preview` for public preview images (image extensions only, filename prefixed `preview-`, `is_public=true`).
- `GET /api/files/:filename` — serves only `is_public` files (preview images); gated resources 404 here.
- Products also support `videoUrl` (YouTube link, validated + embedded on the product detail page via `shared/video.ts`) and `previewImages` (managed in admin → Products with upload/remove).
- The express-session `session` table is declared in `shared/schema.ts` (so `db:push` doesn't offer to drop it) and also created at startup in `adminAuth.ts` (connect-pg-simple's `createTableIfMissing` breaks inside the esbuild bundle).
- `GET/POST/PATCH/DELETE /api/admin/sequence-emails` — Nurture sequence CRUD

### Nurture Sequence
- `server/sequence.ts` — scheduler started from `server/index.ts`; ticks every 10 min (first pass 15s after boot), max 25 sends/run, 1 email per subscriber per tick.
- Anchor: `subscribers.sequenceOptInAt`; `sequenceStep` = index into active sequence emails ordered by dayOffset asc, id asc. Failed sends do NOT advance the step (retried next tick).
- Seeded with 4 default emails (day 1/3/5/7) only when the table is empty; fully editable in /admin.

### Data Layer
- **ORM**: Drizzle ORM + drizzle-zod; schema in `shared/schema.ts`; `DbStorage` in `server/storage.ts`
- **Seed**: `server/seed.ts` runs on startup (products, default 5-question questionnaire backfill, sequence emails)

Data models:
- `lead_magnets`: id, title, description, productType (download|external), resourceUrl, externalUrl, buttonLabel, iconPath, deliveryMethod, active, viewCount, submissionCount, questionnaireFields (jsonb: id/label/required/type("text"|"select")/options), previewImages (jsonb string[]), nextSteps, createdAt
- `subscribers`: id, email, firstName, tag, unsubscribed, sequenceOptIn, sequenceOptInAt, sequenceStep, lastSequenceSentAt, createdAt
- `leads`: id, email, leadMagnetId (FK), questionnaireAnswers (jsonb), unsubscribed, createdAt
- `sequence_emails`: id, dayOffset, subject, body (plain text, {{first_name}} personalization), active, createdAt

### Email Delivery
- **Service**: Resend in `server/email.ts`. Credentials: prefers `RESEND_API_KEY` + `RESEND_FROM_EMAIL` secrets/env (current setup — sender "Eric Gravely <eric@ericgravely.com>", domain ericgravely.com verified for sending); falls back to the Resend Replit Connector only when RESEND_API_KEY is unset (the connector still holds a stale invalid key — ignore it)
- **Delivery is email-only**: download links are HMAC tokens (`generateDownloadToken`, keyed by UNSUBSCRIBE_SECRET) pointing at /api/download
- All senders check Resend's `{error}` response — failures surface to the caller instead of silently claiming success

### Security Considerations
- Unsubscribe: SHA256(email + UNSUBSCRIBE_SECRET); downloads: HMAC-SHA256; both compared with timingSafeEqual
- Resource files in `server/private/downloads/` — not web-accessible
- Admin auth (`server/adminAuth.ts`): password login against `ADMIN_PASSWORD` secret (SHA256 + timingSafeEqual), express-session with connect-pg-simple Postgres store ("session" table, auto-created) mounted only on `/api/admin`; session regenerated on login; cookie httpOnly/lax/secure-in-prod; in-memory rate limit 10 attempts/15min/IP; all 7 admin data routes behind `requireAdmin`; login/logout/session endpoints open (session returns only a boolean). Client gate in admin.tsx + global QueryCache handler flips back to login screen if an admin query gets a 401 (expired session).

## Known Setup Gaps (require user action)
- **Run `npm run db:push` once after pulling** — creates the new `resource_files` table. Until then, admin file uploads return a clear error; everything else keeps working.
- **Resource files missing**: no files uploaded yet. The funnel returns 503 "not available yet" until files are uploaded for `ask-close-playbook.pdf` and `salesrep-coaching-tool.xlsx` — now doable from /admin → Products → Upload file (stored in Postgres).
- **Resend "Receiving MX" DNS record pending** (non-blocking — sending verified & tested working July 2026). User should also rotate the Resend API key eventually (it was pasted in chat once) and update the RESEND_API_KEY secret.
- **Preview images**: `previewImages` is null for all products (can be generated once files are uploaded); preview UI hides gracefully.

## External Dependencies
- **Resend**: Transactional email (Replit Connectors)
- **PostgreSQL**: Primary database (Replit-provisioned)
- **ConvertKit** (optional): tag sync in `server/convertkit.ts`, skipped when not configured

### Required Environment Variables
- `DATABASE_URL`, `SESSION_SECRET`, `UNSUBSCRIBE_SECRET` (falls back to a default — should be set in production)
- `ADMIN_PASSWORD` — admin panel login (set as a secret)
- `MATRIX_URL` — legacy resource URL
- Resend credentials come from the Replit Connector, not env vars
