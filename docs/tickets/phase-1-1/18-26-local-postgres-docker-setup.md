# Ticket 18.26 — Local PostgreSQL Docker Setup

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Developer Experience
**Recommended order:** 26
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-01-application-scaffold.md, 00-03-environment-secrets.md

## Objective

Make local development reproducible for Codex, developers and future software partners through a documented PostgreSQL Docker setup.

## Gap Closed

Environment config and production/staging are planned, but local database setup is not concrete enough for repeatable development.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Docker Compose PostgreSQL service
- Local DB name/user/password placeholders
- Prisma migrate command or ORM equivalent
- Seed command placeholder
- Reset DB command
- Local setup README
- Health check or readiness note

## Functional Requirements

- Developer can start local database with one command
- Application can connect to local database using .env.local
- Migrations can run locally
- Database can be reset for development

## Technical Requirements

- Use safe local credentials only
- Do not include production secrets
- Mount volumes appropriately or document reset behavior
- Avoid conflicting port assumptions or document default port

## Data Model / Persistence Requirements

- Local DB supports migrations used by feature tickets
- Seed data handled by separate dev seed ticket or placeholder

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

- [ ] docker-compose.yml or compose file exists
- [ ] Local Postgres service configured
- [ ] .env.example includes local DATABASE_URL example
- [ ] Migration command documented
- [ ] DB reset command documented
- [ ] Local setup README updated
- [ ] No production credentials included
- [ ] Developer can reproduce setup from docs

## Required Tests

- Manual verification steps documented
- Optional script test checks DB connectivity

## Documentation Updates

- Update README and /docs/deployment/local-development.md if present

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

/docs/tickets/phase-1-1/18-26-local-postgres-docker-setup.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.26 — Local PostgreSQL Docker Setup.

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
