# Ticket 18.11 — Order Rejection and Cancellation Flow

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Order Workflow Completeness
**Recommended order:** 11
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-09-order-command-service.md, 03-04-breeder-order-detail.md, 04-03-station-order-management.md

## Objective

Make negative order outcomes explicit, reasoned and auditable instead of informal status changes.

## Gap Closed

REJECTED and CANCELLED statuses exist, but no complete policy defines reasons, allowed actors, allowed states, UI modals, notifications and proof/audit behavior.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Define rejection policy for station
- Define cancellation policy for breeder/admin
- Require reason for rejection/cancellation
- Add reason modal UI
- Add status transition guards
- Notify affected parties
- Create audit logs
- Create proof events where appropriate

## Functional Requirements

- Station can reject allowed orders with reason
- Breeder can cancel own draft or submitted order according to policy
- Admin can cancel/amend with reason where support policy allows
- Reasons are visible to relevant parties
- Negative status closes or restricts further workflow actions

## Data Model / Persistence Requirements

- Store reason in OrderStatusHistory or dedicated order decision fields
- Capture actor, role, organization, timestamp and previous status

## API / Service Requirements

- OrderService.rejectOrder
- OrderService.cancelOrder
- Validation for mandatory reason
- Transition guard for allowed statuses

## UI / UX Requirements

- Reject modal for station
- Cancel modal for breeder/admin
- Status detail shows reason
- Dashboard removes or updates action-required state

## Security, Permissions & Audit Requirements

- Only assigned station can reject
- Only owning breeder/admin can cancel according to policy
- All negative transitions audit logged

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

- [ ] Station rejection requires reason
- [ ] Breeder cancellation requires reason where policy requires
- [ ] Allowed cancellation statuses are defined and enforced
- [ ] Rejected/cancelled orders cannot continue normal fulfilment
- [ ] Relevant notifications are sent or queued
- [ ] Audit log records decision
- [ ] Status history records reason
- [ ] UI shows reason to authorized users

## Required Tests

- Test rejection with reason
- Test rejection without reason fails
- Test cancellation policy by status
- Test unauthorized cancellation/rejection denied
- Test post-rejection actions blocked

## Documentation Updates

- Document rejection/cancellation policy

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

/docs/tickets/phase-1-1/18-11-order-rejection-cancellation-flow.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.11 — Order Rejection and Cancellation Flow.

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
