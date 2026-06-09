# CoriTech Phase 1 Ticket Index

## Purpose

This folder contains Codex-ready Markdown tickets for CoriTech Phase 1 — the MVP wedge around semen ordering, tracking and documentation. Each ticket is designed to be used directly as a source-of-truth file in Codex.

## Core Phase 1 Frame

Phase 1 is not a generic marketplace build. It is an operational workflow wedge that prepares workflow-generated proof.

```text
Breeder → Semen Listing → Semen Order → Station Confirmation → Shipment Tracking → Documentation → Basic Proof Event → Audit Log
```

Core CoriTech logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

## How to Use These Tickets in Codex

For each task, paste this wrapper into Codex and point to the relevant ticket file:

```text
Implement the ticket at:

/docs/tickets/phase-1/[ticket-file-name].md

Use the ticket file as the source of truth.

Rules:
- Implement only this ticket.
- Follow all acceptance criteria.
- Do not implement future-phase features.
- Do not add AI, blockchain/token, full marketplace automation, federation automation, sensor/wearable ingestion or unrestricted buyer access.
- Add tests where relevant.
- Update documentation if relevant.
- Keep the architecture modular and due-diligence ready.
- Return an acceptance-criteria checklist after implementation.
```

## Recommended Implementation Order


### Sprint 0 — Setup & Control

- [0.1 — Set up CoriTech-owned source repository](./00-01-repository-setup.md) `P0`
- [0.2 — Create project architecture documentation skeleton](./00-02-documentation-skeleton.md) `P0`
- [0.3 — Set up environment configuration and secrets structure](./00-03-environment-secrets.md) `P0`
- [13.1 — Create Vendor Register documentation](./13-01-vendor-register-doc.md) `P0`
- [13.2 — Create Account Ownership Checklist documentation](./13-02-account-ownership-checklist-doc.md) `P0`
- [13.3 — Create IP assignment and handover checklist](./13-03-ip-assignment-handover-checklist.md) `P0`

### Sprint 1 — Core Data Foundation

- [1.1 — Implement User, Organization and Role data model](./01-01-user-organization-role-model.md) `P0`
- [1.2 — Implement Stallion and Semen Listing model](./01-02-stallion-semen-listing.md) `P0`
- [1.3 — Implement Semen Order model and status history](./01-03-semen-order-status-history.md) `P0`
- [1.4 — Implement Shipment and Shipment Tracking Event model](./01-04-shipment-tracking-event.md) `P0`
- [1.5 — Implement Document Metadata and Evidence Attachment model](./01-05-document-evidence-model.md) `P0`
- [1.6 — Implement Proof Event model v1](./01-06-proof-event-v1.md) `P0`
- [1.7 — Implement Verification Level taxonomy v1](./01-07-verification-level-v1.md) `P0`
- [1.8 — Implement Audit Log v1](./01-08-audit-log-v1.md) `P0`
- [1.9 — Implement Correction / Amendment model v1](./01-09-amendment-v1.md) `P1`

### Sprint 2 — Auth & Permissions

- [2.1 — Integrate managed authentication provider](./02-01-auth-provider.md) `P0`
- [2.2 — Implement RBAC permission middleware](./02-02-rbac-middleware.md) `P0`
- [2.3 — Implement Access Permission model v1](./02-03-access-permission-v1.md) `P1`
- [12.2 — Create role/permission matrix documentation](./12-02-role-permission-matrix-doc.md) `P0`

### Sprint 3 — MVP Workflow UI

- [3.1 — Create Breeder dashboard](./03-01-breeder-dashboard.md) `P0`
- [3.2 — Create Semen Catalog UI for breeders](./03-02-semen-catalog-ui.md) `P0`
- [3.3 — Create Semen Order creation flow](./03-03-semen-order-creation-flow.md) `P0`
- [3.4 — Create Breeder order detail view](./03-04-breeder-order-detail.md) `P0`
- [4.1 — Create Breeding Station dashboard](./04-01-station-dashboard.md) `P0`
- [4.2 — Create listing management UI for breeding stations](./04-02-listing-management-ui.md) `P0`
- [4.3 — Create Station order management view](./04-03-station-order-management.md) `P0`

### Sprint 4 — Shipment / Documents / Notifications

- [5.1 — Create shipment creation and update UI](./05-01-shipment-ui.md) `P0`
- [5.2 — Prepare logistics provider integration interface](./05-02-logistics-adapter-interface.md) `P1`
- [6.1 — Integrate object storage provider](./06-01-object-storage-integration.md) `P0`
- [6.2 — Create document upload UI](./06-02-document-upload-ui.md) `P0`
- [6.3 — Implement controlled document viewing](./06-03-controlled-document-viewing.md) `P0`
- [9.1 — Integrate email notification provider](./09-01-email-provider-integration.md) `P0`
- [9.2 — Implement notification orchestration service](./09-02-notification-orchestration.md) `P0`
- [10.1 — Implement Payment Reference model](./10-01-payment-reference-model.md) `P1`
- [10.2 — Create payment provider adapter placeholder](./10-02-payment-provider-adapter-placeholder.md) `P2`

### Sprint 5 — Proof Automation

- [7.1 — Generate proof events from order actions](./07-01-proof-events-from-order-actions.md) `P0`
- [7.2 — Generate proof events from shipment actions](./07-02-proof-events-from-shipment-actions.md) `P0`
- [7.3 — Generate proof events from document uploads](./07-03-proof-events-from-document-uploads.md) `P1`
- [7.4 — Create proof timeline UI](./07-04-proof-timeline-ui.md) `P1`

### Sprint 6 — Admin / Reporting / DD Pack

- [8.1 — Create Admin dashboard](./08-01-admin-dashboard.md) `P0`
- [8.2 — Implement user and organization admin management](./08-02-user-organization-admin.md) `P0`
- [8.3 — Implement admin correction/amendment workflow](./08-03-admin-amendment-workflow.md) `P1`
- [11.1 — Implement basic operational reporting](./11-01-basic-operational-reporting.md) `P1`
- [11.2 — Implement Data Quality Rules v1](./11-02-data-quality-rules-v1.md) `P1`
- [12.1 — Implement audit-aware access logging](./12-01-audit-aware-access-logging.md) `P1`
- [12.3 — Create Security & GDPR Note v1 documentation](./12-03-security-gdpr-note-doc.md) `P0`
- [14.1 — Create staging and production environment setup](./14-01-staging-production-setup.md) `P0`
- [14.2 — Implement CI/CD pipeline baseline](./14-02-cicd-baseline.md) `P1`
- [14.3 — Implement backup and restore baseline](./14-03-backup-restore-baseline.md) `P1`
- [15.1 — Generate MVP Architecture Diagram documentation](./15-01-mvp-architecture-doc.md) `P0`
- [15.2 — Create Core Data Model documentation](./15-02-core-data-model-doc.md) `P0`
- [15.3 — Create Build-vs-Buy Sheet documentation](./15-03-build-vs-buy-doc.md) `P0`
- [15.4 — Create IP / Vendor / Ownership Sheet documentation](./15-04-ip-vendor-ownership-doc.md) `P0`
- [16.1 — Implement complete Breeder-to-Station order journey](./16-01-end-to-end-order-journey.md) `P0`
- [16.2 — Create demo seed data](./16-02-demo-seed-data.md) `P1`
- [17.1 — Add product scope guard documentation](./17-01-phase-1-scope-guards.md) `P0`

## Review Prompt After Each Codex Run

```text
Review your implementation against the ticket file.

Return:
1. Acceptance criteria checklist
2. Files changed
3. Tests added
4. Documentation updated
5. Assumptions made
6. Anything intentionally not implemented
7. Risks or follow-up tickets
```


## Scope Guard

The following are intentionally delayed in Phase 1 unless a ticket explicitly says otherwise:

- Blockchain / token logic
- AI insights or AI claims
- Full marketplace automation
- Full equine data space automation
- Federation/studbook automation unless explicitly required
- Sensor / wearable data ingestion
- Unrestricted buyer access
- Custom authentication when managed auth is available
- Public unrestricted document links
- Vendor-owned production-critical account assumptions