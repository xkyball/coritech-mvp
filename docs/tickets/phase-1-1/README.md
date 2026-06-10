# CoriTech Phase 1.1 Gap Closure Ticket Index

## Purpose

This folder contains Codex-ready Markdown tickets for **CoriTech Phase 1.1**. Phase 1.1 closes the gap between the original Phase 1 ticket pack and a complete usable MVP application.

The original Phase 1 backlog is strong on architecture, data model, proof logic, security, vendor/IP control and DD-readiness. Phase 1.1 adds the missing application glue: executable app scaffold, login UI, onboarding, active role context, real draft-to-submit lifecycle, command services, operational UI gaps, test baseline and MVP readiness.

## MVP Completion Frame

A complete MVP means:

```text
Breeder logs in → finds semen listing → creates draft order → submits order → station receives/confirms/rejects → shipment is created/updated → documents are uploaded and controlled → proof/audit events exist → admin can support → app is locally/staging runnable and testable.
```

## How to Use These Tickets in Codex

Use one ticket at a time. Paste this wrapper into Codex and point it to the relevant file:

```text
Implement the ticket at:

/docs/tickets/phase-1-1/[ticket-file-name].md

Use this ticket file as the source of truth.

Rules:
- Implement only this ticket.
- Follow all acceptance criteria exactly.
- Do not implement future-phase features.
- Do not add AI, blockchain/token, full marketplace automation, full data-space automation, federation automation, sensor/wearable ingestion or unrestricted buyer access.
- Do not commit secrets or real provider credentials.
- Add tests where relevant.
- Update documentation if relevant.
- Keep the architecture modular, permission-aware, proof-ready and due-diligence ready.
- Return an acceptance-criteria checklist after implementation.
```

## Recommended Implementation Order

### Sprint 1.1-A — Runtime Foundation & Auth Entry

- [18.01 — Application Scaffold](./18-01-application-scaffold.md) `P0`
- [18.26 — Local PostgreSQL Docker Setup](./18-26-local-postgres-docker-setup.md) `P0`
- [18.27 — Test Framework Baseline](./18-27-test-framework-baseline.md) `P0`
- [18.23 — API Contract and Service Conventions](./18-23-api-contract-and-service-conventions.md) `P0`
- [18.25 — Global Error Handling](./18-25-global-error-handling.md) `P0`
- [18.02 — Application Shell and Navigation](./18-02-application-shell-navigation.md) `P0`
- [18.03 — Login, Logout and Auth UI](./18-03-login-logout-auth-ui.md) `P0`
- [18.30 — Root Routing and Role Redirects](./18-30-root-routing-role-redirects.md) `P0`

### Sprint 1.1-B — Onboarding, Context & Core Operations

- [18.04 — User Invitation and First-Time Onboarding Flow](./18-04-user-invitation-onboarding-flow.md) `P0`
- [18.05 — Active Organization and Role Context](./18-05-active-organization-role-context.md) `P0`
- [18.06 — Stallion Management UI](./18-06-stallion-management-ui.md) `P0`
- [18.09 — Order Command Service](./18-09-order-command-service.md) `P0`
- [18.08 — Draft Order Save and Submit Flow](./18-08-draft-order-submit-flow.md) `P0`
- [18.10 — Station Receive Order Step](./18-10-station-receive-order-step.md) `P0`
- [18.13 — Shipment Command Service](./18-13-shipment-command-service.md) `P0`
- [18.16 — Document Preview and Download UI](./18-16-document-preview-download-ui.md) `P0`

### Sprint 1.1-C — Workflow Completion & User Clarity

- [18.07 — Order Mare and Recipient Details](./18-07-order-mare-recipient-details.md) `P1`
- [18.11 — Order Rejection and Cancellation Flow](./18-11-order-rejection-cancellation-flow.md) `P1`
- [18.12 — Order Activity and Comments](./18-12-order-activity-comments.md) `P1`
- [18.14 — Delivery Confirmation Flow](./18-14-delivery-confirmation-flow.md) `P1`
- [18.15 — Document Revocation and Replacement](./18-15-document-revocation-replacement.md) `P1`
- [18.17 — Payment Reference UI](./18-17-payment-reference-ui.md) `P1`
- [18.18 — Notification Template Registry](./18-18-notification-template-registry.md) `P1`
- [18.19 — Action Required In-App Notifications](./18-19-action-required-in-app-notifications.md) `P1`
- [18.33 — Status Display System](./18-33-status-display-system.md) `P1`

### Sprint 1.1-D — Admin, Permissions & Support

- [18.20 — Admin Order Support View](./18-20-admin-order-support-view.md) `P1`
- [18.21 — Audit Log Viewer UI](./18-21-audit-log-viewer-ui.md) `P1`
- [18.22 — Permission Management UI](./18-22-permission-management-ui.md) `P1`
- [18.32 — Support Request Flow](./18-32-support-request-flow.md) `P2`

### Sprint 1.1-E — UI Standards, Static Pages & Readiness

- [18.24 — Shared UI Components](./18-24-shared-ui-components.md) `P1`
- [18.34 — Table, Search and Pagination Standard](./18-34-table-search-pagination-standard.md) `P2`
- [18.31 — Legal and Static App Pages](./18-31-legal-static-pages.md) `P2`
- [18.29 — Development Seed Data](./18-29-development-seed-data.md) `P1`
- [18.28 — Minimal E2E Happy Path](./18-28-minimal-e2e-happy-path.md) `P1`
- [18.35 — MVP Readiness Checklist](./18-35-mvp-readiness-checklist.md) `P2`

## Implementation Status

Implementation status is tracked non-destructively in:

- [../_analysis/ticket-implementation-matrix.md](../_analysis/ticket-implementation-matrix.md)
- [../_analysis/mvp-gap-analysis.md](../_analysis/mvp-gap-analysis.md)
- [../_analysis/next-step-recommendation.md](../_analysis/next-step-recommendation.md)
- [../_analysis/unfinished-ticket-order.md](../_analysis/unfinished-ticket-order.md)
- [../_analysis/status-overlays/](../_analysis/status-overlays/)

## Ticket Count

Total Phase 1.1 tickets: **35**

## Explicitly Not Phase 1.1

- AI insights
- Blockchain / token layer
- Full Equine Data Space automation
- Federation automation
- Sensor or wearable ingestion
- Predictive horse performance analytics
- Buyer View as a complete product
- Complex marketplace automation
- Real card payment processing
- Full external logistics-provider implementation
