# Ticket 18.22 — Permission Management UI

**Priority:** P1
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Permissions & Governance
**Recommended order:** 22
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 02-03-access-permission-v1.md, 02-02-rbac-middleware.md, 08-01-admin-dashboard.md

## Objective

Allow controlled granting and revoking of object-level permissions without creating unrestricted access paths.

## Gap Closed

AccessPermission model exists, but no UI lets admins manage grants, expiry, scope or revocation in a visible and auditable way.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Admin permission list
- Grant permission flow
- Revoke permission flow
- Set expiry date
- Select scope
- Select object type/object ID
- Show active and expired permissions
- Audit permission changes
- Prevent unrestricted buyer access

## Functional Requirements

- Admin can grant scoped permission to user/organization
- Admin can revoke permission
- Admin can set expiry
- Admin can review existing permissions for object/user
- System enforces permission changes through AccessPermission service

## Data Model / Persistence Requirements

- Use existing AccessPermission fields; add revokedAt/revokedBy/reason if needed
- Do not create broad wildcard permissions unless deliberately documented and restricted

## API / Service Requirements

- PermissionService.grant
- PermissionService.revoke
- PermissionService.listByObject
- PermissionService.listByUser or organization

## UI / UX Requirements

- Admin permission management page
- Grant form
- Revoke confirmation modal with reason optional/mandatory per policy
- Status badges for active/expired/revoked

## Security, Permissions & Audit Requirements

- Only platform admin can grant/revoke in Phase 1.1 unless policy says otherwise
- Every permission change audit logged
- Buyer view remains future permissioned generated view, not full DB access

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

- [ ] Permission management UI exists
- [ ] Admin can grant scoped permission
- [ ] Admin can revoke permission
- [ ] Expiry can be set
- [ ] Active/expired/revoked permissions visible
- [ ] Permission changes audit logged
- [ ] Unauthorized access denied
- [ ] No unrestricted buyer/full database access introduced

## Required Tests

- Test grant permission
- Test revoke permission
- Test expiry handling
- Test non-admin denied
- Test permission change audit hook

## Documentation Updates

- Update role/permission matrix with management workflow

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

/docs/tickets/phase-1-1/18-22-permission-management-ui.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.22 — Permission Management UI.

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
