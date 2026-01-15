# Self Coaching Matrix Lead Magnet Funnel

## Overview

A lead magnet funnel application that captures email addresses and delivers a "Self Coaching Matrix" PDF via email. The funnel consists of a landing page with email capture, a thank you page, and an unsubscribe flow. The application sends transactional emails with the lead magnet download link, App Store promotion, and optional Pro upsell messaging with time-sensitive pricing.

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

The frontend follows a pages-based structure under `client/src/pages/` with three main views:
- Landing page (`/`) - Email capture form
- Thank you page (`/thanks`) - Post-submission confirmation
- Unsubscribe page (`/unsubscribe`) - Email preference management

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Build**: esbuild for production bundling with selective dependency bundling

Key API endpoints:
- `POST /api/lead` - Email submission and lead magnet delivery
- `GET /api/unsubscribe` - Token-validated unsubscribe handling

### Data Layer
- **ORM**: Drizzle ORM with Zod schema integration
- **Database**: PostgreSQL (configured via DATABASE_URL)
- **Schema Location**: `shared/schema.ts` - Shared between frontend and backend
- **Current Storage**: In-memory storage implementation (MemStorage class) with interface ready for database migration

The Lead data model includes: email, createdAt, unsubscribed status, unsubscribedAt timestamp, and lastSentAt timestamp.

### Email Delivery
- **Service**: Resend (via Replit Connectors integration)
- **Authentication**: Dynamic credential fetching from Replit Connectors API
- **Features**: Unsubscribe link generation using SHA256 token validation

### Security Considerations
- Unsubscribe tokens generated via SHA256 hash of email + secret
- Email validation using Zod schemas
- Graceful error handling to prevent server crashes

## External Dependencies

### Third-Party Services
- **Resend**: Transactional email delivery (connected via Replit Connectors)
- **PostgreSQL**: Primary database (provisioned via Replit)

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `RESEND_API_KEY` - Email service API key (via Replit Connectors)
- `FROM_EMAIL` - Sender email address (via Replit Connectors)
- `APP_STORE_URL` - iOS app download link
- `MATRIX_URL` - Lead magnet PDF download URL
- `UNSUBSCRIBE_SECRET` - Secret for generating unsubscribe tokens

### Optional Environment Variables
- `PRO_PRICE` - Pro subscription price (default: 4.99)
- `FUTURE_PRICE` - Future price for scarcity messaging (default: 14.99)
- `PRICE_INCREASE_DATE` - Date for price increase (YYYY-MM-DD format)
- `SUPPORT_EMAIL` - Customer support email

### Key NPM Dependencies
- Express for HTTP server
- Drizzle ORM + drizzle-zod for database operations
- Resend for email delivery
- React + Vite for frontend
- shadcn/ui + Radix UI for component library
- TanStack React Query for data fetching
- Zod for schema validation