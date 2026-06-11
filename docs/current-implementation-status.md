# Current Implementation Status

Date inspected: 2026-06-10

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
`/app/orders/new` route for breeder semen order creation. Phase 1.1 extends the
route so breeders can create, edit, save, cancel and submit draft orders through
the domain `OrderService`, including audit/proof hook emission. The route now
uses the Prisma-backed semen order repository and validated active breeder
context, so saved drafts and submitted orders persist in PostgreSQL and appear
in the breeder and assigned station workspaces.

Ticket 3.4 adds `apps/web/features/breeder-order-detail` and the
`/app/orders/[orderId]` route for breeder-owned order tracking. The view model
requires an active breeder role for the order's breeder organization, displays
status history, shipment information, permission-filtered linked documents and
the shared proof timeline, and remains read-only/display-only for Phase 1.

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

Ticket 18.06 adds `apps/web/features/stallion-management` and the
`/app/station/stallions` route for breeding stations. The management view
scopes stallions to the active station organization, supports search by name,
UELN or chip ID, creates and edits station-owned stallions, activates or
inactivates stallions, links active stallions into listing creation, and records
stallion changes through the catalog audit hook path.

Ticket 4.3 adds `apps/web/features/station-order-management` and the
`/app/station/orders` route for breeding stations. The workspace lists only
orders assigned to the active station organization, opens station order detail
and executes receive, confirm, reject and move-to-fulfilment status commands through
`OrderService` with station reasons, status history, audit hooks and proof
hooks. Shipment actions now link to `/app/station/shipments`, which creates
and updates durable shipment records through `ShipmentService`. Document actions
link to `/app/documents/upload`, which uploads bytes through the object-storage
provider and persists controlled metadata.

Ticket 7.4 adds `apps/web/features/proof-timeline` as the shared proof timeline
view model/component. Breeder order detail, station selected-order detail and
`/app/admin/proof` now render proof events with actor role, organization,
timestamp, verification level and linked-document indicators without adding
public document links or speculative proof-chain technology.

Ticket 18.10 adds the station receive step. Submitted orders now expose a
`Mark as received` action in the station dashboard and station order management
workspace. The action performs the controlled `SUBMITTED` to `RECEIVED`
transition through `OrderService`, records the station actor context and
optional note in status history, emits the `SEMEN_ORDER_RECEIVED` audit/proof
hook contract and queues the optional `ORDER_RECEIVED` notification hook when a
notification adapter is supplied.

Document runtime workflows are now implemented for Phase 1 controlled evidence:
`/app/documents/upload` and `/api/documents/upload` validate file type/size,
write bytes to private S3-compatible storage, persist document metadata, record
upload audit logs, and create document-upload proof/evidence links where the
repository supports proof-event writes. `/app/documents/[documentId]` and
`/api/documents/[documentId]/access` enforce document classification, record
view audit logs and return short-lived controlled access URLs. The document
detail route also supports authorized revocation and replacement, preserving
document lifecycle evidence instead of deleting records.

Ticket 12.1 extends audit logging with canonical `ACCESS_DECISION` entries for
RBAC allow/deny decisions against concrete protected objects. Platform admins
can query recent audit records at `/app/admin/audit` or
`/api/admin/audit-logs`; normal users still have no audit-log mutation path.
Ticket 18.21 extends that viewer with object, actor, organization, action and
date filters, expandable row detail and page-based pagination. Viewer usage and
limitations are documented in `docs/architecture/audit-log-viewer.md`.

Ticket 18.20 adds the Platform Admin order support workspace at
`/app/admin/orders` and `/app/admin/orders/[orderId]`. Admins can search orders,
inspect status history, proof timeline, linked documents, shipment/tracking
context and an audit excerpt, while corrections are routed to the amendment
handoff instead of direct edits.

Ticket 18.12 adds the order activity and comments layer. Shared breeder/station
comments persist in `order_activities`, status history appears in the same feed
as system activity, and visibility filtering keeps station/internal/admin notes
inside their permitted roles. Breeder order detail, station selected-order
detail and admin order support detail now show order activity; breeder and
station users can add shared comments from their authorized order views.

Ticket 18.32 adds order-linked support requests. Breeder and station users can
submit categorized support requests from authorized order detail surfaces,
requests persist in `support_requests` with requester and order context, admin
notification is queued for later orchestration, and Platform Admin users can
review the lightweight queue at `/app/admin/support`.

Ticket 18.18 adds a provider-agnostic notification template registry under
`packages/domain/src/notifications`. Core order, shipment, document and admin
action events map to template ids with required typed variables and encoded
recipient rules. The database now includes `notification_logs.template_id` so
later provider/orchestration tickets can record which template was resolved.

Ticket 9.1 adds the email provider integration layer. Local development can use
a console sender, staging/production require an environment-driven `http_api`
provider, and `sendNotificationEmail` records successful and failed send
attempts in `notification_logs`. Recipient resolution, queue processing and
retry scheduling remain with Ticket 9.2.

Ticket 9.2 adds notification orchestration for Phase 1 workflow events. Order
submission notifies the assigned station, order confirmation/rejection notifies
the breeder, shipment create/update/delivered events notify the breeder, and
document uploads notify roles allowed by the document classification without
enabling buyer notifications or public document links. `notification_logs` now
stores provider message ids alongside status and failure errors. Retry
scheduling remains a future queue concern.

Ticket 18.19 adds derived in-app action-required lists under
`apps/web/features/action-required`. Breeder, station and Platform Admin
dashboards now show permission-filtered next actions from existing workflow
records, with priorities, dates and protected links. No seen/dismissed lifecycle
state is stored because the implementation intentionally uses a derived query
rather than a persisted action-required model.

Ticket 18.33 adds a central status display registry under
`apps/web/features/status-display` plus shared order, shipment, payment and
verification badge components. Status labels, descriptions, tones and
role-specific next-action hints are display-only and do not replace domain
workflow permission checks. Payment status language now aligns with the
reference-only payment model implemented by Ticket 10.1.

Ticket 18.24 completes the shared UI component foundation in
`apps/web/components/ui`. The library now includes typed buttons, links, form
fields, date input, textarea, field-level form error, badges, status-specific
badges, search fields, tables, pagination controls, empty/loading/error states,
notice/toast surfaces and a reusable confirmation dialog. The permission
revocation flow uses the shared dialog for destructive confirmation.

Ticket 18.34 adds a shared table-list convention under
`apps/web/features/table-list`. List view models can normalize query, page,
page size, whitelisted sort direction and allowed filters through one helper,
while the shared UI library exposes `SearchField` and `PaginationControls`.
`/app/admin/orders` is the first adopter and preserves its existing Platform
Admin permission boundary.

Ticket 11.2 adds the Phase 1 data-quality rule registry under
`packages/domain/src/data-quality`. The registry validates required fields for
orders, shipments, documents and proof events, checks order status-transition
quality and can log data-quality failures through the existing append-only audit
hook path. No new persistence table or automated correction workflow is added.

Ticket 11.1 adds lightweight operational reporting to the Platform Admin
dashboard through `apps/web/features/operational-reporting`. The panel uses
real repository data for active listings, submitted/confirmed/rejected/completed
orders, confirmation timing, shipments, uploaded documents, proof events and
documentation completion rate without introducing a BI stack.

Ticket 10.1 adds the reference-only `PaymentReference` model and
`packages/domain/src/payments/payment-reference.mjs`. Payment references link to
semen orders, store provider name/reference id, status, amount and currency,
and audit create/status updates without storing card data, bank credentials or
raw provider payloads.

Ticket 18.17 exposes payment references in the product without adding payment
processing. Breeder order detail shows read-only payment status/reference,
station order management lets the assigned station maintain manual references
and Platform Admin order support lets admins maintain the same reference fields.
All writes use the reference-only service and append-only audit path.

Ticket 10.2 adds `packages/domain/src/payments/payment-provider-adapter.mjs`.
The `manual_reference` adapter creates and updates `PaymentReference` records
through the same audited service, while `provider_placeholder` documents the
future provider extension point and fails closed until a real provider ticket
implements it. No card, bank credential, checkout or raw provider payload data
is stored.

Ticket 5.2 adds `packages/domain/src/shipments/logistics-provider-adapter.mjs`.
The `manual` logistics adapter uses the same `ShipmentService` path as station
shipment actions, while `external_placeholder` documents the future carrier
seam and fails closed. Tracking event normalization maps known provider statuses
into the existing `ShipmentTrackingEvent` model without adding carrier-specific
core logic.

Ticket 18.28 replaces the E2E placeholder with `e2e/baseline.test.mjs`, a
deterministic Node happy-path that exercises station stallion/listing setup,
breeder draft/submit, station receive/confirm, shipment creation/update, mocked
document metadata upload, breeder document visibility, proof/audit assertions
and one cross-station denial. Run instructions live in
`docs/development/minimal-e2e-happy-path.md`.

Ticket 16.1 extends the same E2E baseline into the complete MVP order journey.
It now includes Platform Admin organization setup, invitation-based breeder and
station onboarding, listing visibility, order/shipment/document notifications,
proof events, audit logs and permission denial evidence. The local journey is
deterministic; hosted staging-demo acceptance remains pending until the external
staging/auth/email/storage/provider setup documented under deployment is
completed.

Ticket 14.2 adds the baseline GitHub Actions workflows in `.github/workflows/`.
Pull requests run install, lint, typecheck, unit/integration tests, minimal E2E
and build. Manual deployment workflow inputs support staging and production
placeholders, with production tied to a protected GitHub environment approval
gate. Ownership and limitations are documented in
`docs/deployment/cicd-baseline.md`.

Ticket 14.1 documents the staging/production deployment structure in
`docs/deployment/staging-production-setup.md`. The environment contract now
includes monitoring/error tracking variables, staging and production examples
cover database, object storage, auth, email and monitoring ownership, and the
Docker image builds the Next.js app for `next start` while local Compose keeps
the development server override.

Ticket 14.3 adds the backup/restore baseline in
`docs/deployment/backup-restore-baseline.md`. PostgreSQL backup and restore can
be planned or triggered through `npm run backup:database` and
`npm run restore:database`, while object storage backup/versioning, RPO/RTO,
backup admin and DD evidence requirements remain documented pending provider
selection.

Ticket 12.3 adds `docs/security/security-gdpr-note.md`, a concise DD-ready
security/GDPR note covering data classification, roles and permissions, proof
security, document access, buyer-view boundaries, risk-control mapping, MVP
controls, legal placeholders and staged roadmap.

Ticket 13.1 adds the Phase 1 vendor register in
`docs/vendor-ip/vendor-register.md` and `docs/vendor-ip/vendor-register.csv`.
It tracks vendor type, role, access/data access, IP created, contract and
handover requirements, risk level, owner and status for development, design,
cloud, auth, payment, notification, storage, database and legal/GDPR vendors.

Ticket 0.1 local repository setup now includes GitHub templates, CODEOWNERS and
`docs/source-control/branch-protection.md`. External acceptance evidence remains
pending because the observed local remote is `https://github.com/xkyball/coritech-mvp.git`,
which is not itself proof of CoriTech-controlled organization ownership or live
branch protection.

Ticket 18.31 adds public static pages at `/privacy`, `/terms`, `/imprint`,
`/contact` and `/data-access`. The root layout now includes footer links to
those pages, and all legal/support copy is explicitly placeholder text pending
final legal and company-detail review.

Ticket 18.35 adds `docs/product/mvp-readiness-checklist.md`, a go/no-go
readiness checklist for investor demo, staging handover and DD review. It
groups checks by product, auth, roles, workflow, proof/audit, documents,
security, infrastructure, testing, demo and DD, with status, evidence, owner and
date fields plus explicit blockers for external ownership, legal and provider
setup.

Ticket 18.22 adds the Platform Admin permission management workspace at
`/app/admin/permissions`. Admins can grant user or organization scoped
object-level permissions, set expiry, revoke permissions with a reason and
review active, expired and revoked permission rows while every change is routed
through the audit-aware AccessPermission service.

Ticket 8.1 replaces the `/app/admin` redirect with a Platform Admin operational
overview. The dashboard shows lightweight counts, routes order search into
order support, links proof/audit/permission/document workspaces and records an
`ADMIN_DASHBOARD_VIEW` audit entry. It links into the amendment workspace
implemented by Ticket 8.3.

Ticket 8.2 adds Platform Admin identity management at `/app/admin/users`,
`/app/admin/organizations` and `/app/admin/roles`. Admins can create/edit/disable
organizations, disable users and assign existing active users to active
organizations with Phase 1 roles. Role assignment changes are audit logged
through the role model, and user/organization admin changes create `ADMIN_EDIT`
audit entries. Accepted user onboarding is handled through the Ticket 18.04
invitation workflow.

Ticket 8.3 adds the Platform Admin amendment workflow at
`/app/admin/amendments` and `/app/admin/amendments/new`. Admins can select a
proof-relevant target, enter an amended value and mandatory correction reason,
and create an amendment record plus `CREATE_AMENDMENT` audit log while the
original target value is loaded from the current target snapshot and preserved.
The workflow intentionally does not silently overwrite target records.

Ticket 18.04 adds durable user invitations at `/app/admin/invitations` and the
public `/accept-invite` page. Platform Admin users can create expiring
invitations for breeder or breeding-station users, view queued invitation
status and show the generated invitation link. Accepting a valid token creates
or links the user, creates the organization role assignment, writes the
role-assignment audit log and sends the invitee to managed login with the
assigned workspace as the return target.

## 4. Current database setup, if any

PostgreSQL is the local development database. Docker Compose defines a `db`
service using `postgres:16-alpine` and a persistent
`coritech_postgres_data` volume.

MinIO is the local/development S3-compatible object storage provider. Docker
Compose defines a `minio` service, a persistent `coritech_minio_data` volume and
a one-shot `minio-init` bucket initializer for the private local bucket.

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
- `minio` - local/development S3-compatible object storage on ports `9000` and
  `9001`.
- `minio-init` - one-shot private bucket initializer.
- `migrate-seed` - Prisma migration and seed runner.
- `web` - Next.js app.
- `adminer` - database UI on port `8080`.

## 7. Current environment-variable setup

`.env.example` contains local development defaults for PostgreSQL, Prisma,
Next.js, managed-auth placeholders, local MinIO object storage defaults, email,
payment-reference and logistics placeholders.

`.gitignore` ignores `.env` and `.env.*` while allowing example files.

## 8. Current seed-data approach, if any

Seed data is implemented in `packages/database/src/seed.ts` and is idempotent
through stable development IDs and upserts.

Seed coverage includes roles, verification levels, organizations, users, role
assignments, stallion, semen listing, semen order, order status history,
shipment, shipment tracking event, document metadata, proof events, audit logs,
an access permission and an amendment. Invitation tables are migrated but not
seeded with reusable invite tokens.

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
