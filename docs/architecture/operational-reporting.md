# Operational Reporting

Date defined: 2026-06-10

## Purpose

Ticket 11.1 adds a lightweight Platform Admin reporting panel for investor demo
and operational oversight. It intentionally stays inside the application layer
and does not introduce a BI stack, analytics warehouse or background reporting
pipeline.

## Surface

The reporting panel appears on `/app/admin` for authenticated Platform Admin
users. The dashboard still records admin access through the existing
`ADMIN_DASHBOARD_VIEW` audit entry.

## Metrics

The reporting view model lives in
`apps/web/features/operational-reporting/operational-reporting.mjs` and is fed
from Prisma-backed repositories.

The panel shows:

- Active listings.
- Submitted, confirmed, rejected and completed orders.
- Average time from `SUBMITTED` to `CONFIRMED` using order status history.
- Shipment count.
- Uploaded document count.
- Proof-event count.
- Documentation completion rate for submitted-or-later orders with at least one
  linked document.

## Boundary

The calculation is synchronous and request-time only. It does not add a report
table, data warehouse, AI insight, forecast, scoring model, public buyer report
or external BI dependency. As record volume grows, these same metric definitions
can be moved behind aggregate database queries without changing the dashboard
contract.
