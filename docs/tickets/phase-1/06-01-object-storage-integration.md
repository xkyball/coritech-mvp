# Ticket 6.1 — Integrate object storage provider

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 4 — Shipment / Documents / Notifications

## Type
Integration / Infrastructure

## Objective
Use commodity object storage while CoriTech owns document access logic.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Configure object storage bucket.
- Upload file to storage.
- Store metadata in DB.
- Generate controlled access URL.
- Add file type and size validation.
- Add malware scanning placeholder.
- Add audit hooks for upload/view.

## Acceptance Criteria
- [ ] File upload works.
- [ ] File metadata is stored.
- [ ] Raw public links are not exposed.
- [ ] Access URL is time-limited or controlled.
- [ ] Upload creates audit log.
- [ ] Object storage account is CoriTech-controlled.

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
Integrate object storage for CoriTech document uploads. Store files in object storage and metadata in the database. Generate controlled time-limited access URLs, validate file type and size, and ensure no public unrestricted file links are exposed. Add audit log hooks for upload and view.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 6.1 — Integrate object storage provider.

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
