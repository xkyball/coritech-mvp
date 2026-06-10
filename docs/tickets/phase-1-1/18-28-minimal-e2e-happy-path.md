# Ticket 18.28 — Minimal E2E Happy Path

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Quality & Verification
**Recommended order:** 28
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-27-test-framework-baseline.md, 18-29-development-seed-data.md, 18-08-draft-order-submit-flow.md, 18-13-shipment-command-service.md, 18-16-document-preview-download-ui.md

## Objective

Create an early end-to-end test that proves the core MVP works from station listing to breeder order to shipment/document visibility.

## Gap Closed

The existing end-to-end journey ticket is late and demo-oriented; the product needs an earlier smaller technical happy path to catch integration breaks.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Login as Station
- Create Stallion
- Create Listing
- Login as Breeder
- Create Draft Order
- Submit Order
- Station receive/confirm order
- Create Shipment
- Upload Document
- Breeder view order/shipment/document
- Assert proof events
- Assert audit logs
- Assert permission boundaries

## Functional Requirements

- Happy path runs against local/staging test setup
- Test proves core user journey works
- Test can be used before demo readiness

## Technical Requirements

- Use seeded users or test-created users
- Mock external email/storage if needed, unless local equivalents exist
- Keep E2E deterministic and not dependent on real external providers

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

- [ ] Minimal E2E test/script exists
- [ ] Test covers station creating listing
- [ ] Test covers breeder draft and submit
- [ ] Test covers station confirmation
- [ ] Test covers shipment creation/update
- [ ] Test covers document upload or mocked document metadata path
- [ ] Test asserts key proof events exist
- [ ] Test asserts key audit logs exist
- [ ] Test asserts unauthorized cross-access denied where practical
- [ ] Run instructions documented

## Required Tests

- This ticket itself creates E2E test(s)
- Add supporting integration assertions if easier

## Documentation Updates

- Document how to run minimal E2E happy path

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

/docs/tickets/phase-1-1/18-28-minimal-e2e-happy-path.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.28 — Minimal E2E Happy Path.

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
