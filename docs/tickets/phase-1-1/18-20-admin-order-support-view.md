# Ticket 18.20 — Admin Order Support View

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Admin Operations
**Recommended order:** 20
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 08-01-admin-dashboard.md, 08-03-admin-amendment-workflow.md, 18-21-audit-log-viewer-ui.md

## Objective

Give platform admins a controlled order-support workspace that shows order context without enabling silent data manipulation.

## Gap Closed

Admin dashboard and amendment workflow exist, but there is no focused view for searching, inspecting and supporting real order problems.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Admin order search
- Admin order detail view
- Show status history
- Show proof timeline
- Show linked documents
- Show audit log excerpt
- Show payment/shipment/comment context if implemented
- Create amendment from order context
- Add support notes if comments/support model exists

## Functional Requirements

- Admin can search order by order number, breeder, station, status
- Admin can inspect a single order’s full operational context
- Admin can initiate amendment without direct silent overwrite
- Admin can access related audit/proof/document views

## API / Service Requirements

- Admin-only order search endpoint/query
- Admin order detail aggregation endpoint/query if needed
- Pagination for search results

## UI / UX Requirements

- Admin order search table
- Admin order detail page with tabs/sections
- Clear read-only vs action buttons
- CTA to create amendment

## Security, Permissions & Audit Requirements

- Admin access requires Platform Admin role
- Admin access is audit logged where sensitive
- No direct DB-style edit of proof-critical fields

## Out of Scope

- AI insights or predictive analytics
- Blockchain, token, wallet or digital asset logic
- Full Equine Data Space automation
- Federation / studbook automation beyond placeholders
- Sensor or wearable ingestion
- Complex marketplace automation
- Unrestricted buyer access
- Real card payment processing or storage of sensitive payment data
- Full external logistics-provider implementation unless explicitly scoped

## Acceptance Criteria

- [ ] Admin order search exists
- [ ] Admin order detail exists
- [ ] Admin can view status history
- [ ] Admin can view proof timeline
- [ ] Admin can view linked documents subject to admin policy
- [ ] Admin can view related audit logs
- [ ] Admin can start amendment from order view
- [ ] Admin cannot silently overwrite proof-critical fields
- [ ] Admin access is logged where configured

## Required Tests

- Test admin can search orders
- Test non-admin cannot access support view
- Test amendment CTA uses proper flow
- Test sensitive view audit if implemented

## Documentation Updates

- Document admin support workflow and no-silent-overwrite rule

## Common Implementation Rules

- Implement only this ticket and keep scope intentionally narrow.
- Preserve CoriTech core logic: workflow-generated proof, role-based permissions, auditability and controlled data access.
- Do not add future-phase features unless they are explicitly listed as placeholders or enums.
- Do not commit secrets, credentials, real API keys or production configuration.
- Prefer service-layer orchestration over spreading business logic across UI components or raw route handlers.
- Add or update tests where functionality is implemented.
- Update documentation when behavior, data model, API convention or operational setup changes.

## Codex Execution Prompt

```text
Implement the ticket at:

/docs/tickets/phase-1-1/18-20-admin-order-support-view.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.20 — Admin Order Support View.

Important rules:
- Keep scope limited to this ticket.
- Follow all acceptance criteria exactly.
- Do not implement AI, blockchain/token, full data-space automation, federation automation, complex marketplace automation or unrestricted buyer access.
- Do not commit secrets or real provider credentials.
- Add tests for implemented behavior.
- Update documentation if this ticket changes architecture, data model, API contract, operational workflow or user behavior.
- Return an acceptance-criteria checklist after implementation.

Expected output:
1. Files changed
2. Functional behavior implemented
3. Tests added or updated
4. Documentation updated
5. Acceptance criteria checklist
6. Assumptions made
7. Anything intentionally not implemented
8. Recommended next ticket
```
