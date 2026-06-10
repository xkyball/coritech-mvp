# Ticket 18.14 — Delivery Confirmation Flow

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Shipment Workflow Completeness
**Recommended order:** 14
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-13-shipment-command-service.md, 03-04-breeder-order-detail.md, 05-01-shipment-ui.md

## Objective

Make delivered semen shipment a confirmable workflow moment rather than only an externally or manually set tracking status.

## Gap Closed

DELIVERED exists as a shipment status, but no process defines whether the station, breeder or system confirms receipt and how this affects proof/audit state.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Define delivery confirmation policy
- Add breeder acknowledge-received action if in scope
- Allow station mark dispatched/delivered according to policy
- Capture confirmation actor and timestamp
- Create proof event and audit log
- Show confirmation on order/shipment detail
- Handle disagreement or delayed state minimally

## Functional Requirements

- Station can mark shipment dispatched
- Breeder can confirm received when allowed
- Shipment current status reflects confirmation
- Proof timeline shows delivery confirmation
- Order can move toward completed state after delivery according to policy

## Data Model / Persistence Requirements

- Add confirmation fields if needed: deliveredAt, confirmedReceivedAt, confirmedByUserId, confirmationSource
- Avoid destructive overwrite of shipment events

## API / Service Requirements

- ShipmentService.markDelivered
- ShipmentService.confirmReceived or equivalent
- Status guard for allowed transitions

## UI / UX Requirements

- Breeder order detail CTA: Confirm received when shipment is delivered/in transit according to policy
- Station shipment view shows delivery/receipt state
- Clear status badges

## Security, Permissions & Audit Requirements

- Only breeder owning order can confirm received as breeder
- Only assigned station can update station-side delivery statuses
- All confirmations audit logged

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

- [ ] Delivery confirmation policy is implemented and documented
- [ ] Breeder can confirm receipt when allowed
- [ ] Confirmation records actor/timestamp
- [ ] Shipment status/tracking events updated consistently
- [ ] Audit log records confirmation
- [ ] Proof event records confirmation without overstating external verification
- [ ] Unauthorized confirmation denied
- [ ] Order detail displays delivery confirmation state

## Required Tests

- Test breeder confirmation
- Test unauthorized confirmation denied
- Test status/proof/audit effects
- Test invalid transition denied

## Documentation Updates

- Document delivery confirmation policy and effect on proof level

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

/docs/tickets/phase-1-1/18-14-delivery-confirmation-flow.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.14 — Delivery Confirmation Flow.

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
