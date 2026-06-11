# Payment Reference Model

Date defined: 2026-06-10

## Purpose

Ticket 10.1 adds a payment reference model for Phase 1 orders without making
CoriTech payment infrastructure. CoriTech stores external/manual payment
references and status only; it does not process cards, store card data, store
bank credentials or operate checkout.

## Data Model

`PaymentReference` links to `SemenOrder` through `semenOrderId` and carries:

- provider name
- provider reference id
- status
- amount
- currency
- order number and organization context for support/reporting
- created/updated actor and timestamps

Allowed statuses:

- `NOT_REQUIRED`
- `PENDING`
- `AUTHORIZED`
- `PAID`
- `FAILED`
- `REFUNDED`

Provider identifiers are stored only as references. Raw provider payloads,
card numbers, CVC/CVV, card expiry, bank account numbers and similar sensitive
payment data are rejected by the domain validator.

## Audit Behavior

The domain service emits audit hooks for:

- `PAYMENT_REFERENCE_CREATED`
- `PAYMENT_REFERENCE_STATUS_UPDATED`

These hooks flow through the existing append-only audit log path. Payment status
changes therefore preserve previous and new status/reference values without
claiming settlement proof beyond the external/manual status recorded.

## UI Behavior

Ticket 18.17 exposes the reference-only state on order detail surfaces:

- breeders can view the status/reference for their own order
- assigned breeding stations can create or update a manual reference
- platform admins can create or update a manual reference from order support
- all update forms use only provider/reference, amount/currency, status and an
  audit reason

The UI intentionally has no card number, CVC/CVV, card expiry, bank credential,
checkout or raw provider-payload fields. Form submissions route through the
payment reference service so updates create append-only audit log entries.

Ticket 10.2 adds a provider-neutral adapter boundary around the same service.
The manual/reference adapter can create and update `PaymentReference` records;
the placeholder adapter documents the future provider seam but does not process
payments.

## Boundary

This model does not add real payment processing, checkout, settlement,
reconciliation automation, provider webhooks or payment-provider credentials.
The Ticket 10.2 placeholder keeps that future integration modular without
locking CoriTech to a direct payment processor.
