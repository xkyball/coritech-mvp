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
| Document storage | Controlled upload, storage and viewing of evidence files | `[PENDING_VENDOR_SELECTION]` |
| Identity and access | Managed authentication, organization roles and permissions | Managed auth contract and role model implemented by Tickets 2.1 and 1.1; Ticket 2.2 implements framework-neutral RBAC middleware for Phase 1 route checks |
| Integrations | Email, logistics adapter placeholder, payment reference placeholder and future external system register | `[PENDING_VENDOR_SELECTION]` |
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
| Which object storage provider is selected? | `[PENDING_VENDOR_SELECTION]` |
| Which hosting and database providers are selected? | `[PENDING_VENDOR_SELECTION]` |
| Where is audit evidence retained? | Ticket 1.8 stores append-only audit evidence in the CoriTech PostgreSQL `audit_logs` table with object-query indexes. |
