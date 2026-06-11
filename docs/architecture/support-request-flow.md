# Support Request Flow

## Purpose

Support requests give breeders and breeding stations an in-product way to ask
for help from an authorized order context. Requests are linked to the order and
queued for Platform Admin review.

## User Flow

Breeder and station users can submit support requests from their authorized
order detail surfaces:

- breeder order detail at `/app/orders/[orderId]`
- station order management selected-order detail at `/app/station/orders`

The request form captures:

- order context
- category
- message
- requester user, organization and active role

After submission the user is redirected back to the same order view with a
confirmation that the request is queued.

## Categories

Ticket 18.32 implements the following categories:

| Category | Use |
| --- | --- |
| `ORDER_STATUS` | Help with order state, next step or unclear workflow status. |
| `DOCUMENT_ACCESS` | Help opening or understanding controlled order documents. |
| `SHIPMENT` | Help with shipment, tracking or fulfilment context. |
| `PAYMENT_REFERENCE` | Placeholder category for later payment-reference workflows. |
| `ACCOUNT_ACCESS` | Help with user, role or organization access issues. |
| `OTHER` | A support issue that does not fit the more specific categories. |

## Admin Queue

Platform Admin users review requests at `/app/admin/support`.

The queue is admin-only and supports lightweight filtering by status and
category. Rows link back to the related admin order-support detail so admins
can inspect the order context without silently editing proof-critical records.

## Notification Boundary

Request creation marks admin notification as `QUEUED` and emits a
`SUPPORT_REQUEST_CREATED` admin-queue hook. No email, SMS or external provider
delivery is implemented in this ticket. Provider delivery belongs to the later
notification tickets.

## Security

Support request creation uses the same order-view permission boundary as order
detail. A user can only create a request for an order they are already allowed
to view. The admin support queue is restricted to active `PLATFORM_ADMIN`
context.

Support messages may include sensitive operational details, so normal users do
not receive a general request list in Phase 1.1.

## Boundaries

This ticket does not implement AI triage, blockchain proof, unrestricted buyer
access, payment processing, external logistics automation or production
notification provider delivery.
