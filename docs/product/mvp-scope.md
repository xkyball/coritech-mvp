# Phase 1 MVP Scope

## Objective

Phase 1 proves CoriTech's operational wedge: semen ordering, tracking and
documentation that generate trustworthy evidence.

## In Scope

| Capability | Phase 1 intent | Status |
| --- | --- | --- |
| Breeder workflow | Search/list semen availability and place controlled orders | Breeder dashboard, semen catalog, draft order save/edit/cancel and controlled submit flow implemented for Phase 1.1 |
| Breeding station workflow | Manage listings, confirm orders and update fulfillment status | Station dashboard implemented for scoped operational visibility and action entry points; listing management UI implemented for station-owned semen listings; order, shipment and document forms remain pending dedicated workflow tickets |
| Shipment tracking | Record shipment milestones and supporting references | `[PENDING_IMPLEMENTATION]` |
| Evidence documents | Upload and control access to documents linked to orders, shipments or proof events | `[PENDING_IMPLEMENTATION]` |
| Proof events | Generate audit-ready proof from workflow actions | `[PENDING_IMPLEMENTATION]` |
| Verification level v1 | Assign simple reviewable verification levels to proof events | `[PENDING_IMPLEMENTATION]` |
| Audit trail | Preserve who did what, when and why | `[PENDING_IMPLEMENTATION]` |
| Managed access | Use managed auth and role-based permissions | Managed auth contract implemented by Ticket 2.1; RBAC middleware pending Ticket 2.2 |

## Core Proof Narrative

```text
Operational trigger -> evidence document -> actor signature or confirmation -> verification level -> audit trail
```

The product should make this chain inspectable without relying on vendor memory
or private operational explanations.

## Draft Order Lifecycle

Breeders can create a draft semen order from an active orderable listing, save
partial delivery and shipping details, return to the draft from the dashboard,
edit it while it remains `DRAFT`, cancel it without deleting the audit trail, or
submit it once required fields are complete.

Submission is the controlled transition from `DRAFT` to `SUBMITTED`. That
transition records order status history, writes audit evidence and respects the
configured proof-event policy. After submission, the breeder cannot freely edit
proof-relevant order fields through the draft flow, and the assigned breeding
station can see the submitted order in its station workspace.

## Delayed Scope

The following are explicitly outside Phase 1 unless a later ticket overrides
this document:

- AI insights, AI scoring and AI-generated claims.
- Blockchain/token logic, token issuance or tokenized proof.
- Full data-space automation, including full equine data space automation.
- Full federation automation and full studbook automation.
- Sensor/wearable ingestion.
- Full marketplace automation.
- Unrestricted buyer access.
- Custom authentication where managed auth is available.
- Public unrestricted document links.

## Open Placeholders

| Item | Placeholder |
| --- | --- |
| Initial countries/markets | `[PENDING_PRODUCT_DECISION]` |
| Initial station partners | `[PENDING_COMMERCIAL_DECISION]` |
| Initial document types | `[PENDING_DOMAIN_DECISION]` |
| Verification level labels | `[PENDING_TICKET_01_07]` |
| MVP launch environment | `[PENDING_DEPLOYMENT_DECISION]` |
