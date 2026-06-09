# Architecture

## Standard Foundation

CoriTech Phase 1 now uses a single local development foundation:

- `apps/web` - Next.js App Router frontend on Node.js.
- `packages/config` - environment validation contract and typed runtime config.
- `packages/domain` - framework-neutral CoriTech domain rules from approved tickets.
- `packages/database` - Prisma schema, migration and seed package.
- `docker-compose.yml` - PostgreSQL, web, migration/seed runner and Adminer.

The previous repository already contained domain helpers, raw SQL migrations and
product documentation. This task adapted those assets into a standard runtime
foundation instead of replacing the product model.

## Runtime Shape

```text
Browser
  -> Next.js app on port 3000
      -> future API routes / server actions
          -> Prisma Client
              -> PostgreSQL
```

The first app screen is a status page for the MVP and proof-chain foundation.
Future workflow tasks should add frontend feature code under
`apps/web/features/*`, shared UI under `apps/web/components`, reusable domain
logic under `packages/domain/src` and database access under `packages/database`.

## Database Shape

Prisma is now the standard ORM and migration surface. Existing raw SQL files in
`packages/database/legacy-sql/migrations` remain preserved as historical source material. The active
Prisma migration lives in:

`packages/database/prisma/migrations/20260609150000_initial_foundation/migration.sql`

Prisma is pinned to the v6 line in this foundation. Prisma v7 changes the
configuration and driver-adapter model, so upgrading should be handled as an
explicit future task rather than an incidental dependency bump.

## MVP Boundary

Phase 1 builds the operational wedge and proof-chain-ready evidence trail. It
does not introduce blockchain, token logic, AI claims, full marketplace
automation, custom authentication, payment-card storage, federation automation,
sensor ingestion or microservices.

## Standard Task Assumption

All future development tasks should assume:

```text
Next.js + TypeScript + PostgreSQL + Prisma ORM + Docker Compose
```
