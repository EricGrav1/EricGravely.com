#!/usr/bin/env bash
# Idempotent dependency + database bootstrap. Runs after checkout.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
source .cursor/lib.sh

echo "[install] Installing npm dependencies..."
npm ci

echo "[install] Ensuring Postgres is running..."
start_postgres
ensure_db

echo "[install] Applying database schema (drizzle push)..."
npm run db:push

echo "[install] Done."
