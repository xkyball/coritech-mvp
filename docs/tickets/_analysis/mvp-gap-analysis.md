# MVP Gap Analysis

Updated: 2026-06-10

## 1. What Exists Today

The repository now contains a real Next.js App Router application, managed-auth routes, active role context, Prisma-backed repositories, core order/shipment/document command services, local PostgreSQL and MinIO configuration, seed data and a passing unit test suite. The main breeder-to-station workflow has real UI routes and backend/domain behavior for draft orders, submission, station receipt/confirmation/rejection, fulfilment, shipments, documents, proof events and audit hooks.

## 2. What Is Missing For A Complete Usable MVP

The biggest remaining gaps are scaffold reliability, RBAC runtime hardening, station stallion management, complete rejection/cancellation visibility, reusable proof/audit timelines, admin support surfaces, notifications, payment references, provider placeholders, E2E tests, CI, staging and backup/restore readiness.

## 3. Documented But Not Implemented

- Email provider and notification orchestration.
- Payment reference model/UI and payment provider placeholder.
- Admin dashboard, admin order support, audit log viewer and permission management.
- E2E happy path, CI/CD, staging/prod and backup/restore.
- Legal/static pages and MVP readiness checklist.

## 4. Implemented But Not Tested Enough

- The workflow has broad unit/domain/web tests, but no browser E2E coverage validates a real login-to-order-to-station-to-shipment-to-document path.
- Seed data is implemented but not directly tested.
- Shared UI components are exercised through feature tests rather than component/visual tests.

## 5. Implemented But Not Fully Wired Into The App

- Amendment domain/model exists but no admin amendment workflow UI is wired.
- Audit log model/helpers exist but no viewer and no app-wide access logging guard.
- Proof events are generated but the timeline UI is only partial.

## 6. Backend Implemented But UI Missing

- Amendment workflow.
- Audit log viewing.
- User/org/role management.
- Dedicated station stallion CRUD.
- Some cancellation/rejection reason visibility and activity feed behavior.

## 7. UI Implemented But Backend/Service Missing

- Dashboard action-required cards exist, but persisted notification lifecycle is missing.
- Some support/recovery surfaces exist, but no support request model/admin triage flow exists.

## 8. Workflow Transitions Missing Or Incomplete

- Core order transitions are implemented in the service.
- Submitted-order cancellation and cross-role rejection/cancellation communication remain incomplete.
- Payment-reference workflow is absent.
- Notification workflow is hook-only.

## 9. Security Or Permission Risks

- RBAC is implemented in domain helpers and route layouts, but no universal API guard/proxy ensures future handlers cannot bypass checks.
- Admin/support routes are not implemented yet, so permission-management and audit-review controls remain unproven.
- Production auth/storage secrets are intentionally absent and must be validated in staging.

## 10. Proof/Audit Hooks Missing

- Core order, shipment and document actions emit proof/audit evidence.
- Missing pieces are presentation/query completeness, admin audit review, app-wide protected access logging and proof timeline reuse.

## 11. Integration Placeholders Remaining

- Email provider.
- Notification template registry and orchestration.
- Logistics adapter interface.
- Payment provider placeholder.
- Monitoring/error tracking.
- Backup/restore automation.

## 12. Local/Staging Setup Gaps

- Local scripts build and test, but lint/typecheck scripts are missing.
- Docker service status could not be verified in this environment due to socket permission denial.
- No staging/prod config evidence or CI workflow found.

## 13. Tickets Blocked By Missing Earlier Foundations

No tickets are now classified as BLOCKED, because the earlier app/auth/workflow foundations exist. Several tickets remain dependency-sequenced: admin support depends on RBAC/proof/audit visibility, notifications depend on template/provider foundations, payment UI depends on PaymentReference, and E2E/CI depend on scaffold/test baseline.

## 14. What Should Be Implemented Next

Ticket 18-01 Application Scaffold should be completed next. The repository can build and test, but the missing root lint/typecheck scripts and health endpoint are foundational for CI, E2E and readiness checks. After that, complete the test baseline, RBAC runtime guard and station stallion management.
