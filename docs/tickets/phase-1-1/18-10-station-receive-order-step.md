# Ticket 18.10 — Station Receive Order Step

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Station Workflow Completeness
**Recommended order:** 10
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-09-order-command-service.md, 04-03-station-order-management.md

## Objective

Operationalize the RECEIVED status so a station can acknowledge that a submitted order has entered station review.

## Gap Closed

The status RECEIVED exists, but there is no explicit workflow action, UI behavior, timestamp, audit/proof policy or notification logic for the station receive step.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Add Station action: Mark as Received
- Enforce SUBMITTED -> RECEIVED transition
- Capture timestamp, actor, role and organization
- Allow optional station note
- Update station order UI
- Notify breeder if configured
- Audit log action
- Optionally create SEMEN_ORDER_RECEIVED proof event if event type exists or add it deliberately

## Functional Requirements

- Station sees submitted orders needing receipt
- Station can mark order as received
- Breeder can see received status
- Station cannot receive orders assigned to another station
- Station cannot receive already rejected/cancelled/completed orders

## API / Service Requirements

- OrderService.receiveOrder handles transition
- Endpoint/action calls receiveOrder
- Optional note stored in status history or order activity

## UI / UX Requirements

- Station order detail has Mark as Received CTA when allowed
- Station dashboard action-required list reflects submitted orders
- Breeder order detail shows received status after action

## Security, Permissions & Audit Requirements

- Only assigned station active context can mark received
- Action is audit logged
- Proof event creation must not overstate verification beyond station acknowledgement

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

- [ ] SUBMITTED -> RECEIVED transition implemented
- [ ] Station UI exposes receive action
- [ ] Receive action records actor/role/org/time
- [ ] Status history includes receive step
- [ ] Audit log records receive step
- [ ] Breeder can see received status
- [ ] Invalid receive transitions are rejected
- [ ] Cross-station receive is denied

## Required Tests

- Test assigned station can receive submitted order
- Test invalid transitions denied
- Test cross-organization denial
- Test audit/status history creation

## Documentation Updates

- Update order lifecycle documentation with RECEIVED step

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

/docs/tickets/phase-1-1/18-10-station-receive-order-step.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.10 — Station Receive Order Step.

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
