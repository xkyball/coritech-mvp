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

The Ticket 1.1 migration is PostgreSQL-oriented and uses CoriTech-owned records
linked to managed authentication identities. It does not add custom
authentication, RBAC middleware, admin screens or the full audit-log table.

Role assignment writes must call the identity role-model helper so the
`ROLE_ASSIGNMENT` audit hook can be forwarded to the AuditLog implementation
introduced by Ticket 1.8.

## Catalog Notes

Ticket 1.2 adds the semen catalog foundation only. Listing writes must call the
catalog helper so the `SEMEN_LISTING_CHANGE` audit hook can be forwarded to the
future AuditLog table introduced by Ticket 1.8.

`semen_listings.listing_status = 'INACTIVE'` records must not be orderable.
Order creation remains owned by a later ticket and must call the catalog
orderability helper before accepting an order.

## Document Evidence Notes

Ticket 1.5 stores document metadata and object-storage references only. The
`documents` table intentionally has no raw file payload or local filesystem path
column. Uploads and controlled viewing must call the document evidence helper so
`DOCUMENT_UPLOADED`, `DOCUMENT_VIEWED` and `EVIDENCE_ATTACHMENT_CREATED` audit
hooks can be forwarded to the future AuditLog table introduced by Ticket 1.8.

Ticket 1.6 adds the durable `proof_events` table and foreign keys from
`documents.proof_event_id` and `evidence_attachments.proof_event_id`.

Ticket 1.7 formalizes `coritech_verification_level` with active Phase 1 levels
`SELF_REPORTED`, `SYSTEM_RECORDED`, `STATION_CONFIRMED` and
`ADMIN_REVIEWED`. `VET_SIGNED`, `FEDERATION_ATTESTED` and
`VERIFIED_FOR_TRANSACTION` are reserved enum values only; the
`proof_events` table constraint blocks assigning them in Phase 1.
