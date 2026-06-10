# Ticket 18.18 — Notification Template Registry

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Notifications
**Recommended order:** 18
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 09-01-email-provider-integration.md, 09-02-notification-orchestration.md

## Objective

Define notifications as a testable product surface through a template registry and event-to-template mapping.

## Gap Closed

Email provider and orchestration tickets exist, but without a template registry notifications can become scattered strings and inconsistent recipient rules.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create notification template registry
- Define templates for core order/shipment/document/admin events
- Add subject lines
- Add plain text body templates
- Optional HTML body templates
- Define event-to-template mapping
- Define recipient rules per template
- Add dev preview or snapshot-friendly output
- Add failed delivery retry placeholder if not implemented

## Functional Requirements

- Order submitted notifies station
- Order received/confirmed/rejected notifies breeder as configured
- Shipment created/updated/delivered notifies breeder
- Document uploaded notifies relevant role
- Admin action required template exists

## Technical Requirements

- Templates should use typed variables
- Missing required variables should fail safely
- Avoid hardcoded recipient emails
- Keep templates provider-agnostic

## Data Model / Persistence Requirements

- NotificationLog should reference templateId where applicable

## API / Service Requirements

- Notification orchestration resolves template by event type
- Template rendering service accepts event payload and recipient context

## UI / UX Requirements

- Developer preview route or local script optional; do not create user-facing inbox here

## Security, Permissions & Audit Requirements

- Do not include sensitive document links directly unless controlled links are intentionally short-lived and permissioned
- Avoid leaking other party private data in email templates

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

- [ ] Template registry exists
- [ ] Core Phase 1 templates defined
- [ ] Each template has subject and plain text body
- [ ] Templates use typed variables
- [ ] Event-to-template mapping exists
- [ ] Recipient rules are documented or encoded
- [ ] NotificationLog stores template reference where possible
- [ ] Tests cover rendering and missing variables

## Required Tests

- Test template rendering for core events
- Test missing variable handling
- Test event-to-template mapping
- Test no hardcoded recipient email

## Documentation Updates

- Document notification template matrix

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

/docs/tickets/phase-1-1/18-18-notification-template-registry.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.18 — Notification Template Registry.

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
