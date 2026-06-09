# Ticket 8.3 — Implement admin correction/amendment workflow

## Priority
P1

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Backend + Frontend / Admin / Proof Integrity

## Objective
Allow controlled corrections while preserving history.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Admin selects target record.
- Admin enters mandatory correction reason.
- System creates amendment record and audit log.
- Original value remains visible.
- Updated value is applied only through amendment process.

## Acceptance Criteria
- [ ] Admin can create amendment.
- [ ] Reason is mandatory.
- [ ] Amendment is visible in admin view.
- [ ] Original value is preserved.
- [ ] Audit trail shows correction.
- [ ] Normal users cannot silently overwrite proof-critical fields.

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
Implement admin correction/amendment workflow for CoriTech. Create UI and backend endpoints that allow a platform admin to amend selected proof-relevant records with a mandatory reason. Preserve original values, create Amendment records and audit log entries.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 8.3 — Implement admin correction/amendment workflow.

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
