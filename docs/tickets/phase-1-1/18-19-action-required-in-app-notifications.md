# Ticket 18.19 — Action Required In-App Notifications

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Notifications & Dashboards
**Recommended order:** 19
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 03-01-breeder-dashboard.md, 04-01-station-dashboard.md, 08-01-admin-dashboard.md, 18-09-order-command-service.md

## Objective

Give users an in-product list of what requires their attention rather than relying only on email or scattered dashboard counts.

## Gap Closed

Dashboards mention notifications/action-required, but no model or derived query defines actionable items for breeder, station and admin users.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Define ActionRequired as model or derived query pattern
- Create breeder action list
- Create station action list
- Create admin action list
- Link action item to relevant object
- Support seen/dismissed state if model-based
- Integrate into dashboards
- Define priority and due/created dates where useful

## Functional Requirements

- Breeder sees draft orders needing submission, confirmed orders needing review, deliveries needing confirmation where applicable
- Station sees submitted orders needing receive/confirm/reject and shipments needing update
- Admin sees support, failed notification or amendment items where implemented
- Clicking item opens relevant object

## Data Model / Persistence Requirements

- Model fields if persisted: id, userId/orgId/role, type, objectType, objectId, title, description, status, createdAt, seenAt
- Derived query alternative must be documented

## API / Service Requirements

- Endpoint/query returns action items for active context
- Results must be permission-filtered

## UI / UX Requirements

- Dashboard action required card/list
- Empty state: no actions required
- Badge/count in app shell optional

## Security, Permissions & Audit Requirements

- Action items must not leak existence of unauthorized orders/documents
- Items must be based on active organization/role context

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

- [ ] Action-required list exists for breeder dashboard
- [ ] Action-required list exists for station dashboard
- [ ] Admin action list exists or clear placeholder implemented
- [ ] Items link to authorized objects
- [ ] Empty state exists
- [ ] Permission filtering works
- [ ] No email-only dependency for knowing next action

## Required Tests

- Test breeder action query
- Test station action query
- Test permission filtering
- Test item link target generation

## Documentation Updates

- Document action-required derivation/model

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

/docs/tickets/phase-1-1/18-19-action-required-in-app-notifications.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.19 — Action Required In-App Notifications.

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
