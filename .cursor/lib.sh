#!/usr/bin/env bash
# Shared helpers for the Cloud Agent development environment.
# Sourced by install.sh, start.sh, and dev-server.sh.

# Local Postgres connection used for development. These are non-secret local
# credentials for a Postgres instance that only lives inside the agent VM.
export PGHOST="${PGHOST:-127.0.0.1}"
export PGPORT="${PGPORT:-5432}"
export DB_NAME="${DB_NAME:-ericgravely}"
export DB_USER="${DB_USER:-appuser}"
export DB_PASS="${DB_PASS:-apppass}"

# The app reads DATABASE_URL directly. Keep an existing value (e.g. a real
# managed database provided via Secrets) but default to the local instance.
export DATABASE_URL="${DATABASE_URL:-postgres://${DB_USER}:${DB_PASS}@${PGHOST}:${PGPORT}/${DB_NAME}}"

start_postgres() {
  # Idempotent: pg_ctlcluster errors if already running, so ignore that and
  # rely on pg_isready to confirm the server is actually accepting connections.
  sudo pg_ctlcluster 16 main start >/dev/null 2>&1 || true
  for _ in $(seq 1 30); do
    if sudo -u postgres pg_isready -q >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "[env] Postgres did not become ready in time" >&2
  return 1
}

ensure_db() {
  # Create the dev role and database only when they do not already exist so the
  # command is safe to run on every boot.
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1; then
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
  fi
  if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1; then
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
  fi
}
