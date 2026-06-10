# Ticket 18.09 — Order Command Service

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Service Layer & Workflow Control
**Recommended order:** 9
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-03-semen-order-status-history.md, 01-08-audit-log-v1.md, 01-06-proof-event-v1.md, 09-02-notification-orchestration.md
**Blocks / Enables:** 18-08-draft-order-submit-flow.md, 18-10-station-receive-order-step.md, 18-11-order-rejection-cancellation-flow.md

## Objective

Centralize semen order business logic in one service layer so status changes, permissions, audit, proof and notifications stay consistent.

## Gap Closed

Existing tickets define models, UI and proof automation separately, but no ticket ensures order commands are executed through a single controlled application service.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create OrderService / command layer
- Implement createDraftOrder
- Implement updateDraftOrder
- Implement submitOrder
- Implement receiveOrder
- Implement confirmOrder
- Implement rejectOrder
- Implement moveToFulfilment
- Implement completeOrder
- Integrate permission checks, status guards, audit hooks, proof hooks and notification hooks

## Functional Requirements

- All order mutations go through OrderService
- Invalid transitions are rejected
- Relevant actions create status history
- Relevant actions call audit/proof/notification services
- Service returns predictable errors for UI

## Technical Requirements

- Avoid duplicating order transition logic in API routes or UI components
- Use transaction boundaries for status update + history + audit/proof where appropriate
- Keep commands idempotent where duplicate user clicks are plausible
- Define typed command input/output objects

## API / Service Requirements

- API routes/actions call OrderService only
- Errors should map to standard API error format once convention exists

## Security, Permissions & Audit Requirements

- OrderService must validate active organization/role context
- Admin overrides must be explicit and audit logged
- No silent overwrite of submitted proof-relevant fields

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

- [ ] OrderService exists
- [ ] All order mutation endpoints use OrderService
- [ ] Allowed transition map is centralized
- [ ] Status history is created for transitions
- [ ] Audit hooks are called
- [ ] Proof hooks are called where relevant
- [ ] Notifications hooks are called where relevant
- [ ] Permission failures are rejected
- [ ] Tests cover key transitions and invalid transitions

## Required Tests

- Unit tests for transition map
- Service tests for create/update/submit/receive/confirm/reject/complete
- Permission tests
- Audit/proof hook invocation tests

## Documentation Updates

- Document order command/service pattern in architecture docs

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

/docs/tickets/phase-1-1/18-09-order-command-service.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.09 — Order Command Service.

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
