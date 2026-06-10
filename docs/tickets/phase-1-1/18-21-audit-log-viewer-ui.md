# Ticket 18.21 — Audit Log Viewer UI

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Admin Operations & Auditability
**Recommended order:** 21
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-08-audit-log-v1.md, 08-01-admin-dashboard.md

## Objective

Make auditability visible and searchable for platform admins and technical reviewers.

## Gap Closed

AuditLog model exists and admin dashboard mentions audit logs, but no dedicated searchable UI lets admins inspect actions by object, actor, organization or date.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create Audit Log list page
- Add filters by object type/object ID
- Add filters by actor/user
- Add filters by organization
- Add filters by action
- Add date range filter
- Create audit detail view or expandable row
- Add pagination
- Enforce read-only behavior

## Functional Requirements

- Admin can find all audit logs for an order, document, shipment or user
- Admin can inspect previous/new value where stored
- Admin can filter by time range
- Audit log entries are not editable from UI

## API / Service Requirements

- Admin audit log query endpoint with filters and pagination
- Do not expose audit logs to non-admin users unless later ticket defines it

## UI / UX Requirements

- Audit table with timestamp, action, actor, role, organization, object type/id
- Detail drawer/modal for payload values
- Empty and loading states

## Security, Permissions & Audit Requirements

- Admin-only access
- Audit viewer access may itself be audit logged if policy requires
- No mutation endpoints for audit log editing

## Out of Scope

- AI insights or predictive analytics
- Blockchain, token, wallet or digital asset logic
- Full Equine Data Space automation
- Federation / studbook automation beyond placeholders
- Sensor or wearable ingestion
- Complex marketplace automation
- Unrestricted buyer access
- Real card payment processing or storage of sensitive payment data
- Full external logistics-provider implementation unless explicitly scoped

## Acceptance Criteria

- [ ] Audit log viewer page exists
- [ ] Admin can filter by object type/id
- [ ] Admin can filter by actor and organization
- [ ] Admin can filter by action and date range
- [ ] Pagination exists
- [ ] Detail view exists
- [ ] Audit logs are read-only
- [ ] Non-admin access denied

## Required Tests

- Test admin access
- Test non-admin denied
- Test filters produce expected query
- Test read-only behavior

## Documentation Updates

- Document audit log viewer usage and limitations

## Common Implementation Rules

- Implement only this ticket and keep scope intentionally narrow.
- Preserve CoriTech core logic: workflow-generated proof, role-based permissions, auditability and controlled data access.
- Do not add future-phase features unless they are explicitly listed as placeholders or enums.
- Do not commit secrets, credentials, real API keys or production configuration.
- Prefer service-layer orchestration over spreading business logic across UI components or raw route handlers.
- Add or update tests where functionality is implemented.
- Update documentation when behavior, data model, API convention or operational setup changes.

## Codex Execution Prompt

```text
Implement the ticket at:

/docs/tickets/phase-1-1/18-21-audit-log-viewer-ui.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.21 — Audit Log Viewer UI.

Important rules:
- Keep scope limited to this ticket.
- Follow all acceptance criteria exactly.
- Do not implement AI, blockchain/token, full data-space automation, federation automation, complex marketplace automation or unrestricted buyer access.
- Do not commit secrets or real provider credentials.
- Add tests for implemented behavior.
- Update documentation if this ticket changes architecture, data model, API contract, operational workflow or user behavior.
- Return an acceptance-criteria checklist after implementation.

Expected output:
1. Files changed
2. Functional behavior implemented
3. Tests added or updated
4. Documentation updated
5. Acceptance criteria checklist
6. Assumptions made
7. Anything intentionally not implemented
8. Recommended next ticket
```
