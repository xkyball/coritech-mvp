# Ticket 18.33 — Status Display System

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** UI Foundation
**Recommended order:** 33
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-03-semen-order-status-history.md, 01-04-shipment-tracking-event.md, 10-01-payment-reference-model.md, 01-07-verification-level-v1.md, 18-24-shared-ui-components.md

## Objective

Create a central display system for order, shipment, payment and verification statuses so users understand current state and next action.

## Gap Closed

Status enums exist technically, but no shared system maps them to human labels, descriptions, badge styles and allowed next actions.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Status label registry
- Order status display config
- Shipment status display config
- Payment status display config
- Verification level display config
- Allowed next-action hints by role/status
- Reusable status components
- Documentation of status language

## Functional Requirements

- User sees human-readable status labels
- User sees role-specific next action where useful
- Status badges are consistent across dashboards/details
- Verification levels are explained without overclaiming proof strength

## Technical Requirements

- Centralize status display config
- Do not duplicate labels in every component
- Keep business transition rules in services; display config may reference allowed actions but not enforce alone

## UI / UX Requirements

- OrderStatusBadge
- ShipmentStatusBadge
- PaymentStatusBadge
- VerificationLevelBadge
- Optional StatusDescription component

## Security, Permissions & Audit Requirements

- Do not reveal unauthorized next actions
- Badges are display only and cannot replace server permission checks

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

- [ ] Central status display config exists
- [ ] Order status labels/descriptions exist
- [ ] Shipment status labels/descriptions exist
- [ ] Payment status labels/descriptions exist
- [ ] Verification level labels/descriptions exist
- [ ] Reusable badge components exist
- [ ] Role-specific next-action hints implemented or documented
- [ ] At least one dashboard/detail uses shared status components

## Required Tests

- Test status config completeness for all enum values
- Test badge rendering for key statuses
- Test no missing label for active enum values

## Documentation Updates

- Document status language and verification level wording

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

/docs/tickets/phase-1-1/18-33-status-display-system.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.33 — Status Display System.

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
