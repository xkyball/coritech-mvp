# Codebase Inventory

Analysis date: 2026-06-10

## Detected Stack

- Repository is an npm workspace with apps/web, packages/config, packages/domain and packages/database.
- Frontend is Next.js App Router with TypeScript under apps/web/app.
- Database package uses Prisma ORM with PostgreSQL in packages/database/prisma/schema.prisma.
- Docker Compose defines PostgreSQL, MinIO, migration/seed, web and Adminer services.
- Domain logic is framework-neutral JavaScript modules under packages/domain/src.
- Tests use Node's built-in test runner, not Jest/Vitest/Playwright.

## Repository Shape Checked

- package.json exists at the root and declares workspaces plus dev/build/test/database scripts.
- README.md documents the standard stack, local run commands, guardrails and current Phase 1 includes.
- .env.example plus local/staging/production examples exist and keep real secrets out of git.
- docker-compose.yml exists and includes db, minio, minio-init, migrate-seed, web and adminer.
- Active Prisma schema is packages/database/prisma/schema.prisma, not a root prisma/schema.prisma.
- Active migrations live under packages/database/prisma/migrations; legacy SQL is preserved under packages/database/legacy-sql/migrations.
- No root src, app, pages, components, lib, server, api, tests or e2e implementation directories are active; the app lives under apps/web and packages.
- .github contains issue templates and a pull request template, but no workflow files.

## Application Foundation

Implemented evidence:
- apps/web/app/layout.tsx and apps/web/app/page.tsx define the root app layout and public overview page.
- apps/web/components/ui/index.tsx and ui.css provide shared UI primitives including DashboardShell, badges, fields, empty/loading/error states and proof event list pieces.
- apps/web/features/navigation.ts defines breeder and station navigation groups.
- Loading files exist for implemented routes.

Missing or partial evidence:
- No app/global-error.tsx, app/error.tsx, app/not-found.tsx or access-denied route was found.
- No authenticated/public layout split was found.
- No admin navigation group or admin route exists.
- No Next.js middleware.ts or route.ts API handlers were found.

## Authentication And User Access

Implemented evidence:
- packages/domain/src/auth/managed-auth-provider.mjs defines OIDC managed-auth contracts, redirect helpers, logout, password-reset/email-verification request helpers and session preparation.
- packages/domain/src/auth/rbac-middleware.mjs defines framework-neutral RBAC middleware and protected route contracts.
- schema.prisma contains User, Organization, Role and UserOrganizationRole.

Missing or partial evidence:
- No login page, logout route/action, auth callback route, session route or protected-route redirect exists in apps/web.
- Current UI uses demo actors and demo organizations, not real authenticated session context.
- No active organization/role context switcher exists.
- Provider selection and CoriTech-owned auth tenant evidence are pending.

## Data Model

Implemented in schema.prisma:
- User, Organization, Role, UserOrganizationRole.
- Stallion, SemenListing.
- SemenOrder, OrderStatusHistory.
- Shipment, ShipmentTrackingEvent.
- Document, EvidenceAttachment.
- ProofEvent, VerificationLevel, AuditLog, Amendment, AccessPermission.

Missing from schema.prisma:
- PaymentReference.
- NotificationLog.
- OrderActivity / OrderComment.
- Mare/recipient order detail fields.
- Document lifecycle status fields for active/superseded/revoked.

## Workflow Logic

Implemented evidence:
- packages/domain/src/orders/semen-order.mjs implements create draft, submit, receive, confirm, reject, cancel, fulfillment, shipped, delivered and completed transition rules with audit/proof hooks.
- packages/domain/src/catalog/semen-catalog.mjs implements station-owned stallion/listing endpoint contracts and listing orderability checks.
- packages/domain/src/shipments/shipment.mjs implements shipment create/update endpoint contracts and tracking events.
- packages/domain/src/documents/document-evidence.mjs implements document metadata, classification, controlled viewing and evidence attachment helpers.
- packages/domain/src/proof/proof-event.mjs can materialize proof events from explicit hooks.
- packages/domain/src/audit/audit-log.mjs materializes audit hooks.

Missing or partial evidence:
- No database-backed OrderService or ShipmentService exists.
- UI server actions use in-memory demo repositories, not Prisma-backed persistent commands.
- No automatic proof-event persistence/duplicate prevention is wired from command actions.
- No notification orchestration or NotificationLog exists.
- No station order management route executes receive/confirm/reject.
- No shipment UI executes create/update.
- No document upload or controlled download endpoint exists.

## UI Functionality

Implemented routes:
- /
- /breeder-dashboard
- /station-dashboard
- /app/catalog
- /app/catalog/[listingId]
- /app/orders/new
- /app/orders/[orderId]
- /app/station/listings

Missing routes or surfaces:
- /login, /logout, /auth/callback, /unauthorized.
- /app/station/orders.
- /app/documents/[documentId].
- Admin dashboard, admin user/org management, admin order support, audit log viewer and permission management UI.
- Payment reference UI, notification center, legal/static pages and support request flow.

## Integrations

Implemented evidence:
- Managed auth provider contract exists, but no concrete provider adapter/runtime route wiring.
- Object storage provider foundation and MinIO local stack exist, but no upload/download route.
- Logistics and payment are represented only as placeholders/reference fields.

Missing evidence:
- No email provider integration.
- No logistics provider adapter.
- No payment provider adapter or PaymentReference model.
- No monitoring/error tracking integration.
- No CI/CD workflow.
- No backup/restore baseline.

## Tests

Implemented evidence:
- 86 domain tests, 6 config tests and 31 web feature tests passed via npm test on 2026-06-10.
- Tests cover many transition, permission, validation, audit/proof hook and UI view-model paths.

Missing evidence:
- No E2E framework or test.
- No database integration test harness.
- No auth/session test helper.
- No CI workflow calling tests.
- No lint or typecheck scripts, though build runs TypeScript.

## Documentation

Implemented evidence:
- Architecture, data model, proof model, RBAC, managed auth, security/GDPR, deployment, Docker setup, UI status and vendor/IP docs exist.

Missing or partial evidence:
- Several docs carry pending placeholders for provider selection, account ownership, staging/production setup, backup/restore and launch readiness.
- This analysis does not replace the original implementation tickets.
