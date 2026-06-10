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
| Stallion | Horse record used for semen listing context | Implemented by Ticket 1.2; owned by a breeding station |
| SemenListing | Offer record for available semen | Implemented by Ticket 1.2; linked to stallion and breeding station |
| SemenOrder | Operational order between breeder and breeding station | Implemented by Ticket 1.3; links breeder, station and listing |
| OrderStatusHistory | Ordered record of order state changes | Implemented by Ticket 1.3; linked to semen order and actor context |
| Shipment | Delivery record for semen order fulfillment | Implemented by Ticket 1.4; linked to confirmed semen order and tracking events |
| ShipmentTrackingEvent | Milestone, carrier update or manual tracking note | Implemented by Ticket 1.4; linked to shipment, actor context and normalized source |
| Document | Metadata and object-storage references for uploaded evidence documents | Implemented by Ticket 1.5; linked to order, shipment or proof event |
| EvidenceAttachment | Relation between a document and a proof event | Implemented by Ticket 1.5; supports proof event documentation without creating proof events automatically |
| ProofEvent | Workflow-generated proof record | Implemented by Ticket 1.6; links trigger, documentation, signature placeholder, verification level and audit-hook context |
| VerificationLevel | Reviewable trust level applied to proof events | Implemented by Ticket 1.7; derived from proof event type and actor role |
| AuditLog | Immutable operational audit entry | Implemented by Ticket 1.8; links actor, role, organization, action, target object, request metadata and timestamp |
| AccessPermission | Controlled document or workflow access grant | Implemented by Ticket 2.3; links subject, resource, scope, grantor, expiry and audit evidence |
| Amendment | Controlled correction record | Implemented by Ticket 1.9; links target record, original/amended values, reason, actor, optional approver, audit evidence and optional proof evidence |
| PaymentReference | Non-processing payment reference | Links order to external payment evidence when applicable |

## Implemented Identity Foundation

Ticket 1.1 introduces the first concrete data-model migration:

`packages/database/legacy-sql/migrations/20260609_0101_user_organization_role_model.sql`

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

The `user_organization_roles` table stores assignment and revocation actors,
and the API identity helper emits a `ROLE_ASSIGNMENT` audit hook. Ticket 1.8
adds the AuditLog service helper that materializes those hooks as
`CHANGE_PERMISSION` audit entries when permission changes are persisted through
an audit-aware repository.

## Implemented Catalog Foundation

Ticket 1.2 adds the station-owned semen catalog model:

`packages/database/legacy-sql/migrations/20260609_0102_stallion_semen_listing_model.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `stallions` | Breeding-station-owned horse records with name, breed, optional UELN/chip identifiers and active/inactive status. |
| `semen_listings` | Semen listing records linked to a stallion and breeding station with listing and availability status. |

Implemented catalog status values:

| Enum | Values |
| --- | --- |
| `coritech_stallion_status` | `ACTIVE`, `INACTIVE` |
| `coritech_semen_availability_status` | `AVAILABLE`, `LIMITED`, `UNAVAILABLE` |
| `coritech_semen_listing_status` | `ACTIVE`, `INACTIVE` |

The API catalog helper exposes framework-neutral CRUD/search endpoint contracts
for stallions and semen listings. Listing management is limited to the owning
breeding station or platform admin. Breeder access is limited to active semen
listings; future buyer access remains unavailable in Phase 1.

Listing writes emit a `SEMEN_LISTING_CHANGE` audit hook. Ticket 1.8 persists
those hooks as AuditLog entries through the shared audit service. Platform-admin
listing updates are normalized as `ADMIN_EDIT` audit entries.

Inactive listings, and listings marked unavailable, are rejected by the catalog
orderability helper. Ticket 1.3 consumes that helper when preparing draft semen
orders.

## Implemented Order Workflow Foundation

Ticket 1.3 adds the central semen-order transaction model:

`packages/database/legacy-sql/migrations/20260609_0103_semen_order_status_history.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `semen_orders` | Breeder-to-breeding-station order records linked to a semen listing, with unique human-readable order numbers and breeder-entered creation details. |
| `order_status_history` | Append-only status transition records with actor user, role, organization, timestamp and reason. |

Implemented order status values:

| Enum | Values |
| --- | --- |
| `coritech_semen_order_status` | `DRAFT`, `SUBMITTED`, `RECEIVED`, `CONFIRMED`, `REJECTED`, `IN_FULFILMENT`, `SHIPPED`, `DELIVERED`, `COMPLETED`, `CANCELLED` |

Allowed transitions are intentionally finite:

| From | To |
| --- | --- |
| `DRAFT` | `SUBMITTED`, `CANCELLED` |
| `SUBMITTED` | `RECEIVED`, `CANCELLED` |
| `RECEIVED` | `CONFIRMED`, `REJECTED`, `CANCELLED` |
| `CONFIRMED` | `IN_FULFILMENT`, `CANCELLED` |
| `IN_FULFILMENT` | `SHIPPED`, `CANCELLED` |
| `SHIPPED` | `DELIVERED` |
| `DELIVERED` | `COMPLETED` |

`REJECTED`, `COMPLETED` and `CANCELLED` are terminal statuses.

Phase 1.1 operationalizes `SUBMITTED` to `RECEIVED` as the station intake
acknowledgement step. The assigned breeding station can mark a submitted order
as received, optionally record a station note, and write the actor user, active
role, organization, timestamp and reason into `order_status_history`.

The API order helper exposes framework-neutral endpoint contracts for creating
draft orders, changing status, viewing an order and viewing status history.
Breeder access is scoped to the breeder organization on the order. Breeding
station access is scoped to the station assigned through the listing.
Platform-admin access is retained for support and oversight. Future buyer
access remains unavailable in Phase 1.

Every prepared order status change emits a `SEMEN_ORDER_STATUS_CHANGE` audit
hook and a `PROOF_EVENT_REQUEST` hook. Ticket 1.8 persists order creation and
status-change hooks as AuditLog entries. Ticket 1.6 can materialize approved
order milestones from proof hooks through the explicit ProofEvent service.
Automatic proof-event generation from every relevant order action and duplicate
prevention remain owned by Ticket 7.1.

Ticket 3.3 adds Phase 1 order-creation detail fields to `semen_orders`:
`requested_delivery_date`, shipping contact fields, shipping address fields and
optional `special_instructions`. Draft orders may be saved before every detail
is complete. Application validation requires requested delivery date, shipping
contact, primary address, city, postal code and country before a breeder can
move the order to `SUBMITTED`. These fields do not create shipment automation,
logistics-provider integration or unrestricted downstream access.

## Implemented Shipment Tracking Foundation

Ticket 1.4 adds the semen-order shipment and normalized tracking-event model:

`packages/database/legacy-sql/migrations/20260609_0104_shipment_tracking_event.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `shipments` | Shipment records linked to semen orders, with current normalized shipment status and optional provider reference fields. |
| `shipment_tracking_events` | Append-only tracking timeline linked to a shipment and actor/source context. |

Implemented shipment status values:

| Enum | Values |
| --- | --- |
| `coritech_shipment_status` | `PREPARED`, `DISPATCHED`, `IN_TRANSIT`, `DELIVERED`, `DELAYED`, `FAILED`, `CANCELLED` |

Implemented tracking event sources:

| Enum | Values |
| --- | --- |
| `coritech_shipment_tracking_event_source` | `MANUAL`, `LOGISTICS_PROVIDER`, `SYSTEM` |

Shipment creation is application-gated to `CONFIRMED` semen orders and assigned
breeding-station users, with platform-admin support access. Breeder access is
read-only for shipments linked to their own orders. Future buyer access remains
unavailable in Phase 1.

Every prepared shipment creation or status update emits a
`SHIPMENT_TRACKING_EVENT` audit hook and a `PROOF_EVENT_REQUEST` hook. Ticket
1.6 can materialize shipment-created, shipment-updated and
shipment-confirmed proof events from those hooks through the explicit
ProofEvent service. Ticket 1.8 persists shipment creation and shipment status
updates as AuditLog entries, while automated shipment proof generation from
shipment actions remains Ticket 7.2.

The model stores optional `provider_name`, `provider_tracking_id`,
`tracking_url`, `source_event_id` and `provider_status` fields so future
logistics provider updates can be normalized into the same tracking timeline.
Ticket 1.4 does not implement a logistics provider adapter or provider
automation; that remains owned by Ticket 5.2.

## Implemented Document Evidence Foundation

Ticket 1.5 adds document metadata and proof-event evidence attachment records:

`packages/database/legacy-sql/migrations/20260609_0105_document_evidence_attachment.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `documents` | Metadata, file details and object-storage references for evidence documents linked to a semen order, shipment or proof event. |
| `evidence_attachments` | Relation attaching documents to proof events for documentation support. |

Implemented document access classifications:

| Classification | Phase 1 meaning |
| --- | --- |
| `INTERNAL` | Visible to the assigned breeding station and platform admin. |
| `ORDER_PARTICIPANTS` | Visible to breeder, assigned breeding station and platform admin for the linked order context. |
| `RESTRICTED` | Visible to the uploader organization and platform admin. |
| `BUYER_VIEW_ELIGIBLE` | Eligibility marker for later controlled buyer workflows; does not grant buyer access in Phase 1. |
| `ADMIN_ONLY` | Visible to platform admin only. |

Documents store `original_file_name`, `content_type`, `file_size_bytes`,
optional SHA-256 checksum and object-storage reference fields
(`storage_provider`, `storage_bucket`, `storage_object_key`, optional region
and version). Raw file bytes, local filesystem paths and public unrestricted
links are intentionally not part of the model.

The API document helper exposes framework-neutral endpoint contracts for
creating metadata records, viewing documents, listing documents by order or
shipment, and attaching documents to proof events. Uploads and views emit
`DOCUMENT_ACCESS` audit hooks. Evidence attachment creation also emits an audit
hook. Ticket 1.8 persists document upload, document view and evidence-attachment
hooks as AuditLog entries. Object-storage provider integration remains owned by
Ticket 6.1, and automatic proof-event generation from document uploads remains
owned by Ticket 7.3.

## Implemented Proof Event Foundation

Ticket 1.6 adds the durable ProofEvent record. Ticket 1.7 formalizes the
verification-level taxonomy used by those records:

`packages/database/legacy-sql/migrations/20260609_0106_proof_event_v1.sql`

`packages/database/legacy-sql/migrations/20260609_0107_verification_level_taxonomy.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `proof_events` | Append-only workflow proof records linked to order, shipment and optional future horse context with actor, role, organization, lifecycle stage, verification level, signature placeholder and audit-hook reference. |

Implemented proof event values:

| Enum | Values |
| --- | --- |
| `coritech_proof_event_type` | `SEMEN_ORDER_CREATED`, `SUBMITTED`, `CONFIRMED`, `REJECTED`, `SHIPMENT_CREATED`, `SHIPMENT_STATUS_UPDATED`, `SHIPMENT_CONFIRMED`, `DOCUMENT_UPLOADED`, `ORDER_COMPLETED`, `ADMIN_CORRECTION_CREATED` |
| `coritech_proof_event_source` | `ORDER_STATUS_CHANGE`, `SHIPMENT_TRACKING_EVENT`, `DOCUMENT_UPLOAD`, `ADMIN_CORRECTION` |
| `coritech_proof_event_status` | `RECORDED`, `VOIDED` |
| `coritech_verification_level` | Active in Phase 1: `SELF_REPORTED`, `SYSTEM_RECORDED`, `STATION_CONFIRMED`, `ADMIN_REVIEWED`; reserved for future phases: `VET_SIGNED`, `FEDERATION_ATTESTED`, `VERIFIED_FOR_TRANSACTION` |

Proof events require actor user, role, organization, timestamp and a
required `verification_level`. Ticket 1.7 derives the active Phase 1 level from
proof event type and actor role. Future verification levels are present in the
taxonomy for migration stability and UI readiness, but the Phase 1 database
constraint and API validation block assigning them to proof events.

Phase 1 derivation rules:

| Actor role | Event types | Derived level |
| --- | --- | --- |
| `BREEDER` | `SEMEN_ORDER_CREATED`, `SUBMITTED`, `DOCUMENT_UPLOADED` | `SELF_REPORTED` |
| `BREEDER` | Other Phase 1 proof event types | `SYSTEM_RECORDED` |
| `BREEDING_STATION` | `CONFIRMED`, `REJECTED`, `SHIPMENT_CONFIRMED`, `DOCUMENT_UPLOADED` | `STATION_CONFIRMED` |
| `BREEDING_STATION` | Other Phase 1 proof event types | `SYSTEM_RECORDED` |
| `PLATFORM_ADMIN` | Any Phase 1 proof event type | `ADMIN_REVIEWED` |

The ProofEvent API helper materializes proof events only through explicit
service calls from existing workflow proof hooks, including Ticket 1.9
admin-correction amendment hooks. It does not automatically create proof events
on every order, shipment, document or amendment action. Those automation rules
remain in Tickets 7.1, 7.2, 7.3 and later admin workflow tickets.

The table blocks direct deletes with a database trigger. Later corrections must
use approved amendment/admin-correction workflows instead of silently deleting
proof records. Ticket 1.8 adds a nullable foreign key from
`proof_events.audit_log_id` to `audit_logs.id` so explicit proof-event service
calls can retain the originating workflow audit-log link when available. Each
proof event also stores the originating `audit_hook_ref`.

## Implemented Audit Log Foundation

Ticket 1.8 adds the durable AuditLog record:

`packages/database/legacy-sql/migrations/20260609_0108_audit_log_v1.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `audit_logs` | Append-only trust-relevant action records with actor user, role, organization, normalized action, source action, object type/id, before/after JSON values, reason, request IP/user agent when available and timestamps. |

Implemented audit actions:

| Enum | Values |
| --- | --- |
| `coritech_audit_log_action` | `CREATE`, `UPDATE`, `STATUS_CHANGE`, `UPLOAD_DOCUMENT`, `VIEW_DOCUMENT`, `CREATE_PROOF_EVENT`, `CHANGE_PERMISSION`, `ADMIN_EDIT`, `CREATE_AMENDMENT`, `LOGIN`, `LOGOUT` |

The API audit helper materializes existing workflow audit hooks into normalized
AuditLog entries. Critical Phase 1 hooks currently wired to persistence are
order creation/status changes, shipment creation/status changes, document
upload/view, evidence attachment, explicit proof-event creation, role
assignment permission changes and platform-admin listing edits.

Audit logs are queryable by `object_type` and `object_id`. Participant-aware
query helpers allow platform-admin access, or Phase 1 breeder/station access
when the caller supplies authorized object context. Future buyer access remains
unavailable in Phase 1.

Audit logs are append-only from normal application flows. The domain module
exposes no update/delete service, and the migration blocks database updates and
deletes with triggers.

## Implemented Access Permission Foundation

Ticket 2.3 adds the object-level AccessPermission grant model:

`packages/database/legacy-sql/migrations/20260609_0203_access_permission_v1.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `access_permissions` | User, organization or role-scoped object grants with scope, grantor, optional expiry and optional revocation metadata. |

Implemented access permission scopes:

| Scope | Phase 1 meaning |
| --- | --- |
| `VIEW` | Controlled object-level read access. |
| `CREATE` | Controlled object-level create-related access where a later endpoint explicitly checks it. |
| `UPDATE` | Controlled object-level update access where a later endpoint explicitly checks it. |
| `CONFIRM` | Controlled object-level confirmation access where a later endpoint explicitly checks it. |
| `UPLOAD_DOCUMENT` | Controlled document-upload permission for a specific object. |
| `VIEW_DOCUMENT` | Controlled document-view permission for a specific object. |
| `ADMIN_SUPPORT` | Explicit platform-admin support grant for a specific object. |
| `BUYER_VIEW` | Reserved future scope only; blocked by the Phase 1 migration constraint and denied by default in the service. |

The API access helper creates and revokes grants through an audit-aware service.
Grant and revocation hooks materialize as `CHANGE_PERMISSION` AuditLog entries.
Service-layer checks require an exact object type/id and scope match, an active
Phase 1 user/organization/role subject match, an effective time window, and no
revocation. Future role codes such as `BUYER` are not active grant subjects in
Phase 1.

Ticket 2.3 does not add route automation, buyer-view generation, full
marketplace access, public document links or unrestricted buyer access. Later
endpoint tickets must explicitly opt into the AccessPermission check where an
object-level grant is required.

## Implemented Amendment Foundation

Ticket 1.9 adds the controlled Correction/Amendment record:

`packages/database/legacy-sql/migrations/20260609_0109_amendment_v1.sql`

Implemented tables:

| Table | Purpose |
| --- | --- |
| `amendments` | Platform-admin-created correction evidence for selected proof-relevant records, preserving original value, amended value, mandatory reason, status, actor context, optional approver, audit-log link and optional proof-event link. |

Implemented amendment values:

| Enum | Values |
| --- | --- |
| `coritech_amendment_status` | `DRAFT`, `SUBMITTED`, `APPROVED`, `REJECTED` |
| `coritech_amendment_target_type` | `SemenOrder`, `OrderStatusHistory`, `Shipment`, `ShipmentTrackingEvent`, `Document`, `EvidenceAttachment`, `ProofEvent` |

The API amendment helper allows active `PLATFORM_ADMIN` users to create
amendment records for selected proof-relevant targets. The helper stores the
original value and amended value separately, requires a non-blank reason,
creates an `AMENDMENT_CREATED` audit hook that materializes as a
`CREATE_AMENDMENT` AuditLog entry, and can emit an explicit
`ADMIN_CORRECTION` proof hook when the amendment carries order, shipment or
horse context.

Ticket 1.9 does not apply `amended_value` to the target record, expose a normal
target-update path, build admin UI, or automate approval workflows. Later
workflow tickets can decide how approved amendments are presented or applied,
but no trust-critical field is silently overwritten by this model.

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
