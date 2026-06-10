# Ticket 18.27 — Test Framework Baseline

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Quality & Verification
**Recommended order:** 27
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-01-application-scaffold.md, 18-26-local-postgres-docker-setup.md
**Blocks / Enables:** service, API and E2E test tickets

## Objective

Establish test infrastructure early so each implementation ticket can add real tests consistently.

## Gap Closed

Many tickets request tests, but there is no explicit baseline for unit, integration, E2E, test DB, factories or auth mocking.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Choose/configure unit test framework
- Configure integration test pattern
- Configure E2E test framework or placeholder
- Configure test database strategy
- Create test data factories
- Create auth/context mocking helpers
- Add CI-compatible test commands
- Document test categories

## Functional Requirements

- Developers can run unit tests
- Developers can run integration tests if DB available
- Auth/role context can be mocked for service/API tests
- Future tickets know where to add tests

## Technical Requirements

- Avoid overcomplicated test stack
- Use deterministic test data
- Separate local dev seed data from test factories
- Ensure tests can run in CI without production services

## Security, Permissions & Audit Requirements

- Do not use real provider credentials in tests
- Mock external providers such as auth/email/storage/payment/logistics

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

- [ ] Unit test framework configured
- [ ] Integration test setup documented/configured
- [ ] E2E test framework selected or explicit placeholder added
- [ ] Test database strategy documented
- [ ] Auth/context test helper exists
- [ ] Test factories exist or starter pattern exists
- [ ] npm/pnpm/yarn test commands exist
- [ ] CI can call test command
- [ ] Example test included

## Required Tests

- Add example unit test
- Add example service/integration test if DB baseline exists
- Add example auth-context mock test

## Documentation Updates

- Create /docs/development/testing.md or update README

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

/docs/tickets/phase-1-1/18-27-test-framework-baseline.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.27 — Test Framework Baseline.

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
