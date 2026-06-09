# Ticket 6.2 — Create document upload UI

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 4 — Shipment / Documents / Notifications

## Type
Frontend / Documents

## Objective
Allow users to upload documents linked to orders, shipments or proof events.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Create upload UI with document type, linked object, access classification, upload progress and error handling.
- Document types v1: Shipment Document, Station Confirmation, Certificate, Vet Report prepared, Other Evidence.
- Use backend object storage API.

## Acceptance Criteria
- [ ] Station can upload document to order.
- [ ] Breeder can upload allowed documents.
- [ ] Document is linked to object.
- [ ] Access classification is required.
- [ ] Upload progress/success state shown.
- [ ] Upload creates audit log.

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
Create document upload UI for CoriTech. Support uploads linked to orders, shipments and proof events. Include document type, access classification, progress state, validation and error handling. Ensure uploads use the backend object storage API.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 6.2 — Create document upload UI.

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
