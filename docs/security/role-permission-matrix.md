# Role and Permission Matrix

## Purpose

This matrix defines implemented Phase 1 RBAC boundaries for the operational
semen-ordering wedge. Ticket 1.1 implements the foundational role codes and
Ticket 2.2 adds framework-neutral API middleware for route-level permission
checks.

## Starter Roles

| Role code | Intended user | Notes |
| --- | --- | --- |
| `PLATFORM_ADMIN` | CoriTech operations or authorized reviewer | Highest operational oversight; can assign Phase 1 roles |
| `BREEDER` | Breeder organization user | Access to own orders and permitted documents once RBAC is implemented |
| `BREEDING_STATION` | Semen provider organization user | Manages station listings, orders and fulfillment once RBAC is implemented |

Prepared future role codes `VET`, `FEDERATION`, `SALES_VENUE`, `BUYER` and
`TECH_SUPPORT` are reserved by the data model but are not assignable or
permissioned in Phase 1.

## Starter Permission Matrix

`PLATFORM_ADMIN`, `BREEDER` and `BREEDING_STATION` are the only permissioned
Phase 1 role codes. Other columns remain pending access categories, not
assigned roles.

Ticket 1.3 implements the first order-workflow permission checks inside the
framework-neutral semen order domain helper: breeders can create and submit
orders for their breeder organization, assigned breeding stations can progress
station-owned order statuses, and platform admins retain support/oversight
access.

Ticket 2.2 adds `api/domain/auth/rbac-middleware.mjs`, which wraps endpoint
handlers with role, organization and object-level checks before the domain
handler runs. Denied access returns a normalized `403` response and writes a
normalized RBAC access-decision event when a route repository exposes
`recordRbacAccessDecision`. Denied decisions are logged; successful
`PLATFORM_ADMIN` access is logged by default.

| Capability | `PLATFORM_ADMIN` | `BREEDER` | `BREEDING_STATION` | Logistics Contributor `[PENDING]` | Evidence Reviewer `[PENDING]` | Diligence Viewer `[PENDING]` |
| --- | --- | --- | --- | --- | --- | --- |
| Manage users and organizations | Yes | No | Own organization only | No | No | No |
| Manage semen listings | Review/override | No | Own listings | No | No | Read-only if approved |
| Create semen order | Support/override | Yes | No | No | No | No |
| Update order status | Support/override | Own order limited | Own station orders | No | No | Read-only if approved |
| Record shipment event | Support/override | No | Own station shipments | Assigned shipments only | No | Read-only if approved |
| Upload evidence document | Support/override | Own order if permitted | Own station orders | Assigned shipment only | No | No |
| View evidence document | Approved access only | Own order if permitted | Own station orders if permitted | Assigned shipment only | Approved access only | Explicit grant only |
| Create proof event | System/admin controlled | No | No | No | No | No |
| Review verification level | Yes | No | No | No | If assigned | Read-only if approved |
| View audit trail | Yes | Own visible events only | Own visible events only | Assigned shipment only | Approved events only | Explicit grant only |

## Access Guardrails

- No unrestricted buyer access.
- No public unrestricted document links.
- No vendor-owned production-critical access dependency.
- Every elevated permission requires a documented owner and review path.
- The Ticket 2.3 `AccessPermission` grant model is not implemented by the RBAC
  middleware; object access remains role, organization and order scoped.

## Document Access Classifications

Ticket 1.5 introduces mandatory document access classifications used by the
document metadata helper:

| Classification | Phase 1 access boundary |
| --- | --- |
| `INTERNAL` | Assigned breeding station and platform admin. |
| `ORDER_PARTICIPANTS` | Breeder, assigned breeding station and platform admin for the linked order context. |
| `RESTRICTED` | Uploader organization and platform admin. |
| `BUYER_VIEW_ELIGIBLE` | Future eligibility marker only; it does not grant buyer access in Phase 1. |
| `ADMIN_ONLY` | Platform admin only. |
