# UI Product Audit

Date inspected: 2026-06-10

## 1. Existing App Framework And Routing Structure

The frontend is a Next.js App Router application in `apps/web/app`, using
React 19, TypeScript and server-rendered route files. Route components call
feature-level view-model factories under `apps/web/features/*/view-model.ts`,
which wrap framework-neutral `.mjs` feature modules.

The root layout imports:

- `apps/web/app/globals.css`
- `apps/web/components/ui/ui.css`

There is no Tailwind CSS setup and no third-party UI framework.

## 2. Existing Pages And Routes

Implemented routes:

- `/`
- `/breeder-dashboard`
- `/station-dashboard`
- `/app/catalog`
- `/app/catalog/[listingId]`
- `/app/orders/new`
- `/app/orders/[orderId]`
- `/app/station/listings`

Implemented loading routes:

- `/breeder-dashboard/loading`
- `/station-dashboard/loading`
- `/app/catalog/loading`
- `/app/catalog/[listingId]/loading`
- `/app/orders/new/loading`
- `/app/orders/[orderId]/loading`
- `/app/station/listings/loading`

Referenced but missing routes:

- `/app/station/orders`
- `/app/documents/[documentId]`

Not implemented in the current app:

- `/login`
- `/logout`
- `/dashboard`
- `/dashboard/breeder`
- `/dashboard/station`
- `/dashboard/admin`
- admin, audit, proof-event, document, user and organization management pages

## 3. Existing Layouts

The current app already has a shared `DashboardShell` with sidebar navigation,
top bar, role badge, organization context and content spacing. The home page
uses its own `ct-home` layout instead of the dashboard shell.

Feature pages generally use:

- `DashboardShell`
- `PageHeader`
- `Card`
- `SectionHeader`
- `Table`
- `MetricCard`
- `StatusBadge`
- `EmptyState`, `LoadingState`, `ErrorState`

## 4. Existing Components

Shared UI primitives live in `apps/web/components/ui/index.tsx`:

- `DashboardShell`
- `PageHeader`
- `Breadcrumbs`
- `SectionHeader`
- `Card`
- `Button`
- `ButtonLink`
- `ActionBar`
- `Badge`
- `StatusBadge`
- `MetricCard`
- `DataPanel`
- `Field`
- `Input`
- `Select`
- `Textarea`
- `Table`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `formatStatusLabel`
- `cx`

Feature components:

- `BreederDashboard`
- `StationDashboard`
- `SemenCatalog`
- `SemenOrderCreation`
- `BreederOrderDetail`
- `ListingManagement`

## 5. Existing Styling System

The active styling system is plain CSS with semantic variables in
`apps/web/app/globals.css` and component classes in
`apps/web/components/ui/ui.css`.

Feature CSS files still exist:

- `apps/web/features/breeder-dashboard/breeder-dashboard.css`
- `apps/web/features/breeder-order-detail/breeder-order-detail.css`
- `apps/web/features/catalog/semen-catalog.css`
- `apps/web/features/order-creation/semen-order-creation.css`

These feature CSS files are not imported by the Next.js root layout and appear
to be historical support for earlier framework-neutral renderers and tests.

## 6. Existing Design Tokens

Existing token variables include:

- `--ct-color-primary`
- `--ct-color-primary-strong`
- `--ct-color-accent`
- `--ct-color-accent-soft`
- `--ct-color-background`
- `--ct-color-surface`
- `--ct-color-surface-muted`
- `--ct-color-border`
- `--ct-color-border-strong`
- `--ct-color-text`
- `--ct-color-muted`
- `--ct-color-success`
- `--ct-color-success-soft`
- `--ct-color-warning`
- `--ct-color-warning-soft`
- `--ct-color-danger`
- `--ct-color-danger-soft`
- `--ct-color-info`
- `--ct-color-info-soft`
- typography, spacing, radius and subtle shadow variables

The token foundation is sound but should be documented as semantic tokens and
extended with missing radius and elevation aliases.

## 7. Existing Navigation Model

Breeder navigation:

- My Orders -> `/breeder-dashboard`
- Browse Semen Listings -> `/app/catalog`
- Create Order -> `/app/orders/new`

Station navigation:

- Station Overview -> `/station-dashboard`
- Listing Management -> `/app/station/listings`

Issue: the station dashboard view model still has an order-management href for
future use, but `/app/station/orders` has no route. The migrated UI does not
expose it as normal sidebar navigation.

## 8. Existing Forms

Implemented forms:

- Catalog filters use GET query parameters.
- Order creation listing selection uses GET.
- Order creation draft and submit use server actions with POST.
- Listing management create/edit uses server actions with POST.
- Listing activate/deactivate actions are POST forms with hidden fields.

Forms use shared `Field`, `Input`, `Select`, `Textarea` and `Button`, but there
is no shared validation summary component yet.

## 9. Existing Tables

Tables are used for:

- Breeder active listings.
- Breeder order rows.
- Breeder recent documents.
- Station active listings.
- Station incoming orders.
- Station shipment updates.
- Station recent documents.
- Listing management rows.
- Order status history.
- Shipment rows.
- Document rows.
- Proof-event rows.

The shared `Table` wrapper provides horizontal overflow on dense screens. Some
proof/audit data would benefit from a timeline or event-list pattern instead of
a plain table.

## 10. Existing Dashboards

Breeder dashboard:

- Order status summary.
- Active listings.
- My orders.
- Recent documents.
- Notifications and action required.

Station dashboard:

- Order status summary.
- Notifications.
- Optional selected order detail.
- Active listings.
- Incoming orders.
- Orders needing action.
- Shipments to update.
- Recent documents.

Both dashboards use demo input and domain guards, not live session data.

## 11. Existing Data-Loading Patterns

Routes are server components. They create view models from demo data modules and
in-memory repositories. Each route catches errors and converts them into
feature-level error view models. Loading routes are implemented with feature
loading states.

Server actions exist for:

- Creating/saving/submitting semen orders.
- Creating/updating/activating/deactivating semen listings.

## 12. Existing Auth, Session And Role State

No UI session provider or real login/logout route exists. Role-aware behavior is
derived from demo actor objects and domain guard functions. Current UI roles:

- Breeder.
- Breeding Station.

Domain packages also define or reference Platform Admin and future roles, but
there are no active admin UI pages.

## 13. Existing Error, Loading And Empty States

Each implemented app route has a loading route. Feature components render
shared `LoadingState` and `ErrorState`. Sections use `EmptyState` or table
fallback rows. Validation issues are rendered in local `ct-alert` sections, not
yet a shared alert primitive.

## 14. Existing Product Workflows

Implemented workflows:

- Breeder reviews dashboard, orders, documents and action items.
- Breeder filters semen catalog.
- Breeder opens listing detail.
- Breeder creates draft semen order or submits order.
- Breeder opens an order detail page with status history, shipments, documents
  and proof events.
- Station reviews dashboard, notifications and assigned orders.
- Station manages owned semen listings.
- Station creates, edits, activates and deactivates listings.

Partially implemented or referenced workflows:

- Station order management links exist but route/page is missing.
- Document detail links exist but route/page is missing.
- Shipment update links are generated but target missing station order routes.
- Admin, audit and proof-event management are not active UI routes.

## 15. Existing User Roles And Personas

Active UI personas:

- Breeder: browses listings, creates orders, reviews their own order records,
  documents and proof history.
- Breeding Station: manages station listings, reviews incoming orders, sees
  shipment and document action readiness.

Domain-level but not UI-implemented personas:

- Platform Admin.
- Vet / Clinic.
- Federation / Studbook.
- Sales Venue.
- Buyer.

## 16. Existing Visual Inconsistencies

- Home page uses a different structure than app pages.
- Some missing routes are presented as normal links.
- Proof events are displayed as a table even though the product concept is an
  event timeline.
- Listing/order confirmation pages show audit hooks lightly but not as a
  structured audit notice.
- Historical feature CSS still contains duplicate color, form and table rules.
- Station and breeder navigation arrays are duplicated per feature component.

## 17. Existing UX Friction

- The dedicated station order-management route is still missing, so station
  order review remains dashboard-based.
- Document "View" links point to missing document detail routes.
- Proof events do not show linked object or audit/document context clearly.
- Current status, shipment and proof sections are separated but not visually
  linked into a trust trail.
- Action cards sometimes say "Display action" instead of explaining what is
  operationally available.

## 18. Existing Accessibility Issues

Strengths:

- Buttons are real buttons.
- Navigation is semantic.
- Tables use table markup.
- Inputs have labels.
- Global focus-visible styling exists.

Issues to improve:

- Missing route links should not be exposed as working actions.
- Validation alerts should use a shared alert pattern.
- Icon-only buttons are not present; if added, they need labels.
- Dense tables need consistently readable behavior on small screens.
- Proof timeline rows need text labels beyond badge color.

## 19. Existing Reusable Components Worth Preserving

The shared UI package is worth preserving and extending. The feature view-model
pattern is also worth preserving because it keeps domain/guard decisions outside
React rendering.

Keep:

- `DashboardShell`
- `PageHeader`
- `SectionHeader`
- `Card`
- `Table`
- `StatusBadge`
- `Field` and form primitives
- `MetricCard` / `DataPanel`
- feature view-model modules
- existing loading/error state conversion

## 20. Obsolete Or Duplicated UI Code

Likely obsolete for the active Next.js app:

- historical feature CSS files under `apps/web/features/*/*.css`
- HTML string renderers in `.mjs` feature modules

These are still used by framework-neutral tests and traceability, so they should
not be removed during this migration unless tests are updated deliberately.

Duplicated patterns to standardize:

- breeder and station navigation constants
- local `DetailTerm` helpers
- validation alert markup
- proof-event table rows
- audit hook summaries
