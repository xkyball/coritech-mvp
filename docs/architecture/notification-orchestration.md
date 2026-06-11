# Notification Orchestration

## Purpose

Ticket 9.2 triggers Phase 1 email notifications from workflow events while
keeping recipient rules, template rendering and delivery logging testable in
domain code.

Implementation:

- orchestration service: `packages/domain/src/notifications/notification-orchestration.mjs`
- provider send service: `packages/domain/src/notifications/email-provider.mjs`
- recipient resolver adapter: `apps/web/features/notifications/prisma-notification-recipient-resolver.ts`
- delivery log adapter: `apps/web/features/notifications/prisma-notification-log-repository.ts`

## Event Rules

| Event | Recipient rule |
| --- | --- |
| `ORDER_SUBMITTED` | Active `BREEDING_STATION` users in the assigned station organization |
| `ORDER_CONFIRMED` | Active `BREEDER` users in the owning breeder organization |
| `ORDER_REJECTED` | Active `BREEDER` users in the owning breeder organization |
| `SHIPMENT_CREATED` | Active `BREEDER` users in the owning breeder organization |
| `SHIPMENT_STATUS_UPDATED` | Active `BREEDER` users in the owning breeder organization |
| `SHIPMENT_DELIVERED` | Active `BREEDER` users in the owning breeder organization |
| `DOCUMENT_UPLOADED` | Active roles allowed by the document access classification, excluding the uploading user where possible |

Document notifications follow the same Phase 1 visibility boundary as document
access:

- `ORDER_PARTICIPANTS` and `BUYER_VIEW_ELIGIBLE`: breeder and station
  participants only; no buyer notification is enabled in Phase 1.
- `INTERNAL`: assigned breeding station users.
- `RESTRICTED`: uploader organization plus Platform Admin.
- `ADMIN_ONLY`: Platform Admin.

## Delivery Logging

Each recipient send attempt writes one `notification_logs` row with event type,
template id, recipient rule/context, status, attempt count, provider message id
when supplied and failure error text when delivery fails.

The orchestrator does not retry failed messages. Retry scheduling remains a
future queue responsibility and is still represented by `next_retry_at` and
`RETRY_PENDING` fields.

## App Wiring

The web app now passes the notification service into:

- breeder order submit flow;
- station receive/confirm/reject order actions;
- station shipment create/update actions;
- document upload API after the document record is created.

These paths use the existing workflow services and do not add parallel status,
proof, audit or document-access logic.

## Boundaries

Notifications contain no public document links. Users must open CoriTech and
pass the normal role/permission checks to inspect the referenced object.
Production delivery still requires CoriTech-controlled provider credentials and
sender account evidence.
