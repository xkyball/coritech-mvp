# Docker Setup

## Services

| Service | Purpose | Port |
| --- | --- | --- |
| `db` | PostgreSQL database with persistent volume | `5432` |
| `migrate-seed` | Prisma client generation, migration deploy and seed runner | none |
| `web` | Next.js development server | `3000` |
| `adminer` | Optional database UI | `8080` |

## Start

```bash
npm run docker:up
```

This uses `scripts/docker-compose.mjs`, which tries `docker compose` first and
falls back to standalone `docker-compose`. It builds the Node image, waits for
PostgreSQL health, runs Prisma migration and seed, then starts the web app.

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

Local defaults are in `.env.example`. Docker Compose uses:

```env
WEB_PORT=3000
POSTGRES_USER=coritech
POSTGRES_PASSWORD=coritech_dev_password
POSTGRES_DB=coritech_mvp
POSTGRES_PORT=5432
DATABASE_URL=postgresql://coritech:coritech_dev_password@db:5432/coritech_mvp?schema=public
```

If another local process is already using port `3000`, keep the container port
unchanged and temporarily run with another host port:

```bash
WEB_PORT=3004 npm run docker:up
```

Do not commit real `.env` files or production secrets.

## Adminer

Open `http://localhost:8080` and use:

- System: `PostgreSQL`
- Server: `db`
- Username: `coritech`
- Password: `coritech_dev_password`
- Database: `coritech_mvp`
