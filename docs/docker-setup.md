# Docker Setup

## Services

| Service | Purpose | Port |
| --- | --- | --- |
| `db` | PostgreSQL database with persistent volume | `5432` |
| `minio` | Local S3-compatible object storage for development only | `9000` |
| `minio-init` | One-shot local bucket initializer | none |
| `migrate-seed` | Prisma client generation, migration deploy and seed runner | none |
| `web` | Next.js development server | `3000` |
| `adminer` | Optional database UI | `8080` |

## Start

```bash
npm run docker:up
```

This uses `scripts/docker-compose.mjs`, which tries `docker compose` first and
falls back to standalone `docker-compose`. It builds the Node image, waits for
PostgreSQL health, starts local MinIO, creates the configured private
development bucket, runs Prisma migration and seed, then starts the web app.

## Stop

```bash
npm run docker:down
```

## Reset

```bash
npm run docker:reset
```

This removes the PostgreSQL volume and clears local database state.

## Environment

Local defaults are in `.env.example`; copy it to `.env` before starting the
stack. `scripts/docker-compose.mjs` passes the repository root `.env` to Docker
Compose explicitly, and the `web` and `migrate-seed` services also load `.env`
as a runtime `env_file`. Values passed directly in the shell still override
file values.

Docker Compose uses:

```env
WEB_PORT=3000
SERVER_BIND_HOST=0.0.0.0
POSTGRES_USER=coritech
POSTGRES_PASSWORD=coritech_dev_password
POSTGRES_DB=coritech_mvp
POSTGRES_PORT=5432
DATABASE_URL=postgresql://coritech:coritech_dev_password@db:5432/coritech_mvp?schema=public
APP_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
OBJECT_STORAGE_PROVIDER=minio
OBJECT_STORAGE_ENDPOINT=minio
OBJECT_STORAGE_PORT=9000
OBJECT_STORAGE_USE_SSL=false
OBJECT_STORAGE_BUCKET=coritech-local-dev
OBJECT_STORAGE_REGION=local-dev
OBJECT_STORAGE_ACCESS_KEY=coritech_minio_dev
OBJECT_STORAGE_SECRET_KEY=coritech_minio_dev_password
OBJECT_STORAGE_CONSOLE_PORT=9001
```

If another local process is already using port `3000`, keep the container port
unchanged and temporarily run with another host port:

```bash
WEB_PORT=3004 npm run docker:up
```

Do not commit real `.env` files or production secrets.

The `.dockerignore` file excludes real `.env` files from the image build
context. Local secrets are injected at Compose runtime instead of being baked
into the Docker image.

`SERVER_BIND_HOST=0.0.0.0` is a container listen address only. Browser-facing
settings such as `APP_BASE_URL`, `API_BASE_URL`, auth callbacks, logout returns
and generated links must stay on `http://localhost:<port>` for local testing.

Manual localhost verification:

1. Start the app with `npm run docker:up`.
2. Open `http://localhost:3000`.
3. Log in through the configured managed auth flow.
4. Navigate between protected app areas.
5. Switch role/context if multiple contexts are available.
6. Log out.
7. Confirm the browser URL never changes to `0.0.0.0`.

## MinIO

MinIO is local/development infrastructure only. It gives Ticket 6.1 a working
S3-compatible storage target without deciding the production provider.

After `npm run docker:up`, open the MinIO Console at
`http://localhost:9001`. The local-only credentials are:

- Username: `coritech_minio_dev`
- Password: `coritech_minio_dev_password`

The `minio-init` service creates the `coritech-local-dev` bucket if it does not
already exist and keeps anonymous access disabled. To verify from Docker:

```bash
docker compose run --rm minio-init
```

For application code running outside Docker, use `.env.local.example` values:

```env
OBJECT_STORAGE_ENDPOINT=localhost
OBJECT_STORAGE_PORT=9000
OBJECT_STORAGE_USE_SSL=false
```

For application code running inside Docker Compose, use `.env.example` values:

```env
OBJECT_STORAGE_ENDPOINT=minio
OBJECT_STORAGE_PORT=9000
OBJECT_STORAGE_USE_SSL=false
```

Ticket 6.1 should consume the storage provider abstraction in
`packages/domain/src/storage/object-storage.mjs`. This Docker setup does not
implement document upload endpoints, document metadata persistence, controlled
access URLs, validation, malware scanning, upload/view audit hooks or public
document sharing.

## Adminer

Open `http://localhost:8080` and use:

- System: `PostgreSQL`
- Server: `db`
- Username: `coritech`
- Password: `coritech_dev_password`
- Database: `coritech_mvp`
