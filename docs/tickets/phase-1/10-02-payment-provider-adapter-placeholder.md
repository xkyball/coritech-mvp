# Ticket 10.2 — Create payment provider adapter placeholder

## Priority
P2

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 4 — Shipment / Documents / Notifications

## Type
Integration / Payment

## Objective
Prepare payment integration without overbuilding.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Create PaymentProviderAdapter interface.
- Add manual/reference adapter.
- Add placeholder for real provider.
- Document no card-data storage rule.

## Acceptance Criteria
- [ ] Payment reference can be created manually.
- [ ] Adapter pattern is documented.
- [ ] Future provider integration can be added.
- [ ] No direct payment processor lock-in.
- [ ] No sensitive payment data is stored.

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
Create a PaymentProviderAdapter interface for CoriTech with a manual/reference implementation for Phase 1. The adapter should support creating and updating PaymentReference records without storing card data. Add documentation stating CoriTech stores only payment references.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 10.2 — Create payment provider adapter placeholder.

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
