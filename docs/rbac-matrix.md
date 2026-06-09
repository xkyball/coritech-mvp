# RBAC Matrix

## Role Status

| Role | Phase 1 status | Boundary |
| --- | --- | --- |
| Breeder | Active | Own breeder organization, own orders and permitted documents. |
| Breeding Station | Active | Own station catalog, assigned orders, shipments and permitted documents. |
| Platform Admin | Active | Support and review workflows with reasoned, auditable actions. |
| Vet / Clinic | Prepared future | No active Phase 1 permission. |
| Federation / Studbook | Prepared future | No federation automation or active Phase 1 permission. |
| Sales Venue | Prepared future | No active Phase 1 permission. |
| Buyer | Prepared future | No active buyer access or marketplace browsing. |

## Active Phase 1 Permissions

| Area | Breeder | Breeding Station | Platform Admin |
| --- | --- | --- | --- |
| View active semen listings | Allowed | Own station records | Support/review |
| Manage stallions/listings | No | Own station records | Support/review |
| Create semen order | Own organization | No | Support/review |
| View semen order | Own organization | Assigned station orders | Support/review |
| Transition order status | Allowed breeder transitions | Allowed station transitions | Support/review |
| Create/update shipment | No | Assigned confirmed orders | Support/review |
| View shipment | Own orders | Assigned station orders | Support/review |
| Upload evidence document | Own order context | Assigned order/shipment context | Support/review |
| View evidence document | Classification and object scoped | Classification and object scoped | Support/review |
| View proof/audit timeline | Object scoped | Object scoped | Operational review |
| Grant object permissions | No | No | Allowed through explicit access-permission records |
| Create amendment | No | No | Allowed through controlled correction workflow |

## Guardrails

- Future roles are seeded for planning but not assignable through Phase 1 role assignments.
- Buyer View remains reserved and blocked by the current access-permission table constraint.
- Custom authentication is not part of this foundation; existing managed-auth contracts remain the boundary.
- Elevated admin activity should be reasoned and audit logged.
