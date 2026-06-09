# Ticket 13.1 — Create Vendor Register documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 0 — Setup & Control

## Type
Documentation / Vendor Governance

## Objective
Track all vendors and prevent dependency risk.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Create markdown and CSV template.
- Include vendor type, role, access level, data access, IP created, contract required, exit/handover requirement, risk level, current owner and status.
- Include Phase 1 vendor types: dev agency/freelancer, UX designer, cloud, auth, payment, notification, storage, legal/GDPR adviser.

## Acceptance Criteria
- [ ] Vendor register file exists.
- [ ] Phase 1 vendor types are included.
- [ ] Each vendor has required contract and handover fields.
- [ ] Risk level is included.
- [ ] Register is suitable for investor DD.

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
Create a vendor register template for CoriTech Phase 1 in markdown and CSV format. Include vendor type, role, access level, data access, IP created, contract required, exit/handover requirement, risk level, current owner and status. Include Phase 1 vendor types such as dev agency, freelancer, UX designer, cloud, auth, payment, notification and storage providers.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 13.1 — Create Vendor Register documentation.

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
