# Data Model

## Source

The Prisma schema in `packages/database/prisma/schema.prisma` is now the
standard data-model source for implementation work. It adapts the existing raw
SQL model in `packages/database/legacy-sql/migrations` and keeps those files for historical
traceability.

## Core Entities

| Entity | Purpose |
| --- | --- |
| `User` | Managed-auth-linked CoriTech user record. |
| `Organization` | Breeder, breeding station or platform organization. |
| `Role` | Role catalog with active Phase 1 and prepared future roles. |
| `UserOrganizationRole` | Organization-scoped role assignment and revocation evidence. |
| `Stallion` | Breeding-station-owned horse record for semen listing context. |
| `SemenListing` | Station-owned semen availability record. |
| `SemenOrder` | Breeder-to-station order record with creation delivery, mare/recipient and shipping details. |
| `OrderStatusHistory` | Append-oriented status transition timeline. |
| `Shipment` | Fulfillment shipment linked to a semen order, including station delivery and breeder receipt confirmation fields. |
| `ShipmentTrackingEvent` | Normalized shipment tracking milestone. |
| `Document` | Document metadata, lifecycle status and object-storage reference. |
| `EvidenceAttachment` | Link between document metadata and proof event. |
| `VerificationLevel` | Seeded verification-level taxonomy for review and UI use. |
| `ProofEvent` | Workflow proof event with trigger, actor, verification and audit context. |
| `AuditLog` | Operational audit entry for proof-relevant actions. |
| `AccessPermission` | Object-level access grant. |
| `Amendment` | Controlled correction/amendment evidence. |
| `PaymentReference` | Reference-only external/manual payment status linked to a semen order; no card or bank credential fields. |

The Phase 1 data-quality rule registry does not add a table. It evaluates the
existing `SemenOrder`, `Shipment`, `Document` and `ProofEvent` records and can
write failure evidence through `AuditLog` when a reporting or admin workflow
explicitly records a failed quality check.

## Seed Coverage

The seed script creates:

- Active roles: Breeder, Breeding Station, Platform Admin.
- Prepared future roles: Vet / Clinic, Federation / Studbook, Sales Venue, Buyer and Technical Support.
- Verification levels: Self-reported, System-recorded, Station-confirmed, Admin-reviewed, Vet-signed, Federation-attested and Verified for transaction.
- One breeder organization, one breeding station and one platform organization.
- One user for each active organization context.
- Role assignments, a stallion, a semen listing, a semen order, status history, shipment, tracking event, document metadata, proof events, audit logs, an access grant and an amendment.

Document lifecycle uses `ACTIVE`, `SUPERSEDED` and `REVOKED` states so
replacement and revocation preserve proof history instead of hard-deleting
evidence.

## Notes

Prisma models intentionally preserve the current Phase 1 domain shape. Some
PostgreSQL-specific protections from the original SQL, such as check
constraints, partial indexes and append-only triggers, are carried in the
initial Prisma migration SQL.
