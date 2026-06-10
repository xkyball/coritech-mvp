# Ticket 18.01 — Application Scaffold

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Runtime Foundation
**Recommended order:** 1
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 00-01-repository-setup.md, 00-03-environment-secrets.md
**Blocks / Enables:** all runtime implementation tickets

## Objective

Create a locally runnable CoriTech application foundation so Phase 1.1 implementation starts from an executable, testable app rather than documentation only.

## Gap Closed

The Phase 1 pack contains repository and documentation setup, but no explicit ticket guarantees a running Next.js / TypeScript / PostgreSQL / Prisma / Docker Compose application baseline.

## Context

Without this scaffold, later Codex tickets may create inconsistent framework structure, duplicate API patterns, or features that cannot be executed locally.

## Scope

- Initialize or normalize the Next.js application structure
- Configure TypeScript, linting, formatting and build scripts
- Configure Prisma or the chosen ORM baseline
- Configure PostgreSQL connection placeholders
- Add Docker Compose for local PostgreSQL if not already present
- Add app, API, test and documentation folders
- Create health-check route or endpoint
- Add developer setup commands to README

## Functional Requirements

- The app can start locally with a single documented command
- The app shows a basic CoriTech placeholder page
- A health endpoint confirms that the application runtime is available
- The database connection path is prepared but does not require production credentials

## Technical Requirements

- Use the existing repository conventions if already present
- Do not create competing app folders or duplicate package managers
- Add scripts for dev, build, lint, typecheck, test and db commands
- Ensure TypeScript strictness is enabled or explicitly documented if phased
- Keep scaffold minimal; do not implement product workflows here

## API / Service Requirements

- Provide a basic health route such as /api/health or equivalent
- Return environment-safe status only; do not expose secrets or internal config

## UI / UX Requirements

- Create a minimal root page identifying the CoriTech Phase 1 MVP app
- Do not design the full product UI in this ticket

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

- [ ] Application installs dependencies successfully
- [ ] Application starts locally using documented command
- [ ] TypeScript build or typecheck runs
- [ ] Lint command exists
- [ ] Test command exists, even if no feature tests exist yet
- [ ] Database connection configuration is prepared
- [ ] Docker Compose local database file exists or local DB strategy is documented
- [ ] No product features are implemented
- [ ] No secrets are committed
- [ ] README contains local startup instructions

## Required Tests

- Add smoke test for health endpoint if framework is ready
- Add placeholder test setup if no feature code exists yet

## Documentation Updates

- Update README with local setup and commands
- Update /docs/deployment or /docs/architecture if scaffold decisions are made

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

/docs/tickets/phase-1-1/18-01-application-scaffold.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.01 — Application Scaffold.

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
