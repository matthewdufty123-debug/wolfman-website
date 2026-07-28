#!/usr/bin/env bash
# Throwaway PostgreSQL for the E2E harness.
#
#   scripts/test-db.sh start   — initialise (first run) and start on TEST_PG_PORT
#   scripts/test-db.sh stop    — stop the server
#   scripts/test-db.sh reset   — drop and recreate the database, schema-less
#   scripts/test-db.sh url     — print the connection string
#
# Nothing here touches the real database. The cluster lives in a scratch
# directory and can be deleted at any time.
set -euo pipefail

PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"
PG_ROOT="${TEST_PG_ROOT:-/var/lib/postgresql/wolfman-test}"
PG_PORT="${TEST_PG_PORT:-55432}"
PG_USER="${TEST_PG_USER:-wolfman}"
PG_DB="${TEST_PG_DB:-wolfman_test}"
PG_SOCK=/tmp

# initdb refuses to run as root, so when we are root we drive it as `postgres`.
if [ "$(id -un)" = "root" ]; then
  as_pg() { runuser -u postgres -- "$@"; }
  needs_chown=1
else
  as_pg() { "$@"; }
  needs_chown=0
fi

url() { echo "postgresql://${PG_USER}@localhost:${PG_PORT}/${PG_DB}"; }

start() {
  if [ ! -d "$PG_ROOT/data" ]; then
    mkdir -p "$PG_ROOT"
    [ "$needs_chown" = "1" ] && chown postgres:postgres "$PG_ROOT"
    as_pg "$PG_BIN/initdb" -D "$PG_ROOT/data" -U "$PG_USER" --auth=trust -E UTF8 >/dev/null
  fi

  if as_pg "$PG_BIN/pg_isready" -h "$PG_SOCK" -p "$PG_PORT" -q 2>/dev/null; then
    echo "postgres already running on :$PG_PORT"
  else
    as_pg "$PG_BIN/pg_ctl" -D "$PG_ROOT/data" \
      -o "-p $PG_PORT -k $PG_SOCK -c listen_addresses=localhost" \
      -l "$PG_ROOT/log" start >/dev/null
    echo "postgres started on :$PG_PORT"
  fi

  as_pg "$PG_BIN/psql" -h "$PG_SOCK" -p "$PG_PORT" -U "$PG_USER" -d postgres -tc \
    "SELECT 1 FROM pg_database WHERE datname='$PG_DB'" | grep -q 1 \
    || as_pg "$PG_BIN/psql" -h "$PG_SOCK" -p "$PG_PORT" -U "$PG_USER" -d postgres -q -c "CREATE DATABASE $PG_DB"
}

stop() {
  as_pg "$PG_BIN/pg_ctl" -D "$PG_ROOT/data" stop -m fast >/dev/null 2>&1 || true
  echo "postgres stopped"
}

reset() {
  as_pg "$PG_BIN/psql" -h "$PG_SOCK" -p "$PG_PORT" -U "$PG_USER" -d postgres -q \
    -c "DROP DATABASE IF EXISTS $PG_DB WITH (FORCE)" -c "CREATE DATABASE $PG_DB"
  echo "database $PG_DB reset"
}

case "${1:-start}" in
  start) start ;;
  stop)  stop ;;
  reset) reset ;;
  url)   url ;;
  *) echo "usage: $0 {start|stop|reset|url}" >&2; exit 1 ;;
esac
