# Ticket 12.1 — Implement audit-aware access logging

## Priority
P1

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Security / GDPR

## Objective
Record sensitive access, especially document views and admin access.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Log document views.
- Log admin access to sensitive records.
- Log permission changes.
- Log failed access attempts for protected objects.
- Add admin query view/API.

## Acceptance Criteria
- [ ] Sensitive view events are logged.
- [ ] Admin access is logged.
- [ ] Failed access attempts can be logged.
- [ ] Access logs include user, role, object and timestamp.
- [ ] Access logs are not editable by normal users.

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
Implement access logging for CoriTech. Log document views, admin access to sensitive records, permission changes and failed access attempts for protected objects. Reuse or extend AuditLog where appropriate. Add query endpoints for admins.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 12.1 — Implement audit-aware access logging.

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
