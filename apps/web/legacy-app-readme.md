# CoriTech App

This directory contains Phase 1 frontend modules introduced by approved tickets.

## Implemented Modules

- `breeder-dashboard/` - Ticket 3.1 breeder dashboard view model, HTML renderer
  and styles for a breeder organization's catalog, order, document and
  action-required overview.
- `breeder-order-detail/` - Ticket 3.4 breeder-owned order detail view model,
  renderer, React component and styles for order summary, current status,
  status history, shipment information, permissioned documents and simple proof
  event display.

## Guardrails

Frontend code in this directory must continue to use managed auth context and
role-based server contracts from `packages/domain/src/`. It must not add custom
authentication, public document links, AI claims, blockchain/token logic, full
marketplace automation, federation automation, sensor ingestion or unrestricted
buyer access unless a later approved ticket explicitly changes the scope.
