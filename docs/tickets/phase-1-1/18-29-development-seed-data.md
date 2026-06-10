# Ticket 18.29 — Development Seed Data

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Developer Experience
**Recommended order:** 29
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-01-user-organization-role-model.md, 01-02-stallion-semen-listing.md, 01-03-semen-order-status-history.md, 02-01-auth-provider.md
**Blocks / Enables:** 18-28-minimal-e2e-happy-path.md, demos and local development

## Objective

Provide reproducible local/staging demo data for development, testing and Codex implementation without relying on manual setup.

## Gap Closed

Demo seed data exists as a late ticket, but development needs earlier seeded users, organizations, roles, listings and order states.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Local platform admin user
- Local breeder user
- Local station user
- Demo breeder organization
- Demo station organization
- Role assignments
- Demo stallion
- Demo semen listing
- Demo draft order
- Demo submitted order
- Optional shipment/document metadata
- Seed reset command
- Document local credentials or provider-specific login approach

## Functional Requirements

- Developer can reset seed data
- Developer can log in or simulate seeded users according to auth provider strategy
- Dashboards show useful data immediately
- Seed data supports E2E happy path

## Data Model / Persistence Requirements

- Keep seed data clearly fake/demo
- Do not include real personal data
- Use deterministic IDs or stable lookup keys where useful

## Security, Permissions & Audit Requirements

- No production credentials
- No real emails unless controlled test domain/placeholders
- Do not seed privileged access outside local/staging

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

- [ ] Seed script exists
- [ ] Reset seed command exists
- [ ] Admin/Breeder/Station test users exist or are mapped via auth test strategy
- [ ] Demo organizations exist
- [ ] Role assignments exist
- [ ] Demo stallion and listing exist
- [ ] Draft/submitted order examples exist
- [ ] Seed data documented
- [ ] No real sensitive data included

## Required Tests

- Test seed script can run on clean DB
- Optional smoke test confirms seeded entities exist

## Documentation Updates

- Document seed users, roles and reset command in local development docs

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

/docs/tickets/phase-1-1/18-29-development-seed-data.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.29 — Development Seed Data.

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
