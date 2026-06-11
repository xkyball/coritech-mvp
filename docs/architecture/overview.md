# Architecture Overview

## Purpose

This document is the Phase 1 architecture starting point for CTO, software
partner and investor due diligence.

## Phase 1 System Frame

CoriTech Phase 1 is a Verified Horse Passport and Equine Data Space wedge. The
MVP creates operational value through semen ordering, tracking and documentation
while preparing the proof chain.

Core proof logic:

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

## Architecture Layers

| Layer | Phase 1 responsibility | Status |
| --- | --- | --- |
| Product workflow | Semen listing, semen order, station confirmation, shipment tracking and evidence collection | `[PENDING_IMPLEMENTATION]` |
| Proof layer | Workflow-generated proof events, verification level v1 and audit trail | Core models implemented by Tickets 1.6, 1.7 and 1.8 |
| Data layer | Core operational records and document metadata | `[PENDING_IMPLEMENTATION]` |
| Document storage | Controlled upload, storage and viewing of evidence files | Local MinIO/S3-compatible foundation added; Ticket 6.1 still owns upload, metadata, controlled access and audit behavior |
| Identity and access | Managed authentication, organization roles and permissions | Managed auth contract and role model implemented by Tickets 2.1 and 1.1; Ticket 2.2 implements framework-neutral RBAC middleware for Phase 1 route checks |
| Integrations | Email, payment provider placeholder, logistics adapter placeholder and future external system register | Email provider adapter implemented by Ticket 9.1; payment provider boundary implemented as a reference-only placeholder; logistics connector boundary implemented by Ticket 5.2; vendor/account evidence still pending |
| Deployment | Local, staging and production environments under CoriTech control | `[PENDING_ENVIRONMENT_SETUP]` |

## MVP Boundary

Phase 1 builds the domain-specific trust layer and integrates commodity
infrastructure where available. It does not implement speculative technology or
future automation.

Delayed items:

- AI insights, AI scoring and AI-generated claims.
- Blockchain/token logic or tokenized proof.
- Full data-space automation, including full equine data space automation.
- Full federation automation and full studbook automation.
- Sensor/wearable ingestion.
- Full marketplace automation.
- Unrestricted buyer access.

## Due-Diligence Notes

| Question | Current answer |
| --- | --- |
| Who owns production accounts? | Production-critical accounts, including managed auth, must be CoriTech-controlled before production use. Evidence remains tracked in the account ownership checklist. |
| Which managed auth provider is selected? | OIDC-compatible managed auth contract implemented by Ticket 2.1; concrete provider selection and tenant evidence remain pending. |
| Which object storage provider is selected? | MinIO is configured for local development only. Production S3-compatible object storage selection and CoriTech-controlled account evidence remain pending. |
| Which email provider is selected? | Ticket 9.1 adds a provider-neutral HTTP email adapter and local console sender. CoriTech-controlled provider account evidence remains pending before live use. |
| Which hosting and database providers are selected? | `[PENDING_VENDOR_SELECTION]` |
| Does CoriTech store payment data? | No card or sensitive payment data is stored. The reference-only model is documented in [Payment Reference Model](./payment-reference-model.md). |
| Where is audit evidence retained? | Ticket 1.8 stores append-only audit evidence in the CoriTech PostgreSQL `audit_logs` table with object-query indexes. |
| How do admins inspect audit evidence? | The read-only Platform Admin audit log viewer is documented in [Audit Log Viewer](./audit-log-viewer.md). |
| Where can admins see operational metrics? | Lightweight dashboard reporting is documented in [Operational Reporting](./operational-reporting.md). |
| What API and service conventions should new tickets follow? | Phase 1.1 route, response, error, validation, auth-context, pagination and service-layer conventions are documented in [API Contract and Service Conventions](./api-contract-and-service-conventions.md). |
| How are runtime and API errors displayed? | Global runtime, auth, forbidden, not-found and validation behavior is documented in [Error Handling](./error-handling.md). |
| How are app shell and navigation conventions defined? | Public/authenticated layout boundaries and role-aware navigation are documented in [Web App Shell and Navigation](./web-app-shell-and-navigation.md). |
| Where do Platform Admin users land? | The operational overview is documented in [Admin Dashboard](./admin-dashboard.md). |
| How are users, organizations and roles managed? | Platform Admin identity workflows are documented in [Admin Identity Management](./admin-identity-management.md). |
| How are real users onboarded? | Platform Admin invitations and first-time acceptance are documented in [User Invitation And Onboarding Flow](../product/onboarding-flow.md). |
| Where do semen order mutations live? | The Phase 1.1 order command layer is documented in [Order Command Service](./order-command-service.md). |
| How do admins support order issues without silent edits? | The read-only support workspace and amendment handoff are documented in [Admin Order Support](./admin-order-support.md). |
| How are order comments separated from audit evidence? | The order activity feed and comment-versus-audit boundary are documented in [Order Activity And Comments](./order-activity-comments.md). |
| How do users request order support? | Order-linked support requests, categories and the admin queue are documented in [Support Request Flow](./support-request-flow.md). |
| How are notification templates defined? | Provider-agnostic template ids, event mappings and recipient rules are documented in [Notification Template Registry](./notification-template-registry.md). |
| How are outbound emails sent? | Environment-driven provider setup, send attempt logging and ownership constraints are documented in [Email Provider Integration](./email-provider-integration.md). |
| How are workflow notifications triggered? | Order, shipment and document recipient rules are documented in [Notification Orchestration](./notification-orchestration.md). |
| How do users know what needs attention in-app? | Derived, permission-filtered dashboard action lists are documented in [Action Required Notifications](./action-required-notifications.md). |
| How are statuses labeled and explained? | Shared order, shipment, payment-reference and verification display language is documented in [Status Display System](./status-display-system.md). |
| How do list pages standardize search and pagination? | Query parameter, helper and shared UI conventions are documented in [Table Search Pagination Standard](./table-search-pagination-standard.md). |
| How are proof-critical records quality checked? | Phase 1 required-field, transition and proof-event checks are documented in [Data Quality Rules v1](./data-quality-rules-v1.md). |
| How are proof-critical corrections captured? | Platform Admin correction evidence is documented in [Admin Amendment Workflow](./admin-amendment-workflow.md). |
