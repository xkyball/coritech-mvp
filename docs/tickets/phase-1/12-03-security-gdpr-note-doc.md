# Ticket 12.3 — Create Security & GDPR Note v1 documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Documentation / Due Diligence

## Objective
Produce practical, not theatrical, security/GDPR documentation.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Include executive security position, data classification, roles/permissions, proof chain security, GDPR position, MVP controls, document access, buyer view, risk-control mapping, DD checklist and security roadmap.
- State horse data is not harmless by default.
- State lawful basis must be assessed per data flow.
- Distinguish consent as product permission vs GDPR lawful basis.

## Acceptance Criteria
- [ ] Document exists in /docs/security/security-gdpr-note.md.
- [ ] States horse data is not harmless by default.
- [ ] States lawful basis must be assessed per data flow.
- [ ] Distinguishes consent as product permission vs GDPR lawful basis.
- [ ] States MVP does not require blockchain or tokens.
- [ ] Includes MVP security controls.

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
Create docs/security/security-gdpr-note.md for CoriTech Phase 1. Include executive security position, data classification, roles/permissions, proof chain security, GDPR position, MVP controls, document access, buyer view, risk-control mapping, due-diligence evidence checklist and staged security roadmap. Keep it concise and due-diligence ready.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 12.3 — Create Security & GDPR Note v1 documentation.

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
