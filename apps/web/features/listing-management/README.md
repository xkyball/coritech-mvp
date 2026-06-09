# Listing Management Feature

Ticket 4.2 adds the Phase 1 station listing-management route at
`/app/station/listings`.

Implemented behavior:

- Station-scoped create and edit forms for semen listings linked to active
  station-owned stallions.
- Activation/deactivation and availability management for station-owned
  listings.
- Server-side required-field validation, including an audit change reason.
- Mutations routed through the existing catalog domain endpoints so listing
  changes emit the established audit hooks and persisted audit logs.
- Shared demo listing repository used by the breeder catalog so inactive
  listings are hidden from breeder-visible catalog pages.

Scope guard:

- This feature does not add custom auth, unrestricted buyer access, AI,
  blockchain/token logic, full marketplace automation, federation automation,
  sensor/wearable ingestion, station order-processing forms, shipment forms or
  document upload flows.
