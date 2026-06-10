# Role and Permission Matrix

## Purpose

This matrix defines CoriTech Phase 1 role and permission boundaries for the
semen-ordering, tracking and documentation wedge. It is written for investors,
CTOs and security/GDPR reviewers who need to understand what each actor can
view, create, update, confirm and upload.

Phase 1 keeps the proof frame focused:

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

This document records the access intent. The executable enforcement remains in
the role model, RBAC middleware, object-level access-permission service and
document classification helpers.

## Enforcement Sources

| Control | Phase 1 source | Due-diligence note |
| --- | --- | --- |
| Role catalogue | `packages/domain/src/identity/role-model.mjs` | Only `BREEDER`, `BREEDING_STATION` and `PLATFORM_ADMIN` are assignable in Phase 1. |
| Active context | `packages/domain/src/identity/active-context.mjs` | Resolves the active organization and role from server-side user role assignments; browser-selected context is not trusted until validated. |
| Route-level RBAC | `packages/domain/src/auth/rbac-middleware.mjs` | Protected routes check role, organization and object context before handlers run. |
| Object-level grants | `packages/domain/src/access/access-permission.mjs` | Grants are explicit, scoped, revocable, optionally expiring and audit logged. They do not create broad marketplace, buyer or data-space access. |
| Document visibility | `packages/domain/src/documents/document-evidence.mjs` | Documents are filtered by classification and object participation. No public unrestricted document links are created. |
| Audit evidence | `packages/domain/src/audit/audit-log.mjs` and proof hooks | Denied RBAC decisions, elevated admin access and permission changes can be retained as review evidence. |

## Active Organization And Role Context

Every authenticated action must run with one explicit active organization and
one active Phase 1 role. The active-context resolver accepts the authenticated
user ID, the user's server-side `UserOrganizationRole` assignments and optional
organization status metadata.

Resolution rules:

- A user with one valid active Phase 1 organization role receives that context
  automatically.
- A user with multiple active contexts must select one before protected
  workflow pages or service actions proceed.
- A selected context is accepted only when it matches an active role assignment
  for the authenticated user and, when organization metadata is supplied, an
  active organization.
- Future roles such as `BUYER`, revoked assignments and disabled organizations
  do not become active contexts.
- A user with no valid active context is routed to the no-role setup state.

The validated context produces the actor shape consumed by RBAC and workflow
services:

```text
userId + activeOrganizationId + activeRoleCode
```

Audit and proof hooks use the same validated actor context for
`actorUserId`, `actorRoleCode`, `actorOrganizationId` and the
`MANAGED_AUTH_ACTOR_CONTEXT` reference. UI forms must not pass arbitrary
organization IDs for authorization when the organization can be derived from
the active context.

## Role Readiness

| Role | Phase 1 status | Permission posture | Restrictions |
| --- | --- | --- | --- |
| `BREEDER` | Active | Operational user for a breeder organization. | Limited to its own organization, own orders and documents visible through order participation or explicit grant. |
| `BREEDING_STATION` | Active | Operational user for a breeding station organization. | Limited to its own stallions, listings, assigned orders, fulfillment activity and permitted documents. |
| `PLATFORM_ADMIN` | Active | CoriTech operational oversight and support role. | Elevated access must be named, reasoned, logged where hooks exist and reviewable. It is not a substitute for customer or vendor ownership. |
| `VET` | Prepared future role | Reserved for later veterinary attestation and signature workflows. | Not assignable and receives no active Phase 1 permissions. No vet-signature automation is implemented here. |
| `FEDERATION` | Prepared future role | Reserved for later studbook or federation verification workflows. | Not assignable and receives no active Phase 1 permissions. No federation automation or data exchange is implemented here. |
| `BUYER` | Prepared future role | Reserved for later controlled buyer workflows. | Not assignable and receives no active Phase 1 permissions. Buyer access is never unrestricted. |
| `TECH_SUPPORT` | Prepared future role | Reserved for later technical support operations. | Not assignable as standing access in Phase 1. External technical support must be restricted, time-bounded and approved by Platform Admin. |

The data model also reserves `SALES_VENUE` for a later phase. It has no active
Phase 1 permission and is outside this ticket's review matrix.

## Active Phase 1 Matrix

Legend:

- `Allowed` means the role may perform the action when validation passes.
- `Context-limited` means the role must match the relevant organization,
  order, shipment, listing, document classification or explicit grant.
- `Support override` means Platform Admin may act for support or review, with
  the action reasoned and logged where hooks exist.
- `No` means no Phase 1 permission is granted.

| Permission area | `BREEDER` | `BREEDING_STATION` | `PLATFORM_ADMIN` |
| --- | --- | --- | --- |
| View active semen listings | Allowed for orderable active listings. | Context-limited to own station records, with listing search available for authenticated station users. | Support override and operational review. |
| Create semen order | Allowed for the breeder's own organization. | No. | Support override for a breeder organization. |
| View semen order | Context-limited to orders owned by the breeder organization. | Context-limited to orders assigned to the station. | Support override and review. |
| Update order workflow status | Context-limited to breeder-owned transitions such as submit or cancel while allowed by workflow state. | Context-limited to assigned order transitions such as receive, confirm, reject and fulfillment progress. | Support override for allowed workflow transitions. |
| Confirm operational event | No standalone confirmation authority beyond breeder-owned status transitions. | Context-limited station confirmation of assigned orders and fulfillment events. | Support override and admin-reviewed corrections where approved by implemented workflows. |
| Manage stallions and semen listings | No. | Allowed for own station stallions and listings. | Support override and review. |
| View shipment or tracking record | Context-limited to shipments linked to own orders. | Context-limited to assigned station shipments. | Support override and review. |
| Create or update shipment record | No. | Context-limited to assigned station fulfillment records where implemented. | Support override and review. |
| Upload evidence document | Context-limited to own order context and permitted document classification. | Context-limited to assigned order, shipment or proof-event context and permitted document classification. | Support override and admin-only evidence handling. |
| View evidence document | Context-limited by own order participation, classification and explicit grant. | Context-limited by assigned station participation, classification and explicit grant. | Support override subject to classification and audit review. |
| Attach evidence to proof event | Context-limited when the breeder can view both the document and the proof event. | Context-limited when the station can view both the document and the proof event. | Support override. |
| View proof timeline or audit trail | Context-limited to visible proof events and audit entries for own operational records. | Context-limited to visible proof events and audit entries for assigned station records. | Operational review of proof and audit evidence. |
| Manage users and organizations | No. | Own organization user administration only if a later approved admin workflow grants it; no broad Phase 1 authority in this matrix. | Allowed for Phase 1 role assignment, revocation and organization support workflows. |
| Grant object-level permissions | No. | No. | Allowed only through explicit object-level AccessPermission workflows, with reason, scope, grantor and expiry/revocation evidence. |
| Access production configuration or secrets | No. | No. | Restricted to named CoriTech-controlled admins; production-critical accounts must remain CoriTech-owned or transferable. |

## Permission Domains

| Domain | View | Create | Update | Confirm | Upload |
| --- | --- | --- | --- | --- | --- |
| Catalog | Breeders can view active orderable listings; stations view own records; admins review. | Stations create own stallions/listings; admins may support. | Stations update own records; admins may support. | No Phase 1 catalog confirmation authority. | No catalog upload authority. |
| Orders | Breeders view own orders; stations view assigned orders; admins review. | Breeders create own orders; admins may support. | Breeders and stations transition only allowed workflow states for their context; admins may support. | Stations confirm assigned orders; admins may support or review. | Order documents may be uploaded only by authorized participants and admins. |
| Shipments | Breeders view own order shipments; stations view assigned shipments; admins review. | Stations create shipment records for confirmed assigned orders where implemented; admins may support. | Stations update assigned shipment status where implemented; admins may support. | Station-confirmed shipment proof events are workflow generated where approved. | Shipment documents may be uploaded only by authorized participants and admins. |
| Documents | Visibility is classification-aware and object-context-aware. | Document records are created only through controlled upload workflows. | Metadata changes require an approved workflow; no public document editing is created here. | Documents do not create independent confirmation authority. | Uploads require role, object context, classification and storage metadata validation. |
| Proof and audit | Visible only through role/object context or admin review. | Proof events are workflow generated by approved domain actions, not manually created by general users. | Corrections use amendment evidence rather than overwriting prior records. | Verification level is derived from the actor and workflow, not from unrestricted user choice. | Evidence attachments require access to both the document and proof event. |

## Future Role Preparation

| Future role | Prepared for | Phase 1 boundary |
| --- | --- | --- |
| `VET` | Veterinary document review, signature or attestation. | No active access. Any future vet access must be object-scoped, consent-aware and audit logged. |
| `FEDERATION` | Studbook or federation validation and later data-space exchange. | No active access. No federation automation, ingestion or unrestricted export exists in Phase 1. |
| `BUYER` | Controlled purchase-side review of selected generated evidence. | No active access. Buyer View is prepared only as a future generated permissioned read-only view. |
| `TECH_SUPPORT` | Temporary troubleshooting by named external or internal support personnel. | No standing access. Any support access must be least-privilege, time-bounded, approved, logged and revoked when the task ends. |

## Buyer View Boundary

Buyer View is not full database access. It is a future generated,
permissioned, read-only view assembled from records and documents that are
explicitly eligible for buyer review. Phase 1 only marks eligibility through
controlled concepts such as `BUYER_VIEW_ELIGIBLE`; it does not grant a buyer
role, buyer search, buyer account access, public links or unrestricted document
visibility.

A future Buyer View must meet all of these boundaries before activation:

- Generated from approved operational records, never by exposing raw tables.
- Read-only and scoped to a specific transaction, horse, order or document set.
- Permissioned by explicit grant, expiry and revocation path.
- Filtered to exclude internal notes, restricted documents, credentials,
  payment details, unrelated orders and unrelated organization data.
- Logged for access evidence and review.

## Technical Support Boundary

External technical support is restricted and time-bounded. Phase 1 does not
allow standing `TECH_SUPPORT` role assignment, shared admin accounts or
vendor-owned production-critical access.

Any approved support access must follow these constraints:

- Named individual identity through the managed auth provider or provider admin
  console, not a shared login.
- Platform Admin approval with reason, target system, target object or bounded
  operational scope.
- Minimum necessary permission for the task.
- Start time and expiry time, with revocation evidence after completion.
- No direct unrestricted database browsing unless explicitly approved for an
  incident and captured in the access record.
- No retained production secrets by agencies, freelancers or external vendors.

## Document Access Classifications

| Classification | Phase 1 access boundary |
| --- | --- |
| `INTERNAL` | Assigned breeding station and Platform Admin. |
| `ORDER_PARTICIPANTS` | Breeder, assigned breeding station and Platform Admin for the linked order context. |
| `RESTRICTED` | Uploader organization and Platform Admin. |
| `BUYER_VIEW_ELIGIBLE` | Future eligibility marker only. It does not grant buyer access in Phase 1. |
| `ADMIN_ONLY` | Platform Admin only. |

## Restrictions and Non-Goals

- No unrestricted buyer access.
- No public unrestricted document links.
- No full marketplace automation.
- No full equine data-space automation.
- No federation or studbook automation in Phase 1.
- No sensor or wearable ingestion.
- No AI insights or AI claims.
- No blockchain, token, wallet or digital asset layer.
- No custom authentication when managed auth is available.
- No vendor-owned production-critical account assumptions.

## Review Checklist

- Active Phase 1 access is limited to Breeder, Breeding Station and Platform
  Admin.
- Future roles are prepared but not assignable or permissioned in Phase 1.
- Buyer View is documented as generated, permissioned and read-only, not full
  database access.
- Technical support access is restricted, named, least-privilege,
  time-bounded, logged and revoked.
- Elevated access and permission changes remain due-diligence ready through
  reason, actor, scope, expiry/revocation and audit evidence.
