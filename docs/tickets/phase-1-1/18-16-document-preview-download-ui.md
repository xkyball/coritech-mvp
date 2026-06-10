# Ticket 18.16 — Document Preview and Download UI

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Document Usability
**Recommended order:** 16
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 06-03-controlled-document-viewing.md, 18-15-document-revocation-replacement.md

## Objective

Make controlled documents practically usable through preview/download UI while preserving permission checks and audit logging.

## Gap Closed

Controlled document viewing is defined technically, but users still need a concrete list, preview/download action, access-denied state and expired-link handling.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create document list component
- Create document item/detail display
- Add preview/download button
- Fetch temporary access URL through backend
- Handle access denied
- Handle expired temporary URL
- Display file metadata and document type
- Trigger view audit through controlled access path

## Functional Requirements

- Breeder can preview/download permitted order documents
- Station can preview/download permitted station/order documents
- Admin can preview/download according to admin permissions
- User sees clear message if access denied
- Temporary links are fetched just-in-time

## API / Service Requirements

- Frontend must request access URL from controlled backend endpoint
- Do not use raw storage URLs stored in DB directly

## UI / UX Requirements

- Document type badge
- File name, file size, upload date, uploader context
- Status badge for active/superseded/revoked
- Preview if browser-supported; fallback to download
- Loading and error states

## Security, Permissions & Audit Requirements

- No public unrestricted file links
- View/download access is permission-checked server-side
- Document view/download audit log is created
- Expired URL does not bypass permission

## Out of Scope

- AI insights or predictive analytics
- Blockchain, token, wallet or digital asset logic
- Full Equine Data Space automation
- Federation / studbook automation beyond placeholders
- Sensor or wearable ingestion
- Complex marketplace automation
- Unrestricted buyer access
- Real card payment processing or storage of sensitive payment data
- Full external logistics-provider implementation unless explicitly scoped

## Acceptance Criteria

- [ ] Document list UI exists
- [ ] Preview/download action uses controlled backend endpoint
- [ ] Permitted users can open documents
- [ ] Unauthorized users receive access denied
- [ ] Expired URL handling is user-readable
- [ ] File metadata displayed
- [ ] View/download audit is triggered
- [ ] No raw public storage URL is exposed in UI

## Required Tests

- Test document list rendering
- Test controlled URL fetch
- Test access denied state
- Test expired link handling if feasible
- Test no raw storage URL in rendered data where practical

## Documentation Updates

- Update document UX/access docs if present

## Common Implementation Rules

- Implement only this ticket and keep scope intentionally narrow.
- Preserve CoriTech core logic: workflow-generated proof, role-based permissions, auditability and controlled data access.
- Do not add future-phase features unless they are explicitly listed as placeholders or enums.
- Do not commit secrets, credentials, real API keys or production configuration.
- Prefer service-layer orchestration over spreading business logic across UI components or raw route handlers.
- Add or update tests where functionality is implemented.
- Update documentation when behavior, data model, API convention or operational setup changes.

## Codex Execution Prompt

```text
Implement the ticket at:

/docs/tickets/phase-1-1/18-16-document-preview-download-ui.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.16 — Document Preview and Download UI.

Important rules:
- Keep scope limited to this ticket.
- Follow all acceptance criteria exactly.
- Do not implement AI, blockchain/token, full data-space automation, federation automation, complex marketplace automation or unrestricted buyer access.
- Do not commit secrets or real provider credentials.
- Add tests for implemented behavior.
- Update documentation if this ticket changes architecture, data model, API contract, operational workflow or user behavior.
- Return an acceptance-criteria checklist after implementation.

Expected output:
1. Files changed
2. Functional behavior implemented
3. Tests added or updated
4. Documentation updated
5. Acceptance criteria checklist
6. Assumptions made
7. Anything intentionally not implemented
8. Recommended next ticket
```
