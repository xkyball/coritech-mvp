# Ticket 18.12 — Order Activity and Comments

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Order Workflow Completeness
**Recommended order:** 12
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-03-semen-order-status-history.md, 03-04-breeder-order-detail.md, 04-03-station-order-management.md

## Objective

Add a lightweight order activity and comments layer so users see context and communication around an order, not only raw statuses.

## Gap Closed

Status history exists, but practical order communication, notes, visible comments and system activity feed are not defined.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create OrderActivity or OrderComment model
- Support system activity entries
- Support shared comments between breeder and station
- Support internal admin/station notes if needed
- Display activity on order detail
- Link activity to actor, organization and role
- Define visibility levels

## Functional Requirements

- Users can see system activity for authorized orders
- Authorized users can add shared comments
- Internal notes are visible only to permitted roles if implemented
- Status changes appear in activity feed or are linked from it
- Comments preserve timestamp and author context

## Data Model / Persistence Requirements

- Suggested fields: id, orderId, type, visibility, message, createdByUserId, createdByOrganizationId, createdByRole, createdAt
- Types: SYSTEM_STATUS, USER_COMMENT, INTERNAL_NOTE, SUPPORT_NOTE

## API / Service Requirements

- Add create comment endpoint/action
- Add list order activity endpoint/action
- Validate visibility and role permissions

## UI / UX Requirements

- Activity feed on order detail
- Comment input where allowed
- Badge/label for system vs user entries
- Empty state for no comments

## Security, Permissions & Audit Requirements

- Users can only comment on authorized orders
- Internal notes must not leak to breeders if marked internal
- Comments may be audit-relevant but do not replace audit log

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

- [ ] Order activity model exists or documented equivalent implemented
- [ ] System events can appear in order activity
- [ ] Authorized users can add comments
- [ ] Comments show actor/org/role/timestamp
- [ ] Visibility rules are enforced
- [ ] Order detail shows activity feed
- [ ] Unauthorized users cannot view or add comments

## Required Tests

- Test add comment by authorized breeder/station
- Test unauthorized access denied
- Test visibility filtering
- Test system activity creation hook if implemented

## Documentation Updates

- Document comment vs audit-log distinction

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

/docs/tickets/phase-1-1/18-12-order-activity-comments.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.12 — Order Activity and Comments.

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
