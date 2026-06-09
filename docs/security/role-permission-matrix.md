# Role and Permission Matrix

## Purpose

This starter matrix defines expected Phase 1 access boundaries. It is
conceptual only and will be finalized by the role and permission tickets.

## Starter Roles

| Role | Intended user | Notes |
| --- | --- | --- |
| CoriTech Admin | CoriTech operations or authorized reviewer | Highest operational oversight |
| Breeder | Buyer or breeder organization user | Access to own orders and permitted documents |
| Breeding Station Admin | Semen provider organization user | Manages station listings, orders and fulfillment |
| Logistics Contributor | Internal or external shipment updater | Limited shipment event access |
| Evidence Reviewer | Authorized reviewer or verifier | Limited review access where approved |
| Investor/Diligence Viewer | Read-only due-diligence user | Only if explicitly provisioned |

## Starter Permission Matrix

| Capability | CoriTech Admin | Breeder | Breeding Station Admin | Logistics Contributor | Evidence Reviewer | Diligence Viewer |
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
