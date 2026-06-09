# Ticket 1.5 — Implement Document Metadata and Evidence Attachment model

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Document Access

## Objective
Allow documents to support proof events without making CoriTech a generic document folder.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement Document and EvidenceAttachment.
- Store metadata and object-storage references, not raw files in DB.
- Add access classifications INTERNAL, ORDER_PARTICIPANTS, RESTRICTED, BUYER_VIEW_ELIGIBLE, ADMIN_ONLY.
- Allow documents to link to order, shipment or proof event.
- Prepare upload/view audit hooks.

## Acceptance Criteria
- [ ] Documents can be linked to order, shipment or proof event.
- [ ] File metadata is stored.
- [ ] Access classification is mandatory.
- [ ] Evidence attachments can support proof events.
- [ ] Upload and view actions are audit-hook-ready.
- [ ] No local filesystem dependency for production documents.

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
Implement Document and EvidenceAttachment models for CoriTech Phase 1. Documents should store metadata and object storage references, not raw files in the database. Support access classification, links to orders/shipments/proof events, and evidence attachment relation. Include migrations, API endpoints, validation and audit-log hooks.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.5 — Implement Document Metadata and Evidence Attachment model.

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
