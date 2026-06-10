# Ticket 18.06 — Stallion Management UI

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Station Product Operations
**Recommended order:** 6
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 01-02-stallion-semen-listing.md, 04-02-listing-management-ui.md
**Blocks / Enables:** station-created semen listings with real stallion data

## Objective

Allow breeding stations to create, edit and manage stallion records that semen listings depend on.

## Gap Closed

The Phase 1 pack includes Stallion/SemenListing models and listing management, but no explicit UI for station users to manage Stallion records themselves.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Create Station Stallion List
- Create Stallion form
- Edit Stallion form
- Activate/inactivate stallion
- Link stallion to listing creation flow
- Validate required fields
- Show ownership/organization context
- Audit stallion changes

## Functional Requirements

- Station user can view own stallions
- Station user can create stallion
- Station user can edit own stallion
- Station user cannot manage another station’s stallion
- Inactive stallions cannot be used for new active listings unless explicitly allowed

## API / Service Requirements

- Use existing stallion CRUD endpoints or implement missing station-safe endpoints
- Enforce organization ownership server-side

## UI / UX Requirements

- Stallion list with search by name/UELN/chipId where fields exist
- Create/edit form with clear required fields
- Status badge for active/inactive
- CTA from stallion detail to create listing

## Security, Permissions & Audit Requirements

- All create/edit/deactivate actions require Station role in active organization
- Changes create audit log entries

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

- [ ] Station stallion list page exists
- [ ] Station can create stallion for own organization
- [ ] Station can edit own stallion
- [ ] Station cannot edit other station stallions
- [ ] Station can activate/inactivate stallion
- [ ] Listing flow can select a stallion
- [ ] Required fields are validated
- [ ] Stallion changes are audit logged

## Required Tests

- Test station can create own stallion
- Test cross-organization access denied
- Test validation errors
- Test inactive stallion behavior

## Documentation Updates

- Update station workflow docs if present

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

/docs/tickets/phase-1-1/18-06-stallion-management-ui.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.06 — Stallion Management UI.

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
