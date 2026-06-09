# Ticket 14.3 — Implement backup and restore baseline

## Priority
P1

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 6 — Admin / Reporting / DD Pack

## Type
Infrastructure / Resilience

## Objective
Ensure MVP data can be backed up and restored.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Set automated database backup or documented provider backup.
- Define object storage backup policy.
- Document restore test procedure.
- Add RPO/RTO placeholders.
- Ensure backup admin access.

## Acceptance Criteria
- [ ] Backup policy exists.
- [ ] Database backup can be triggered or provider backup is documented.
- [ ] Restore procedure is documented.
- [ ] Backup admin exists.
- [ ] Evidence can be shown in DD.

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
Create backup and restore baseline for CoriTech. Add documentation for automated database backups, object storage backup policy, restore test procedure, RPO/RTO placeholders and backup admin access. Implement scripts or infrastructure configuration where appropriate.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 14.3 — Implement backup and restore baseline.

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
