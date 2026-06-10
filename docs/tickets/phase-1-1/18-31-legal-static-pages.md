# Ticket 18.31 — Legal and Static App Pages

**Priority:** P2
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Public App Completeness
**Recommended order:** 31
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 18-01-application-scaffold.md

## Objective

Add basic static legal and support-facing pages/placeholders so the application is not an internal-only shell.

## Gap Closed

Security/GDPR documentation exists for due diligence, but the app lacks user-facing static pages such as privacy, terms, imprint/company details and contact/support placeholders.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Privacy Policy placeholder page
- Terms placeholder page
- Imprint/company details placeholder page
- Contact/support placeholder page
- Footer links from public/auth pages
- Data access note placeholder

## Functional Requirements

- Users can access static pages without app errors
- Pages clearly indicate placeholder/legal-review status where final text is not approved
- Footer includes links to static pages

## UI / UX Requirements

- Simple readable layout
- Consistent with public layout
- No heavy marketing site required

## Security, Permissions & Audit Requirements

- Do not make unreviewed legal claims as final
- Use placeholders where legal counsel review is required
- Do not expose private contact details unless approved

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

- [ ] Privacy page exists
- [ ] Terms page exists
- [ ] Imprint/company page exists
- [ ] Contact/support page exists
- [ ] Footer links exist
- [ ] Placeholder/legal-review status is clear
- [ ] No product workflow dependency introduced

## Required Tests

- Basic route rendering tests if available

## Documentation Updates

- Document that legal pages require final legal review before production

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

/docs/tickets/phase-1-1/18-31-legal-static-pages.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.31 — Legal and Static App Pages.

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
