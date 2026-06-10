# Ticket 18.24 — Shared UI Components

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** UI Foundation
**Recommended order:** 24
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-02-application-shell-navigation.md
**Blocks / Enables:** all dashboard/form/table tickets

## Objective

Create a small shared UI component foundation for consistent forms, tables, badges, empty/loading states and confirmation flows.

## Gap Closed

Multiple UI tickets require forms, tables and status badges, but no ticket defines reusable components, increasing inconsistency and rework.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Button
- Input
- Select
- Date input
- Textarea
- Form error display
- Status badge
- Verification level badge
- Data table shell
- Empty state
- Loading state
- Confirmation modal
- Toast or notification UI placeholder

## Functional Requirements

- Forms can reuse shared components
- Statuses display consistently across order/shipment/payment/proof
- Users see consistent loading/empty/error states
- Destructive actions use confirmation modal

## Technical Requirements

- Use the project’s chosen styling system
- Avoid importing heavy UI libraries without explicit decision
- Components should be typed and reusable
- Keep business logic out of generic components

## UI / UX Requirements

- Components should be clean, premium, investor-grade, practical and not decorative
- Support accessible labels and keyboard interaction where feasible

## Security, Permissions & Audit Requirements

- Confirmation modal should be used for destructive/revocation/cancellation actions but does not replace server permissions

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

- [ ] Shared component folder exists
- [ ] Button/Input/Select/Textarea components exist
- [ ] Form error component exists
- [ ] Status badge component exists
- [ ] Verification badge component exists
- [ ] Empty/loading states exist
- [ ] Confirmation modal exists
- [ ] Components are used in at least one existing or example page
- [ ] No feature-specific logic embedded in generic components

## Required Tests

- Render tests for core components if UI test setup exists
- Basic accessibility checks where feasible

## Documentation Updates

- Document component usage briefly in UI/readme docs

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

/docs/tickets/phase-1-1/18-24-shared-ui-components.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.24 — Shared UI Components.

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
