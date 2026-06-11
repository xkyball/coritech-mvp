# CoriTech Phase 1 MVP

CoriTech is a Verified Horse Passport and Equine Data Space for the equine
market. Phase 1 focuses on the operational semen-ordering wedge:

```text
Breeder -> Semen Listing -> Semen Order -> Station Confirmation -> Shipment Tracking -> Documentation -> Basic Proof Event -> Audit Log
```

Core proof logic:

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

## Standard Development Stack

This repository uses:
- Next.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Docker Compose

All future development tasks should build on this foundation unless explicitly instructed otherwise.

## Product Guardrails

Do not introduce:
- blockchain/token logic
- AI claims or AI features
- full marketplace automation
- custom authentication
- payment-card storage
- federation automation
- sensor/wearable ingestion

unless explicitly requested in a later phase.

## What Existed Before This Standardization

The repository already contained useful Phase 1 domain work:

- Framework-neutral JavaScript domain helpers under `packages/domain/src/`.
- PostgreSQL-oriented raw SQL model migrations under `packages/database/legacy-sql/migrations/`.
- Environment validation helpers under `packages/config/src/`.
- A breeder dashboard view-model and renderer under `apps/web/features/breeder-dashboard/`.
- Product, architecture, data-model, security, ticket and ownership docs under `docs/`.

There was no package manifest, package manager lockfile, Next.js runtime,
TypeScript application setup, Prisma schema, seed script, Dockerfile or Docker
Compose stack.

The detailed pre-migration inspection lives in
`docs/current-implementation-status.md`.

## What Changed

- Added an npm workspace foundation.
- Added a Next.js App Router app at `apps/web`.
- Added a Prisma/PostgreSQL database package at `packages/database`.
- Adapted the existing raw SQL migration intent into the first Prisma-managed
  migration.
- Added idempotent local seed data for roles, organizations, users, catalog,
  order, shipment, document metadata, proof events, audit logs, access
  permission and amendment evidence.
- Added Docker Compose services for PostgreSQL, the web app, migration/seed and
  Adminer.
- Updated local environment defaults and stack documentation.

## Repository Structure

```text
apps/web/                 Next.js App Router frontend
apps/web/features/        Migrated frontend feature modules
packages/config/          Environment contract and validation helper
packages/domain/          Framework-neutral CoriTech domain rules
packages/database/        Prisma schema, migration and seed data
docs/                     Product, architecture, data, proof, RBAC and Docker docs
docker-compose.yml        Local development stack
Dockerfile                Node.js app image for web and migrate-seed services
```

## Run Locally

Install dependencies:

```bash
npm install
```

Copy local environment defaults:

```bash
cp .env.example .env
```

Start the full local stack:

```bash
npm run docker:up
```

Open:

- Web app: `http://localhost:3000`
- Health endpoint: `http://localhost:3000/api/health`
- Adminer: `http://localhost:8080`

Adminer connection values:

- System: `PostgreSQL`
- Server: `db`
- Username: `coritech`
- Password: `coritech_dev_password`
- Database: `coritech_mvp`

## Database Commands

Run migrations:

```bash
npm run db:migrate
```

Seed the database:

```bash
npm run db:seed
```

Reset the database:

```bash
npm run db:reset
```

Open Prisma Studio:

```bash
npm run db:studio
```

For host-side Prisma commands, set `DATABASE_URL` to a host-reachable database
URL such as:

```bash
DATABASE_URL="postgresql://coritech:coritech_dev_password@localhost:5432/coritech_mvp?schema=public"
```

## Stable Root Scripts

```bash
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run test:unit
npm run test:integration
npm run test:e2e
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:studio
npm run backup:database
npm run restore:database
npm run docker:up
npm run docker:down
npm run docker:reset
```

Testing conventions, shared factories and auth-context mocks are documented in
`docs/development/testing.md`. The minimal MVP happy path is documented in
`docs/development/minimal-e2e-happy-path.md`.

The baseline CI/CD workflow is documented in
`docs/deployment/cicd-baseline.md`.
Staging and production setup requirements are documented in
`docs/deployment/staging-production-setup.md`.
Backup and restore baseline procedures are documented in
`docs/deployment/backup-restore-baseline.md`.
Repository ownership and branch-protection evidence requirements are documented
in `docs/source-control/repository-ownership.md` and
`docs/source-control/branch-protection.md`.

## UI System

All future UI work must use the shared UI system.

Before creating a new page or component:
1. Check the existing component library.
2. Reuse shared layout primitives.
3. Use semantic design tokens.
4. Preserve accessibility.
5. Avoid one-off styling.
6. Do not create demo or preview routes unless explicitly requested.

Shared UI source:

- `apps/web/components/ui/index.tsx`
- `apps/web/components/ui/ui.css`
- `apps/web/app/globals.css`
- `docs/ui-design-system.md`

## UI Guardrails

The UI should feel:
- calm
- precise
- premium
- role-aware
- operational
- trust-focused

Avoid:
- decorative imagery
- generic marketplace styling
- random colors
- raw browser-default forms
- one-off components
- crypto/web3 visual language

## Phase 1 Includes

- Organization-scoped roles for Breeder, Breeding Station and Platform Admin.
- Prepared future roles for Vet / Clinic, Federation / Studbook, Sales Venue and Buyer.
- Stallion and semen listing records.
- Semen orders and status history.
- Shipments and tracking events.
- Document metadata and evidence attachment records.
- Verification level taxonomy.
- Proof events.
- Audit logs.
- Access permissions.
- Corrections and amendments.

## Intentionally Excluded

- Blockchain, tokens, wallets or digital assets.
- AI features, scoring or generated claims.
- Full marketplace automation.
- Custom authentication and password handling.
- Payment-card storage or payment processing.
- Federation automation.
- Sensor or wearable ingestion.
- Complex microservices.

## Future Task Baseline

Future Codex tasks should assume this repository already uses:

```text
Next.js + TypeScript + PostgreSQL + Prisma ORM + Docker Compose
```
