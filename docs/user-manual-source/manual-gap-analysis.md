# Manual Gap Analysis

Status: SOURCE EXTRACTION ONLY

## 1. Implemented User-Facing Features Not Yet Documented as a Manual

| Feature | Gap | Evidence | Priority for future manual | Confidence |
|---|---|---|---|---|
| Active context selection | Needs user-friendly explanation of organization/role context, switching, and no-role state. | `apps/web/app/app/select-role/page.tsx`; `apps/web/components/ActiveContextBar.tsx`; `packages/domain/src/identity/active-context.mjs` | HIGH | HIGH |
| Breeder dashboard and order detail | Needs step-by-step manual content and screenshots. | `apps/web/features/breeder-dashboard/BreederDashboard.tsx`; `apps/web/features/order-detail/BreederOrderDetail.tsx` | HIGH | HIGH |
| Catalog and draft order creation | Required fields and save vs submit behavior need manual guidance. | `apps/web/features/catalog/semen-catalog.mjs`; `apps/web/features/order-creation/OrderCreationForm.tsx`; `packages/domain/src/orders/semen-order.mjs` | HIGH | HIGH |
| Station order management | Station receive/confirm/reject/fulfillment steps need clear operator instructions. | `apps/web/features/station-orders/StationOrderManagement.tsx`; `packages/domain/src/orders/semen-order.mjs` | HIGH | HIGH |
| Shipment workflow | Manual should explain manual/provider-reference shipment creation, update, and delivery/receipt distinction. | `apps/web/features/shipment-workflow/ShipmentWorkflow.tsx`; `packages/domain/src/shipments/shipment.mjs` | HIGH | HIGH |
| Document upload/detail lifecycle | Controlled access, classification options, revoke, and replace need careful explanation. | `apps/web/features/documents`; `packages/domain/src/documents` | HIGH | HIGH |
| Admin workspaces | Admin users, orgs, invitations, roles, orders, support, proof, audit, permissions, and amendments need separate admin manual sections. | `apps/web/app/app/admin`; `apps/web/features/admin-dashboard/admin-dashboard.mjs` | HIGH | HIGH |
| Payment references | Needs explanation as reference-only tracking, not payment processing. | `apps/web/features/payment-reference/PaymentReferencePanel.tsx`; `packages/domain/src/payments/payment-reference.mjs` | MEDIUM | HIGH |
| Support requests | User creation and admin queue need explanation, with clear caveat that admin resolution UI was not found. | `packages/domain/src/support/support-request.mjs`; `apps/web/app/app/admin/support/page.tsx` | MEDIUM | HIGH |

## 2. Partially Implemented Features Requiring Caution

| Feature | Caution | Evidence | Confidence |
|---|---|---|---|
| Managed auth | Login/reset depend on provider configuration and are not local password forms. | `apps/web/app/login/page.tsx`; `apps/web/app/password-reset/page.tsx`; `.env.example` | HIGH |
| Notifications | Templates/logs/action-required items exist, but no full in-app notification center was found. | `packages/domain/src/notifications`; `apps/web/features/admin-dashboard`; `apps/web/features/station-dashboard` | HIGH |
| Support request lifecycle | Creation and admin listing exist, but no admin resolve/close UI was found. | `packages/domain/src/support/support-request.mjs`; `apps/web/app/app/admin/support/page.tsx` | HIGH |
| Payment | Payment references exist; real payment processing does not. | `packages/domain/src/payments/payment-reference.mjs`; `.env.example` | HIGH |
| Logistics | Shipment tracking exists; full provider integration/webhooks do not. | `packages/domain/src/shipments/shipment.mjs`; `.env.example` | HIGH |
| Static legal/support pages | Pages exist but appear placeholder/static. | `apps/web/features/static-pages/static-pages.mjs` | HIGH |
| Amendment lifecycle | Admin can create/list amendment evidence; approval/rejection workflow UI was not found. | `apps/web/app/app/admin/amendments`; `packages/domain/src/amendments/amendment.mjs` | HIGH |

## 3. Workflows Unclear from Codebase

| Workflow | Unclear point | Evidence reviewed | Confidence |
|---|---|---|---|
| Full profile management after onboarding | No profile settings/update page found beyond invitation display name and admin user controls. | `apps/web/app`; `apps/web/app/accept-invite/page.tsx`; `apps/web/app/app/admin/users/page.tsx` | HIGH |
| Support resolution | Status enum supports lifecycle states, but admin UI mutation path was not found. | `packages/domain/src/support/support-request.mjs`; `apps/web/app/app/admin/support/page.tsx` | HIGH |
| Notification delivery/retry operations | Template/log source exists, retry behavior appears placeholder/disabled, and no admin notification UI was found. | `packages/domain/src/notifications` | MEDIUM/HIGH |
| Buyer/external document access | Access permission scope and document classification mention buyer-view readiness, but no active buyer route/role navigation was found. | `packages/database/prisma/schema.prisma`; `packages/domain/src/identity/role-model.mjs`; `apps/web/features/navigation.mjs` | HIGH |
| Admin shipment/listing global operations | Admin dashboard source marks admin listings/shipments as planned; station-specific routes exist. | `apps/web/features/admin-dashboard/admin-dashboard.mjs`; `apps/web/app/app/station` | HIGH |

## 4. Screens Needing Screenshots Later

| Screen | Screenshot need | Evidence |
|---|---|---|
| `/login` and `/password-reset` | Auth setup and provider-configured vs unconfigured states. | `apps/web/app/login/page.tsx`; `apps/web/app/password-reset/page.tsx` |
| `/app/select-role` | Role/context selection. | `apps/web/app/app/select-role/page.tsx` |
| `/breeder-dashboard` | Breeder overview with populated and empty states. | `apps/web/features/breeder-dashboard/BreederDashboard.tsx` |
| `/app/catalog` and `/app/catalog/[listingId]` | Catalog browse and listing detail/order start. | `apps/web/features/catalog/semen-catalog.mjs` |
| `/app/orders/new` | Draft order form and confirmation. | `apps/web/features/order-creation/OrderCreationForm.tsx` |
| `/app/orders/[orderId]` | Breeder order detail, shipment, documents, proof, support. | `apps/web/features/order-detail/BreederOrderDetail.tsx` |
| `/station-dashboard` | Station overview/action-required. | `apps/web/features/station-dashboard/StationDashboard.tsx` |
| `/app/station/orders` | Station order commands and selected order view. | `apps/web/features/station-orders/StationOrderManagement.tsx` |
| `/app/station/shipments` | Shipment creation/update and tracking timeline. | `apps/web/features/shipment-workflow/ShipmentWorkflow.tsx` |
| `/app/station/stallions` and `/app/station/listings` | Station setup/management workflows. | `apps/web/features/stallion-management/StallionManagement.tsx`; `apps/web/features/listing-management/ListingManagement.tsx` |
| `/app/documents/upload` and `/app/documents/[documentId]` | Document upload/access/lifecycle actions. | `apps/web/features/documents` |
| `/app/admin` and admin subpages | Admin overview, users, invitations, organizations, roles, orders, support, proof, audit, permissions, amendments. | `apps/web/app/app/admin` |

## 5. Terminology Needing Standardization

| Term | Issue | Evidence | Recommendation for later manual |
|---|---|---|---|
| Breeding Station vs Station | Both terms appear; role code is `BREEDING_STATION`. | `packages/database/prisma/schema.prisma`; `apps/web/features/navigation.mjs`; station routes | Use "Breeding Station" for role, "station" for general nouns. |
| Platform Admin vs Admin | UI uses Admin; role code is `PLATFORM_ADMIN`. | `apps/web/features/navigation.mjs`; admin routes | Define "Platform Admin" once, then use "Admin" in UI instructions. |
| Order received vs shipment received | Station "receive order" and breeder "confirm received shipment" are different. | `packages/domain/src/orders/semen-order.mjs`; `packages/domain/src/shipments/shipment.mjs` | Use "mark order as received by station" vs "confirm shipment receipt by breeder." |
| Controlled access URL/link | Document viewing uses controlled access, not public links. | `apps/web/app/api/documents/[documentId]/access/route.ts`; `packages/domain/src/documents/document-storage.mjs` | Define once in document section. |
| Payment reference | Could be confused with payment processing. | `packages/domain/src/payments/payment-reference.mjs` | State clearly: reference/status tracking only. |
| Proof event and audit log | Related but different concepts. | `packages/domain/src/proof/proof-event.mjs`; `packages/domain/src/audit/audit-log.mjs` | Provide short glossary in final manual. |

## 6. Roles Needing Clearer Explanation

| Role | Gap | Evidence |
|---|---|---|
| BREEDER | Needs clear boundary between ordering, tracking, documents, proof view, support, and no station/admin control. | `apps/web/features/navigation.mjs`; breeder routes |
| BREEDING_STATION | Needs workflow explanation for station-owned stallions/listings and assigned order fulfillment. | `apps/web/features/navigation.mjs`; station routes |
| PLATFORM_ADMIN | Needs governance/support framing and caution that admin tools are not arbitrary silent edits. | `apps/web/features/admin-dashboard/admin-dashboard.mjs`; admin routes; amendment service |
| Future roles | Should not be described as active. | `packages/domain/src/identity/role-model.mjs`; `packages/database/prisma/schema.prisma` |

## 7. Status Values Needing User-Friendly Labels

| Status group | Current source | Gap |
|---|---|---|
| Orders | `apps/web/features/status-display/status-display-registry.mjs` | Mostly covered; manual should align labels with UI. |
| Shipments | `apps/web/features/status-display/status-display-registry.mjs` | Mostly covered; distinguish `DELIVERED` and breeder receipt. |
| Payment references | `apps/web/features/status-display/status-display-registry.mjs` | Covered, but manual should state reference-only. |
| Documents | `packages/database/prisma/schema.prisma`; `packages/domain/src/documents` | Needs friendly labels for `ACTIVE`, `REVOKED`, `SUPERSEDED` and access classifications. |
| Proof events | `packages/database/prisma/schema.prisma`; `packages/domain/src/proof/proof-event.mjs` | Needs friendly event type and verification-level descriptions. |
| Support requests | `packages/database/prisma/schema.prisma`; `packages/domain/src/support/support-request.mjs` | Needs labels and current lifecycle limitations. |
| Amendments | `packages/database/prisma/schema.prisma`; `packages/domain/src/amendments/amendment.mjs` | Needs explanation that submitted amendment evidence does not mutate target. |

## 8. Error Messages Needing Clearer Wording

| Area | Issue | Evidence |
|---|---|---|
| Active context/object IDs | Some errors may expose object ids or active-context terms that are meaningful to developers but less clear to users. | `apps/web/features/auth/active-context-runtime.mjs`; route actions |
| Shipment missing order id | Message is accurate but manual should tell users to start from order workflow link. | `apps/web/features/shipment-workflow/ShipmentWorkflow.tsx` |
| Document storage/config errors | API distinguishes storage unavailable/runtime errors; manual should translate into "try again/contact admin." | `apps/web/app/api/documents/upload/route.ts`; `apps/web/app/api/documents/[documentId]/access/route.ts` |
| Payment sensitive data rejection | Useful but should be phrased as policy: do not enter card/bank details. | `packages/domain/src/payments/payment-reference.mjs` |
| Static legal/support copy | Placeholder wording should not be repeated as final manual copy. | `apps/web/features/static-pages/static-pages.mjs` |

## 9. Admin Actions Needing Explanation

| Admin action | Explanation needed | Evidence |
|---|---|---|
| Assign roles | How org-role context affects user access. | `/app/admin/users`; `packages/domain/src/identity/active-context.mjs` |
| Disable users/orgs | What access impact is and what is not deleted. | `/app/admin/users`; `/app/admin/organizations` |
| Create invitations | Invite role limits, expiry, and provider/email status. | `/app/admin/invitations`; `packages/domain/src/onboarding/user-invitation.mjs` |
| Review audit/proof | Difference between proof timeline and audit log. | `/app/admin/proof`; `/app/admin/audit` |
| Grant/revoke permissions | Scope/object/subject model and active/expired/revoked states. | `/app/admin/permissions`; `packages/domain/src/permissions/access-permission.mjs` |
| Create amendments | Evidence-only correction process and target immutability. | `/app/admin/amendments/new`; `packages/domain/src/amendments/amendment.mjs` |
| Support queue | Current queue review vs missing resolution controls. | `/app/admin/support`; `packages/domain/src/support/support-request.mjs` |

## 10. Features Not to Include as Implemented Yet

| Feature | Reason | Evidence | Confidence |
|---|---|---|---|
| AI insights or recommendations | Explicitly out of scope; no implementation found. | `README.md`; repo scan | HIGH |
| Blockchain/token logic | Explicitly out of scope; no implementation found. | `README.md`; repo scan | HIGH |
| Full data-space/federation automation | Explicitly out of scope; future role exists but no active workflow. | `README.md`; `packages/domain/src/identity/role-model.mjs` | HIGH |
| Sensor/wearable ingestion | Explicitly out of scope; no implementation found. | `README.md`; repo scan | HIGH |
| Complex marketplace automation | Station-managed listings exist, but no automated marketplace beyond active catalog. | `apps/web/features/listing-management`; `apps/web/features/catalog`; `README.md` | HIGH |
| Real payment processing | Payment reference only; sensitive data rejected. | `packages/domain/src/payments/payment-reference.mjs`; `.env.example` | HIGH |
| Full logistics provider integration | Manual/provider-reference shipment tracking only. | `packages/domain/src/shipments/shipment.mjs`; `.env.example` | HIGH |
| Public buyer portal/unrestricted buyer access | Future role/scope present, active route not found. | `packages/database/prisma/schema.prisma`; `apps/web/features/navigation.mjs` | HIGH |
| In-app notification center | Notification logs/templates found, no notification center route. | `packages/domain/src/notifications`; `apps/web/app` | HIGH |
| Final legal/privacy/support policy pages | Static placeholder pages exist. | `apps/web/features/static-pages/static-pages.mjs` | HIGH |
| Full support ticket resolution UI | Creation/admin queue found, resolution UI not found. | `apps/web/app/app/admin/support/page.tsx`; `packages/domain/src/support/support-request.mjs` | HIGH |
| Admin global listing/shipment workspaces | Admin dashboard marks admin listings/shipments planned; station-specific routes exist. | `apps/web/features/admin-dashboard/admin-dashboard.mjs`; `apps/web/app/app/station` | HIGH |

