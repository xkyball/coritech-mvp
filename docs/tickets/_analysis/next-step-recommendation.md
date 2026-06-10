# Next-Step Recommendation

Analysis date: 2026-06-10

## Recommended Next Ticket

Ticket 18.03 - Login, Logout and Auth UI

Original ticket: ../phase-1-1/18-03-login-logout-auth-ui.md

## Why This Is Next

The codebase already has enough scaffold, schema, domain logic, local build/test setup and demo UI to proceed. The biggest P0 blocker to a usable Phase 1 app is that there is no real login/session boundary. Current pages use demo actors, so RBAC, active organization context and command services cannot be safely wired into the app yet.

This is higher leverage than another UI workflow because it turns the app from demo-role-aware to actually user-aware. It also precedes admin, station order management, document viewing and permission UI.

## What It Unlocks

- Protected breeder, station and future admin routes.
- Active organization/role context tied to an authenticated internal User.
- Runtime RBAC middleware/route adapters.
- Persistent OrderService and ShipmentService commands with real actor context.
- Root role redirects and unauthorized/access-denied behavior.
- Meaningful E2E happy-path testing.

## Dependencies

- Ticket 2.1 managed-auth provider contract exists in packages/domain/src/auth/managed-auth-provider.mjs.
- User/Organization/Role/UserOrganizationRole models exist in schema.prisma.
- Environment variables for managed auth are documented.
- Provider selection and production tenant evidence remain pending, so the task should remain provider-contract compatible and avoid custom password handling.

## What Should Not Be Implemented Yet

- Custom password storage or custom reset tokens.
- User invitation/onboarding beyond what the ticket requires.
- Admin dashboards, audit viewers or permission management UI.
- OrderService, ShipmentService or proof automation unless the ticket explicitly requires a minimal session hook.
- AI, blockchain/token logic, federation automation, sensor ingestion, full marketplace automation or unrestricted buyer access.

## Acceptance Criteria For The Next Codex Task

- Login route exists and delegates to the managed auth provider contract.
- Logout route/action exists and clears local session context before provider logout.
- Auth callback route exists or is explicitly documented as provider-managed if not needed.
- Protected routes redirect unauthenticated users.
- Authenticated user can reach the app shell with a session-derived user identity.
- Auth error state is user-readable and safe.
- Password reset and email verification paths stay provider-managed.
- Tests cover login/logout URL behavior, protected redirect behavior and error state.
- Documentation updates identify remaining provider/account evidence placeholders.

## Suggested Codex Prompt

```text
Implement the ticket at:

/docs/tickets/phase-1-1/18-03-login-logout-auth-ui.md

Use the ticket file as the source of truth. Also read:

/docs/tickets/_analysis/status-overlays/phase-1-1/18-03.status.md

Task:
Implement only Ticket 18.03 - Login, Logout and Auth UI. Keep the implementation provider-managed and do not add custom password handling. Wire usable login/logout/callback/session behavior into the Next.js app enough that protected routes can redirect unauthenticated users and authenticated users can reach the app shell. Add focused tests and update docs where relevant. Do not implement invitation onboarding, admin dashboards, OrderService, proof automation, payment, logistics, AI, blockchain/token, federation automation, sensor ingestion or unrestricted buyer access. Return an acceptance-criteria checklist.
```

## Next 3 Tickets After That

1. Ticket 18.30 - Root Routing and Role Redirects: use the new session boundary to send users to the correct role area.
2. Ticket 18.05 - Active Organization and Role Context: make every action run under explicit org/role context.
3. Ticket 18.09 - Order Command Service: replace demo order mutations with persistent, permission-aware, audit/proof-ready commands.
