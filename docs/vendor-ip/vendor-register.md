# Vendor Register

## Purpose

This register tracks CoriTech Phase 1 vendors, vendor categories and dependency
risk for investor due diligence and operational handover. It complements the
account ownership checklist and IP assignment handover checklist.

## Control Rule

No Phase 1 vendor may be the only practical owner of production-critical source
code, accounts, secrets, documentation, design files or operational knowledge.
Vendor access must be named, scoped, reviewable and removable.

## Status Values

| Status | Meaning |
| --- | --- |
| `[PENDING_VENDOR_SELECTION]` | Vendor category is expected, but no vendor is selected. |
| `[PENDING_CONTRACT_REVIEW]` | Vendor or category needs contract/IP/DPA review before use. |
| `[PENDING_CORITECH_ACCOUNT]` | Vendor account must be created or transferred under CoriTech control. |
| `[ACTIVE_PHASE_1]` | Vendor/category is active for Phase 1 with evidence attached. |
| `[NOT_IN_PHASE_1]` | Category is tracked for future risk but not active in Phase 1. |
| `[EXIT_READY]` | Handover/export path is documented and tested where relevant. |
| `[EXCEPTION_REVIEW_REQUIRED]` | Current state does not meet the control rule. |

## Register

| Vendor type | Role | Access level | Data access | IP created | Contract required | Exit/handover requirement | Risk level | Current owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Development agency / freelancer | Build application, domain services, infrastructure scripts or documentation | Repository and task-scoped development access; no standing production secrets | Test/demo data only unless explicitly approved | Source code, tests, docs, deployment notes | MSA/SOW with IP assignment, confidentiality, open-source disclosure and no retained secrets | Source history in CoriTech repo, setup docs, dependency list, open issues, access removal | High | `[PENDING_CONFIRMATION]` | `[PENDING_CONTRACT_REVIEW]` |
| UX designer / design studio | Product flows, UI system, editable designs and assets | Design workspace access; no production system access by default | Product context and approved demo data only | Editable design files, prototypes, assets, component notes | Design/IP assignment or transferable license, font/asset license disclosure | Editable files transferred to CoriTech-controlled workspace, asset license list, export package | Medium | `[PENDING_CONFIRMATION]` | `[PENDING_CONTRACT_REVIEW]` |
| Cloud / hosting provider | Run web app, database/network infrastructure and deployment target | Cloud account admin/operator access only for CoriTech-approved admins | Runtime logs and infrastructure metadata | Configuration only; no product IP owned by vendor | Provider terms, DPA if personal data/logs are processed, support/exit terms | Resource export, deployment runbook, backup/restore path, admin transfer path | High | CoriTech required | `[PENDING_VENDOR_SELECTION]` |
| Managed auth provider | Hosted login, identity, MFA, password reset and email verification | Auth tenant admin access for CoriTech admins | Account identity data, auth events, provider subject and email | Configuration only | Provider terms, DPA, admin/recovery ownership evidence | Tenant ownership export, OAuth client settings, user export path, recovery contacts | High | CoriTech required | `[PENDING_VENDOR_SELECTION]` |
| Payment provider | Future payment processing or settlement evidence beyond manual references | No production payment account required in Phase 1 | Phase 1 uses reference-only payment metadata; no card/bank data | None in Phase 1 | Future merchant agreement/KYC/DPA before real processing | Merchant ownership, settlement/bank handover and export path before activation | High | `[NOT_IN_PHASE_1]` | `[NOT_IN_PHASE_1]` |
| Notification/email provider | Send workflow notification emails | Provider account/API key controlled by CoriTech | Email address, rendered notification content, template context and delivery metadata | Configuration and templates remain CoriTech-owned | Provider terms, DPA, sender-domain ownership | Sender/domain verification export, API key rotation, suppression/export process | Medium | CoriTech required | `[PENDING_VENDOR_SELECTION]` |
| Object storage provider | Store private evidence document bytes | Bucket/account admin access for CoriTech admins | Uploaded document bytes and storage metadata | None; storage provider owns commodity infrastructure only | Provider terms, DPA, backup/export terms | Bucket policy export, versioning/backup settings, bulk export/restore path | High | CoriTech required | `[PENDING_VENDOR_SELECTION]` |
| Database provider | Store operational, proof, audit and document metadata | Database admin access for CoriTech admins | Core application data, audit logs and proof records | None; database provider owns commodity infrastructure only | Provider terms, DPA, backup/restore terms | Logical backup, restore drill, admin transfer path, export process | High | CoriTech required | `[PENDING_VENDOR_SELECTION]` |
| Legal / GDPR adviser | Review lawful basis, DPA posture, privacy/security notes and vendor terms | Document review only unless separately approved | Legal analysis materials and approved data-flow summaries | Legal memos and review notes under agreed ownership/license | Engagement letter, confidentiality, data-processing terms if needed | Final memos, open risks, action register, contact handover | High | CoriTech | `[PENDING_VENDOR_SELECTION]` |

## Required Fields For Every Selected Vendor

When a concrete vendor is selected, replace placeholders and add:

- legal vendor name;
- named CoriTech contract owner;
- named vendor contact;
- access level and expiry/review cadence;
- data access category;
- IP or configuration created;
- required contract, DPA and confidentiality evidence;
- exit/handover evidence location;
- risk level and mitigation notes;
- current owner and backup owner;
- status and last review date.

## Review Cadence

- Review before signing a contract or statement of work.
- Review before granting repository, design, cloud, auth, storage, email,
  database or production access.
- Review before investor diligence.
- Review before final vendor payment or access removal.
- Review after provider selection, administrator change or security incident.

## Related Evidence

- `docs/vendor-ip/account-ownership-checklist.md`
- `docs/vendor-ip/ip-assignment-handover-checklist.md`
- `docs/vendor-ip/ip-vendor-ownership.md`
- `docs/integrations/external-systems-register.md`
