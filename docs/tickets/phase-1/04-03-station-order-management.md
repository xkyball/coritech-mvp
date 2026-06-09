# Ticket 4.3 — Create Station order management view

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 3 — MVP Workflow UI

## Type
Frontend / Workflow

## Objective
Allow station to process incoming semen orders.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Actions: view submitted order, mark received, confirm, reject, add reason/comment, move to fulfilment, create shipment, upload documents.
- Enforce allowed status transitions.
- Connect actions to proof/audit hooks.

## Acceptance Criteria
- [ ] Station can only manage orders assigned to its organization.
- [ ] Confirmed order creates SEMEN_ORDER_CONFIRMED proof event.
- [ ] Rejected order creates status history.
- [ ] All station actions create audit logs.
- [ ] Station can add reason/comment.
- [ ] Invalid transitions are blocked.

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
Create Station Order Management UI for CoriTech. Stations can view submitted orders, mark received, confirm, reject, add comments, move to fulfilment, create shipment and upload documents. Enforce valid status transitions and organization permissions.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 4.3 — Create Station order management view.

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
