# Ticket 12.2 — Create role/permission matrix documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 2 — Auth & Permissions

## Type
Documentation / Security

## Objective
Make access logic reviewable for investors, CTOs and GDPR/security reviewers.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Document roles and what each can view/create/update/confirm/upload.
- Document restrictions.
- Document Buyer View as future permissioned generated view.
- Document external technical support restrictions.

## Acceptance Criteria
- [ ] Matrix exists in /docs/security/role-permission-matrix.md.
- [ ] Covers Breeder, Breeding Station and Platform Admin.
- [ ] Prepares Vet, Federation, Buyer and Tech Support.
- [ ] States Buyer View is not full database access.
- [ ] States technical support access is restricted and time-bounded.

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
Create a role-permission matrix document for CoriTech Phase 1. Cover Breeder, Breeding Station and Platform Admin in detail, and include future roles Vet, Federation, Buyer and Tech Support. Clarify that Buyer View is a generated permissioned read-only view, not full database access.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 12.2 — Create role/permission matrix documentation.

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
