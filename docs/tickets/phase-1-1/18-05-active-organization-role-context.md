# Ticket 18.05 — Active Organization and Role Context

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Authentication & Permissions
**Recommended order:** 5
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-01-user-organization-role-model.md, 02-02-rbac-middleware.md
**Blocks / Enables:** all role-specific workflows, audit/proof actor attribution

## Objective

Ensure every user action runs under an explicit active organization and role context so workflow proof and permissions remain unambiguous.

## Gap Closed

The data model allows multiple user-organization-role assignments, but no ticket defines how the active context is selected, persisted, displayed and used by permissions and audit/proof events.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Determine active organization on login
- Create organization/role switcher for multi-context users
- Persist active context in session or secure app state
- Expose active context to API/service layer
- Display active context in app shell
- Use active context in audit/proof attribution
- Handle users with no valid active organization

## Functional Requirements

- Single-role users get context automatically
- Multi-role users can switch context
- User always sees which organization/role they are acting as
- Permissions are evaluated against active context
- Actions record active organization and role

## Technical Requirements

- Do not trust client-selected context without server validation
- Context switch must validate UserOrganizationRole membership
- Centralize active context resolver
- Avoid passing organizationId from arbitrary UI input when it can be derived from context

## API / Service Requirements

- Create context endpoint if needed
- Create switch active context action if needed
- Expose current context to frontend

## UI / UX Requirements

- Organization/role switcher visible for users with multiple contexts
- Read-only display for users with one context
- Clear fallback state if no active organization exists

## Security, Permissions & Audit Requirements

- User cannot switch to organization/role they do not hold
- All proof/audit events must use validated active context
- Admin context must be clearly indicated

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

- [ ] Active context exists for authenticated user
- [ ] Single-context user gets automatic context
- [ ] Multi-context user can switch context
- [ ] Invalid context switch is rejected
- [ ] App shell displays active organization and role
- [ ] API/services can access validated active context
- [ ] Audit/proof hooks can use active context
- [ ] Permission checks use active context

## Required Tests

- Test context resolution for single-role user
- Test context switch for multi-role user
- Test rejection of unauthorized context
- Test API permission check against active context

## Documentation Updates

- Document active-context pattern in role/permission docs

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

/docs/tickets/phase-1-1/18-05-active-organization-role-context.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.05 — Active Organization and Role Context.

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
