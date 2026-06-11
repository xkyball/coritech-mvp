# IP, Vendor and Ownership Note

## Purpose

This starter note records the ownership posture needed for investor diligence
and future handover.

## Ownership Position

CoriTech should own or control:

- Source repository and history.
- Product requirements and architecture documentation.
- Domain workflow definitions.
- Data model and proof event model.
- Production accounts or transferable account rights.
- Evidence documents and operational records created through the platform.

## Vendor/IP Register

The Phase 1 vendor register template lives in
`docs/vendor-ip/vendor-register.md` and `docs/vendor-ip/vendor-register.csv`.

| Area | Ownership requirement | Status |
| --- | --- | --- |
| Source code | CoriTech-owned or assigned to CoriTech | `[PENDING_CONFIRMATION]` |
| Documentation | CoriTech-owned | `[PENDING_CONFIRMATION]` |
| Product designs | CoriTech-owned or licensed for unrestricted product use | `[PENDING_CONFIRMATION]` |
| Vendor-created code | Assigned to CoriTech or licensed with production rights | `[PENDING_CONTRACT_REVIEW]` |
| Cloud accounts | CoriTech-controlled or transferable | `[PENDING_VENDOR_SELECTION]` |
| Auth, storage, email and hosting providers | Contracted under CoriTech-controlled accounts | `[PENDING_VENDOR_SELECTION]` |
| Domain-specific proof logic | CoriTech-owned | `[PENDING_CONFIRMATION]` |

## Required Evidence

- Signed IP assignment or work-for-hire confirmation for contributors.
- Completed pre-signature IP assignment and handover checklist in
  `docs/vendor-ip/ip-assignment-handover-checklist.md`.
- Vendor contracts or statements of work with ownership language.
- Repository ownership evidence.
- Admin and backup admin list for production-critical accounts.
- Export or transfer process for each production-critical vendor.
- Data processing agreements where personal data is handled.
- Account ownership checklist evidence in
  `docs/vendor-ip/account-ownership-checklist.md`.
- Final handover evidence for source code, documentation, dependencies,
  design files, deployment knowledge and production secret removal.

## Explicit Rejection

Production-critical vendor-owned account assumptions are not accepted without a
documented exception, commercial rationale and transfer path. Outsourcing
delivery is acceptable only when CoriTech retains ownership, transferability and
operational handover control.
