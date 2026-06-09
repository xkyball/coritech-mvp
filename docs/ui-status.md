# CoriTech UI Status

Date inspected: 2026-06-09

## Current UI Exists Now

The active frontend is a Next.js App Router app under `apps/web/app`.
It renders the real Phase 1 MVP UI from feature modules in
`apps/web/features`.

Current routes found:

- `/`
- `/breeder-dashboard`
- `/station-dashboard`
- `/app/catalog`
- `/app/catalog/[listingId]`
- `/app/orders/new`
- `/app/orders/[orderId]`

Routes requested for inspection but not currently implemented:

- `/login`
- `/logout`
- `/dashboard`
- `/dashboard/breeder`
- `/dashboard/station`
- `/dashboard/admin`
- `/unauthorized`

No auth UI pages or dashboard role routes were found in the active app. Managed
auth provider logic exists in the domain package, but there is no fake login
flow in the UI.

## Pages And Components Found

Active app files:

- `apps/web/app/layout.tsx` - root layout and global CSS imports.
- `apps/web/app/page.tsx` - root MVP status/overview page.
- `apps/web/app/breeder-dashboard/page.tsx` - breeder dashboard page.
- `apps/web/app/breeder-dashboard/loading.tsx` - breeder dashboard loading UI.
- `apps/web/app/station-dashboard/page.tsx` - breeding station dashboard page.
- `apps/web/app/station-dashboard/loading.tsx` - breeding station dashboard loading UI.
- `apps/web/app/app/catalog/page.tsx` - semen catalog list page.
- `apps/web/app/app/catalog/loading.tsx` - catalog loading UI.
- `apps/web/app/app/catalog/[listingId]/page.tsx` - listing detail page.
- `apps/web/app/app/catalog/[listingId]/loading.tsx` - listing detail loading UI.
- `apps/web/app/app/orders/new/page.tsx` - semen order creation page.
- `apps/web/app/app/orders/new/loading.tsx` - order creation loading UI.
- `apps/web/app/app/orders/[orderId]/page.tsx` - breeder order detail page.
- `apps/web/app/app/orders/[orderId]/loading.tsx` - order detail loading UI.

Active feature components:

- `apps/web/features/breeder-dashboard/BreederDashboard.tsx`
- `apps/web/features/station-dashboard/StationDashboard.tsx`
- `apps/web/features/catalog/SemenCatalog.tsx`
- `apps/web/features/order-creation/SemenOrderCreation.tsx`
- `apps/web/features/breeder-order-detail/BreederOrderDetail.tsx`

Feature view-model and demo-state modules are already separated from the React
renderers and should be preserved.

## Styling System Exists Now

The app currently uses plain CSS:

- `apps/web/app/globals.css`
- `apps/web/features/breeder-dashboard/breeder-dashboard.css`
- `apps/web/features/catalog/semen-catalog.css`
- `apps/web/features/order-creation/semen-order-creation.css`
- `apps/web/features/breeder-order-detail/breeder-order-detail.css`

There is no Tailwind CSS config, no PostCSS/Tailwind dependency, and no large UI
library. `apps/web/components` only contains `.gitkeep`, so there is no current
shared component system.

Existing global variables include ink, muted, line, paper, panel, teal, green,
gold and rose. Feature CSS files repeat their own similar color, spacing,
button, card, table and form rules.

## Inconsistencies

- Feature modules duplicate page shells, headers, cards, tables, links, buttons,
  forms, loading states and error states.
- Colors are close but not consistently named or applied as semantic tokens.
- Some status text is rendered as plain text instead of consistent status
  badges.
- Buttons and links use different class names per feature.
- Mobile table behavior is repeated in multiple CSS files.
- Root page visual language is separate from the app feature pages.
- There is no reusable dashboard shell, sidebar, top bar, page header or
  action bar.
- There is no shared field wrapper, empty state, loading state or error state.

## Will Be Standardized

- Semantic theme tokens for primary, accent, background, surface, border,
  muted, success, warning, danger and info.
- Global typography, spacing, focus states and form controls.
- Shared UI primitives in `apps/web/components/ui`.
- A reusable dashboard shell with CoriTech wordmark, sidebar navigation, top bar,
  organization and role context.
- Consistent page headers, section headers, cards, data panels, tables, badges,
  status badges, empty/loading/error states and action bars.
- Real app routes will use the shared shell and primitives where practical.

## Will Be Migrated

- `/`
- `/breeder-dashboard`
- `/app/catalog`
- `/app/catalog/[listingId]`
- `/app/orders/new`
- `/app/orders/[orderId]`
- Existing loading and error states for the implemented routes.
- Existing feature React components, preserving their view-model behavior.

## Will Be Preserved

- Next.js App Router structure.
- Existing feature modules and view-model contracts.
- Existing demo-state repository behavior used by the breeder dashboard and
  order creation flow.
- Existing form submissions and redirects on `/app/orders/new`.
- Existing links between catalog, order creation, dashboard and order detail.
- Existing semantic table markup where tables are already used.
- Guardrails excluding fake auth, AI, blockchain, full marketplace and backend
  scope expansion.

## Should Not Be Touched In This Task

- Prisma schema and migrations.
- Domain package business rules.
- Database seed logic except where UI data contracts would require it; none are
  currently required.
- Auth provider implementation.
- Missing future feature pages for station, admin, documents, proof events,
  audit logs, users, organizations or system status.
- Docker and infrastructure configuration unless needed to run the existing UI.

## Obsolete Or Unused UI

No active preview/demo UI routes were found. There are `.mjs` HTML renderers and
feature CSS files from earlier tickets; these appear to support framework-neutral
tests and traceability, so they should not be removed in this task.

## Risks Before Migration

- The app has no shared UI primitives, so migration touches several feature
  components at once.
- Existing `.mjs` renderers and tests may continue to reflect older HTML/CSS
  patterns even after React components are migrated.
- Current pages rely on demo input modules; the migration should not imply a
  production auth/session flow.
- Introducing Tailwind would require new dependencies and configuration; given
  the current restricted environment and existing CSS foundation, a semantic CSS
  variable and shared component system is the lower-risk path.
- Dashboard routes requested by product context do not currently exist; creating
  them now would be new scope rather than migration.

## Migration Outcome

Implemented after inspection:

- Added semantic theme tokens to `apps/web/app/globals.css`.
- Added shared UI primitives in `apps/web/components/ui/index.tsx`.
- Added shared UI styles in `apps/web/components/ui/ui.css`.
- Updated `apps/web/app/layout.tsx` to import the shared UI CSS instead of
  feature-specific CSS files.
- Migrated `/` to the CoriTech visual language.
- Migrated `/breeder-dashboard` to the shared dashboard shell and components.
- Added `/station-dashboard` with station-scoped active listings, assigned
  incoming orders, action-ready order cards, shipment update entry points,
  recent documents and notifications.
- Migrated `/app/catalog` and `/app/catalog/[listingId]`.
- Migrated `/app/orders/new`, preserving server actions for draft and submit.
- Migrated `/app/orders/[orderId]`.
- Preserved feature view-models, demo-state behavior, semantic tables, loading
  states and error states.
- Did not add preview routes, fake auth flows, backend schema changes or new
  product features.

Pages intentionally not migrated because they do not exist in the current app:

- `/login`
- `/logout`
- `/dashboard`
- `/dashboard/breeder`
- `/dashboard/station`
- `/dashboard/admin`
- `/unauthorized`
- Future documents, proof events, audit, users, organizations and system status
  routes.
