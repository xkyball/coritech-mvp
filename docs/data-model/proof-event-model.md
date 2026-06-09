# Proof Event Model

## Purpose

Proof events are the Phase 1 bridge between operational workflow and the future
CoriTech proof chain.

Core logic:

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

## Implemented Fields

| Field | Purpose | Status |
| --- | --- | --- |
| `id` | Unique proof event identifier | Implemented by Ticket 1.6 |
| `event_type` | Ticket 1.6 proof event type enum | Implemented by Ticket 1.6 |
| `source` | Workflow source that requested proof creation | Implemented by Ticket 1.6 |
| `trigger_type` | Workflow action that created the proof event request | Implemented by Ticket 1.6 |
| `trigger_ref` | JSON reference to the originating order, shipment, document or correction context | Implemented by Ticket 1.6 |
| `semen_order_id` | Optional order link | Implemented by Ticket 1.6 |
| `shipment_id` | Optional shipment link | Implemented by Ticket 1.6 |
| `horse_id` | Optional future horse/passport link | Prepared by Ticket 1.6 without federation or studbook automation |
| `documentation_refs` | Evidence document references supporting the event | Implemented by Ticket 1.6 as JSON references; Ticket 1.5 `evidence_attachments` stores durable document attachment rows |
| `actor_user_id` | User responsible for the trigger | Implemented by Ticket 1.6 |
| `actor_role_code` | Role context for the trigger | Implemented by Ticket 1.6 |
| `actor_organization_id` | Organization context for the trigger | Implemented by Ticket 1.6 |
| `lifecycle_stage` | Reviewable lifecycle stage derived from the event type | Implemented by Ticket 1.6 |
| `signature_ref` | Managed-auth signature or future attestation reference | Placeholder implemented by Ticket 1.6 |
| `attestation_refs` | Future attestation slots | Placeholder implemented by Ticket 1.6 |
| `verification_level` | Required trust-strength level derived from event type and actor role | Implemented by Ticket 1.7 |
| `audit_log_id` | Durable audit-log link | Implemented by Ticket 1.8 |
| `audit_hook_ref` | Originating workflow audit hook reference | Implemented by Ticket 1.6 |
| `status` | Proof event lifecycle status | Implemented by Ticket 1.6 as `RECORDED` or `VOIDED` |
| `occurred_at` | Workflow event timestamp | Implemented by Ticket 1.6 |
| `created_at` | Proof event creation timestamp | Implemented by Ticket 1.6 |
| `updated_at` | Proof event update timestamp | Implemented by Ticket 1.6 |

Migration:

`api/db/migrations/20260609_0106_proof_event_v1.sql`

`api/db/migrations/20260609_0107_verification_level_taxonomy.sql`

## Phase 1 Event Sources

| Source | Ticket 1.6 event types |
| --- | --- |
| `ORDER_STATUS_CHANGE` | `SEMEN_ORDER_CREATED`, `SUBMITTED`, `CONFIRMED`, `REJECTED`, `ORDER_COMPLETED` |
| `SHIPMENT_TRACKING_EVENT` | `SHIPMENT_CREATED`, `SHIPMENT_STATUS_UPDATED`, `SHIPMENT_CONFIRMED` |
| `DOCUMENT_UPLOAD` | `DOCUMENT_UPLOADED` |
| `ADMIN_CORRECTION` | `ADMIN_CORRECTION_CREATED` |

## Documentation Attachment Foundation

Ticket 1.5 introduces `documents` and `evidence_attachments` so a proof event
can be supported by one or more evidence documents. Ticket 1.6 adds the durable
`proof_events` target and foreign keys for proof-linked documents and evidence
attachments.

A document upload does not automatically create a proof event or assign a high
verification level in Tickets 1.5 or 1.6. Automatic proof events from document
uploads remain Ticket 7.3.

## Verification Level Taxonomy

Ticket 1.7 replaces the Ticket 1.6 placeholder with a formal
`coritech_verification_level` enum and API taxonomy metadata. Every prepared
proof event receives a required verification level derived from proof event type
and actor role. If a caller supplies a level explicitly, it must match the
derived level.

Active Phase 1 levels:

| Level | Meaning | Badge label |
| --- | --- |
| `SELF_REPORTED` | Participant-entered workflow fact that has not been station-confirmed or admin-reviewed | Self reported |
| `SYSTEM_RECORDED` | Workflow event captured by the application from an allowed order, shipment or document action | System recorded |
| `STATION_CONFIRMED` | Workflow fact confirmed by the breeding station in its assigned operational role | Station confirmed |
| `ADMIN_REVIEWED` | Platform-admin review or correction recorded through approved support workflows | Admin reviewed |

Reserved future levels:

| Level | Phase 1 status |
| --- | --- |
| `VET_SIGNED` | Reserved only; not assignable in Phase 1 |
| `FEDERATION_ATTESTED` | Reserved only; not assignable in Phase 1 |
| `VERIFIED_FOR_TRANSACTION` | Reserved only; not assignable in Phase 1 |

Phase 1 derivation rules:

| Actor role | Event types | Derived level |
| --- | --- | --- |
| `BREEDER` | `SEMEN_ORDER_CREATED`, `SUBMITTED`, `DOCUMENT_UPLOADED` | `SELF_REPORTED` |
| `BREEDER` | Other Phase 1 proof event types | `SYSTEM_RECORDED` |
| `BREEDING_STATION` | `CONFIRMED`, `REJECTED`, `SHIPMENT_CONFIRMED`, `DOCUMENT_UPLOADED` | `STATION_CONFIRMED` |
| `BREEDING_STATION` | Other Phase 1 proof event types | `SYSTEM_RECORDED` |
| `PLATFORM_ADMIN` | Any Phase 1 proof event type | `ADMIN_REVIEWED` |

## Deletion And Amendment Policy

Proof events are append-only in Ticket 1.6. The database migration adds a
delete-blocking trigger for `proof_events`, and the API helper exposes no normal
delete path. Later corrections should be represented through approved
amendment/admin-correction workflows rather than silent deletion.

Ticket 1.9 adds the Amendment model and an explicit admin-correction proof
hook. When an amendment carries order, shipment or horse context, the existing
ProofEvent service can materialize that hook as an
`ADMIN_CORRECTION_CREATED` proof event with `ADMIN_REVIEWED` verification. This
is an explicit service call, not automatic amendment-to-proof generation.

## Automation Boundary

Ticket 1.6 provides the ProofEvent model and an explicit hook-to-proof service.
Ticket 1.9 extends that explicit path for admin-correction amendment hooks. The
service does not automatically create proof events on every order, shipment,
document or amendment action, prevent duplicates across those workflows, or run
full admin amendment workflow automation. Those concerns remain in Tickets 7.1,
7.2, 7.3, 8.3 and adjacent workflow tickets.

## Delayed Technology Note

Phase 1 proof is workflow-generated. It does not rely on AI, blockchain/token
logic, full data-space automation, full federation automation or
sensor/wearable ingestion.
