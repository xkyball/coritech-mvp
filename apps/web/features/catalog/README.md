# Semen Catalog UI

Ticket 3.2 adds the breeder-facing semen catalog module.

## Files

- `semen-catalog.mjs` prepares list and detail view models, applies the active
  listing guard, and renders conservative HTML for tests.
- `view-model.ts` exposes the catalog helpers to the Next.js app.
- `SemenCatalog.tsx` renders list, detail, loading, empty and error states.
- `semen-catalog.d.ts` documents the frontend contract for app integration.
- `semen-catalog.css` provides the catalog layout.
- `semen-catalog.test.mjs` covers active-only visibility, search/filter
  behavior, detail links, order CTA gating and non-breeder access.
- `apps/web/app/app/catalog/page.tsx` and
  `apps/web/app/app/catalog/[listingId]/page.tsx` render the current
  demo-backed catalog routes until API/server-action integration is introduced
  by a later approved ticket.

## Scope

The module expects the app shell or API boundary to provide managed-auth actor
context, preloaded semen listing records and optional station display names. It
uses the shared domain catalog rules so breeders only see active listings and
unavailable listings cannot expose order creation.

This module does not implement the order creation workflow, public buyer access,
marketplace automation, payments, shipment management, document upload, AI,
blockchain/token logic, federation automation or sensor/wearable ingestion.
