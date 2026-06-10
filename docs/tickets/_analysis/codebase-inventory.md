# Codebase Inventory

Updated: 2026-06-10

## Detected Stack

- Monorepo using npm workspaces from package.json.
- Next.js App Router web application under apps/web.
- TypeScript and JavaScript modules across apps and packages.
- Prisma schema and migrations under packages/database/prisma.
- PostgreSQL and MinIO local services in docker-compose.yml.
- Vitest test coverage for domain, config and web features.

## Application Foundation

Implemented evidence:

- apps/web/app contains public auth pages, protected app routes and role workspaces.
- apps/web/app/app/layout.tsx protects app routes.
- apps/web/app/app/page.tsx redirects based on active role context.
- apps/web/components/ui includes shared Button, Card, DashboardShell and StatusBadge primitives.
- apps/web/app/error.tsx, global-error.tsx and not-found.tsx provide error surfaces.

Remaining gaps:

- Root lint and typecheck scripts are missing.
- No health endpoint found.
- No E2E suite or CI workflow found.

## Authentication And User Access

Implemented evidence:

- apps/web/app/login/page.tsx, logout/page.tsx, logged-out/page.tsx and auth route handlers implement login/logout/callback/reset/verification surfaces.
- apps/web/features/auth/server-session.ts signs/verifies sessions and maps managed provider identities to internal users and memberships.
- apps/web/features/auth/active-context-runtime.mjs manages active organization/role context.
- Role layouts under apps/web/app/app/breeder, station and admin enforce role-specific access.

Remaining gaps:

- RBAC enforcement is still route/service local rather than a single app-wide API guard.
- Invitation/onboarding and permission-management UI are not implemented.

## Data Model

Implemented models found in packages/database/prisma/schema.prisma:

- User, Organization, Role, UserOrganizationRole.
- Stallion, SemenListing, SemenOrder, OrderStatusHistory.
- Shipment, ShipmentTrackingEvent.
- Document, EvidenceAttachment, ProofEvent, VerificationLevel, AuditLog.
- Amendment and AccessPermission.

Missing models:

- PaymentReference.
- NotificationLog.
- OrderActivity and OrderComment.

## Workflow Logic

Implemented evidence:

- packages/domain/src/orders/semen-order.mjs implements order create, update draft, submit, receive, confirm, reject, move to fulfilment, complete and cancel commands with audit/proof/notification hooks.
- packages/domain/src/shipments/shipment.mjs implements create shipment, update shipment status, tracking events, delayed/delivered markers and receipt confirmation.
- packages/domain/src/documents/document-storage.mjs implements upload, controlled access URL generation, replacement and revocation.
- apps/web feature repositories wire these services to Prisma-backed web routes.

Remaining gaps:

- Complete submitted-order cancellation UI and cross-role reason/activity visibility are incomplete.
- Notification orchestration is hook-only; no persisted log/template/provider.
- Logistics and payment provider adapters remain placeholders/open.

## UI Functionality

Implemented evidence:

- Breeder dashboard, catalog, order creation and order detail routes exist.
- Station dashboard, listing management, station order management and shipment management routes exist.
- Document upload, controlled document detail/access, replacement and revocation routes exist.
- Role selection and role-based navigation exist.

Remaining gaps:

- Dedicated station stallion management UI is incomplete.
- Admin dashboard, admin order support, audit log viewer, user/org management and permission management UI are not implemented.
- Proof timeline is partial and not reusable across all admin/station/breeder contexts.

## Integrations

Implemented evidence:

- Managed auth route/session foundation exists.
- Local object storage foundation exists with MinIO and S3-compatible adapter.

Remaining gaps:

- Email provider integration is absent.
- Notification orchestration is incomplete.
- Logistics adapter interface is partial.
- Payment reference/provider placeholder is absent.
- Monitoring/error tracking, CI/CD, staging/prod setup and backup/restore are incomplete.

## Tests

Current verification evidence:

- npm test passed with 108 domain tests, 6 config tests and 78 web tests.
- npm run build passed.
- Prisma validate passed when DATABASE_URL was supplied.

Remaining gaps:

- No root lint/typecheck scripts.
- No E2E suite.
- No CI workflow.
- Docker service status could not be verified because Docker socket access was denied.
