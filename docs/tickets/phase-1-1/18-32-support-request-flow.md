# Ticket 18.32 — Support Request Flow

**Priority:** P2
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Support Operations
**Recommended order:** 32
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 03-04-breeder-order-detail.md, 04-03-station-order-management.md, 08-01-admin-dashboard.md, 09-02-notification-orchestration.md

## Objective

Give users a practical way to request support from within an order context.

## Gap Closed

Order detail mentions support/contact action, but no support flow, form, linked object model or admin queue is defined.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Support CTA on order detail
- Support request form
- Link request to order/object
- Category selection
- Message field
- Notify admin or create action-required item
- Admin support queue lightweight
- Status tracking optional but recommended

## Functional Requirements

- Breeder/station can create support request from authorized order
- Admin can view support requests
- Support request includes object context
- Request creation can notify admin
- User gets confirmation

## Data Model / Persistence Requirements

- Suggested SupportRequest fields: id, objectType, objectId, category, message, createdByUserId, organizationId, status, createdAt, updatedAt
- Status values: OPEN, IN_REVIEW, RESOLVED, CLOSED

## API / Service Requirements

- Create support request action
- List admin support requests
- Update support status optional

## UI / UX Requirements

- Support modal/form from order detail
- Admin support list
- Support detail or drawer optional

## Security, Permissions & Audit Requirements

- User can only create support request for authorized object
- Admin-only support queue
- Support messages may contain sensitive info and must be permissioned

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

- [ ] Support CTA exists on order detail
- [ ] Authorized user can submit support request
- [ ] Request links to order/object
- [ ] Admin can view request
- [ ] Admin notification/action item created or queued
- [ ] Unauthorized support request creation denied
- [ ] User receives confirmation
- [ ] Sensitive context not exposed to unauthorized users

## Required Tests

- Test create support request
- Test unauthorized object support denied
- Test admin list access
- Test notification/action hook if implemented

## Documentation Updates

- Document support request workflow and categories

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

/docs/tickets/phase-1-1/18-32-support-request-flow.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.32 — Support Request Flow.

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
