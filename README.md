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
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:studio
npm run docker:up
npm run docker:down
npm run docker:reset
```

## UI Foundation

All future UI work must use the CoriTech design system and shared components.

Visual principles:
- calm
- precise
- premium
- role-aware
- trust-focused
- operational
- due-diligence ready

Avoid:
- decorative horse imagery
- marketplace-first styling
- random colors
- one-off components
- generic admin-template pages

When implementing UI:
1. Check existing shared components first.
2. Reuse the dashboard shell.
3. Use semantic theme tokens.
4. Preserve accessibility.
5. Do not create preview/demo routes unless explicitly requested.

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
