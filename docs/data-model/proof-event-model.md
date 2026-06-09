# Proof Event Model

## Purpose

Proof events are the Phase 1 bridge between operational workflow and the future
CoriTech proof chain.

Core logic:

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

## Starter Fields

| Field | Purpose | Status |
| --- | --- | --- |
| `id` | Unique proof event identifier | `[PENDING_DATA_MODEL]` |
| `trigger_type` | Workflow action that created the proof event | `[PENDING_TICKET_01_06]` |
| `trigger_ref` | Linked order, shipment, document or amendment record | `[PENDING_TICKET_01_06]` |
| `documentation_refs` | Evidence documents supporting the event | Implemented as Ticket 1.5 `evidence_attachments`; durable proof event table remains `[PENDING_TICKET_01_06]` |
| `actor_ref` | User or organization responsible for the trigger | `[PENDING_TICKET_01_01]` |
| `signature_ref` | Confirmation, attestation or managed identity evidence | `[PENDING_ARCHITECTURE_DECISION]` |
| `verification_level` | Simple reviewable proof level | `[PENDING_TICKET_01_07]` |
| `audit_log_ref` | Audit entry for creation or amendment | `[PENDING_TICKET_01_08]` |
| `created_at` | Event creation timestamp | `[PENDING_DATA_MODEL]` |

## Phase 1 Event Sources

| Source | Example proof event |
| --- | --- |
| Order action | Breeder placed order or station confirmed order |
| Shipment action | Shipment created, dispatched or delivered |
| Document upload | Required evidence document attached to order or shipment |
| Admin amendment | Corrected record with reason and approver |

## Documentation Attachment Foundation

Ticket 1.5 introduces `documents` and `evidence_attachments` so a proof event
can be supported by one or more evidence documents once Ticket 1.6 adds durable
proof-event persistence. A document upload does not automatically create a proof
event or assign a high verification level in Ticket 1.5.

## Verification Level Placeholder

Final labels are owned by later Phase 1 tickets. The starter intent is:

| Level | Meaning |
| --- | --- |
| `[LEVEL_0_PLACEHOLDER]` | Recorded workflow event without supporting document |
| `[LEVEL_1_PLACEHOLDER]` | Event linked to supporting documentation |
| `[LEVEL_2_PLACEHOLDER]` | Event linked to documentation and actor confirmation |
| `[LEVEL_3_PLACEHOLDER]` | Event reviewed or verified under approved CoriTech rules |

## Delayed Technology Note

Phase 1 proof is workflow-generated. It does not rely on AI, blockchain/token
logic, full data-space automation, full federation automation or
sensor/wearable ingestion.
