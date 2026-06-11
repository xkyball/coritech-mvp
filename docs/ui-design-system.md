# UI Design System

Date defined: 2026-06-10

## 1. Visual Principles

CoriTech UI is a B2B trust-infrastructure product. It should feel calm,
precise, premium, technical, operational and investor-grade. The visual system
uses light backgrounds, white surfaces, dark navy/deep teal typography, muted
orange or restrained teal accents and subtle grey-blue borders.

Avoid decorative imagery, glossy surfaces, heavy gradients, crypto/web3 styling,
random colors and generic marketplace-first layouts.

## 2. Product UX Principles

- Role context is always visible on app pages.
- Status must be readable as text and consistent badge tone.
- Proof, audit, document and shipment data must be visually connected to the
  object being inspected.
- Primary actions should be obvious, but unavailable routes must not be
  presented as working actions.
- Dashboards prioritize next action and status clarity over showing every data
  field at once.
- Forms are grouped by task, with validation near the submit action.

## 3. Information Architecture

Current product areas:

- Product entry: `/`
- Breeder workspace: `/breeder-dashboard`, `/app/catalog`,
  `/app/catalog/[listingId]`, `/app/orders/new`, `/app/orders/[orderId]`
- Station workspace: `/station-dashboard`, `/app/station/listings`

Future areas should only enter navigation when their routes exist:

- Station order management.
- Documents.
- Proof events.
- Audit/admin.
- User and organization administration.

## 4. Navigation Model

Use `DashboardShell` for role-scoped pages. Navigation is role-aware:

- Breeder: My Orders, Browse Semen Listings, Create Order.
- Breeding Station: Station Overview, Listing Management.

Do not include unavailable pages as ordinary links. If a workflow has generated
future links, present them as unavailable notices or document the gap until the
route exists.

## 5. Page Templates

Dashboard page:

- `DashboardShell`
- `PageHeader`
- metric strip
- priority notifications/actions
- data sections with tables or cards
- empty/loading/error states

List/index page:

- `PageHeader`
- filter/search card where relevant
- table or card list
- count and empty state

Create/edit form:

- `PageHeader`
- validation `Alert`
- context review card
- form sections
- primary/secondary actions
- confirmation state

Detail page:

- `PageHeader` with status badge
- summary/status panel
- detail metadata grid
- timeline/event sections
- related documents and shipments

Proof/audit page or section:

- event/timeline rows
- actor, role, organization and timestamp
- verification badge
- linked object and document count
- audit status or audit action

## 6. Component Inventory

Shared primitives live in `apps/web/components/ui/index.tsx`.

Core:

- `DashboardShell`
- `PageHeader`
- `Breadcrumbs`
- `SectionHeader`
- `Card`
- `ActionBar`
- `Button`
- `ButtonLink`
- `IconButton`
- `Badge`
- `StatusBadge`
- `VerificationBadge`
- `OrderStatusBadge`
- `ShipmentStatusBadge`
- `PaymentStatusBadge`
- `VerificationLevelBadge`
- `StatusDescription`
- `MetricCard`
- `DataPanel`
- `DetailList`
- `Table`
- `PaginationControls`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `Alert`
- `Notice`
- `ProofEventList`
- `ConfirmationDialog`
- `ToastMessage`

Forms:

- `Field`
- `SearchField`
- `Input`
- `DateInput`
- `Select`
- `Textarea`
- `FormError`
- `Checkbox`
- `Toggle`

Optional future primitives:

- `Tabs` when an implemented page has dense sibling views.

## 7. Component Usage Rules

- Use `Button` for actions and `ButtonLink` for navigation.
- Use `IconButton` only when the icon or short symbol has an accessible label.
- Use `Card` for bounded sections; avoid cards inside cards.
- Use `DataPanel` and `DetailList` for key metadata.
- Use `StatusBadge` for operational state.
- Use the specific status badge component where the status family is known.
- Use `VerificationLevelBadge` for verification levels.
- Use `StatusDescription` when a card needs the shared plain-language status
  explanation or role-specific next-action hint.
- Use `ProofEventList` for proof events instead of raw tables.
- Use `Alert` for validation or failure summaries.
- Use `FormError` for field-level blocking form errors.
- Use `Notice` for non-blocking unavailable workflow explanations.
- Use `ConfirmationDialog` for destructive actions such as revocation and
  cancellation; it does not replace server authorization.
- Use `ToastMessage` only for non-blocking local status feedback.
- Use `SearchField` and `PaginationControls` with the table-list helper for
  searchable paginated list routes.

## 8. Data Display Rules

- Metrics: use `MetricCard` in `ct-metric-grid`.
- Tabular data: use `Table` with semantic `thead`, `tbody`, `th` and `td`.
- Dense tables: use horizontal scroll on small screens.
- Searchable tables: normalize `query`, `page`, `pageSize`, `sort` and
  `direction` through the feature table-list helper before rendering.
- Pagination: use `PaginationControls` and preserve the active filters in links.
- Metadata: use `DetailList`.
- Proof events: use event-list/timeline pattern.
- Documents: show file name, type, linked object, visibility and created date.
- Shipments: show provider, tracking reference, current status and history.

## 9. Form Rules

- Every input must have a visible label.
- Required fields should use native `required` where possible.
- Validation summaries use `Alert`.
- Form actions sit at the bottom of the section in `ct-form-actions`.
- Primary submit action appears after secondary/draft actions only when the
  workflow benefits from draft-first review.
- Destructive actions use danger tone and concise text.

## 10. Status And State Rules

Operational status tone mapping:

- success: available, submitted, approved, delivered, complete, verified.
- warning: pending, draft, requested, in transit, review.
- danger: rejected, cancelled, failed, unavailable.
- info: shipment, proof, document, tracking.
- neutral: unknown or non-operational status.

Verification levels:

- `SELF_REPORTED` -> Self-reported.
- `SYSTEM_RECORDED` -> System-recorded.
- `STATION_CONFIRMED` -> Station-confirmed.
- `ADMIN_REVIEWED` -> Admin-reviewed.
- `VET_SIGNED` -> Vet-signed.
- `FEDERATION_ATTESTED` -> Federation-attested.
- `VERIFIED_FOR_TRANSACTION` -> Verified for transaction.

Color is never the only signal; badges must include text.

## 11. Empty, Loading And Error State Rules

- Loading states use `LoadingState` and `aria-busy`.
- Errors use `ErrorState` or `Alert` with `role="alert"`.
- Empty states explain what is absent and, where safe, include one action.
- Missing future routes use `Notice`, not working links.

## 12. Accessibility Rules

- Use semantic landmarks, headings, lists, tables and forms.
- Keep heading order logical.
- Use links for navigation and buttons for actions.
- Associate labels with controls.
- Use visible focus states.
- Use `aria-current="page"` for active nav.
- Provide labels for icon-only buttons.
- Avoid inaccessible custom controls.
- Maintain contrast using semantic tokens.

## 13. Anti-Patterns

Do not:

- Create demo or preview routes.
- Add fake auth/session UI.
- Add marketplace-first pages for trust workflows.
- Render raw JSON as proof or audit UX.
- Use random colors or per-page palettes.
- Keep broken links to missing routes.
- Add heavy UI frameworks without an explicit task.
- Add AI, blockchain, payment, federation automation or unrelated features.

## 14. Migration Plan

1. Preserve the current Next.js App Router and feature view-model pattern.
2. Extend the existing shared UI package rather than adding a new framework.
3. Document current routes and missing referenced routes.
4. Remove or constrain navigation/actions for missing pages.
5. Replace local alert/detail/proof patterns with shared primitives.
6. Render proof events as structured event rows.
7. Add semantic token aliases and missing primitives.
8. Update README guardrails.
9. Run web tests, workspace tests, typecheck/build and visual inspection where
   the environment allows it.
