# Ticket 18.08 — Draft Order Save and Submit Flow

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Order Workflow Completeness
**Recommended order:** 8
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-03-semen-order-status-history.md, 03-03-semen-order-creation-flow.md, 18-09-order-command-service.md
**Blocks / Enables:** reliable breeder ordering

## Objective

Make draft orders real editable work objects and provide a controlled transition from DRAFT to SUBMITTED.

## Gap Closed

The status DRAFT exists and order creation is mentioned, but the save/edit/submit lifecycle is not explicitly implemented or acceptance-tested.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create draft order
- Save draft order
- Edit draft order
- Cancel or delete draft according to chosen policy
- Submit draft order
- Validate required fields only at submit where appropriate
- Create status history for DRAFT to SUBMITTED
- Trigger audit and proof behavior according to event policy

## Functional Requirements

- Breeder can save progress without submitting
- Breeder can return to draft and edit
- Breeder can submit when required fields are complete
- After submission, breeder cannot freely edit proof-relevant fields
- Submission creates order number if not already created or confirms it if pre-created

## API / Service Requirements

- OrderService methods should include createDraftOrder, updateDraftOrder and submitOrder
- Status transition guard must enforce DRAFT -> SUBMITTED
- Submit endpoint must be idempotency-safe enough to avoid duplicate submissions

## UI / UX Requirements

- Save Draft CTA
- Submit Order CTA
- Draft status badge
- Validation messages on submit
- Draft list or dashboard indicator

## Security, Permissions & Audit Requirements

- Only owning breeder organization can edit draft
- Only validated active breeder context can submit
- Submission creates audit log and appropriate proof event; draft save should not overstate proof

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

- [ ] Breeder can create draft
- [ ] Breeder can save draft with partial data
- [ ] Breeder can edit own draft
- [ ] Breeder can submit complete draft
- [ ] Incomplete draft submit is rejected with clear validation
- [ ] DRAFT -> SUBMITTED transition is recorded in status history
- [ ] Audit log records submission
- [ ] Proof event policy is respected
- [ ] Submitted order is visible to assigned station
- [ ] Cross-organization draft access is denied

## Required Tests

- Test draft creation
- Test draft update
- Test submit validation
- Test DRAFT -> SUBMITTED transition
- Test station visibility after submit
- Test duplicate submit prevention

## Documentation Updates

- Document draft/submit lifecycle in product workflow docs

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

/docs/tickets/phase-1-1/18-08-draft-order-submit-flow.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.08 — Draft Order Save and Submit Flow.

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
