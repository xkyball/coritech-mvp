# Ticket 1.4 — Implement Shipment and Shipment Tracking Event model

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 1 — Core Data Foundation

## Type
Backend / Integration-ready Workflow

## Objective
Capture shipment information as part of the semen order workflow and prepare future logistics integration.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Implement Shipment and ShipmentTrackingEvent.
- Statuses: PREPARED, DISPATCHED, IN_TRANSIT, DELIVERED, DELAYED, FAILED, CANCELLED.
- Event sources: MANUAL, LOGISTICS_PROVIDER, SYSTEM.
- Allow station to create shipment for confirmed order and update status.
- Prepare future logistics integration via normalized tracking events.

## Acceptance Criteria
- [ ] Station can create shipment for confirmed order.
- [ ] Station can manually update shipment status.
- [ ] Tracking events are linked to shipment.
- [ ] Tracking status update can trigger proof/audit hooks.
- [ ] Future logistics provider integration is structurally prepared.

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
Implement Shipment and ShipmentTrackingEvent models for CoriTech. Support manual tracking in MVP while preparing external logistics provider integration. Include shipment status enum, event source enum, migrations, CRUD endpoints, validation and tests. Link shipments to semen orders and make tracking events audit/proof-event ready.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 1.4 — Implement Shipment and Shipment Tracking Event model.

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
