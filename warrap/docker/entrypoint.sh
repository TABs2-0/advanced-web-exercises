#!/usr/bin/env bash
set -e

if [ -n "${DB_HOST:-}" ]; then
  echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT:-5432}..."
  until nc -z "$DB_HOST" "${DB_PORT:-5432}"; do
    sleep 1
  done
fi

if [ "${BUILD_TAILWIND:-false}" = "true" ]; then
  cd /app/theme/static_src
  if [ ! -d node_modules ]; then
    npm ci
  fi
  npm run build
  cd /app
fi

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  python manage.py migrate --noinput
fi

if [ "${RUN_COLLECTSTATIC:-false}" = "true" ]; then
  python manage.py collectstatic --noinput
fi

if [ "${SEED_DATA:-false}" = "true" ]; then
  python manage.py seed_data
fi

exec "$@"
