# Ticket 7.2 — Generate proof events from shipment actions

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 5 — Proof Automation

## Type
Backend / Core IP

## Objective
Turn shipment workflow updates into proof events.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Generate events for shipment created, shipment status updated and shipment delivered/confirmed.
- Link proof event to shipment and order.
- Use same service for manual and future provider-originated tracking.
- Apply verification level derivation and audit logging.

## Acceptance Criteria
- [ ] Shipment actions create proof events.
- [ ] Delivered shipment has stronger verification if station-confirmed.
- [ ] Proof event links to shipment and order.
- [ ] Audit log records event creation.
- [ ] Manual/provider tracking use same proof hook.

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
Implement proof event generation from shipment actions in CoriTech. When a shipment is created, updated or delivered, create a ProofEvent linked to shipment and order. Use verification level derivation and audit logging. Ensure manual and provider-originated tracking events can use the same service.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 7.2 — Generate proof events from shipment actions.

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
