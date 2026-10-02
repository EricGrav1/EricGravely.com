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
- Admin (`/admin`) — six tabs: Dashboard (stat tiles, 30-day signups chart, per-product conversion table), Signups (expandable questionnaire answers + sequence progress), Products (create/edit products, active toggle, resource file upload), Sequences (named drip sequences — `components/admin/SequencesTab.tsx`), Broadcasts (one-off/scheduled sends to a segment — `components/admin/BroadcastsTab.tsx`), Questions (per-resource questionnaire editor). Shared email UI (editor, live preview, test send, audience picker, automation-health banner) is in `components/admin/emailTools.tsx`.
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
- `GET/POST/PATCH/DELETE /api/admin/sequences` — named sequence CRUD (GET includes each sequence's emails + enrollment counts); `POST /api/admin/sequences/:id/enroll-existing` (`{dryRun:true}` returns the match count)
- `POST/PATCH/DELETE /api/admin/sequence-emails` — sequence email CRUD (create requires `sequenceId`)
- `GET/POST /api/admin/broadcasts`, `POST /api/admin/broadcasts/:id/cancel` — broadcasts (POST takes `audience` + optional `scheduledAt`)
- `POST /api/admin/audience/count`, `/api/admin/email/preview`, `/api/admin/email/test`, `/api/admin/email/process` (runs email jobs ~8s in-request), `GET /api/admin/email/status` (cron heartbeat)
- `POST /api/cron/email` — runs all email jobs; requires `Authorization: Bearer $CRON_SECRET`
- `POST /api/unsubscribe?email=&token=` — RFC 8058 one-click unsubscribe (target of the List-Unsubscribe header)

### Email: Sequences + Broadcasts
- **Named sequences** (`sequences` table) with a trigger: `resource_signup` (`leadMagnetId` = that resource, null = any), `newsletter_signup`, or `manual`. `/api/subscribe` calls `storage.enrollForSignup()`, which enrolls the person in every active matching sequence. One `sequence_enrollments` row per subscriber per sequence (unique) — re-signing up never restarts a sequence. "Add existing subscribers" backfills everyone matching the trigger (day count starts now).
- **Progress is a cursor** (`lastDayOffset`, `lastEmailId`), not a step index — adding/deleting/pausing emails never makes anyone skip or repeat. An email with day N is due N days after enrollment. Emails added after the end also go to people who finished. Catch-up sends are spaced ≥12h apart.
- **Broadcasts** target an `EmailAudience` (all / newsletter tag / any resource / a specific resource), can be scheduled, previewed, test-sent, canceled or stopped mid-send. Starting a broadcast snapshots recipients into `broadcast_recipients`; batches of up to 50 go out via Resend's batch API. A failed batch is bisected to isolate a bad address. Systemic errors (rate limit, bad key) — or 3 single-recipient failures in a row — pause the broadcast (`lastError`) and requeue everyone; it resumes next run.
- **Who sends** (`server/emailJobs.ts` → `runEmailJobs`): (1) `POST /api/cron/email` pinged every 10 min by `.github/workflows/email-cron.yml` — required on Autoscale, where the server sleeps and timers don't fire; (2) the admin page while a broadcast is sending / "Send due emails now"; (3) an in-process 5-min timer. All work is claimed atomically (SKIP LOCKED for recipients, compare-and-swap for enrollments), so overlapping runs never double-send. The admin panel warns when the cron heartbeat is older than an hour.
- **Email body format** (`formatEmailBody` in `server/email.ts`): plain text, blank lines = paragraphs, `{{first_name}}`, `[text](url)` links, a link alone on its own line = gold CTA button, `**bold**`, bare URLs auto-linked. All list emails carry `List-Unsubscribe` + `List-Unsubscribe-Post` headers.
- **Migration** (`server/emailMigration.ts`): on first boot after this change, the old two-audience setup becomes "Free resource follow-up" + "Newsletter welcome" sequences, and every opted-in subscriber keeps their exact place. Legacy `sending` broadcasts become `interrupted`. The legacy columns (`sequence_emails.audience`, `subscribers.sequenceStep` etc.) are kept but no longer drive sending.

### Data Layer
- **ORM**: Drizzle ORM + drizzle-zod; schema in `shared/schema.ts`; `DbStorage` in `server/storage.ts`
- **Seed**: `server/seed.ts` runs on startup (products, default 5-question questionnaire backfill, sequence emails)

Data models:
- `lead_magnets`: id, title, description, productType (download|external), resourceUrl, externalUrl, buttonLabel, iconPath, deliveryMethod, active, viewCount, submissionCount, questionnaireFields (jsonb: id/label/required/type("text"|"select")/options), previewImages (jsonb string[]), nextSteps, createdAt
- `subscribers`: id, email, firstName, tag, unsubscribed, sequenceOptIn, sequenceOptInAt, sequenceStep, lastSequenceSentAt, createdAt
- `leads`: id, email, leadMagnetId (FK), questionnaireAnswers (jsonb), unsubscribed, createdAt
- `sequences`: id, name, trigger, leadMagnetId, active, createdAt
- `sequence_emails`: id, sequenceId (FK, cascade), dayOffset, subject, body (plain text, see format above), active, sentCount, audience (legacy), createdAt
- `sequence_enrollments`: id, subscriberId, sequenceId (unique pair), status, enrolledAt, lastEmailId, lastDayOffset, lastSentAt, emailsSent
- `broadcasts`: id, subject, body, status (scheduled|sending|sent|failed|canceled|interrupted), audience (jsonb), scheduledAt, startedAt, completedAt, totalRecipients, sentCount, failedCount, lastError
- `broadcast_recipients`: id, broadcastId, email, firstName, status (pending|sending|sent|failed|canceled), error, claimedAt, sentAt
- `app_state`: key/value (cron heartbeat per source)

### Email Delivery
- **Service**: Resend in `server/email.ts`. Credentials: prefers `RESEND_API_KEY` + `RESEND_FROM_EMAIL` secrets/env (current setup — sender "Eric Gravely <eric@ericgravely.com>", domain ericgravely.com verified for sending); falls back to the Resend Replit Connector only when RESEND_API_KEY is unset (the connector still holds a stale invalid key — ignore it)
- **Delivery is email-only**: download links are HMAC tokens (`generateDownloadToken`, keyed by UNSUBSCRIBE_SECRET) pointing at /api/download
- All senders check Resend's `{error}` response — failures surface to the caller instead of silently claiming success

### Security Considerations
- Unsubscribe: SHA256(email + UNSUBSCRIBE_SECRET); downloads: HMAC-SHA256; both compared with timingSafeEqual
- Resource files in `server/private/downloads/` — not web-accessible
- Admin auth (`server/adminAuth.ts`): password login against `ADMIN_PASSWORD` secret (SHA256 + timingSafeEqual), express-session with connect-pg-simple Postgres store ("session" table, auto-created) mounted only on `/api/admin`; session regenerated on login; cookie httpOnly/lax/secure-in-prod; in-memory rate limit 10 attempts/15min/IP; all 7 admin data routes behind `requireAdmin`; login/logout/session endpoints open (session returns only a boolean). Client gate in admin.tsx + global QueryCache handler flips back to login screen if an admin query gets a 401 (expired session).

## Known Setup Gaps (require user action)
- **Email automation**: run `npm run db:push` (new tables: sequences, sequence_enrollments, broadcast_recipients, app_state), set the `CRON_SECRET` secret in Replit, redeploy, then add the same `CRON_SECRET` as a GitHub Actions repository secret. Until the cron pings, the admin Sequences/Broadcasts tabs show a warning and sequence emails only go out while the site happens to be awake.
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
- `CRON_SECRET` — shared secret for `POST /api/cron/email`; set the same value as the GitHub Actions secret `CRON_SECRET`
- `MATRIX_URL` — legacy resource URL
- Resend credentials come from the Replit Connector, not env vars
