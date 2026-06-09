# Ticket 1.6 — Implement Proof Event model v1

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Core IP

## Objective
Create the atomic unit of CoriTech trust: an event-based proof record.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement ProofEvent with links to order, shipment and optional horse.
- Event types include SEMEN_ORDER_CREATED, SUBMITTED, CONFIRMED, REJECTED, SHIPMENT_CREATED, SHIPMENT_STATUS_UPDATED, SHIPMENT_CONFIRMED, DOCUMENT_UPLOADED, ORDER_COMPLETED, ADMIN_CORRECTION_CREATED.
- Include event trigger/source, actor, role, organization, lifecycle stage, verification level and timestamps.
- Prepare hooks for signatures/attestations later.

## Acceptance Criteria
- [ ] Proof events can be generated from order and shipment actions.
- [ ] Proof events include actor, role, organization and timestamp.
- [ ] Proof events have verification level.
- [ ] Proof events are linked to audit log or audit hook.
- [ ] Proof events cannot be silently deleted by normal users.
- [ ] Model supports later signatures and attestations.

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
Implement ProofEvent model v1 for CoriTech. It must represent workflow-generated proof, not document uploads alone. Include event type enum, trigger/source fields, actor role, organization, lifecycle stage, verification level, status and timestamps. Add migrations, model types, service methods and tests. Create hooks so order and shipment actions can generate proof events.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.6 — Implement Proof Event model v1.

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
