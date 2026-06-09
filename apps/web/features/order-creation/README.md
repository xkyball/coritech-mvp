# Semen Order Creation Feature

Phase 1 breeder flow for creating semen orders from active, orderable listings.

Implemented behavior:

- Listing selection and stallion/station review.
- Draft creation through the domain order endpoint.
- Submit flow that creates a draft, validates delivery/shipping details and transitions it to `SUBMITTED`.
- Confirmation state with the generated order number.
- Shared demo repository used by the breeder dashboard.

Scope guard:

- This feature emits the existing backend audit/proof hooks but does not
  materialize automatic proof events, shipments, logistics-provider actions,
  payment processing, marketplace automation or unrestricted buyer access.
