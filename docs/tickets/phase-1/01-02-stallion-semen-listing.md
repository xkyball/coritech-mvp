# Ticket 1.2 — Implement Stallion and Semen Listing model

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Product Data

## Objective
Create the catalog foundation for the semen ordering MVP wedge.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement Stallion and SemenListing entities.
- Fields include name, breed, UELN/chip where available, station ownership, availability and listing status.
- Add CRUD endpoints and basic search/filter by stallion, breed, station and availability.
- Restrict listing management to owning breeding station or admin.
- Prepare audit hook for listing changes.

## Acceptance Criteria
- [ ] Breeding Station can create and edit its own listings.
- [ ] Breeder can view active listings.
- [ ] Listings link to Stallion and Breeding Station.
- [ ] Inactive listings cannot be ordered.
- [ ] Basic search/filter works.
- [ ] Listing changes are audit logged or audit-hook-ready.

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
Implement Stallion and SemenListing models for a CoriTech semen ordering MVP. Include migrations, TypeScript types, CRUD endpoints, validation, status enums and basic search/filter functionality. Listings belong to breeding stations and reference stallions. Ensure listing changes are ready to be audit logged.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.2 — Implement Stallion and Semen Listing model.

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
