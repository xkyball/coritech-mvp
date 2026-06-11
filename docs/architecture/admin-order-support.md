# Admin Order Support

## Purpose

The admin order support workspace gives Platform Admin users a controlled,
read-only way to inspect operational order context during support and due
diligence review.

## Implemented Routes

| Route | Purpose |
| --- | --- |
| `/app/admin/orders` | Search orders by order number, organization identifier/name and status. |
| `/app/admin/orders/[orderId]` | Inspect one order with status history, proof timeline, linked documents, shipment context, activity comments and an audit excerpt. |

Both routes require the validated active `PLATFORM_ADMIN` context from the web
runtime. Non-admin contexts are rejected before order data is loaded.

## No Silent Overwrite Rule

The support detail page does not expose direct edits for proof-critical order,
document, shipment, proof or audit fields. If an admin needs to correct a
record, the page links to the amendment start path with the selected
`SemenOrder` target context. The amendment workflow remains responsible for
capturing original value, amended value, mandatory reason, audit log and proof
evidence.

## Audit Behavior

Opening an admin order detail page records an `ACCESS_DECISION` audit log for
the concrete `SemenOrder` target when audit persistence is available. The audit
excerpt shown on the order page is read-only and links to the broader admin
audit query.

## Support Queue

Ticket 18.32 adds `/app/admin/support` for the lightweight support request
queue. Requests link back to the admin order support detail route so admins can
review order, proof, document, shipment, activity and audit context without
silent data changes.

## Intentional Boundaries

- Payment context is limited to the Ticket 18.17 reference-only panel. It does
  not add payment processing, checkout or sensitive payment data fields.
- Activity comments are read-only in the support detail after Ticket 18.12.
- Support requests are handled by `/app/admin/support`; support-note writes
  beyond request creation remain owned by later support workflow hardening.
- The order support route does not implement the full amendment creation UI;
  it only passes target context to that workflow.
- No AI, blockchain, federation automation, marketplace expansion or
  unrestricted buyer access is introduced by this workspace.
