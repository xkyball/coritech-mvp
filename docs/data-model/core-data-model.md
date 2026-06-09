# Core Data Model

## Purpose

This is the Phase 1 core data model reference for due diligence. Entities are
marked as implemented when an approved ticket has added code and migrations;
the remaining entities are still conceptual placeholders.

## Core Entities

| Entity | Phase 1 role | Key relationships |
| --- | --- | --- |
| User | Authenticated person using CoriTech | Implemented by Ticket 1.1; belongs to one or more organizations through roles |
| Organization | Breeder, breeding station or CoriTech platform entity | Implemented by Ticket 1.1; owns users and later workflow records |
| Role | Permission group scoped to organization context | Implemented by Ticket 1.1; grants Phase 1 role context |
| Stallion | Horse record used for semen listing context | Owned or managed by a breeding station |
| SemenListing | Offer record for available semen | Linked to stallion and breeding station |
| SemenOrder | Operational order between breeder and breeding station | Links breeder, station, listing, shipment and evidence |
| OrderStatusHistory | Ordered record of order state changes | Linked to semen order and actor |
| Shipment | Delivery record for semen order fulfillment | Linked to order and tracking events |
| ShipmentTrackingEvent | Milestone, carrier update or manual tracking note | Linked to shipment and actor/source |
| EvidenceDocument | Metadata for uploaded proof documents | Linked to order, shipment or proof event |
| ProofEvent | Workflow-generated proof record | Links trigger, documentation, signature, verification level and audit trail |
| VerificationLevel | Reviewable trust level applied to proof events | Used by proof event and reporting surfaces |
| AuditLog | Immutable operational audit entry | Links actor, action, target object and timestamp |
| AccessPermission | Controlled document or workflow access grant | Links subject, resource and permission |
| Amendment | Controlled correction record | Links original record, reason, approver and audit evidence |
| PaymentReference | Non-processing payment reference | Links order to external payment evidence when applicable |

## Implemented Identity Foundation

Ticket 1.1 introduces the first concrete data-model migration:

`api/db/migrations/20260609_0101_user_organization_role_model.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `users` | CoriTech user records linked to managed authentication subjects. |
| `organizations` | Phase 1 breeder, breeding station and CoriTech platform organizations. |
| `roles` | Role catalog with Phase 1 assignable roles and future prepared enum values. |
| `user_organization_roles` | Organization-scoped user role assignments with assignment and revocation metadata. |

Phase 1 assignable role codes are `BREEDER`, `BREEDING_STATION` and
`PLATFORM_ADMIN`.

Prepared future role codes are `VET`, `FEDERATION`, `SALES_VENUE`, `BUYER` and
`TECH_SUPPORT`. They exist only as reserved enum/catalog values and are not
assignable in Phase 1.

Role assignment changes are not a full audit-log implementation. The
`user_organization_roles` table stores assignment and revocation actors, and
the API identity helper emits a `ROLE_ASSIGNMENT` audit hook for Ticket 1.8 to
connect to the future `AuditLog` table.

## Data Ownership Principle

Operational and proof data must remain under CoriTech-controlled accounts or
contractually transferable systems. Vendor memory is not an acceptable system of
record.

## Open Placeholders

| Area | Placeholder |
| --- | --- |
| Database provider | PostgreSQL-style migration prepared; production vendor remains `[PENDING_VENDOR_SELECTION]` |
| Canonical IDs | UUID primary keys in Ticket 1.1 migration; cross-system ID policy remains `[PENDING_ARCHITECTURE_DECISION]` |
| Required document types | `[PENDING_DOMAIN_DECISION]` |
| Retention periods | `[PENDING_LEGAL_DECISION]` |
| Data residency requirements | `[PENDING_LEGAL_DECISION]` |
