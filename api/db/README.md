# CoriTech API Database

This directory contains database-facing assets introduced by approved Phase 1
tickets.

## Migrations

| Migration | Ticket | Purpose |
| --- | --- | --- |
| `migrations/20260609_0101_user_organization_role_model.sql` | 1.1 | Creates the `users`, `organizations`, `roles` and `user_organization_roles` foundation. |
| `migrations/20260609_0102_stallion_semen_listing_model.sql` | 1.2 | Creates station-owned `stallions` and `semen_listings` catalog tables with status enums and search indexes. |
| `migrations/20260609_0103_semen_order_status_history.sql` | 1.3 | Creates `semen_orders`, status history, order-number generation and finite order-status constraints. |
| `migrations/20260609_0104_shipment_tracking_event.sql` | 1.4 | Creates `shipments` and append-only shipment tracking events linked to confirmed semen orders. |
| `migrations/20260609_0105_document_evidence_attachment.sql` | 1.5 | Creates document metadata, object-storage reference fields, mandatory access classification and proof-event evidence attachments. |
| `migrations/20260609_0106_proof_event_v1.sql` | 1.6 | Creates append-only `proof_events`, proof-event enums, proof-event document/evidence foreign keys and delete protection. |
| `migrations/20260609_0107_verification_level_taxonomy.sql` | 1.7 | Creates the verification-level enum, converts proof events from the placeholder value and blocks future reserved levels from Phase 1 assignment. |
| `migrations/20260609_0108_audit_log_v1.sql` | 1.8 | Creates append-only `audit_logs`, normalized audit actions, object-query indexes, proof-event audit-log foreign key and update/delete protection. |
| `migrations/20260609_0109_amendment_v1.sql` | 1.9 | Creates admin-only `amendments` for selected proof-relevant records, preserving original/amended values, reason, status, audit-log link and optional proof-event link. |
| `migrations/20260609_0201_managed_auth_provider.sql` | 2.1 | Updates database comments for provider-managed authentication and internal user identity mapping. |
| `migrations/20260609_0203_access_permission_v1.sql` | 2.3 | Creates object-level `access_permissions`, active permission scopes, reserved inactive `BUYER_VIEW` scope and grant/revocation indexes. |

The Ticket 1.1 migration is PostgreSQL-oriented and uses CoriTech-owned records
linked to managed authentication identities. It does not add custom
authentication, RBAC middleware or admin screens.

Ticket 2.1 updates the database comments only. It does not add password fields
or provider-specific credential storage.

Role assignment writes must call the identity role-model helper so the
`ROLE_ASSIGNMENT` audit hook can be forwarded to the Ticket 1.8 AuditLog service
as a `CHANGE_PERMISSION` entry.

## Catalog Notes

Ticket 1.2 adds the semen catalog foundation only. Listing writes must call the
catalog helper so the `SEMEN_LISTING_CHANGE` audit hook can be forwarded to the
Ticket 1.8 AuditLog service.

`semen_listings.listing_status = 'INACTIVE'` records must not be orderable.
Order creation remains owned by a later ticket and must call the catalog
orderability helper before accepting an order.

## Document Evidence Notes

Ticket 1.5 stores document metadata and object-storage references only. The
`documents` table intentionally has no raw file payload or local filesystem path
column. Uploads and controlled viewing must call the document evidence helper so
`DOCUMENT_UPLOADED`, `DOCUMENT_VIEWED` and `EVIDENCE_ATTACHMENT_CREATED` audit
hooks can be forwarded to the Ticket 1.8 AuditLog service.

Ticket 1.6 adds the durable `proof_events` table and foreign keys from
`documents.proof_event_id` and `evidence_attachments.proof_event_id`.

Ticket 1.7 formalizes `coritech_verification_level` with active Phase 1 levels
`SELF_REPORTED`, `SYSTEM_RECORDED`, `STATION_CONFIRMED` and
`ADMIN_REVIEWED`. `VET_SIGNED`, `FEDERATION_ATTESTED` and
`VERIFIED_FOR_TRANSACTION` are reserved enum values only; the
`proof_events` table constraint blocks assigning them in Phase 1.

## Audit Log Notes

Ticket 1.8 stores normalized audit actions in `audit_logs` and keeps the
domain-specific workflow action in `source_action` and metadata. The table is
queryable by `(object_type, object_id)` and records actor user, actor role,
actor organization, previous/new JSON values, reason, IP address and user agent
when the application edge provides them.

`audit_logs` is append-only. The migration adds triggers that block updates and
deletes; normal application flows must create later corrective evidence instead
of editing prior audit rows.

## Access Permission Notes

Ticket 2.3 stores object-level `access_permissions` grants with optional user,
organization or active Phase 1 role subjects, exact object type/id, scope,
platform-admin grantor, optional expiry and revocation metadata. The service
helper must be used for grant/revoke operations so `ACCESS_PERMISSION_GRANTED`
and `ACCESS_PERMISSION_REVOKED` hooks become `CHANGE_PERMISSION` audit entries.

`BUYER_VIEW` is reserved in the scope enum for migration stability, but the
Phase 1 migration constraint and service validation prevent granting it. Service
checks also deny prepared future scopes by default.

## Amendment Notes

Ticket 1.9 stores controlled correction records in `amendments`. Each row
captures the selected target type and ID, optional target field, original value,
amended value, mandatory reason, platform-admin actor, status, optional
platform-admin approver, audit-log link and optional proof-event link.

The amendment table does not update the target record. Application flows must
create amendment evidence and audit entries instead of silently overwriting
proof-critical fields. The later admin workflow ticket may decide how approved
amendments are presented or applied, but that automation is not part of Ticket
1.9.
