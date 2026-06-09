# Ticket 3.4 — Create Breeder order detail view

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 3 — MVP Workflow UI

## Type
Frontend / Workflow

## Objective
Allow breeder to track order status, shipment and documents.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Sections: order summary, current status, status history, shipment information, linked documents, proof events, support/contact action.
- Integrate permission-aware document list.
- Display simple proof event timeline when available.

## Acceptance Criteria
- [ ] Breeder can view own order detail.
- [ ] Status history is visible.
- [ ] Shipment status is visible if available.
- [ ] Linked documents are visible subject to permissions.
- [ ] Proof events are displayed in simple form.
- [ ] Unauthorized order access is blocked.

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
Create the Breeder Order Detail page for CoriTech. Include order summary, current status, status history, shipment information, linked documents and simple proof event timeline. Ensure permission checks prevent viewing unrelated orders.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 3.4 — Create Breeder order detail view.

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
