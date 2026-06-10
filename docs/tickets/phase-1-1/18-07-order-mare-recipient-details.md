# Ticket 18.07 — Order Mare and Recipient Details

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Order Workflow Completeness
**Recommended order:** 7
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-03-semen-order-status-history.md, 03-03-semen-order-creation-flow.md

## Objective

Make semen orders operationally meaningful by capturing basic mare / recipient / breeding-context details required for real station processing.

## Gap Closed

The existing order model captures listing, delivery and instructions, but real semen orders need at least minimal mare or recipient context to be actionable.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Add mare/recipient details to order data model or dedicated related entity
- Add fields to draft order form
- Show details on breeder review and station order detail
- Validate required fields at submit time
- Keep fields minimal and Phase-1 appropriate

## Functional Requirements

- Breeder can enter mare details while creating or editing draft
- Breeder can submit only when required mare details are present
- Station can view mare details when processing order
- Admin can view details for support

## Data Model / Persistence Requirements

- Suggested fields: mareName, mareRegistrationReference, mareBreed, mareOwnerName optional, intendedInseminationContext optional, vetOrRecipientContact optional
- Prefer a dedicated OrderMareDetails entity if it keeps order table cleaner; otherwise document inline fields

## API / Service Requirements

- Create/update draft order must accept mare details
- Submit validation must check required mare fields
- Order detail endpoint must include mare details for authorized users

## UI / UX Requirements

- Mare details step or section in order flow
- Read-only summary on review page
- Station visible section in order detail

## Security, Permissions & Audit Requirements

- Mare details are order-sensitive data and must follow order permissions
- Changes to submitted order details should be restricted or amendment-based

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

- [ ] Mare/recipient details are persisted
- [ ] Draft can be saved with partial mare details
- [ ] Submit requires configured mandatory mare details
- [ ] Station sees mare details on assigned order
- [ ] Unauthorized users cannot access mare details
- [ ] Data model documentation updated
- [ ] Tests cover submit validation

## Required Tests

- Test save partial draft
- Test submit rejected without mandatory mare details
- Test station can view assigned order mare details
- Test unauthorized access denied

## Documentation Updates

- Update core data model docs with mare/order details decision

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

/docs/tickets/phase-1-1/18-07-order-mare-recipient-details.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.07 — Order Mare and Recipient Details.

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
