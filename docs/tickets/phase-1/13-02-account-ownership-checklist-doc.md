# Ticket 13.2 — Create Account Ownership Checklist documentation

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 0 — Setup & Control

## Type
Documentation / Ownership

## Objective
Ensure CoriTech controls production-critical accounts.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Create markdown and CSV checklist.
- Systems: repositories, cloud, domain registrar, DNS, email/domain workspace, CI/CD, database admin, storage buckets, monitoring/logging, error tracking, payment, auth, notifications, design tools, project management, documentation, secrets vault, analytics.
- Include current owner, required owner, admin, backup admin, DD evidence and status.

## Acceptance Criteria
- [ ] Checklist exists.
- [ ] Required owner is CoriTech for production-critical accounts.
- [ ] Admin access and backup admin columns exist.
- [ ] DD evidence column exists.
- [ ] Status column exists.
- [ ] Rule included: no production-critical account only under vendor account.

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
Create an account ownership checklist for CoriTech Phase 1 in markdown and CSV format. Include system/account, current owner, required owner, admin access held by, backup admin, due-diligence evidence and status. Include all production-critical accounts and state that no production-critical account should exist only under a vendor’s personal or agency-owned account.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 13.2 — Create Account Ownership Checklist documentation.

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
