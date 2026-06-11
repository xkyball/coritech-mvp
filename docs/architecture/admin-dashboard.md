# Admin Dashboard

## Purpose

The Platform Admin dashboard is the Phase 1 operational overview for support,
audit and controlled-access work. It replaces the previous `/app/admin` redirect
with a real overview page while keeping proof-critical changes in their own
audited workflows.

## Surface

- `/app/admin` - Platform Admin overview.

The route requires a validated active `PLATFORM_ADMIN` context before it loads
operational counts or navigation.

## Overview Data

The dashboard summarizes existing records from durable repositories:

- semen orders
- orderable active listings
- shipments
- controlled documents linked to orders
- proof events
- recent audit logs

The overview includes the Ticket 11.1 operational reporting panel documented in
[Operational Reporting](./operational-reporting.md). It calculates the required
Phase 1 metrics at request time from existing repositories and status history.

## Search And Navigation

The dashboard provides order search that routes into `/app/admin/orders`, where
order support detail access is audit visible. It also exposes admin navigation
areas for users, invitations, organizations, roles, listings, orders, shipments,
documents, proof events, audit logs and amendments.

Available entries open implemented routes. Planned entries are shown as scoped
admin areas without creating unfinished routes or parallel implementation
patterns. Users, organizations and roles are implemented through the admin
identity management routes; amendments are implemented through the admin
amendment workflow. Listings and shipments remain bounded to their own later
admin workflows where not already implemented.

## Audit Behavior

Opening the admin dashboard records an `ACCESS_DECISION` audit entry with
`sourceAction=ADMIN_DASHBOARD_VIEW`. Mutating admin workflows remain responsible
for their own audit logs, such as permission grant/revoke and later amendment
creation.

## Limitations

- The dashboard does not implement admin shipment or listing management routes.
- Amendment creation lives in `/app/admin/amendments/new`; the dashboard only
  links to it.
- The dashboard does not add AI, blockchain, marketplace expansion, public
  documents or unrestricted buyer access.
