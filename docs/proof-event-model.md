# Proof Event Model

## Core Logic

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

Proof events connect operational workflow facts to reviewable evidence. They
are not blockchain events, token events, AI outputs or federation automation.

## Phase 1 Sources

| Source | Supported event types |
| --- | --- |
| `ORDER_STATUS_CHANGE` | `SEMEN_ORDER_CREATED`, `SUBMITTED`, `CONFIRMED`, `REJECTED`, `ORDER_COMPLETED` |
| `SHIPMENT_TRACKING_EVENT` | `SHIPMENT_CREATED`, `SHIPMENT_STATUS_UPDATED`, `SHIPMENT_CONFIRMED` |
| `DOCUMENT_UPLOAD` | `DOCUMENT_UPLOADED` |
| `ADMIN_CORRECTION` | `ADMIN_CORRECTION_CREATED` |

## Verification Levels

Active in Phase 1:

- Self-reported
- System-recorded
- Station-confirmed
- Admin-reviewed

Reserved for later phases:

- Vet-signed
- Federation-attested
- Verified for transaction

The seeded `verification_levels` catalog supports review and UI work, while the
`proof_events.verification_level` enum and database constraint keep future
levels inactive for Phase 1 proof events.

## Evidence Attachments

Documents store metadata and object-storage references only. Evidence
attachments link document metadata to proof events. Raw file storage, public
document links and object-storage provider integration are intentionally outside
this foundation task.

## Amendment Policy

Proof-critical corrections are represented as amendments and later proof/audit
evidence. Existing proof or audit rows should not be silently overwritten.
