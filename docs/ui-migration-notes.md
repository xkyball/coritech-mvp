# UI Migration Notes

Date started: 2026-06-10

## Scope

This migration applies to the active Next.js UI in `apps/web`. It preserves the
existing feature view-models, demo repositories, server actions, route structure
and Phase 1 product boundaries.

## Pages Planned For Migration

Real implemented pages:

- `/`
- `/breeder-dashboard`
- `/station-dashboard`
- `/app/catalog`
- `/app/catalog/[listingId]`
- `/app/orders/new`
- `/app/orders/[orderId]`
- `/app/station/listings`

## Pages Intentionally Not Created

The following are referenced by product concepts or existing links but are not
implemented in this migration because creating them would be new product scope:

- `/app/station/orders`
- `/app/documents/[documentId]`
- admin dashboard routes
- audit log routes
- proof-event routes
- user/organization admin routes
- auth/login/logout routes

## Migration Decisions

- Keep plain CSS and semantic variables. Do not add Tailwind or a UI framework.
- Keep `apps/web/components/ui` as the shared component library and extend it.
- Keep feature `.mjs` renderers and feature CSS files for tests/history; do not
  remove them in this task.
- Remove unavailable station order management from normal station sidebar
  navigation until the route exists.
- Treat unavailable document detail routes as metadata-only states rather than
  working document view links.
- Use `ProofEventList` for proof events in real order-detail UI.
- Use shared `Alert`, `Notice` and `DetailList` to reduce local one-off markup.

## Migration Completed

- Added `IconButton`, `Checkbox`, `Toggle`, `Alert`, `Notice`, `DetailList`,
  `VerificationBadge` and `ProofEventList` shared primitives.
- Added semantic token aliases for primary-muted, focus ring, larger radius and
  subtle/raised elevation.
- Centralized breeder and station navigation in `apps/web/features/navigation.ts`.
- Migrated catalog, order creation, listing management and order detail metadata
  to `DetailList`.
- Migrated validation summaries to `Alert`.
- Migrated breeder order proof events from a table to a proof-event timeline.
- Removed the missing station order-management route from station navigation.
- Preserved the dashboard-based station order review links that already route to
  `/station-dashboard?orderId=...`.
- Suppressed broken document detail links in dashboard/detail document tables.
- Updated README UI guardrails.

## Verification Plan

Run after migration:

- web feature tests
- root test suite
- TypeScript check for `apps/web`
- production build
- route inspection with the in-app browser if the local dev server can bind

## Known Risks

- The app currently uses demo data, not real session data.
- Missing document and station-order pages limit end-to-end action completion.
- Historical `.mjs` renderers may not visually match React components after the
  shared component migration; they remain behavior-test support.
