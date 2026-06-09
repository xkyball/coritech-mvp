# Ticket 16.2 — Create demo seed data

## Priority
P1

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
DevEx / Demo

## Objective
Enable repeatable demos for investors, software partners and internal testing.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Seed platform admin, breeding station, station user, breeder organization, breeder user, stallion, semen listing, sample order, shipment, document metadata, proof events and audit logs.
- Add seed/reset script.
- Document local/staging demo credentials only.

## Acceptance Criteria
- [ ] Seed script can reset demo data.
- [ ] Demo users have documented credentials for local/staging.
- [ ] Sample flow is realistic.
- [ ] No production secrets are included.
- [ ] Seed data supports E2E demo.

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
Create demo seed data for CoriTech Phase 1. Include platform admin, breeding station, station user, breeder organization, breeder user, stallion, semen listing, sample order, shipment, document metadata, proof events and audit logs. Add a seed/reset script and document demo credentials for local/staging only.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 16.2 — Create demo seed data.

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
