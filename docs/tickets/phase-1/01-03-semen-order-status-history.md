# Ticket 1.3 — Implement Semen Order model and status history

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Workflow

## Objective
Create the central MVP transaction workflow object.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement SemenOrder and OrderStatusHistory.
- Add statuses DRAFT, SUBMITTED, RECEIVED, CONFIRMED, REJECTED, IN_FULFILMENT, SHIPPED, DELIVERED, COMPLETED, CANCELLED.
- Add allowed status transitions.
- Generate unique human-readable order number.
- Record actor, role, organization, timestamp and reason on status changes.

## Acceptance Criteria
- [ ] Breeder can create draft order and submit it.
- [ ] Breeding Station can receive, confirm or reject assigned order.
- [ ] Every status change creates status history.
- [ ] Invalid status transitions are rejected.
- [ ] Status changes trigger audit/proof hooks.
- [ ] Tests cover transitions and permissions.

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
Implement SemenOrder and OrderStatusHistory for CoriTech Phase 1. Include status enum, allowed status transitions, unique order number generation, migrations, TypeScript models, API endpoints and tests. Ensure every status transition records actor, role, organization, timestamp and reason.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.3 — Implement Semen Order model and status history.

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
