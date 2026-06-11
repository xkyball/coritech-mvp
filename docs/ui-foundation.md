# CoriTech UI Foundation

Date established: 2026-06-09

## Visual Design Principles

CoriTech UI should feel like a premium B2B operations dashboard for trust
infrastructure:

- Calm and precise.
- Role-aware.
- Operational before marketplace-oriented.
- Due-diligence ready.
- Technical without visual noise.
- Trust-focused rather than decorative.

Avoid decorative horse imagery, stock photography, random gradients, neon
colors, crypto styling, generic admin templates and playful ornament.

## Styling System

The active UI foundation uses semantic CSS variables and shared TypeScript React
components. Tailwind CSS is not introduced in this task because the repository
already had a small custom CSS base and adding Tailwind would require extra
dependencies and configuration. Future Tailwind adoption should be an explicit
task if the team wants it.

Active foundation files:

- `apps/web/app/globals.css`
- `apps/web/components/ui/index.tsx`
- `apps/web/components/ui/ui.css`

Legacy feature CSS files are preserved for historical renderers and tests, but
the Next.js root layout imports the shared UI CSS instead of the feature CSS
files.

## Color Tokens

Use semantic tokens from `apps/web/app/globals.css`:

- `--ct-color-primary` - dark navy / deep teal.
- `--ct-color-primary-strong` - strongest text and sidebar tone.
- `--ct-color-accent` - muted orange for proof emphasis and key accents.
- `--ct-color-background` - very light grey app background.
- `--ct-color-surface` - white surface.
- `--ct-color-surface-muted` - calm muted surface.
- `--ct-color-border` - subtle grey-blue border.
- `--ct-color-border-strong` - stronger input/table border.
- `--ct-color-text` - primary text.
- `--ct-color-muted` - secondary text.
- `--ct-color-success` / `--ct-color-success-soft` - restrained green states.
- `--ct-color-warning` / `--ct-color-warning-soft` - muted amber states.
- `--ct-color-danger` / `--ct-color-danger-soft` - controlled red states.
- `--ct-color-info` / `--ct-color-info-soft` - calm blue states.

Do not introduce raw page-level colors when a semantic token exists.

## Typography Rules

The base font is the system UI stack represented by `--ct-font-sans`.

Use the scale in `globals.css`:

- `--ct-text-xs`
- `--ct-text-sm`
- `--ct-text-md`
- `--ct-text-lg`
- `--ct-text-xl`
- `--ct-text-2xl`
- `--ct-text-3xl`

Headings should be clear but restrained. Dashboard and card headings should not
use hero-scale type. Letter spacing remains `0`.

## Spacing Rules

Use the shared spacing scale:

- `--ct-space-1`
- `--ct-space-2`
- `--ct-space-3`
- `--ct-space-4`
- `--ct-space-5`
- `--ct-space-6`
- `--ct-space-8`
- `--ct-space-10`
- `--ct-space-12`

Prefer consistent gaps and card padding over one-off margins. Dashboard pages
should use `ct-page-stack` inside `DashboardShell`.

## Shared Components

Shared primitives live in `apps/web/components/ui/index.tsx`.

Current components:

- `DashboardShell`
- `PageHeader`
- `SectionHeader`
- `Breadcrumbs`
- `Card`
- `Button`
- `ButtonLink`
- `ActionBar`
- `Badge`
- `StatusBadge`
- `MetricCard`
- `DataPanel`
- `Field`
- `SearchField`
- `Input`
- `DateInput`
- `Select`
- `Textarea`
- `FormError`
- `Table`
- `PaginationControls`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `ConfirmationDialog`
- `ToastMessage`

Utility exports:

- `cx`
- `formatStatusLabel`

Future UI work should check this component list before creating new primitives.

## Layout Rules

Use `DashboardShell` for application pages. It provides:

- CoriTech wordmark.
- Sidebar navigation.
- Top bar.
- Role badge.
- Organization context.
- Main content spacing.

Use `PageHeader` for page title, subtitle, contextual breadcrumb and primary
actions. Use `SectionHeader` inside cards for section titles and counts.

Use `Card` for bounded content sections. Do not put card-like components inside
other cards. Direct child data panels inside cards should remain visually flat.

Use `Table` for tabular data and keep semantic table markup. Use `SearchField`
and `PaginationControls` with feature-owned table-list query normalization for
searchable lists. Use `StatusBadge` for state values so color is not the only
indicator.

## Migration Approach

The following real routes were migrated:

- `/`
- `/breeder-dashboard`
- `/app/catalog`
- `/app/catalog/[listingId]`
- `/app/orders/new`
- `/app/orders/[orderId]`

The existing feature view-models, demo repository behavior, links, server
actions, loading states and error states were preserved. No preview routes or
new product features were added.

## Anti-Patterns

Avoid:

- Preview/demo routes unless explicitly requested.
- One-off buttons, tables, cards, badges or fields.
- Raw browser-default forms.
- Random colors outside semantic tokens.
- Decorative horse imagery.
- Marketplace-first layouts.
- Fake auth/session flows.
- New backend/product scope inside UI migration work.
- Full feature pages for station, admin, documents, proof events or audit unless
  the route already exists or a later task explicitly requests it.

## Future Codex Task Rules

For future UI tasks:

1. Inspect the existing route and feature component first.
2. Reuse `DashboardShell` for app pages.
3. Reuse shared primitives from `apps/web/components/ui`.
4. Use semantic tokens from `apps/web/app/globals.css`.
5. Preserve existing view-model and server-action behavior.
6. Use accessible labels and semantic HTML.
7. Use `StatusBadge` for statuses and `Table` for tabular data.
8. Use the table-list convention for searchable or paginated list routes.
9. Add empty, loading and error states through shared primitives.
10. Do not create preview/demo routes unless the user explicitly asks for them.
11. Document any route that cannot be migrated instead of inventing new scope.
