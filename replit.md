# Free Resources Lead Magnet Funnel

## Overview

A multi-resource lead magnet funnel for sales professionals. Visitors browse a gallery of free resources, pick one, provide their email (and optional phone), then receive it via email. Admins manage the resource catalog and track conversion analytics per resource. The app is built around the Sales Coach AI mobile app and delivers resources like the Self Coaching Matrix PDF.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS with shadcn/ui component library (New York style)
- **Build Tool**: Vite with custom plugins for Replit integration

Pages under `client/src/pages/`:
- Landing page (`/`) — Two-step: resource card gallery → contact form (email + optional phone)
- Thank you page (`/thanks?resource=<name>`) — Post-submission confirmation, shows resource name
- Unsubscribe page (`/unsubscribe`) — Token-validated email preference management
- Admin panel (`/admin`) — Resource CRUD + per-resource analytics dashboard

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Build**: esbuild for production bundling

Key API endpoints:
- `GET /api/lead-magnets` — List active lead magnets (for visitors)
- `POST /api/lead-magnets/:id/view` — Increment view count (fired when card renders)
- `POST /api/lead` — Submit lead (email + optional phone + leadMagnetId + optional questionnaire)
- `GET /api/unsubscribe` — Token-validated unsubscribe
- `GET /api/analytics` — Per-resource stats (views, submissions, conversion rate)
- `GET /api/admin/lead-magnets` — All lead magnets including inactive (admin)
- `POST /api/admin/lead-magnets` — Create new resource
- `PATCH /api/admin/lead-magnets/:id` — Update/toggle resource

### Data Layer
- **ORM**: Drizzle ORM with Zod schema integration
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Schema Location**: `shared/schema.ts` — Shared between frontend and backend
- **Storage**: `DbStorage` class in `server/storage.ts` (PostgreSQL-backed)
- **Seed**: `server/seed.ts` runs on startup to ensure Self Coaching Matrix exists

Data models:
- `lead_magnets`: id, title, description, resourceUrl, deliveryMethod, active, viewCount, submissionCount, createdAt
- `leads`: id, email, phone, leadMagnetId (FK), questionnaireAnswers (jsonb), unsubscribed, unsubscribedAt, lastSentAt, createdAt

### Email Delivery
- **Service**: Resend (via Replit Connectors integration)
- **Authentication**: Dynamic credential fetching from Replit Connectors API (never cached)
- **Templates**: Dynamic per lead magnet (subject, body, resource link from DB record)
- **Features**: Unsubscribe link generation using SHA256 token validation

### Security Considerations
- Unsubscribe tokens generated via SHA256 hash of email + UNSUBSCRIBE_SECRET
- Email validation using Zod schemas
- Admin endpoints unauthenticated (by design, no auth in scope)
- Graceful error handling to prevent server crashes

## External Dependencies

### Third-Party Services
- **Resend**: Transactional email delivery (connected via Replit Connectors)
- **PostgreSQL**: Primary database (provisioned via Replit)

### Required Environment Variables
- `DATABASE_URL` — PostgreSQL connection string
- `RESEND_API_KEY` — Email service API key (via Replit Connectors)
- `FROM_EMAIL` — Sender email address (via Replit Connectors)
- `APP_STORE_URL` — iOS app download link
- `MATRIX_URL` — Self Coaching Matrix resource URL (used in seed)
- `UNSUBSCRIBE_SECRET` — Secret for generating unsubscribe tokens

### Optional Environment Variables
- `PRO_PRICE` — Pro subscription price (default: 4.99)
- `FUTURE_PRICE` — Future price for scarcity messaging (default: 14.99)
- `PRICE_INCREASE_DATE` — Date for price increase (YYYY-MM-DD format)
- `SUPPORT_EMAIL` — Customer support email

### Key NPM Dependencies
- Express for HTTP server
- Drizzle ORM + drizzle-zod for database operations
- Resend for email delivery
- React + Vite for frontend
- shadcn/ui + Radix UI for component library
- TanStack React Query for data fetching
- Zod for schema validation
