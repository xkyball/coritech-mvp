# Role and Permission Source

Status: SOURCE EXTRACTION ONLY

## Active Role Summary

| Role name | Role purpose | Available app areas | Available actions | Restricted actions | Default landing route | Evidence | Status | Confidence |
|---|---|---|---|---|---|---|---|---|
| BREEDER | Order semen from station listings and track own orders, shipments, documents, proof timeline, payment references, and support requests. | `/breeder-dashboard`, `/app/catalog`, `/app/catalog/[listingId]`, `/app/orders/new`, `/app/orders/[orderId]`, `/app/documents/upload`, `/app/documents/[documentId]` when permitted. | Browse catalog, create/save/submit/cancel own draft orders, view own orders, confirm shipment receipt, upload role-allowed documents, view permitted documents, create support requests, view payment reference. | Cannot manage station stallions/listings, station order commands, admin workspaces, unrestricted document classifications, admin audit/permission/amendment actions. | `/breeder-dashboard` | `apps/web/features/navigation.mjs`; `apps/web/features/auth/role-routing.mjs`; `packages/domain/src/orders/semen-order.mjs`; `packages/domain/src/documents/document-evidence.mjs`; `packages/domain/src/shipments/shipment.mjs` | IMPLEMENTED | HIGH |
| BREEDING_STATION | Manage station-owned stallions/listings and fulfill station-assigned semen orders with shipment/document/proof support. | `/station-dashboard`, `/app/station/orders`, `/app/station/shipments`, `/app/station/stallions`, `/app/station/listings`, `/app/documents/upload`, `/app/documents/[documentId]` when permitted. | Create/edit/activate/inactivate station stallions; create/edit/activate/deactivate listings; mark orders received, confirm, reject, move to fulfillment; create/update shipments; upload role-allowed documents; maintain payment references; create support requests/comments. | Cannot browse as breeder, create breeder orders, access admin workspaces, manage unrelated station objects, grant permissions, create amendments. | `/station-dashboard` | `apps/web/features/navigation.mjs`; `apps/web/features/station-orders/StationOrderManagement.tsx`; `packages/domain/src/orders/semen-order.mjs`; `packages/domain/src/stallions`; `packages/domain/src/listings`; `packages/domain/src/shipments/shipment.mjs` | IMPLEMENTED | HIGH |
| PLATFORM_ADMIN | Operate platform-level support, governance, role assignment, audit, permissions, and amendment evidence workflows. | `/app/admin`, `/app/admin/users`, `/app/admin/invitations`, `/app/admin/organizations`, `/app/admin/roles`, `/app/admin/orders`, `/app/admin/orders/[orderId]`, `/app/admin/support`, `/app/admin/proof`, `/app/admin/audit`, `/app/admin/permissions`, `/app/admin/amendments`, `/app/admin/amendments/new`, `/app/documents/upload`, `/app/documents/[documentId]` when permitted. | Manage users, organizations, invitations, role assignments, order support views, support queue, proof/audit views, object permissions, amendments, admin payment references, admin document upload/access. | Should not silently mutate proof-critical order/shipment/document facts except through explicit workflows such as amendments or permissions; buyer-view/future roles not enabled. | `/app/admin` | `apps/web/features/navigation.mjs`; `apps/web/features/admin-dashboard/admin-dashboard.mjs`; `packages/domain/src/identity/role-model.mjs`; `packages/domain/src/audit/audit-log.mjs`; `packages/domain/src/amendments/amendment.mjs`; `packages/domain/src/permissions/access-permission.mjs` | IMPLEMENTED | HIGH |

## Future or Prepared Roles

| Role code | Evidence found | Active app areas found | Manual treatment | Status | Confidence |
|---|---|---|---|---|---|
| VET | Defined in Prisma role enum and role model. | None found in navigation or protected route defaults. | Do not write as an active user manual role. | NOT_IMPLEMENTED | HIGH |
| FEDERATION | Defined in Prisma role enum and role model. | None found in navigation or protected route defaults. | Do not write as an active user manual role. | NOT_IMPLEMENTED | HIGH |
| SALES_VENUE | Defined in Prisma role enum and role model. | None found in navigation or protected route defaults. | Do not write as an active user manual role. | NOT_IMPLEMENTED | HIGH |
| BUYER | Defined in Prisma role enum and role model; document access classifications reference buyer-view eligibility. | None found in navigation or protected route defaults. | Treat buyer access as future/prepared only unless later implemented. | NOT_IMPLEMENTED | HIGH |
| TECH_SUPPORT | Defined in Prisma role enum and role model. | None found in navigation or protected route defaults. | Do not write as an active user manual role. | NOT_IMPLEMENTED | HIGH |

Evidence: `packages/database/prisma/schema.prisma`; `packages/domain/src/identity/role-model.mjs`; `apps/web/features/navigation.mjs`; `apps/web/features/auth/role-routing.mjs`.

## Active Organization and Role Context

| Topic | Extracted source information | Evidence | Status | Confidence |
|---|---|---|---|---|
| Active context cookie | The app stores active context in a `coritech_active_context` cookie after validating that the signed-in user has that organization-role assignment. | `apps/web/features/auth/active-context-runtime.mjs`; `apps/web/app/app/context/switch/route.ts` | IMPLEMENTED | HIGH |
| Context selection | `/app/select-role` lists available contexts and posts the selected key to the context switch route. | `apps/web/app/app/select-role/page.tsx`; `apps/web/components/ActiveContextBar.tsx` | IMPLEMENTED | HIGH |
| Context display | Authenticated app pages render an active context bar showing user, organization, and role, plus a switch option. | `apps/web/app/app/layout.tsx`; `apps/web/components/ActiveContextBar.tsx` | IMPLEMENTED | HIGH |
| No active role | Users without an active assignment are sent to `/app/no-role` or `/app/select-role` depending on available context state. | `apps/web/features/auth/role-routing.mjs`; `apps/web/app/app/no-role/page.tsx` | IMPLEMENTED | HIGH |
| Actor attribution | Domain commands use active context to attribute user/org/role on audit, proof, documents, and workflow actions. | `packages/domain/src/identity/active-context.mjs`; `packages/domain/src/audit/audit-log.mjs`; `packages/domain/src/proof/proof-event.mjs` | IMPLEMENTED | HIGH |

## Route Protection and RBAC Notes

| Protection type | Extracted source information | Evidence | Manual caution | Status | Confidence |
|---|---|---|---|---|---|
| Middleware protection | Middleware checks for a session cookie before protected route access and redirects unauthenticated users to login. | `apps/web/middleware.ts`; `apps/web/features/auth/auth-routes.mjs` | Middleware is not the complete permission story. | IMPLEMENTED | HIGH |
| Role route routing | Role-routing maps default routes and allowed protected prefixes for active roles. | `apps/web/features/auth/role-routing.mjs` | Manual can explain default landing routes and role-specific nav from this evidence. | IMPLEMENTED | HIGH |
| Server page guards | App pages call active-context helpers such as `requireActiveRole` or equivalent guard logic before rendering role-specific pages. | `apps/web/app/**/page.tsx`; `apps/web/features/auth/active-context-runtime.mjs` | Evidence should be checked per screen before claiming access. | IMPLEMENTED | HIGH |
| Domain RBAC | Domain services validate actor role, object ownership/visibility, and permitted actions for orders, shipments, documents, audit, permissions, amendments, and support. | `packages/domain/src/**`; `packages/domain/src/auth/rbac-middleware.mjs` | If UI hides an action but service does not enforce it, manual should not present hiding as security. Key workflows do enforce service checks. | IMPLEMENTED | HIGH |
| UI-only visibility | Navigation hides unavailable areas by role, but final enforcement is route/service based. | `apps/web/features/navigation.mjs`; `apps/web/features/auth/role-routing.mjs`; `packages/domain/src` | Document as role navigation, not as the only access control. | PARTIALLY_IMPLEMENTED | HIGH |
| Object-level permissions | Admin can grant/revoke scoped access to specific users/organizations for `SemenOrder`, `Shipment`, `Document`, and `ProofEvent`. | `apps/web/app/app/admin/permissions/page.tsx`; `packages/domain/src/permissions/access-permission.mjs`; `packages/database/prisma/schema.prisma` | Buyer or external sharing should not be claimed as complete public access. | IMPLEMENTED | HIGH |

## Protected Route Groups

| Route group | Allowed role evidence | Evidence | Status | Confidence |
|---|---|---|---|---|
| Breeder routes | BREEDER default and allowed paths include breeder dashboard, catalog, order creation/detail, documents. | `apps/web/features/auth/role-routing.mjs`; `apps/web/features/navigation.mjs` | IMPLEMENTED | HIGH |
| Station routes | BREEDING_STATION default and allowed paths include station dashboard, station orders, station shipments, stallions, listings, documents. | `apps/web/features/auth/role-routing.mjs`; `apps/web/features/navigation.mjs` | IMPLEMENTED | HIGH |
| Admin routes | PLATFORM_ADMIN default and allowed paths include `/app/admin/**` and documents. | `apps/web/features/auth/role-routing.mjs`; `apps/web/features/navigation.mjs`; `apps/web/features/admin-dashboard/admin-dashboard.mjs` | IMPLEMENTED | HIGH |
| Shared document upload/detail | Active Phase 1 roles can upload documents, with role-limited classifications and object checks. | `apps/web/features/documents/DocumentUploadForm.tsx`; `packages/domain/src/documents/document-evidence.mjs` | IMPLEMENTED | HIGH |

## Authorization Failures and Messages

| Failure | User-facing/system behavior | Evidence | Status | Confidence |
|---|---|---|---|---|
| Not authenticated | Redirect to login or unauthenticated page for protected app areas. | `apps/web/middleware.ts`; `apps/web/features/auth/auth-routes.mjs`; `apps/web/app/unauthenticated/page.tsx` | IMPLEMENTED | HIGH |
| No active role/context | User is sent to role selection/no-role pages. | `apps/web/features/auth/role-routing.mjs`; `apps/web/app/app/select-role/page.tsx`; `apps/web/app/app/no-role/page.tsx` | IMPLEMENTED | HIGH |
| Wrong role for route | User is sent to unauthorized/access denied route depending on route/service failure. | `apps/web/features/auth/role-routing.mjs`; `apps/web/app/unauthorized/page.tsx`; `apps/web/app/access-denied/page.tsx` | IMPLEMENTED | MEDIUM |
| Object access denied | Domain services return denied decisions for object-level access; document detail shows access denied. | `packages/domain/src/auth/rbac-middleware.mjs`; `packages/domain/src/documents/document-evidence.mjs`; `apps/web/features/documents/DocumentDetail.tsx` | IMPLEMENTED | HIGH |
| Disabled user | Managed auth session processing blocks disabled users. | `apps/web/features/auth/server-session.ts`; `apps/web/app/app/admin/users/page.tsx` | IMPLEMENTED | HIGH |

