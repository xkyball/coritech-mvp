# Ticket 18.13 — Shipment Command Service

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Service Layer & Workflow Control
**Recommended order:** 13
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-04-shipment-tracking-event.md, 05-02-logistics-adapter-interface.md, 01-08-audit-log-v1.md, 01-06-proof-event-v1.md

## Objective

Centralize shipment actions in a service so shipment status, proof events, audit logs and notifications are consistent.

## Gap Closed

Shipment model, UI and adapter interface exist, but shipment mutation logic is not guaranteed to go through one controlled command layer.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create ShipmentService
- Implement createShipment
- Implement updateShipmentStatus
- Implement attachTrackingReference
- Implement markDelivered
- Implement markDelayed
- Validate shipment can be created only for eligible orders
- Emit audit/proof/notification hooks
- Normalize manual and provider-originated tracking events

## Functional Requirements

- Station can create shipment for confirmed/in fulfilment order according to policy
- Station can update shipment status
- Status updates create tracking events
- Delivered status can trigger delivery confirmation path if configured
- Breeder sees current shipment status

## Technical Requirements

- Use transaction boundaries for shipment + tracking event + audit/proof where appropriate
- Do not couple core shipment logic to one external provider
- Keep logistics adapter input normalized

## API / Service Requirements

- Shipment mutation endpoints call ShipmentService
- Service exposes typed command inputs and standard errors

## Security, Permissions & Audit Requirements

- Only assigned station/admin can mutate shipment
- Breeder may view but not mutate shipment unless delivery confirmation ticket allows acknowledgement
- All status changes audit logged

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

- [ ] ShipmentService exists
- [ ] Shipment can be created only for eligible order statuses
- [ ] Tracking event created for status update
- [ ] Audit hook called for shipment changes
- [ ] Proof hook called for configured events
- [ ] Manual and provider event paths use same normalized service
- [ ] Unauthorized mutation denied
- [ ] Tests cover status update and permission rules

## Required Tests

- Test create shipment for confirmed order
- Test create shipment denied for draft/submitted order
- Test status update creates tracking event
- Test audit/proof hooks
- Test unauthorized mutation denial

## Documentation Updates

- Document shipment service and provider adapter relationship

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

/docs/tickets/phase-1-1/18-13-shipment-command-service.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.13 — Shipment Command Service.

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
