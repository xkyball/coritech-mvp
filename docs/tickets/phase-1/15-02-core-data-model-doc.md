# Ticket 15.2 — Create Core Data Model documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Documentation / Data Model

## Objective
Document the data model behind verified horse records.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Include Horse Identity Core, Actors/Organizations/Roles, Workflow & Transaction Wedge, Proof Chain/Lifecycle Events, Verification/Signatures/Trust, Permissions/Consent/Views/Audit and external references.
- Use entity tables and Mermaid ER diagram where useful.
- Define key relationships.

## Acceptance Criteria
- [ ] Core data model doc exists.
- [ ] Includes ER-style Mermaid diagram or clear tables.
- [ ] Defines core entities.
- [ ] Defines key relationships.
- [ ] States passport is generated trust view, not static PDF.
- [ ] States buyer view is generated permissioned view.

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
Create docs/data-model/core-data-model.md for CoriTech. Include conceptual data domains, entity tables, relationship table and Mermaid ER diagram if possible. Explain Horse + Actor + Role + Event + Signature + Verification + Consent + Audit = Trusted Horse Passport.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 15.2 — Create Core Data Model documentation.

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
