# Blocked Tickets

Updated: 2026-06-10

## Current BLOCKED Count

0

No ticket is currently classified as BLOCKED. Earlier hard blockers were removed by the now-present app scaffold, auth/session foundation, active role context, order command service, shipment command service and document access implementation.

## Dependency-Sequenced Tickets

The following tickets are not BLOCKED, but should not be started until their prerequisites are handled:

- 18-20 Admin Order Support View: depends on RBAC runtime hardening and proof/audit visibility.
- 18-21 Audit Log Viewer UI: depends on admin workspace and app-wide access logging decisions.
- 18-22 Permission Management UI: depends on admin user/org management and RBAC guard patterns.
- 09-01 Email Provider Integration: depends on notification template/orchestration shape.
- 09-02 Notification Orchestration: depends on template registry and provider adapter.
- 18-17 Payment Reference UI: depends on PaymentReference model.
- 10-02 Payment Provider Adapter Placeholder: depends on PaymentReference model.
- 18-28 Minimal E2E Happy Path: depends on test framework baseline and stable local service startup.
- 14-02 CI/CD Baseline: depends on lint/typecheck/test command completeness.
- 16-01 Complete Breeder-to-Station Journey: should remain a capstone after core gaps, E2E and readiness work.
