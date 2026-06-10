# Ticket 18.23 — API Contract and Service Conventions

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Architecture Consistency
**Recommended order:** 23
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-01-application-scaffold.md
**Blocks / Enables:** all backend/API implementation tickets

## Objective

Define a consistent API and service-layer convention so Codex and future developers do not create incompatible patterns ticket by ticket.

## Gap Closed

The Phase 1 tickets request many endpoints/services, but do not define a shared route naming, error format, pagination, validation or service convention.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Define API route naming conventions
- Define request/response shape
- Define standard error format
- Define validation pattern
- Define pagination pattern
- Define auth context pattern
- Define permission failure behavior
- Define service-layer naming and responsibility
- Define audit/proof hook convention

## Functional Requirements

- Every new backend route/action follows the same response and error structure
- Frontend can rely on predictable validation errors
- Services own business logic; routes/actions are thin

## Technical Requirements

- Pick one validation library/pattern if project already supports it
- Define where services live
- Define where DTOs/types live
- Define transaction boundary pattern
- Define logging/audit hook pattern

## API / Service Requirements

- Standard success response shape
- Standard error response shape with code/message/details
- Validation error shape
- Pagination fields: items, page/cursor, hasMore/total where selected
- 401/403/404/409/422 semantics

## Security, Permissions & Audit Requirements

- Permission failures must return controlled 403 without leaking sensitive object details
- 401/403 distinction documented
- Do not include secrets or internal stack traces in API responses

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

- [ ] API conventions document exists
- [ ] Service-layer conventions document exists
- [ ] Standard response/error shapes defined
- [ ] Pagination convention defined
- [ ] Validation convention defined
- [ ] Auth context convention defined
- [ ] Permission failure convention defined
- [ ] Audit/proof hook convention defined
- [ ] At least one example route/service included
- [ ] Future tickets can reference this convention

## Required Tests

- If helper utilities are implemented, add tests for error/response builders
- No broad feature tests required if documentation-only

## Documentation Updates

- Create /docs/architecture/api-contract-and-service-conventions.md or equivalent

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

/docs/tickets/phase-1-1/18-23-api-contract-and-service-conventions.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.23 — API Contract and Service Conventions.

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
