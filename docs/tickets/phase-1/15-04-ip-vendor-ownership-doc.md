# Ticket 15.4 — Create IP / Vendor / Ownership Sheet documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Documentation / Investor DD

## Objective
Show that CoriTech owns or controls what investors fund.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Sections: ownership principles, core asset ownership matrix, vendor register, contractual control requirements, account ownership checklist, data ownership/control position, open-source dependency register, DD checklist, red flags and ownership roadmap.
- State implementation may be outsourced, ownership/control cannot.

## Acceptance Criteria
- [ ] IP/vendor/ownership doc exists.
- [ ] States implementation may be outsourced, but ownership/control cannot.
- [ ] Includes account ownership checklist.
- [ ] Includes red flags.
- [ ] Includes roadmap Phase 0 to Phase 3.
- [ ] Suitable for investor follow-up.

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
Create docs/vendor-ip/ip-vendor-ownership-sheet.md for CoriTech. Include ownership principles, core asset ownership matrix, vendor register, contractual control requirements, account ownership checklist, data ownership/control position, open-source dependency register, due-diligence checklist, red flags and ownership roadmap.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 15.4 — Create IP / Vendor / Ownership Sheet documentation.

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
