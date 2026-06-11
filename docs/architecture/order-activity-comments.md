# Order Activity And Comments

## Purpose

Order activity gives breeders, breeding stations and platform admins lightweight
operational context around a semen order. It is designed for practical
communication and timeline readability, not for replacing proof or audit
records.

## Implemented Model

Ticket 18.12 adds the `order_activities` table and domain helpers under
`packages/domain/src/orders/order-activity.mjs`.

Persisted activity records store:

- the linked `SemenOrder` id and order number
- activity type: `SYSTEM_STATUS`, `USER_COMMENT`, `INTERNAL_NOTE` or
  `SUPPORT_NOTE`
- visibility: `SHARED`, `STATION_INTERNAL` or `ADMIN_INTERNAL`
- message text
- actor user, organization and role context
- creation timestamp

The first UI path supports shared breeder/station comments. System status rows
are derived from `order_status_history` and displayed in the same feed.

## Visibility

Visibility is enforced in the domain service before rows are displayed or
created:

- `SHARED` entries are visible to authorized order participants and platform
  admins.
- `STATION_INTERNAL` entries are visible to the assigned station and platform
  admins.
- `ADMIN_INTERNAL` entries are visible only to platform admins.

Actors must already be authorized to view the order before they can view or add
activity.

## Comment Versus Audit Log

Order activity comments are mutable-business-context records in the sense that
they describe practical conversation around an order. They are not the evidence
ledger.

Authoritative evidence remains split across:

- `order_status_history` for workflow state transitions.
- `proof_events` and evidence attachments for workflow proof.
- `audit_logs` for append-only access, mutation and permission evidence.

Activity comments may be useful during support review, but they do not replace
audit logs, proof events or status history. Proof-critical corrections still
belong in the amendment workflow.

## UI Surfaces

The activity feed appears on:

- breeder order detail at `/app/orders/[orderId]`
- station order management selected-order detail at `/app/station/orders`
- platform-admin order support detail at `/app/admin/orders/[orderId]`

Only breeder and station order detail expose the initial shared comment form.
Admin support displays the feed read-only until the separate support-request and
support-note tickets define their write workflow.

## Boundaries

This ticket does not add AI summarization, blockchain proof, marketplace
automation, unrestricted buyer access, payment processing, external logistics
automation or notification delivery.
