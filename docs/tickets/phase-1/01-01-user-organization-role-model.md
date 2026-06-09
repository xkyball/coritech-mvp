# Ticket 1.1 — Implement User, Organization and Role data model

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Data Model

## Objective
Create the actor and role foundation because proof depends on who creates, confirms, signs or views an event.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement User, Organization, Role and UserOrganizationRole.
- Support Phase 1 roles BREEDER, BREEDING_STATION and PLATFORM_ADMIN.
- Prepare future role enums for VET, FEDERATION, SALES_VENUE, BUYER and TECH_SUPPORT.
- Add migrations, TypeScript types, validation and tests.
- Prepare audit hook for role assignment.

## Acceptance Criteria
- [ ] Users can belong to one or more organizations.
- [ ] Users can hold different roles per organization.
- [ ] Role model supports Phase 1 and later phases.
- [ ] Admin user can assign roles.
- [ ] Role assignments are auditable or have clear audit hooks.
- [ ] Database migrations and unit tests are included.

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
Implement the User, Organization, Role and UserOrganizationRole data model for CoriTech Phase 1. Use a clean relational schema and TypeScript types. Support breeders, breeding stations and platform admins now, but prepare role enums for vets, federations, sales venues, buyers and technical support. Add migrations, models, validation and basic tests.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.1 — Implement User, Organization and Role data model.

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
