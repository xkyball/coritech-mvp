# UI Role Routing Policy

Ticket 18.30 defines how users land in the CoriTech web app after opening the
root URL, logging in or choosing a role-specific app route.

## Route Map

| Route | Behavior |
| --- | --- |
| `/` | Public application entry map for unauthenticated users, with sign-in, invitation, role workspace and current workflow links. Authenticated users are redirected to `/app`. |
| `/login` | Public managed-auth entry point. If a managed session cookie is already present, redirects to the controlled `returnTo` path or `/app`. |
| `/app` | Protected app landing route. Requires authentication and then delegates to active role routing. |
| `/app/breeder` | Protected breeder role route. Requires a resolved active `BREEDER` context before redirecting to `/breeder-dashboard`. |
| `/app/station` | Protected breeding station role route. Requires a resolved active `BREEDING_STATION` context before redirecting to `/station-dashboard`. |
| `/app/admin` | Protected platform admin role route. Requires a resolved active `PLATFORM_ADMIN` context before admin workspace content is allowed. |
| `/app/no-role` | Clean fallback when the session has no resolved active organization and role context. |
| `/app/select-role` | Clean fallback for multi-role users when a selected/default context is required. |
| `/unauthorized` | Clean fallback for role routes that do not match the validated active context. |

## Redirect Policy

- Unauthenticated protected routes redirect to `/login` with a controlled
  same-origin `returnTo` value.
- Open redirects are rejected; auth pages are not accepted as post-login return
  targets to avoid loops.
- Login redirects after provider callback land on `/app` by default, where the
  active role route policy decides the final workspace.
- A single active breeder context lands on `/breeder-dashboard`.
- A single active breeding station context lands on `/station-dashboard`.
- A single active platform admin context lands on `/app/admin`.
- Multi-role users without a selected context land on `/app/select-role`.
- Multi-role users with a stale selected context also land on
  `/app/select-role` so they can choose one of their current valid contexts.
- Single-context users with a stale selected context are safely resolved to
  their remaining valid context.
- Users with no active organization role land on `/app/no-role`.
- Requests for a role route that does not match the validated active context
  redirect to `/unauthorized`.

## Active Context Boundary

The routing policy is implemented in `apps/web/features/auth/role-routing.mjs`
as framework-neutral logic that accepts a server-resolved managed auth session
and active context. The active context itself is validated by
`packages/domain/src/identity/active-context.mjs`, which resolves or switches
context only from server-side user organization role assignments.

The web app stores the selected active context using
`apps/web/features/auth/active-context-runtime.mjs`. That cookie stores only a
selected organization/role key and is always revalidated against server-side
session memberships before use. It must not be treated as authorization by
itself.

The authenticated app shell renders the active-context switcher from
`apps/web/features/auth/ActiveContextBar.tsx`. The switcher displays the
validated user, organization and role. Users with one valid context see the
active role only; users with multiple valid contexts can post a switch to
`/app/context/switch`, which revalidates the requested context before setting
the cookie and redirecting to the role's default workspace.

The Next.js route pages treat an authenticated request without a resolved
context as `/app/select-role` for multi-context users or `/app/no-role` when no
valid context exists. This avoids leaking protected dashboard data or granting
access from browser-provided role claims. Runtime provider/session adapter
wiring is still responsible for supplying the authenticated user's role
assignments to the resolver.
