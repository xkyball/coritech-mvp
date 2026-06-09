# Role and Permission Matrix

## Purpose

This starter matrix defines expected Phase 1 access boundaries. Ticket 1.1 now
implements the foundational role codes; permission enforcement remains owned by
later authorization tickets.

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

This matrix remains conceptual until the RBAC ticket is implemented. Only
`PLATFORM_ADMIN`, `BREEDER` and `BREEDING_STATION` are implemented role codes
in Ticket 1.1; the other columns remain pending access categories, not assigned
roles.

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
