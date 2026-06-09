# Security and GDPR Note

## Purpose

This starter note records the Phase 1 security and privacy posture for technical
due diligence. It is not legal advice.

## Data Classes

| Data class | Examples | Phase 1 handling |
| --- | --- | --- |
| Account data | User name, email, organization, role | Managed auth and role-based access |
| Operational data | Listings, orders, shipment references, statuses | Authenticated access only |
| Evidence documents | Certificates, order documents, shipment evidence | Controlled storage and restricted viewing |
| Audit data | Actor, timestamp, action, target object, amendment reason | Retained for diligence and operational accountability |
| Payment reference data | External reference IDs or manual payment notes | No payment processing unless later approved |

## Security Principles

- Use managed authentication where available.
- Enforce least-privilege role access.
- Prevent public unrestricted document links.
- Store secrets outside version control.
- Keep production-critical accounts CoriTech-owned or transferable.
- Log access and changes to proof-relevant records.
- Prefer provider controls with exportable audit evidence.

## GDPR and Privacy Placeholders

| Topic | Placeholder |
| --- | --- |
| Controller/processor roles | `[PENDING_LEGAL_DECISION]` |
| Lawful basis | `[PENDING_LEGAL_DECISION]` |
| Data residency | `[PENDING_LEGAL_DECISION]` |
| Retention period | `[PENDING_LEGAL_DECISION]` |
| Data subject request process | `[PENDING_LEGAL_PROCESS]` |
| Vendor data processing agreements | `[PENDING_VENDOR_SELECTION]` |

## Explicit Non-Goals

Phase 1 does not include AI profiling, blockchain/token proof, unrestricted
buyer access, public document links, sensor/wearable ingestion or automated
federation data exchange. Full data-space automation and full federation
automation are delayed.
