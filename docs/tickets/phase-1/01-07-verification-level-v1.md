# Ticket 1.7 — Implement Verification Level taxonomy v1

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Core IP

## Objective
Make trust strength visible and structured from the beginning.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Add verification level enum: SELF_REPORTED, SYSTEM_RECORDED, STATION_CONFIRMED, ADMIN_REVIEWED.
- Prepare future values VET_SIGNED, FEDERATION_ATTESTED and VERIFIED_FOR_TRANSACTION.
- Implement derivation service based on event type and actor role.
- Add UI-ready labels/badges metadata.

## Acceptance Criteria
- [ ] Proof event requires verification level.
- [ ] Verification level can be derived from event type and actor role.
- [ ] Future levels exist but are marked not active in Phase 1.
- [ ] Tests validate derivation rules.
- [ ] Documentation explains the taxonomy.

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
Implement VerificationLevel taxonomy v1 for CoriTech. Add enum values for SELF_REPORTED, SYSTEM_RECORDED, STATION_CONFIRMED and ADMIN_REVIEWED, with future-ready values for VET_SIGNED, FEDERATION_ATTESTED and VERIFIED_FOR_TRANSACTION. Add a service that derives verification level from event type and actor role. Add tests.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.7 — Implement Verification Level taxonomy v1.

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
