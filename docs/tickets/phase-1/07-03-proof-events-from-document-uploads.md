# Ticket 7.3 — Generate proof events from document uploads

## Priority
P1

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 5 — Proof Automation

## Type
Backend / Core IP

## Objective
Treat documents as evidence attached to proof events, not as proof by themselves.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Document upload can create DOCUMENT_UPLOADED proof event.
- Document can be attached as EvidenceAttachment to existing proof event.
- Metadata includes uploader role and organization.
- Access classification is included.

## Acceptance Criteria
- [ ] Uploading evidence creates proof event or links to existing one.
- [ ] EvidenceAttachment is created.
- [ ] Document upload does not automatically create high verification status.
- [ ] Audit log records upload.
- [ ] Tests cover document-proof linking.

## Not in Scope
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

## Required Output
- Code changes or documentation changes required by this ticket.
- Tests where implementation changes behavior or data model.
- Migrations where data model changes.
- Documentation updates where architecture, security, data model or ownership is affected.
- Short implementation summary.
- List of assumptions and known limitations.

## Codex Execution Prompt
```text
Implement document-to-proof event linking for CoriTech. Uploading a document should create a DOCUMENT_UPLOADED proof event or attach the document as EvidenceAttachment to an existing proof event. Ensure document upload does not automatically create high verification status.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 7.3 — Generate proof events from document uploads.

Use this ticket file as the source of truth.

Rules:
- Implement only this ticket.
- Follow the acceptance criteria exactly.
- Do not implement future-phase features.
- Do not add AI, blockchain/token, full marketplace automation, federation automation, sensor/wearable ingestion or unrestricted buyer access.
- Add tests where relevant.
- Update documentation if relevant.
- Keep the architecture modular and due-diligence ready.
- Return an acceptance-criteria checklist after implementation.
```

## Review Checklist
- [ ] Scope stayed inside this ticket.
- [ ] Acceptance criteria are demonstrably met.
- [ ] Tests were added or consciously not required.
- [ ] No secrets were committed.
- [ ] No future-phase features were accidentally implemented.
- [ ] Audit/proof hooks were added where relevant.
- [ ] Ownership / transferability implications were documented where relevant.
