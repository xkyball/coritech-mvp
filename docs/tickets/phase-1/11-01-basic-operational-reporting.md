# Ticket 11.1 — Implement basic operational reporting

## Priority
P1

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Backend + Frontend / Reporting

## Objective
Give admins and operators basic visibility without overbuilding analytics.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Metrics: active listings, submitted/confirmed/rejected/completed orders, average time to confirmation, shipments, uploaded documents, proof events and documentation completion rate.
- Add admin dashboard panel.
- Use lightweight queries; do not add heavy BI stack.

## Acceptance Criteria
- [ ] Admin can view basic metrics.
- [ ] Metrics are based on real database data.
- [ ] No complex BI stack is required.
- [ ] Reporting is lightweight.
- [ ] Metrics support investor demo.

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
Implement basic operational reporting for CoriTech Phase 1. Add backend queries and an admin dashboard panel for active listings, submitted/confirmed/rejected/completed orders, average time to confirmation, shipments, uploaded documents, proof events and documentation completion rate.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 11.1 — Implement basic operational reporting.

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
