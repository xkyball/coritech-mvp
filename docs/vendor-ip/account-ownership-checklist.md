# Account Ownership Checklist

## Purpose

This checklist records production-critical account ownership for CoriTech Phase
1 due diligence. It is the working evidence tracker for confirming that
repositories, infrastructure, operational tools and vendor-managed services are
owned or controlled by CoriTech before production use.

## Control Rule

No production-critical account may exist only under a vendor's personal,
freelancer or agency-owned account. Vendors may help configure accounts, but
CoriTech must hold the legal account relationship, primary administrator access
and at least one backup administrator for production-critical systems before
production launch.

Exceptions are not the default. Any exception must have a documented commercial
rationale, a named CoriTech owner, due-diligence evidence, a tested export or
transfer path and approval before production use.

## Status Values

| Status | Meaning |
| --- | --- |
| `[PENDING_CONFIRMATION]` | Account exists or is expected, but evidence has not been attached. |
| `[PENDING_VENDOR_SELECTION]` | Provider has not been selected. |
| `[PENDING_CORITECH_ACCOUNT]` | Provider is expected, but a CoriTech-controlled account still needs to be created. |
| `[PENDING_EVIDENCE]` | Ownership/access state is expected but supporting evidence is missing. |
| `[CONFIRMED]` | Required owner, admin access, backup admin and evidence are confirmed. |
| `[NOT_IN_PHASE_1]` | Listed for control planning only; no production use in Phase 1. |
| `[EXCEPTION_REVIEW_REQUIRED]` | Current ownership does not meet the control rule and must be resolved before production use. |

## Checklist

| System / account | Production critical | Current owner | Required owner | Admin access held by | Backup admin | DD evidence | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Source-control organization and repositories | Yes | `[PENDING_CONFIRMATION]` | CoriTech | `[CORITECH_PRIMARY_ADMIN]` | `[CORITECH_BACKUP_ADMIN]` | Organization ownership export, repository settings export, admin list, branch protection evidence | `[PENDING_CONFIRMATION]` |
| Cloud provider account | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Account owner record, billing owner record, IAM admin list, support plan owner, transfer/export notes | `[PENDING_VENDOR_SELECTION]` |
| Domain registrar account | Yes | `[PENDING_CONFIRMATION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Registrant record, account owner screenshot/export, admin list, domain lock and renewal settings | `[PENDING_CONFIRMATION]` |
| DNS provider account | Yes | `[PENDING_CONFIRMATION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | DNS zone export, account owner screenshot/export, admin list, change-control notes | `[PENDING_CONFIRMATION]` |
| Email/domain workspace | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Workspace owner export, domain verification record, admin list, recovery contacts | `[PENDING_VENDOR_SELECTION]` |
| CI/CD platform account | Yes | `[PENDING_CONFIRMATION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Pipeline owner record, connected repository evidence, deployment permission list, approval settings | `[PENDING_CONFIRMATION]` |
| Database admin account | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Database owner record, privileged role list, backup/restore owner, export procedure | `[PENDING_VENDOR_SELECTION]` |
| Object storage buckets/account | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Bucket owner record, access policy export, encryption settings, retention/export notes | `[PENDING_VENDOR_SELECTION]` |
| Monitoring/logging account | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Account owner export, admin list, retention settings, incident access notes | `[PENDING_VENDOR_SELECTION]` |
| Error tracking account | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Account owner export, project ownership, admin list, data retention/export notes | `[PENDING_VENDOR_SELECTION]` |
| Payment provider account | Conditional | `[NOT_IN_PHASE_1]` | CoriTech before production payment use | `[PENDING_FUTURE_TICKET]` | `[PENDING_FUTURE_TICKET]` | Merchant owner record, settlement/bank owner, admin list, compliance/KYC evidence | `[NOT_IN_PHASE_1]` |
| Managed auth provider account | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Tenant owner export, admin list, MFA policy evidence, domain/app client settings, recovery settings | `[PENDING_VENDOR_SELECTION]` |
| Notification provider account | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Account owner export, sender/domain verification, admin list, API key control notes | `[PENDING_VENDOR_SELECTION]` |
| Design tools workspace | Diligence critical | `[PENDING_CONFIRMATION]` | CoriTech or assigned/licensed to CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Workspace owner export, file transfer proof, contributor access list, license/assignment evidence | `[PENDING_CONFIRMATION]` |
| Project management workspace | Diligence critical | `[PENDING_CONFIRMATION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Workspace owner export, admin list, board/project export path, access review | `[PENDING_CONFIRMATION]` |
| Documentation/data-room workspace | Diligence critical | `[PENDING_CONFIRMATION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Workspace owner export, folder permission export, admin list, retention/export settings | `[PENDING_CONFIRMATION]` |
| Secrets vault | Yes | `[PENDING_VENDOR_SELECTION]` | CoriTech | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Vault owner export, administrator list, recovery policy, secret rotation evidence | `[PENDING_VENDOR_SELECTION]` |
| Analytics account | Conditional | `[PENDING_VENDOR_SELECTION]` | CoriTech before production use | `[PENDING_CORITECH_ADMIN]` | `[PENDING_BACKUP_ADMIN]` | Account owner export, property/project owner, admin list, data retention/export settings | `[PENDING_VENDOR_SELECTION]` |

## Review Requirements

- Review before production launch, before investor diligence, after vendor
  selection and after any administrator change.
- Replace placeholders with evidence references once accounts are selected or
  confirmed.
- Attach exports or screenshots in the approved CoriTech evidence location; do
  not rely on verbal vendor confirmation.
- Resolve `[EXCEPTION_REVIEW_REQUIRED]` rows before production use.
