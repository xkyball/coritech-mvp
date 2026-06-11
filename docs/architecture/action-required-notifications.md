# Action Required Notifications

## Purpose

Ticket 18.19 gives each active role context an in-product list of work that
requires attention without depending on email delivery.

The implementation uses a derived query pattern rather than a persisted
`ActionRequired` table. The source records are still the durable workflow
records: semen orders, shipments, support requests, amendments and notification
delivery logs.

## Derived Sources

| Context | Derived action sources |
| --- | --- |
| Breeder | Draft orders, confirmed or rejected orders needing review, in-transit or delivered shipments without receipt confirmation |
| Breeding station | Submitted or received orders with available station transitions, confirmed orders needing a shipment, non-terminal shipments needing updates |
| Platform Admin | Open or in-review support requests, submitted amendments, failed notification logs when supplied to the query |

The shared query lives in `apps/web/features/action-required` and is consumed by
the breeder, station and admin dashboards.

## Permission Filtering

Action items are filtered with the existing domain permission helpers before any
item is returned:

- order items use `canViewSemenOrder` and transition checks;
- shipment items use `canViewShipment` and `canManageShipment`;
- admin items require an active `PLATFORM_ADMIN` role.

This keeps the list scoped to the active user, role and organization context and
prevents action items from revealing unauthorized order, shipment or support
records.

## Link Targets

Action items link only to implemented protected surfaces:

- breeder order detail and draft order editing;
- station dashboard order actions and station shipment management;
- admin support, amendment and audit workspaces.

Opening the link still requires the destination route's normal authorization
checks.

## Persistence Boundary

Seen, dismissed and read-state fields are intentionally not implemented because
the ticket is delivered as a derived query. Adding those lifecycle states would
require a persisted model and ownership rules for per-user or per-organization
state.
