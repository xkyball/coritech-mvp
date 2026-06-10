# Ticket 18.30 — Root Routing and Role Redirects

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Runtime Foundation
**Recommended order:** 30
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-03-login-logout-auth-ui.md, 18-05-active-organization-role-context.md, 18-02-application-shell-navigation.md

## Objective

Define where users land when opening the app or logging in, based on authentication and active role context.

## Gap Closed

Dashboards exist, but there is no explicit routing policy for root, login, app home, breeder/station/admin areas or role-based redirects.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Define root route behavior
- Define /login route behavior
- Define /app route behavior
- Define /app/breeder
- Define /app/station
- Define /app/admin
- Redirect after login by active role
- Handle users with multiple roles
- Handle no-role/no-organization state
- Handle unauthorized role route fallback

## Functional Requirements

- Unauthenticated root directs to login or public page according to policy
- Authenticated user lands in correct dashboard
- Multi-role user lands in selected/default context
- Forbidden role routes show access denied or redirect safely
- No infinite redirect loops

## API / Service Requirements

- Use active context resolver; do not rely only on client-side checks

## UI / UX Requirements

- No-role state explains that account is not fully configured
- Role selection state for multi-role users if needed
- Clean fallback pages

## Security, Permissions & Audit Requirements

- Protected routes require auth
- Role routes require validated active context
- Do not leak protected data during redirects

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

- [ ] Root route behavior implemented
- [ ] Login redirect after auth implemented
- [ ] /app redirects by active role
- [ ] Breeder route protected for breeder role
- [ ] Station route protected for station role
- [ ] Admin route protected for admin role
- [ ] Multi-role/no-role states handled
- [ ] Unauthorized role access handled
- [ ] No redirect loops observed

## Required Tests

- Test unauthenticated root/protected behavior
- Test breeder redirect
- Test station redirect
- Test admin redirect
- Test unauthorized role access
- Test no-role state

## Documentation Updates

- Document route map and role redirect policy

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

/docs/tickets/phase-1-1/18-30-root-routing-role-redirects.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.30 — Root Routing and Role Redirects.

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
