# Ticket 18.17 — Payment Reference UI

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Payment Reference Flow
**Recommended order:** 17
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 10-01-payment-reference-model.md, 10-02-payment-provider-adapter-placeholder.md, 03-04-breeder-order-detail.md, 04-03-station-order-management.md

## Objective

Expose payment reference status in the product without implementing full payment processing.

## Gap Closed

PaymentReference model and adapter placeholder exist, but no UI allows users/admin/station to see or maintain payment reference state.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Display payment status on order detail
- Allow authorized admin/station to create or update manual payment reference according to policy
- Show amount/currency/provider reference if present
- Add payment status badge
- Audit payment reference changes
- Keep no-card-data rule explicit

## Functional Requirements

- Breeder can see payment status/reference if relevant to order
- Station/admin can maintain manual payment reference where allowed
- Payment status updates are visible on order
- Payment is not required for all flows unless configured

## Data Model / Persistence Requirements

- Use PaymentReference model only; do not store card numbers, bank credentials or sensitive payment details

## API / Service Requirements

- Create/update PaymentReference service/action
- Endpoint validates role and order relationship
- Audit hook for status changes

## UI / UX Requirements

- Payment panel on order detail
- Manual payment reference form for allowed roles
- Status badge: NOT_REQUIRED, PENDING, AUTHORIZED, PAID, FAILED, REFUNDED

## Security, Permissions & Audit Requirements

- No card data fields
- No payment processor checkout unless future ticket
- Payment provider reference must not be treated as proof of settlement without status policy

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

- [ ] Payment panel visible on order detail
- [ ] Payment status badge displays current status
- [ ] Authorized role can create/update payment reference
- [ ] Unauthorized update denied
- [ ] No sensitive payment data is collected or stored
- [ ] Payment update audit logged
- [ ] Breeder can view relevant status
- [ ] Documentation states this is reference flow only

## Required Tests

- Test display payment status
- Test authorized update
- Test unauthorized update denied
- Test no sensitive fields accepted

## Documentation Updates

- Update payment reference docs and no-card-data rule

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

/docs/tickets/phase-1-1/18-17-payment-reference-ui.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.17 — Payment Reference UI.

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
