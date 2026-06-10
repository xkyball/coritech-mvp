# Ticket 18.03 — Login, Logout and Auth UI

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Authentication & Onboarding
**Recommended order:** 3
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 02-01-auth-provider.md, 18-02-application-shell-navigation.md
**Blocks / Enables:** 18-04-user-invitation-onboarding-flow.md, 18-30-root-routing-role-redirects.md

## Objective

Make authentication usable through real UI pages and session handling, not only provider-level integration.

## Gap Closed

The Phase 1 auth ticket integrates a managed provider, but does not ensure users can log in, log out, recover access, handle callbacks, or be redirected correctly in the application.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create login page
- Create logout action
- Create auth callback handling page or route
- Create password reset entry point if supported by provider
- Create email verification state handling if supported
- Create auth error page
- Add session loading UI
- Add redirect handling after successful login

## Functional Requirements

- User can open login page
- User can authenticate through provider flow
- User can log out
- Unauthenticated access to protected routes redirects to login
- Auth errors produce readable messages
- Session loading does not show protected data prematurely

## Technical Requirements

- Reuse managed provider SDK from Ticket 02-01
- Do not implement custom password storage or password verification
- Use environment config from Ticket 00-03
- Centralize auth route constants
- Handle missing provider config safely in local dev

## UI / UX Requirements

- Login page should feel like part of CoriTech, but remain simple
- Show clear app name and short product context
- Provide password reset link only if provider supports it
- Show verification instructions when relevant

## Security, Permissions & Audit Requirements

- No secrets in client-side code
- No custom password handling
- Do not expose session tokens in logs or UI
- Redirect URLs must be controlled and not open redirect vulnerabilities

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

- [ ] Login route exists
- [ ] Logout route/action exists
- [ ] Auth callback route exists if provider requires it
- [ ] Protected routes redirect unauthenticated users
- [ ] Authenticated user can reach app shell
- [ ] Auth error state is user-readable
- [ ] Password reset path exists or is documented as provider-managed
- [ ] Email verification handling exists or is documented as provider-managed
- [ ] No custom password logic is implemented

## Required Tests

- Test unauthenticated protected route behavior
- Test authenticated redirect behavior with mocked auth where possible
- Test logout action where framework allows

## Documentation Updates

- Update auth documentation with login/logout/callback routes and provider-managed responsibilities

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

/docs/tickets/phase-1-1/18-03-login-logout-auth-ui.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.03 — Login, Logout and Auth UI.

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
