# Notification Template Registry

## Purpose

Ticket 18.18 defines notifications as a testable, provider-agnostic product
surface. Templates live in the domain package so later provider and
orchestration tickets can resolve events consistently instead of scattering
email strings through workflow services.

Implementation:

- registry: `packages/domain/src/notifications/notification-template-registry.mjs`
- sender adapter: `packages/domain/src/notifications/email-provider.mjs`
- log model: `notification_logs.template_id`

## Template Matrix

| Event | Template id | Recipient rule | Purpose |
| --- | --- | --- | --- |
| `ORDER_SUBMITTED` | `order.submitted.station` | `ORDER_BREEDING_STATION` | Notify the assigned breeding station that an order needs review. |
| `ORDER_RECEIVED` | `order.received.breeder` | `ORDER_BREEDER` | Notify the breeder that station intake occurred. |
| `ORDER_CONFIRMED` | `order.confirmed.breeder` | `ORDER_BREEDER` | Notify the breeder that the station confirmed the order. |
| `ORDER_REJECTED` | `order.rejected.breeder` | `ORDER_BREEDER` | Notify the breeder that the station rejected the order with its recorded reason. |
| `ORDER_CANCELLED` | `order.cancelled.participant` | `ORDER_BREEDING_STATION` | Notify the counterparty that an authorized cancellation occurred. |
| `SHIPMENT_CREATED` | `shipment.created.breeder` | `ORDER_BREEDER` | Notify the breeder that shipment fulfilment has started. |
| `SHIPMENT_STATUS_UPDATED` | `shipment.updated.breeder` | `ORDER_BREEDER` | Notify the breeder that shipment status changed. |
| `SHIPMENT_DELIVERED` | `shipment.delivered.breeder` | `ORDER_BREEDER` | Notify the breeder that shipment delivery was recorded. |
| `DOCUMENT_UPLOADED` | `document.uploaded.relevant_role` | `DOCUMENT_RELEVANT_ROLE` | Notify only roles permitted to see document metadata. |
| `SUPPORT_REQUEST_CREATED` | `admin.action_required` | `PLATFORM_ADMIN` | Notify Platform Admin users that a support request needs review. |
| `ADMIN_ACTION_REQUIRED` | `admin.action_required` | `PLATFORM_ADMIN` | Generic admin action-required template for later workflows. |

## Rendering Rules

Each template has:

- provider channel, currently `EMAIL`
- subject template
- plain text body template
- typed required variables
- recipient rule
- retry placeholder metadata

Rendering fails before delivery if a required variable is missing or blank. The
registry does not contain hardcoded recipient email addresses. Ticket 9.1 adds
the provider-neutral email sender and attempt logging. Ticket 9.2 adds
recipient resolution and workflow orchestration.

## Security Boundary

Templates do not include public document links. Document notifications tell the
recipient to open CoriTech and rely on controlled document access. Templates
should not include private data for another party except information already
visible to the authorized recipient in the relevant order, shipment, document or
support workflow.

## Retry Placeholder

Each template records that retry scheduling is not implemented by Ticket 18.18,
Ticket 9.1 or Ticket 9.2. `notification_logs` includes `status`,
`attempt_count` and `next_retry_at` so future queue and retry behavior can be
added without changing the template identity or provider contract.
