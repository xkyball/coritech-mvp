# Ticket 3.1 — Create Breeder dashboard

## Priority
P0

## Phase
Phase 1 — MVP Wedge

## Sprint / Workstream
Sprint 3 — MVP Workflow UI

## Type
Frontend / Product

## Objective
Give breeders a simple operational dashboard for semen catalog, orders and status tracking.

## CoriTech Context
CoriTech is a Verified Horse Passport & Equine Data Space. Phase 1 must create immediate operational value through semen ordering, tracking and documentation while preparing the Proof Chain.

Core proof logic:

```text
Trigger → Documentation → Signature → Verification Level → Audit Trail
```

This ticket must support the Phase 1 principle: build the domain-specific trust layer, integrate commodity infrastructure, and delay speculative technology.

## Scope
- Create dashboard sections: active listings, my orders, order status summary, recent documents, notifications/action required.
- Enforce role-based rendering.
- Link to catalog and order detail pages.
- Add loading, empty and error states.

## Acceptance Criteria
- [ ] Breeder sees only own organization context.
- [ ] Breeder can navigate to catalog.
- [ ] Breeder can create order from listing.
- [ ] Breeder can view own orders and status history.
- [ ] Breeder cannot see other breeder orders.

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
Create a Breeder Dashboard UI for CoriTech Phase 1. Include active semen listings, my orders, order status summary, recent documents and notifications/action-required area. Enforce role-based rendering so breeders only see their own organization’s data. Use clean investor-grade UI, not a marketplace-heavy design.
```

## Recommended Codex Wrapper Prompt
```text
Implement Ticket 3.1 — Create Breeder dashboard.

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
