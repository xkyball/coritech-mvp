# CoriTech API

This directory contains API-side contracts introduced by approved Phase 1
tickets.

- `config/` contains the Ticket 0.3 environment contract and validation helper.
- `db/` contains approved database migrations.
- `domain/identity/` contains the Ticket 1.1 user, organization and role model
  helper plus TypeScript declarations.

No custom authentication, authorization middleware, order logic, payment
handling, logistics integration, proof-event generation, AI behavior or
blockchain logic is implemented here yet.

Future API code must be introduced by an approved Phase 1 ticket and must keep
configuration, auditability and ownership boundaries explicit.
