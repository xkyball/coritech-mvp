# CoriTech API

This directory contains API-side contracts introduced by approved Phase 1
tickets.

- `config/` contains the Ticket 0.3 environment contract and validation helper.
- `db/` contains approved database migrations.
- `domain/catalog/` contains the Ticket 1.2 stallion and semen listing model,
  endpoint contracts, validation, ownership checks, search helpers and listing
  audit hook.
- `domain/identity/` contains the Ticket 1.1 user, organization and role model
  helper plus TypeScript declarations.
- `domain/orders/` contains the Ticket 1.3 semen order model, status transition
  rules, order status history preparation, endpoint contracts and audit/proof
  hooks.
- `domain/shipments/` contains the Ticket 1.4 shipment and normalized tracking
  event model, endpoint contracts, validation, station-scoped write checks and
  audit/proof hooks.

No custom authentication, authorization middleware, payment handling, logistics
provider adapter, durable proof-event generation, AI behavior or blockchain
logic is implemented here yet.

Future API code must be introduced by an approved Phase 1 ticket and must keep
configuration, auditability and ownership boundaries explicit.
