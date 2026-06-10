# Ticket 18.02 — Application Shell and Navigation

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Runtime Foundation
**Recommended order:** 2
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-01-application-scaffold.md, 02-01-auth-provider.md
**Blocks / Enables:** 03-01-breeder-dashboard.md, 04-01-station-dashboard.md, 08-01-admin-dashboard.md

## Objective

Create the shared app shell that connects public, authenticated, breeder, station and admin areas in one coherent application.

## Gap Closed

Existing dashboard tickets define individual screens, but no ticket defines the global layout, navigation, role-based menu structure or shared runtime states.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create public layout and authenticated app layout
- Create role-aware navigation structure
- Add top navigation or sidebar according to product needs
- Add breadcrumb placeholder
- Add loading, empty and error state foundations
- Add sign-out location in shell
- Prepare responsive layout for desktop and tablet widths

## Functional Requirements

- Authenticated users see navigation matching their active role
- Unauthenticated users are redirected to login for protected routes
- Admin users can access admin navigation
- Breeder users can access breeder navigation
- Station users can access station navigation

## Technical Requirements

- Navigation items should be defined in one central config
- Role visibility should use the permission/context layer, not hardcoded page-only checks
- Avoid duplicating layout code per role
- Keep labels human-readable and suitable for non-technical equine-market users

## UI / UX Requirements

- Application shell includes product name, user identity area, active organization indicator placeholder and primary navigation
- Responsive behavior is documented or implemented
- Empty/loading/error components can be reused by later tickets

## Security, Permissions & Audit Requirements

- Protected navigation must not be treated as authorization by itself; API/RBAC checks still apply
- Do not reveal links to unauthorized areas if role context is known

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

- [ ] Shared app shell exists
- [ ] Public and authenticated layouts are separated
- [ ] Role-based navigation config exists
- [ ] Breeder, Station and Admin navigation groups exist
- [ ] User can reach logout from authenticated shell
- [ ] Unauthorized routes do not render protected content
- [ ] Layout is reusable by later dashboards
- [ ] No feature-specific business logic is implemented in shell

## Required Tests

- Test navigation config for role visibility where practical
- Add basic rendering test for shell if test framework exists

## Documentation Updates

- Document route/layout conventions in /docs/architecture or API/service conventions if available

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

/docs/tickets/phase-1-1/18-02-application-shell-navigation.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.02 — Application Shell and Navigation.

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
