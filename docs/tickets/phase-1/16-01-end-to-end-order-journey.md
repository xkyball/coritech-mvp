# Ticket 16.1 — Implement complete Breeder-to-Station order journey

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
End-to-End / Product

## Objective
Deliver the first complete working MVP journey.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- End-to-end flow: admin creates station/user, station creates stallion/listing, breeder views listing, creates order, station confirms, creates shipment, uploads document, breeder views status/document, proof timeline and audit log show events.
- Add E2E test script.
- Support staging demo.

## Acceptance Criteria
- [ ] Journey works in staging.
- [ ] Required proof events are created.
- [ ] Required audit logs are created.
- [ ] Notifications are triggered.
- [ ] Permissions are enforced.
- [ ] Demo data can be seeded.
- [ ] Investor demo can be run.

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
Implement and test the full CoriTech Phase 1 end-to-end journey: admin creates station and users, station creates stallion/listing, breeder creates order, station confirms, creates shipment and uploads document, breeder tracks status, proof timeline shows events and audit log records actions. Add seed data and an end-to-end test script.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 16.1 — Implement complete Breeder-to-Station order journey.

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
