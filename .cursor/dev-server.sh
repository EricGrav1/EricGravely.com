#!/usr/bin/env bash
# Runs the Express + Vite dev server. Long-running foreground process.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
source .cursor/lib.sh

# Make sure the database is reachable before starting (in case the terminal
# launches before start.sh finishes on a fresh boot).
start_postgres
ensure_db

# Secrets fall back to development defaults so the app boots without any
# configuration. Set real values in the Secrets panel for email delivery and a
# private admin password.
export SESSION_SECRET="${SESSION_SECRET:-dev-session-secret}"
export UNSUBSCRIBE_SECRET="${UNSUBSCRIBE_SECRET:-scm-funnel-secret-2024}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
export PORT="${PORT:-5000}"

# Non-secret site configuration (mirrors Replit's userenv defaults).
export APP_STORE_URL="${APP_STORE_URL:-https://apps.apple.com/us/app/sales-coach-ai/id6748286535}"
export PRO_PRICE="${PRO_PRICE:-4.99}"
export FUTURE_PRICE="${FUTURE_PRICE:-14.99}"
export RESEND_FROM_EMAIL="${RESEND_FROM_EMAIL:-Eric Gravely <eric@ericgravely.com>}"
export MATRIX_URL="${MATRIX_URL:-https://example.com/matrix}"

echo "[dev-server] Starting on http://localhost:${PORT}"
exec npm run dev
