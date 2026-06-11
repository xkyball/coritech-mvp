# Table Search Pagination Standard

Date defined: 2026-06-10

## Purpose

Ticket 18.34 defines the Phase 1.1 convention for list views that expose
search, filters, sorting and pagination. The goal is a consistent user
experience without introducing a second authorization or data-access pattern.

## Shared Contract

List routes should use these query parameters where applicable:

- `query` - free-text search.
- `page` - one-based page number.
- `pageSize` - bounded page size.
- `sort` - whitelisted sort field.
- `direction` - `asc` or `desc`.
- Domain filters - explicit allow-listed names such as `status`.

The shared normalization and pagination helper lives in
`apps/web/features/table-list/table-list.mjs`. Feature modules should wrap that
helper with feature-specific allowed filters, allowed sorts, defaults and route
builders.

## UI Pattern

Shared UI components live in `apps/web/components/ui/index.tsx`:

- `SearchField` for labeled text search.
- `PaginationControls` for previous/next/first navigation.
- `Table` for semantic tabular data.
- `EmptyState`, `LoadingState` and `ErrorState` for list states.

List views should keep search and filters in a GET form so the URL is
shareable. Sort controls should submit only whitelisted fields and directions.
Pagination links must preserve the current normalized search, sort and filter
state.

## Authorization Boundary

Search, sort and pagination do not widen access. Feature view models must apply
existing role and object permissions before returning rows or counts. Empty
states should avoid revealing whether unauthorized records exist outside the
actor's permitted scope.

## First Adopter

The Platform Admin order support list at `/app/admin/orders` uses the shared
helper and UI pattern. It preserves the existing Platform Admin gate, order
support scope and read-only correction boundary while adding whitelisted sort
links and reusable pagination controls.

## Boundaries

This standard does not add global full-text search, saved filters, cursor-based
pagination, user preferences or cross-tenant list access. Those remain future
product decisions.
