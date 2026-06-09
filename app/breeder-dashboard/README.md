# Breeder Dashboard

Ticket 3.1 adds a focused Phase 1 breeder dashboard module.

## Files

- `breeder-dashboard.mjs` prepares a breeder-scoped view model and renders a
  conservative HTML dashboard.
- `breeder-dashboard.d.ts` documents the frontend contract for app-shell
  integration.
- `breeder-dashboard.css` provides the dashboard layout and states.
- `breeder-dashboard.test.mjs` covers role scoping, dashboard links and
  loading, empty and error states.

## Scope

The module expects the app shell or API boundary to provide managed-auth actor
context plus preloaded listing, order, status-history and document records. It
filters the records so a breeder dashboard only displays the selected breeder
organization's orders, status history and documents. Active semen listings are
shown through the Phase 1 catalog visibility rules, and order creation is
exposed only as a controlled link to the future order creation screen.

This module does not implement public buyer access, marketplace automation,
payments, shipment management, document upload, AI, blockchain/token logic,
federation automation or sensor/wearable ingestion.
