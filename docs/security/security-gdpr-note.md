# Security and GDPR Note v1

## Executive Position

CoriTech Phase 1 is a controlled operational workflow for semen ordering,
shipment tracking, evidence documents, proof events and audit logs. The MVP
uses commodity infrastructure for authentication, database, object storage,
email and deployment while CoriTech owns the domain-specific trust layer:

```text
Trigger -> Documentation -> Signature -> Verification Level -> Audit Trail
```

Horse and equine transaction data is not harmless by default. Even when a field
does not identify a natural person on its face, it can reveal commercial
relationships, ownership patterns, breeding activity, location context,
veterinary or logistics information and personal contact details through
linkage.

The MVP does not require blockchain or tokens. Phase 1 proof is implemented
through controlled records, private documents, verification levels and
append-only audit evidence.

## Data Classification

| Data class | Examples | Phase 1 handling |
| --- | --- | --- |
| Account and identity data | Name, email, managed-auth subject, organization membership, active role | Managed authentication, server-resolved active context and role checks |
| Organization data | Breeder and breeding-station records, user-role assignments | Platform Admin controlled, audit logged where implemented |
| Operational order data | Listings, orders, shipment records, tracking references and workflow status | Organization-scoped role access and workflow guards |
| Evidence documents | Certificates, shipment documents, order attachments and proof-linked files | Private object storage, metadata in PostgreSQL, controlled access URLs only after authorization |
| Proof and verification data | Proof events, evidence attachments, verification level, lifecycle stage | Generated from approved workflow actions, not public-chain publishing |
| Audit and access data | Actor, role, organization, action, target object, reason, request context | Append-only diligence evidence, admin-viewable through controlled surfaces |
| Notification data | Template id, recipient context, delivery status and provider message id | Provider-neutral logging without hardcoded recipient lists |
| Payment references | External/manual provider reference, amount, currency and status | Reference-only; no card data, bank credentials, checkout or raw payment payloads |

## Roles and Permissions

Phase 1 active roles are `BREEDER`, `BREEDING_STATION` and `PLATFORM_ADMIN`.
Prepared future roles such as `VET`, `FEDERATION`, `BUYER` and `TECH_SUPPORT`
do not receive active Phase 1 access.

Permissions are enforced through:

- managed-auth sessions and server-side active context resolution;
- role, organization and object checks in the RBAC middleware;
- workflow services that validate allowed order, shipment and document actions;
- explicit object-level grants for exceptional access;
- document classification and lifecycle checks;
- audit logging for admin, document, permission and access-decision events.

The detailed role matrix lives in `docs/security/role-permission-matrix.md`.

## Proof Chain Security

The Phase 1 proof chain is evidence-based and append-only:

- workflow actions create proof and audit hooks;
- document bytes are private in object storage;
- document metadata and evidence attachments link records to proof events;
- verification levels are derived from actor/workflow context;
- corrections use amendment or lifecycle records rather than silent overwrite;
- Platform Admin review is logged and reviewable.

No public document links, unrestricted buyer access, blockchain tokens or
AI-generated proof claims are required for this MVP.

## GDPR Position

This note is not legal advice. CoriTech must assess lawful basis per data flow,
not once for the whole platform. A semen order, a notification email, a document
view, an admin support action and a future buyer-view permission may each need
their own GDPR analysis.

Consent inside the product is a permission signal, not automatically the GDPR
lawful basis. For example, a user may consent to share a generated buyer view
inside CoriTech, while the legal basis for processing the underlying operational
records may still be contract, legitimate interest, legal obligation or another
lawful basis assessed by counsel.

Open legal placeholders:

| Topic | Status |
| --- | --- |
| Controller/processor role allocation | `[PENDING_LEGAL_DECISION]` |
| Lawful basis by data flow | `[PENDING_LEGAL_DECISION]` |
| Retention schedule | `[PENDING_LEGAL_DECISION]` |
| Data subject request process | `[PENDING_LEGAL_PROCESS]` |
| Vendor DPA register | `[PENDING_VENDOR_SELECTION]` |
| International transfer assessment | `[PENDING_LEGAL_DECISION]` |

## MVP Security Controls

| Control | Phase 1 evidence |
| --- | --- |
| Managed authentication | Google/OIDC provider contract and no local password storage |
| Admin MFA requirement | Provider-level MFA requirement documented for Platform Admin |
| Role and organization scoping | Active context, role model, RBAC middleware and route guards |
| Private document storage | S3-compatible/MinIO abstraction with no public unrestricted links |
| Document access audit | Controlled access URL flow records view audit evidence |
| Append-only audit | Audit-log model and Platform Admin audit viewer |
| Permission management | Scoped, expiring and revocable object-level grants |
| Admin support boundaries | Admin order/support views inspect and route corrections without silent overwrite |
| Notification safety | Template registry, provider-neutral email adapter and delivery logs |
| Deployment separation | Local, staging and production env examples and validation |
| Backup/restore readiness | Database backup/restore helpers and object storage policy baseline |
| Account ownership | CoriTech-controlled account checklist with backup-admin requirement |
| Secrets handling | No real secrets in git; future vault placeholder documented |

## Document Access

Documents are private by default. Users do not receive raw public object-storage
links. A document view must pass role, organization, object, classification and
lifecycle checks before a short-lived controlled access URL is issued.

Document classes:

- `INTERNAL`: assigned station and Platform Admin.
- `ORDER_PARTICIPANTS`: breeder, assigned station and Platform Admin.
- `RESTRICTED`: uploader organization and Platform Admin.
- `BUYER_VIEW_ELIGIBLE`: future eligibility marker only.
- `ADMIN_ONLY`: Platform Admin only.

Revoked and superseded documents keep lifecycle evidence; they are not deleted
to hide prior proof context.

## Buyer View Boundary

Buyer view is not active in Phase 1. `BUYER_VIEW_ELIGIBLE` and buyer-related
permission terms are preparation only. A future buyer view must be generated,
read-only, explicitly permissioned, time-bounded where appropriate and filtered
to exclude internal notes, unrelated records, raw tables, credentials and
restricted documents.

## Risk-Control Mapping

| Risk | Current control | Remaining action |
| --- | --- | --- |
| Vendor-owned production account lock-in | Account ownership checklist and staging/prod setup rules | Replace placeholders with real CoriTech-owned evidence |
| Unauthorized order or document access | RBAC, active context, document classification and permission checks | Continue route-by-route audit as new workflows are added |
| Public evidence leakage | Private object storage and controlled access URLs | Confirm production bucket policy and object-storage backup settings |
| Silent correction of proof records | Amendment workflow and append-only audit/proof records | Continue to route admin corrections through amendment/support workflows |
| Credential exposure | `.env*` examples only, secret values outside git | Select CoriTech-controlled vault before production |
| Email misdelivery | Template registry, recipient rules and delivery logs | Confirm production sender domain and provider ownership |
| Data loss | Backup/restore baseline and scripts | Run staging restore drill after provider selection |
| GDPR overclaiming | Explicit legal placeholders and per-flow lawful-basis requirement | Complete legal review and DPA register before production launch |

## Due-Diligence Checklist

- Role-permission matrix reviewed and current.
- Managed-auth provider account ownership, MFA policy and recovery contacts
  evidenced.
- Platform Admin users and backup admins named.
- Database, object storage, email, monitoring, CI/CD and secrets accounts are
  CoriTech-controlled or explicitly blocked.
- No production secrets committed to source control.
- Document storage bucket is private and public links are disabled.
- Backup/restore policy and latest restore drill evidence available.
- Audit viewer and proof timeline evidence available for key workflows.
- Security/GDPR legal placeholders assigned to an owner.
- Vendor register and DPA status available.
- User-facing legal/static pages reviewed before production publication.

## Security Roadmap

| Stage | Security/GDPR work |
| --- | --- |
| Before staging demo reliance | Confirm CoriTech-owned staging accounts, backup admin access, email sender, monitoring/error account and staging restore drill |
| Before production launch | Complete legal lawful-basis review, DPA register, retention schedule, production MFA evidence, backup/restore drill and secrets vault decision |
| After MVP launch | Add formal access reviews, incident runbook, data subject request procedure and vendor access review cadence |
| Later phases | Reassess buyer view, veterinary signature, federation exchange, payment provider and logistics automation before activation |

## Explicit Non-Goals

This note does not add AI insights, blockchain/token proof, full marketplace
automation, federation automation, sensor/wearable ingestion, custom password
handling, public document links or unrestricted buyer access.
