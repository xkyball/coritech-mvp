# Data Quality Rules v1

Date defined: 2026-06-10

## Purpose

Ticket 11.2 defines the Phase 1 data-quality baseline for proof-critical
records. The implementation keeps quality checks in the domain layer so admin
reporting can reuse them without adding a second workflow path.

## Rule Registry

The shared rule registry lives in
`packages/domain/src/data-quality/data-quality-rules.mjs`.

It covers:

- `SemenOrder` required fields, submitted-order details and status transitions.
- `Shipment` linked-order, status, actor and timestamp fields.
- `Document` target, storage, classification, lifecycle and uploader fields.
- `ProofEvent` trigger, actor, role, timestamp, verification and audit context.

The rule ids are stable strings intended for reports and audit references:

- `ORDER_REQUIRED_FIELDS`
- `ORDER_SUBMISSION_FIELDS`
- `ORDER_STATUS_TRANSITION`
- `SHIPMENT_REQUIRED_FIELDS`
- `DOCUMENT_REQUIRED_FIELDS`
- `PROOF_EVENT_REQUIRED_FIELDS`

## Failure Logging

Data-quality checks return structured findings with rule id, entity type,
severity, field and message. When a caller needs an evidence trail,
`recordDataQualityFailures` writes an audit log through the existing append-only
audit hook path with source action `DATA_QUALITY_VALIDATION_FAILED`.

The module does not create a new persistence table. Reports can evaluate current
records and log failure batches where an admin or system workflow explicitly
needs that evidence.

## Proof-Event Boundary

Proof events still use the existing proof-event creation validator. A proof
event cannot be prepared without event type, source, trigger, actor, role,
organization, audit hook context and valid timestamp data. Verification level
may be derived by the proof-event module, but persisted proof-event records must
carry an active Phase 1 verification level.

## Boundaries

This ticket does not add AI quality scoring, blockchain notarization, federation
validation, sensor ingestion, unrestricted buyer visibility or automated cleanup.
It also does not silently repair records; corrections remain amendment/audit
workflows.
