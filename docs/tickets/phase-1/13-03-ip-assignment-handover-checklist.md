# Ticket 13.3 — Create IP assignment and handover checklist

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 0 — Setup & Control

## Type
Documentation / Legal-Technical Control

## Objective
Ensure implementation can be outsourced without losing ownership.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Create checklist for IP assignment, source code delivery, company-owned repo, documentation, handover, open-source disclosure, dependency list, confidentiality, exit support, no production secrets retention, design file transfer and deployment knowledge transfer.
- Apply to dev agencies, freelancers and UX/UI designers.
- Clarify acceptable outsourcing vs unacceptable ownership loss.

## Acceptance Criteria
- [ ] Checklist exists.
- [ ] Applies to dev agency, freelancer and UX/UI designer.
- [ ] Separates acceptable outsourcing from unacceptable ownership loss.
- [ ] Can be used before signing vendor contracts.

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
Create an IP assignment and handover checklist for CoriTech vendors. Include source code delivery, CoriTech-owned repositories, IP assignment, documentation, handover, open-source disclosure, dependency list, confidentiality, exit support, no retention of production secrets, design file transfer and deployment knowledge transfer.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 13.3 — Create IP assignment and handover checklist.

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
