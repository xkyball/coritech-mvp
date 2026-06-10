# Ticket 18.15 — Document Revocation and Replacement

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Document Integrity
**Recommended order:** 15
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-05-document-evidence-model.md, 06-01-object-storage-integration.md, 06-03-controlled-document-viewing.md, 01-09-amendment-v1.md

## Objective

Allow incorrect or outdated documents to be revoked or replaced without destroying proof history.

## Gap Closed

Documents can be uploaded and viewed, but there is no lifecycle for active, superseded or revoked documents.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Add document status lifecycle
- Implement revoke document action
- Implement replace document action
- Require reason for revocation/replacement
- Preserve original document metadata and storage key
- Link replacement to original document
- Show status in UI
- Audit all lifecycle changes

## Functional Requirements

- Authorized user can revoke own/allowed document according to policy
- Authorized user can replace document with a new version
- Superseded/revoked documents are clearly labelled
- Proof-relevant documents are not hard-deleted through normal UI
- Active document list can hide or group superseded documents

## Data Model / Persistence Requirements

- Document.status values: ACTIVE, SUPERSEDED, REVOKED
- Document.replacedByDocumentId or replacement group relation if implemented
- Document.revocationReason / replacementReason if chosen
- Lifecycle timestamp and actor captured through audit/amendment

## API / Service Requirements

- Revoke document service/action
- Replace document service/action
- Controlled viewing should consider document status

## UI / UX Requirements

- Document list status badge
- Replace action
- Revoke action with reason modal
- Document detail shows lifecycle history

## Security, Permissions & Audit Requirements

- Only permitted roles can revoke/replace
- Reason mandatory
- Actions audit logged
- No silent hard delete for proof-relevant documents

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

- [ ] Document status lifecycle implemented
- [ ] Document can be revoked with reason
- [ ] Document can be replaced and original becomes superseded
- [ ] Original metadata remains accessible to authorized admin/support
- [ ] Controlled viewing respects status policy
- [ ] UI displays document status
- [ ] Audit log records revoke/replace
- [ ] Tests cover lifecycle rules

## Required Tests

- Test revoke with reason
- Test revoke without reason fails
- Test replace document
- Test superseded document visibility
- Test unauthorized lifecycle change denied

## Documentation Updates

- Update document access/spec docs with lifecycle rules

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

/docs/tickets/phase-1-1/18-15-document-revocation-replacement.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.15 — Document Revocation and Replacement.

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
