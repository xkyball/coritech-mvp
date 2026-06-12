#!/usr/bin/env sh
set -eu

log() {
  printf "%s\n" "$*" >&2
}

require_safe_identifier() {
  name="$1"
  value="$2"

  case "$value" in
    ""|*[!A-Za-z0-9_]*)
      log "${name} must contain only letters, numbers and underscores for the all-in-one container."
      exit 1
      ;;
  esac
}

wait_for_minio() {
  for _ in $(seq 1 60); do
    if mc alias set coritech-local "http://127.0.0.1:${OBJECT_STORAGE_PORT}" "${MINIO_ROOT_USER}" "${MINIO_ROOT_PASSWORD}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done

  log "MinIO did not become ready within 60 seconds."
  return 1
}

cleanup() {
  status="$?"
  trap - EXIT INT TERM

  if [ -n "${WEB_PID:-}" ]; then
    kill "${WEB_PID}" 2>/dev/null || true
  fi

  if [ -n "${MINIO_PID:-}" ]; then
    kill "${MINIO_PID}" 2>/dev/null || true
  fi

  if [ "${POSTGRES_STARTED:-false}" = "true" ]; then
    gosu postgres pg_ctl -D "${POSTGRES_DATA_DIR}" -m fast -w stop >/dev/null 2>&1 || true
  fi

  exit "$status"
}

trap cleanup EXIT INT TERM

: "${APP_INTERNAL_PORT:=3000}"
: "${POSTGRES_USER:=coritech}"
: "${POSTGRES_PASSWORD:=coritech_dev_password}"
: "${POSTGRES_DB:=coritech_mvp}"
: "${POSTGRES_PORT:=5432}"
: "${POSTGRES_DATA_DIR:=/var/lib/coritech/postgres}"
: "${POSTGRES_LISTEN_ADDRESSES:=127.0.0.1}"
: "${MINIO_DATA_DIR:=/var/lib/coritech/minio}"
: "${OBJECT_STORAGE_PROVIDER:=minio}"
: "${OBJECT_STORAGE_ENDPOINT:=127.0.0.1}"
: "${OBJECT_STORAGE_PORT:=9000}"
: "${OBJECT_STORAGE_CONSOLE_PORT:=9001}"
: "${OBJECT_STORAGE_USE_SSL:=false}"
: "${OBJECT_STORAGE_BUCKET:=coritech-local-dev}"
: "${OBJECT_STORAGE_REGION:=local-dev}"
: "${OBJECT_STORAGE_ACCESS_KEY:=coritech_minio_dev}"
: "${OBJECT_STORAGE_SECRET_KEY:=coritech_minio_dev_password}"
: "${RUN_DATABASE_SEED:=false}"

require_safe_identifier "POSTGRES_USER" "${POSTGRES_USER}"
require_safe_identifier "POSTGRES_DB" "${POSTGRES_DB}"

export POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB POSTGRES_PORT
export OBJECT_STORAGE_PROVIDER OBJECT_STORAGE_ENDPOINT OBJECT_STORAGE_PORT
export OBJECT_STORAGE_USE_SSL OBJECT_STORAGE_BUCKET OBJECT_STORAGE_REGION
export OBJECT_STORAGE_ACCESS_KEY OBJECT_STORAGE_SECRET_KEY
export MINIO_ROOT_USER="${MINIO_ROOT_USER:-${OBJECT_STORAGE_ACCESS_KEY}}"
export MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-${OBJECT_STORAGE_SECRET_KEY}}"
export DATABASE_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public}"

mkdir -p "${POSTGRES_DATA_DIR}" "${MINIO_DATA_DIR}"
chown -R postgres:postgres "${POSTGRES_DATA_DIR}"

if [ ! -s "${POSTGRES_DATA_DIR}/PG_VERSION" ]; then
  log "Initializing PostgreSQL data directory."
  gosu postgres initdb -D "${POSTGRES_DATA_DIR}" --auth-local=trust --auth-host=scram-sha-256 >/dev/null
  {
    printf "\nlisten_addresses = '%s'\n" "${POSTGRES_LISTEN_ADDRESSES}"
    printf "port = %s\n" "${POSTGRES_PORT}"
    printf "password_encryption = 'scram-sha-256'\n"
    printf "unix_socket_directories = '/tmp'\n"
  } >> "${POSTGRES_DATA_DIR}/postgresql.conf"
  {
    printf "host all all 127.0.0.1/32 scram-sha-256\n"
    printf "host all all ::1/128 scram-sha-256\n"
  } >> "${POSTGRES_DATA_DIR}/pg_hba.conf"
fi

log "Starting PostgreSQL."
gosu postgres pg_ctl -D "${POSTGRES_DATA_DIR}" -o "-k /tmp" -l "${POSTGRES_DATA_DIR}/server.log" -w start >/dev/null
POSTGRES_STARTED=true

password_sql="$(printf "%s" "${POSTGRES_PASSWORD}" | sed "s/'/''/g")"

if [ "$(gosu postgres psql -h /tmp -p "${POSTGRES_PORT}" -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='${POSTGRES_USER}'" || true)" != "1" ]; then
  gosu postgres psql -h /tmp -p "${POSTGRES_PORT}" -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE ROLE \"${POSTGRES_USER}\" WITH LOGIN PASSWORD '${password_sql}';" >/dev/null
else
  gosu postgres psql -h /tmp -p "${POSTGRES_PORT}" -d postgres -v ON_ERROR_STOP=1 \
    -c "ALTER ROLE \"${POSTGRES_USER}\" WITH PASSWORD '${password_sql}';" >/dev/null
fi

if [ "$(gosu postgres psql -h /tmp -p "${POSTGRES_PORT}" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${POSTGRES_DB}'" || true)" != "1" ]; then
  gosu postgres createdb -h /tmp -p "${POSTGRES_PORT}" -O "${POSTGRES_USER}" "${POSTGRES_DB}"
fi

log "Starting MinIO."
minio server "${MINIO_DATA_DIR}" \
  --address ":${OBJECT_STORAGE_PORT}" \
  --console-address ":${OBJECT_STORAGE_CONSOLE_PORT}" >/var/lib/coritech/minio.log 2>&1 &
MINIO_PID="$!"

wait_for_minio
mc mb --ignore-existing "coritech-local/${OBJECT_STORAGE_BUCKET}" >/dev/null
mc anonymous set none "coritech-local/${OBJECT_STORAGE_BUCKET}" >/dev/null

log "Running database migrations."
npm run db:migrate

if [ "${RUN_DATABASE_SEED}" = "true" ]; then
  log "Seeding database."
  npm run db:seed
fi

log "Starting CoriTech web app on port ${APP_INTERNAL_PORT}."
npm --workspace @coritech/web run start -- --hostname 0.0.0.0 --port "${APP_INTERNAL_PORT}" &
WEB_PID="$!"

wait "${WEB_PID}"
