# MVP Gap Analysis

Analysis date: 2026-06-10

## 1. What Exists Today

- A runnable Next.js/TypeScript workspace with Prisma/PostgreSQL schema, Docker Compose local stack and seed data.
- Strong framework-neutral domain foundations for identity roles, catalog/listings, orders/status history, shipments/tracking, document metadata, proof events, verification levels, audit logs, access permissions and amendments.
- Demo-backed breeder and station UI routes for dashboards, catalog, order creation/order detail and listing management.
- Unit/feature tests for domain helpers and UI view models.
- Architecture, data model, RBAC, security/GDPR, deployment and vendor/IP documentation.

## 2. What Is Missing For A Complete Usable MVP

- Real login/logout/callback/session handling and protected route redirects.
- Active organization/role context tied to authenticated users.
- Database-backed command services for order and shipment mutations.
- Station order management route for receive/confirm/reject and reasoned outcomes.
- Shipment creation/update UI and delivery confirmation flow.
- Document upload, preview/download and lifecycle management.
- Automatic proof-event persistence from order/shipment/document actions with duplicate prevention.
- Notification templates, NotificationLog and workflow notification orchestration.
- Admin support, audit viewer, user/org management and permission management UI.
- E2E test, CI workflow, staging deployment, backup/restore and monitoring/error tracking.

## 3. Documented But Not Implemented

- Staging/production setup, CI/CD and backup/restore are documented only as pending placeholders.
- Email provider, payment provider, logistics provider, monitoring and error tracking are documented as pending or structural references.
- PaymentReference and NotificationLog appear in ticket/doc expectations but are absent from schema.
- Security/GDPR and vendor/account docs contain pending legal/vendor evidence fields.

## 4. Implemented But Not Tested Enough

- Build and domain/web tests pass, but there is no E2E test for the core journey.
- There are no database integration tests using Prisma/PostgreSQL.
- There are no auth/session/protected-route tests because auth is not wired.
- There are no CI tests because no CI workflow exists.

## 5. Implemented But Not Wired Into The App

- Managed auth provider contract is not wired into Next routes.
- RBAC middleware exists but is not fed by real sessions in route handlers.
- Prisma schema and seed data exist, but UI server actions use in-memory demo repositories.
- Proof and audit hooks exist, but automatic proof persistence is not connected to command services.
- Object storage provider foundation exists, but no upload/download UI or endpoint uses it.

## 6. Backend Implemented But UI Missing

- Station order receive/confirm/reject transitions.
- Shipment create/update endpoint contracts.
- Document metadata and evidence attachment helpers.
- AccessPermission grant/revoke/check service.
- Amendment creation service.
- Audit log object query helper.

## 7. UI Implemented But Backend/Service Logic Missing

- Order creation UI works against demo state, not persistent database-backed OrderService.
- Listing management UI works against demo state, not persistent catalog repositories.
- Dashboard action cards expose future operational actions without executing them.
- Document metadata appears in detail views, but no controlled document route/download exists.

## 8. Missing Workflow Transitions

The domain transition map supports the target order states, but the app does not persistently execute the full journey. Missing app-level commands include receive order, confirm order, reject order with reason, cancel order with policy, move to fulfilment, create shipment, update shipment status, confirm delivery, upload document, replace/revoke document and complete order.

## 9. Security Or Permission Risks

- Protected routes are not actually protected by login/session middleware.
- Demo actors can make UI appear role-aware without proving real authorization.
- Admin surfaces are absent, so support workflows are not controlled through UI.
- Document links are metadata-only or point to missing routes, reducing accidental exposure risk but blocking usable document access.
- Production account ownership and provider choices remain pending evidence.

## 10. Missing Proof/Audit Hooks

- Hooks exist in domain helpers, but command services do not persist proof events automatically from order/shipment/document actions.
- Duplicate proof-event prevention is missing.
- Notification failures and runtime access attempts are not persisted through a live app service.

## 11. Integration Placeholders

- Managed auth provider tenant/adapter.
- Email provider.
- Production object storage provider.
- Logistics adapter.
- Payment reference/provider adapter.
- Monitoring/error tracking.
- CI/CD and staging deployment.
- Backup/restore.

## 12. Local/Staging Setup Gaps

- Local build and tests pass.
- Prisma validation passes when DATABASE_URL is supplied.
- Migration status could not connect to localhost:5432 in this environment.
- Docker Compose files exist, but this environment could not access the Docker socket.
- No staging environment or deployment workflow exists.

## 13. Tickets Blocked By Earlier Foundations

- Admin dashboard/order support/audit/permission UI are blocked by login/session and active Platform Admin context.
- Root role redirects are blocked by login/session and active context.
- Full E2E happy path is blocked by persistent command services and station/document workflow UI.
- Proof automation is blocked by persistent order/shipment/document command services.

## 14. What Should Be Implemented Next

Implement Ticket 18.03 - Login, Logout and Auth UI. This closes the largest P0 usability gap and unlocks protected routes, active role context, DB-backed command services and real permission enforcement.
