# Azure VM All-in-One Container

## Purpose

This runbook is for a small Azure VM or demo VM where CoriTech runs as one
container containing:

- the Next.js web app;
- PostgreSQL;
- MinIO object storage.

This is intentionally separate from the normal local `docker-compose.yml`
workflow, which keeps app, database and MinIO in separate containers.

## Fit

Use this for controlled demos, internal staging or a simple VM proof of
deployment. It is not the preferred production shape because app, database and
object storage share one failure domain, one container lifecycle and one volume
backup boundary.

For production launch, prefer CoriTech-controlled managed PostgreSQL, managed
object storage and a web-only app container once provider choices are finalized.

## Files

| File | Purpose |
| --- | --- |
| `Dockerfile.all-in-one` | Builds Node, PostgreSQL, MinIO and the app into one image. |
| `scripts/start-all-in-one.sh` | Starts PostgreSQL, starts MinIO, creates the private bucket, runs migrations and starts Next.js. |
| `docker-compose.all-in-one.yml` | Runs a single `coritech` service with a persistent `/var/lib/coritech` volume. |
| `.env.all-in-one.example` | Example variable contract for the all-in-one container. |

## Azure VM Preparation

1. Create an Ubuntu VM under a CoriTech-controlled Azure subscription.
2. Allow inbound SSH only from trusted admin IPs.
3. Allow inbound HTTP/HTTPS through a reverse proxy, or temporarily allow port
   `3000` for a private demo.
4. Do not expose PostgreSQL `5432`, MinIO API `9000` or MinIO Console `9001` to
   the public internet.
5. Install Docker Engine and the Docker Compose plugin on the VM.
6. Clone the repository to a stable path such as `/opt/coritech`.

## Configure

Create the real all-in-one env file on the VM:

```bash
cp .env.all-in-one.example .env.all-in-one
nano .env.all-in-one
```

For a domain-backed VM, set:

```env
APP_BASE_URL=https://app.example.com
API_BASE_URL=https://app.example.com
```

Google hosted auth must authorize:

```text
https://app.example.com/auth/callback
```

Keep these values local to the container because PostgreSQL and MinIO run in
the same container:

```env
DATABASE_URL=postgresql://coritech:coritech_dev_password@127.0.0.1:5432/coritech_mvp?schema=public
OBJECT_STORAGE_ENDPOINT=127.0.0.1
OBJECT_STORAGE_PORT=9000
OBJECT_STORAGE_USE_SSL=false
```

This local MinIO endpoint is enough for server-side uploads and storage checks.
Browser-facing document download links need a reachable storage endpoint. For
external document-download demos, route a TLS hostname such as
`storage.example.com` to the same VM's MinIO API port and set:

```env
OBJECT_STORAGE_ENDPOINT=storage.example.com
OBJECT_STORAGE_PORT=443
OBJECT_STORAGE_USE_SSL=true
```

Keep the MinIO API and Console restricted to trusted networks or proxy rules.

If this is a fresh demo VM and demo data is wanted, set:

```env
RUN_DATABASE_SEED=true
```

Keep it `false` for production-like environments.

## Start

Build and start the single-container stack:

```bash
docker compose --env-file .env.all-in-one -f docker-compose.all-in-one.yml up -d --build
```

The compose file reads `.env.all-in-one` by default. To use a different file
name, set `CORITECH_ALL_IN_ONE_ENV_FILE=/path/to/env-file`.

Check status and logs:

```bash
docker compose -f docker-compose.all-in-one.yml ps
docker compose -f docker-compose.all-in-one.yml logs -f coritech
```

Verify the app:

```bash
curl http://localhost:3000/api/health
```

If a deployed VM redirects back to `localhost` after login, confirm that the
running container received the public URL values:

```bash
docker compose -f docker-compose.all-in-one.yml exec coritech printenv APP_BASE_URL API_BASE_URL CORITECH_ENVIRONMENT
```

After editing `.env.all-in-one`, recreate the container so Docker applies the
new values:

```bash
docker compose --env-file .env.all-in-one -f docker-compose.all-in-one.yml up -d --build --force-recreate
```

## Persistent Data

All state lives in the named Docker volume mounted at:

```text
/var/lib/coritech
```

Inside that volume:

| Path | Data |
| --- | --- |
| `/var/lib/coritech/postgres` | PostgreSQL data directory |
| `/var/lib/coritech/minio` | MinIO object bytes |
| `/var/lib/coritech/minio.log` | MinIO runtime log |

Do not remove the `coritech_all_in_one_data` volume unless you intentionally
want to delete the VM database and object storage.

## Update

From the repository directory on the VM:

```bash
git pull
docker compose --env-file .env.all-in-one -f docker-compose.all-in-one.yml up -d --build
```

The container runs Prisma migrations on startup. Demo seeding only runs when
`RUN_DATABASE_SEED=true`.

## Backup

Create a database dump inside the persistent volume:

```bash
docker compose -f docker-compose.all-in-one.yml exec coritech sh -lc 'mkdir -p /var/lib/coritech/backups && PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc -f /var/lib/coritech/backups/coritech.dump'
```

Copy it off the VM or into CoriTech-controlled backup storage:

```bash
container_id="$(docker compose -f docker-compose.all-in-one.yml ps -q coritech)"
docker cp "$container_id:/var/lib/coritech/backups/coritech.dump" ./coritech.dump
```

Back up `/var/lib/coritech/minio` or use a VM-volume snapshot to preserve object
bytes. A useful restore drill must verify both PostgreSQL metadata and MinIO
object bytes together.

## Stop

Stop the container while preserving data:

```bash
docker compose -f docker-compose.all-in-one.yml down
```

Delete all local all-in-one data only when intentionally resetting the VM:

```bash
docker compose -f docker-compose.all-in-one.yml down -v
```

## Boundaries

This variant does not provision Azure resources, configure TLS, create DNS,
create Google OAuth clients, configure live email, configure live monitoring or
replace the production backup/restore approval process.
