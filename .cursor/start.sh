#!/usr/bin/env bash
# Per-boot reconciliation: make sure Postgres is up and the dev database exists.
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=/dev/null
source .cursor/lib.sh

start_postgres
ensure_db

echo "[start] Postgres is ready on ${PGHOST}:${PGPORT} (db: ${DB_NAME})."
