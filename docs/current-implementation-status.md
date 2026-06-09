# Current Implementation Status

Date inspected: 2026-06-09

## 1. Current framework / runtime detected

The project now uses Next.js with the App Router under `apps/web/app`.
The runtime target is Node.js. TypeScript is enabled for the Next.js app and
for the Prisma/database package.

## 2. Current package manager and workspace structure

The repository now uses npm workspaces with `package-lock.json`.

Workspace packages:

- `apps/web` - Next.js frontend.
- `packages/domain` - migrated framework-neutral CoriTech domain helpers.
- `packages/config` - migrated environment validation contract.
- `packages/database` - Prisma schema, migration, generated client and seed logic.

## 3. Current app structure

The active app lives under `apps/web`.

Important app folders:

- `apps/web/app` - Next.js App Router pages and layout.
- `apps/web/components` - shared UI component area.
- `apps/web/features` - feature modules for auth, catalog, orders, shipments,
  documents, proof events, audit, admin and migrated breeder-dashboard logic.

The former root `app/breeder-dashboard` module has been migrated to
`apps/web/features/breeder-dashboard`.

Ticket 3.3 adds `apps/web/features/order-creation` and the
`/app/orders/new` route for breeder semen order creation. The route uses the
existing order domain endpoints for draft creation and submission, including
audit/proof hook emission, and shares the demo order repository with the
breeder dashboard so newly created demo orders appear in "My orders".

Ticket 3.4 adds `apps/web/features/breeder-order-detail` and the
`/app/orders/[orderId]` route for breeder-owned order tracking. The view model
requires an active breeder role for the order's breeder organization, displays
status history, shipment information, permission-filtered linked documents and
simple proof events, and remains read-only/display-only for Phase 1.

Ticket 4.1 adds `apps/web/features/station-dashboard` and the
`/station-dashboard` route for breeding stations. The dashboard requires an
active station role, scopes active listings and assigned orders to the station
organization, opens a dashboard order detail panel, and exposes action entry
points for confirm/reject, shipment updates and controlled document uploads
only when the existing domain guards make those actions audit/proof ready.

Ticket 4.2 adds `apps/web/features/listing-management` and the
`/app/station/listings` route for breeding stations. The management view
supports station-owned listing creation, edits, activation/deactivation,
availability updates, required-field validation and audited mutations through
the existing catalog domain endpoints. The breeder catalog now reads from the
same demo listing repository so inactive listings are hidden from
breeder-visible catalog pages.

## 4. Current database setup, if any

PostgreSQL is the local development database. Docker Compose defines a `db`
service using `postgres:16-alpine` and a persistent
`coritech_postgres_data` volume.

The historical raw SQL migrations from the original implementation are preserved
under `packages/database/legacy-sql/migrations`.

## 5. Current ORM / data-access setup, if any

Prisma ORM is configured in `packages/database`.

Active files:

- `packages/database/prisma/schema.prisma`
- `packages/database/prisma/migrations/20260609150000_initial_foundation/migration.sql`
- `packages/database/src/client.ts`
- `packages/database/src/seed.ts`

Prisma is pinned to v6 to keep the standard `schema.prisma` and `DATABASE_URL`
workflow stable.

## 6. Current Docker setup, if any

Docker setup now exists:

- `Dockerfile`
- `docker-compose.yml`
- `.dockerignore`
- `scripts/docker-compose.mjs`

The helper script supports both `docker compose` and standalone
`docker-compose`, because this machine has Docker installed with standalone
Compose but not the Docker Compose plugin.

Compose services:

- `db` - PostgreSQL.
- `migrate-seed` - Prisma migration and seed runner.
- `web` - Next.js app.
- `adminer` - database UI on port `8080`.

## 7. Current environment-variable setup

`.env.example` contains local development defaults for PostgreSQL, Prisma,
Next.js, managed-auth placeholders, object storage placeholders, email,
payment-reference and logistics placeholders.

`.gitignore` ignores `.env` and `.env.*` while allowing example files.

## 8. Current seed-data approach, if any

Seed data is implemented in `packages/database/src/seed.ts` and is idempotent
through stable development IDs and upserts.

Seed coverage includes roles, verification levels, organizations, users, role
assignments, stallion, semen listing, semen order, order status history,
shipment, shipment tracking event, document metadata, proof events, audit logs,
an access permission and an amendment.

## 9. Existing useful product/domain files that were preserved

Preserved and migrated:

- `packages/domain/src/**`
- `packages/config/src/**`
- `packages/database/legacy-sql/migrations/**`
- `apps/web/features/breeder-dashboard/**`
- `docs/**`

## 10. Existing files that appear obsolete, duplicated or conflicting

The former root `api/` and `app/` directories have been removed after their
contents were migrated into the workspace structure.

Historical SQL migrations are intentionally retained under
`packages/database/legacy-sql/migrations` for traceability, while Prisma is now
the active migration path.

## 11. Migration recommendation

- Preserve: domain rules, environment contract, SQL migration history, product
  docs and breeder dashboard logic.
- Adapt: all future app/runtime work into `apps/web` and all future data-access
  work into `packages/database`.
- Replace: any future use of root `api/` or root `app/` paths with workspace
  package paths.
- Remove later: only consider removing legacy SQL history after Prisma
  migrations are accepted as the sole historical record.

## 12. Risks before migration

- Docker verification depends on local Docker daemon health and port
  availability for `3000`, `5432` and `8080`.
- Prisma v7 changes the configuration model; upgrading should be an explicit
  task, not an incidental dependency bump.
- Some PostgreSQL-specific behavior lives in migration SQL and should be checked
  carefully when future schema changes are generated.
