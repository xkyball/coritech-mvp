# Semen Order Creation Feature

Phase 1 breeder flow for creating semen orders from active, orderable listings.

Implemented behavior:

- Listing selection and stallion/station review.
- Draft creation and draft update through the domain `OrderService`.
- Submit flow that creates or updates a draft, validates delivery/shipping
  details and transitions it to `SUBMITTED`.
- Existing draft editing through `/app/orders/new?draftOrderId=...`.
- Draft cancellation through the existing audited `CANCELLED` status transition.
- Confirmation state with the generated order number.
- Shared demo repository used by the breeder dashboard.

Scope guard:

- This feature emits the existing backend audit/proof hooks but does not
  materialize automatic proof events, shipments, logistics-provider actions,
  payment processing, marketplace automation or unrestricted buyer access.
