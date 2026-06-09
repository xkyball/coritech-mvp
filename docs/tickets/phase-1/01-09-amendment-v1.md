# Ticket 1.9 — Implement Correction / Amendment model v1

## Priority
P1

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Proof Integrity

## Objective
Allow corrections without silently overwriting trust-critical records.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement Amendment with target object, original value, amended value, reason, actor, approver and status.
- Statuses: DRAFT, SUBMITTED, APPROVED, REJECTED.
- Allow admin-created amendments for selected proof-relevant records.
- Link amendment to audit log and proof event where relevant.

## Acceptance Criteria
- [ ] Admin can create amendment for selected objects.
- [ ] Original value is preserved.
- [ ] Reason is mandatory.
- [ ] Amendment creates audit log.
- [ ] Amendment can link to proof event.
- [ ] No trust-critical field is silently overwritten.

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
Implement Correction/Amendment v1 for CoriTech. Create an Amendment model that preserves original value, amended value, reason, target object, actor and status. Add service logic to create amendments for proof-relevant records without silently overwriting history. Add audit log integration and tests.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.9 — Implement Correction / Amendment model v1.

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
