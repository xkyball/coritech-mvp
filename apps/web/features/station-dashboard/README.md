# Station Dashboard

Ticket 4.1 adds the Phase 1 breeding station dashboard at `/station-dashboard`.

The feature is intentionally a station-scoped operational view. It shows active
listings owned by the station, assigned incoming orders, order actions that are
allowed by the existing status-transition rules, shipment update entry points,
station-visible documents and notifications.

The dashboard reuses existing domain guards for visibility and action readiness:

- `canViewSemenListing`
- `canViewSemenOrder`
- `canTransitionSemenOrderStatus`
- `canManageShipment`
- `canUploadDocument`
- `canViewDocument`

Station order-processing forms, shipment forms and document upload flows remain
in their own Phase 1 tickets. Listing management is handled separately at
`/app/station/listings`.
