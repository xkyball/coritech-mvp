# Ticket 15.3 — Create Build-vs-Buy Sheet documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Documentation / Investor DD

## Objective
Explain what CoriTech builds, buys, integrates and delays.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Sections: Build, Buy/Integrate, Delay, decision principles, detailed table, risk-to-decision mapping and phasing.
- Mark core IP as Build.
- Mark commodity infrastructure as Buy/Integrate.
- Mark speculative tech as Delay.

## Acceptance Criteria
- [ ] Build-vs-buy doc exists.
- [ ] Core IP is marked Build.
- [ ] Commodity infrastructure is marked Buy/Integrate.
- [ ] Speculative tech is marked Delay.
- [ ] Includes Phase 1 decisions.
- [ ] States MVP does not require blockchain/token.
- [ ] States AI waits until verified data exists.

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
Create docs/architecture/build-vs-buy.md for CoriTech Phase 1. Include summary columns Build, Buy/Integrate and Delay, decision principles, detailed build-vs-buy table, risk-to-decision mapping and phased implementation view. Emphasize that CoriTech builds the proof infrastructure and buys commodity services.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 15.3 — Create Build-vs-Buy Sheet documentation.

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
