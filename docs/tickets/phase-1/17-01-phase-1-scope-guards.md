# Ticket 17.1 — Add product scope guard documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Documentation / Product Governance

## Objective
Prevent Phase 1 from becoming too broad.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Document delayed items: AI Insights, Blockchain/Token Layer, Full Equine Data Space Automation, Federation Automation, Sensor/Wearable Data Ingestion, Complex Marketplace Automation, Predictive Horse Performance Analytics, Wallet/Digital Asset Layer.
- Explain why each is delayed.
- Label delayed backlog items as Later/Optional.

## Acceptance Criteria
- [ ] Scope guard doc exists.
- [ ] Each delayed item has reason.
- [ ] Product backlog labels delayed items as Later / Optional.
- [ ] Architecture avoids hard dependency on delayed items.
- [ ] Investor narrative is clear: delay is discipline, not weakness.

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
Create docs/product/phase-1-scope-guards.md for CoriTech. List explicitly delayed items: AI insights, blockchain/token, full data space automation, federation automation, sensor/wearable ingestion, complex marketplace automation, predictive analytics and wallet/digital asset layer. Explain why each is delayed and how Phase 1 remains proof-chain-ready without them.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 17.1 — Add product scope guard documentation.

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
