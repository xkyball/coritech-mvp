# UI Function Map

Date mapped: 2026-06-10

## Implemented Routes

### `/`

Status: implemented

Route / Page -> Root product overview

User role -> Public / internal evaluator

Primary user goal -> Understand the Phase 1 operational wedge and open the
breeder or station workspace.

Main actions -> Open breeder workspace, open station workspace.

Data displayed -> Core proof chain, Phase 1 workflow, stack/foundation labels.

Current UI problems -> It is visually separate from the role-aware app shell and
can read more like a status page than a product entry point.

Required new UI pattern -> Product entry surface with restrained operational
overview, role entry actions and proof-chain summary. No fake marketing hero.

### `/accept-invite`

Status: implemented

Route / Page -> Invitation acceptance

User role -> Invited breeder or breeding-station user before managed login.

Primary user goal -> Validate an invitation token, complete profile basics and
continue into managed login for the assigned workspace.

Main actions -> Review invited email/organization/role, enter display name,
accept invitation, continue to managed login.

Data displayed -> Invitation state, email, organization, role, expiry and clear
invalid/expired/used/revoked state messages.

Current UI problems -> Email delivery is queued until the later email-provider
ticket supplies concrete delivery.

Required new UI pattern -> Public onboarding form with explicit token state,
minimal profile completion and no role/organization self-selection.

### `/breeder-dashboard`

Status: implemented

Route / Page -> Breeder dashboard

User role -> Breeder

Primary user goal -> Review owned orders, visible listings, documents and next
actions.

Main actions -> Browse catalog, open order detail, inspect recent documents,
review notifications/action items.

Data displayed -> Order status counts, active listings, orders, documents,
action-required cards.

Current UI problems -> Generally migrated to shared shell, but proof context is
not surfaced on the dashboard and table/action density could be clearer.

Required new UI pattern -> Role dashboard with metric strip, priority cards,
clear status badges, data tables and action cards.

### `/station-dashboard`

Status: implemented

Route / Page -> Station dashboard

User role -> Breeding Station

Primary user goal -> Monitor station-owned listings, incoming orders, shipment
readiness, document visibility and operational notifications.

Main actions -> Manage listings, inspect selected order, review action cards,
open shipment/document actions when implemented.

Data displayed -> Order status counts, notifications, selected order, active
listings, incoming orders, action items, shipments, documents.

Current UI problems -> Dedicated station order management is still missing, so
order review and action discovery remain dashboard-based; action proof copy is
terse.

Required new UI pattern -> Operational station dashboard with implemented
navigation only, structured unavailable notices for missing future routes,
status badges and trust-ready action cards.

### `/app/catalog`

Status: implemented

Route / Page -> Semen catalog list

User role -> Breeder

Primary user goal -> Search/filter active breeder-visible semen listings and
start an order.

Main actions -> Apply filters, clear filters, open listing detail, create order.

Data displayed -> Listing cards with stallion, breed, station, terms and
availability.

Current UI problems -> Works with shared primitives; listing cards are
scannable but could better align with app-wide detail-list rules.

Required new UI pattern -> List/index page with page header, filter card, result
cards, status badges and empty state.

### `/app/catalog/[listingId]`

Status: implemented

Route / Page -> Semen listing detail

User role -> Breeder

Primary user goal -> Inspect a listing before ordering.

Main actions -> Back to catalog, create order if orderable.

Data displayed -> Stallion, breed, station, availability, terms, UELN,
microchip.

Current UI problems -> Detail metadata is adequate but uses local detail helper.

Required new UI pattern -> Detail page with summary header, metadata grid,
status badge and clear primary order action.

### `/app/orders/new`

Status: implemented

Route / Page -> Create semen order

User role -> Breeder

Primary user goal -> Select a listing, provide delivery details, save a draft or
submit the order.

Main actions -> Select listing, review listing, save draft, submit order.

Data displayed -> Listing selector, selected listing review, shipping form,
validation issues, confirmation state.

Current UI problems -> Uses shared fields and alerts but validation alert is
local; form sections could state proof/audit impact more consistently.

Required new UI pattern -> Structured create form with listing context, grouped
fields, validation alert, primary/secondary actions and confirmation detail
panel.

### `/app/orders/[orderId]`

Status: implemented

Route / Page -> Breeder order detail

User role -> Breeder

Primary user goal -> Understand current order status, shipment state,
documents, status history, proof events and order activity.

Main actions -> Return to dashboard, add shared order comment, submit support
request, contact support, view linked documents if document detail exists.

Data displayed -> Order status, summary metadata, status history, shipments,
tracking events, documents, proof timeline and order activity feed.

Current UI problems -> Breeder proof events now use the shared proof timeline
model and timeline component in the React surface; document links remain
controlled-access metadata/detail links rather than public file links.

Required new UI pattern -> Detail page with status summary, metadata grid,
status/audit timeline, shipment table, document table and proof-event timeline.

### `/app/station/stallions`

Status: implemented

Route / Page -> Station stallion management

User role -> Breeding Station

Primary user goal -> Create, edit, activate and inactivate station-owned
stallion records before opening semen listings.

Main actions -> Search stallions by name/UELN/chip ID, save stallion, activate
or inactivate stallion, create listing from an active stallion.

Data displayed -> Stallion editor, station stallion table, identifiers, status,
validation issues, confirmation state and audit hook summary.

Current UI problems -> The route still uses the shared demo catalog repository
until the app has durable station catalog API wiring.

Required new UI pattern -> Same operational table/form pattern as station
listing management, with audit notice and safe status action placement.

### `/app/station/listings`

Status: implemented

Route / Page -> Station listing management

User role -> Breeding Station

Primary user goal -> Create, edit, activate and deactivate station-owned semen
listings.

Main actions -> Select stallion, edit availability/status/terms, save listing,
activate/deactivate listing.

Data displayed -> Listing editor, station listing table, validation issues,
confirmation state, audit hook summary.

Current UI problems -> Confirmation audit data is present but not rendered as a
shared audit notice; listing table actions are clear but can be cramped on
small screens.

Required new UI pattern -> Admin-style operational form plus searchable/scannable
table pattern, audit notice, status badges and safe action placement.

## Referenced But Missing Routes

### `/app/station/orders`

Status: implemented

Route / Page -> Station order management

User role -> Breeding Station

Primary user goal -> Confirm/reject station orders and manage station-side
order status.

Main actions -> confirm, reject, inspect, create shipment, update shipment,
upload documents.

Data displayed -> Orders, statuses, breeder, listing, shipment state, documents,
proof events, next action.

Current UI problems -> Proof timeline is available on selected station order
detail; deeper audit-log inspection remains separate admin work.

Required new UI pattern -> Searchable data table with status badges, action bar,
detail route/drawer, proof/audit visibility.

### `/app/documents/[documentId]`

Status: referenced but missing

Route / Page -> Document detail

User role -> Breeder / Breeding Station / Platform Admin depending on access
classification.

Primary user goal -> Inspect document metadata and permitted view/download
actions.

Main actions -> view/download where permitted, return to linked object.

Data displayed -> File name, type, linked object, uploader, visibility scope,
created date, permitted actions.

Current UI problems -> Document links exist from dashboards and order detail,
but no route exists.

Required new UI pattern -> Document metadata panel connected to order/shipment
or proof context, not a document-first product area.

### Admin, Audit, Proof Event And User/Organization Routes

Status: partial

Route / Page -> `/app/admin`, `/app/admin/proof` plus operational/admin areas

User role -> Platform Admin and future personas.

Primary user goal -> Administer users, organizations, amendments, audit logs and
proof records.

Main actions -> search, inspect, review, navigate to amendment entry point,
verify.

Data displayed -> Audit logs, proof events, organizations, roles, documents.

Current UI problems -> `/app/admin` exposes the Platform Admin operational
overview, order search handoff and admin navigation areas. Admin proof timeline
exists for read-only proof-event inspection, `/app/admin/audit` exposes the
Platform Admin audit log query surface with filters, expandable detail and
pagination, `/app/admin/orders` exposes read-only order support search and
detail context, `/app/admin/permissions` manages explicit object-level grants
and revocations, `/app/admin/amendments` records controlled corrections, and
`/app/admin/invitations` creates breeder/station onboarding invitations. Users
and organizations now have Platform Admin management routes for existing
records.

Required new UI pattern -> Admin data tables, proof/audit timelines, safe
destructive/approval actions and read-heavy detail pages.
