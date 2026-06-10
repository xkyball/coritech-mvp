# Ticket 18.04 — User Invitation and First-Time Onboarding Flow

**Priority:** P0
**Phase:** Phase 1.1 — MVP Gap Closure
**Epic:** Authentication & Onboarding
**Recommended order:** 4
**Source:** ENGINE_v3 gap analysis between Phase 1 ticket pack and complete usable MVP
**Depends on:** 02-01-auth-provider.md, 08-02-user-organization-admin.md, 09-01-email-provider-integration.md
**Blocks / Enables:** real breeder/station onboarding

## Objective

Create the practical process by which a platform admin invites breeders or station users into CoriTech and connects them to the right organization and role.

## Gap Closed

Admin user management and authentication exist as separate concepts, but there is no end-to-end user onboarding path for real users.

## Context

This ticket closes a practical application gap so the Phase 1 MVP becomes usable end-to-end, not just architecturally defined.

## Scope

- Admin creates invitation for a user email
- Invitation references organization and intended role
- System generates invite token or provider invite link
- Invitation email is sent or queued
- Accept-invite page exists
- First-time user completes profile basics
- Expired/used/invalid invite states are handled
- User is mapped to organization and role after acceptance

## Functional Requirements

- Admin can invite Breeder or Station users
- User receives or can be shown an invitation link
- User can accept the invitation
- User record is created or linked
- UserOrganizationRole assignment is created
- User sees correct role context after first login

## Data Model / Persistence Requirements

- Invitation entity or provider-equivalent mapping must include email, organizationId, role, status, expiresAt, invitedByUserId, acceptedAt
- Invitation status should support PENDING, ACCEPTED, EXPIRED, REVOKED

## API / Service Requirements

- Create invitation endpoint/service
- Accept invitation endpoint/service
- Validate invitation token
- Revoke invitation optional for P0 if documented

## UI / UX Requirements

- Admin invite form
- Accept invite page
- Expired invite page/state
- First-time profile completion form
- Clear confirmation after successful onboarding

## Security, Permissions & Audit Requirements

- Invite tokens must be unguessable and expire
- Invitation must not grant role until accepted/validated
- Role assignment must be audit logged
- Admin-only creation of invitations

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

- [ ] Admin can create user invitation for organization and role
- [ ] Invitation has expiry
- [ ] User can accept valid invitation
- [ ] Invalid/expired invitation is rejected with clear UI
- [ ] Accepted invitation creates or links User
- [ ] Accepted invitation creates UserOrganizationRole
- [ ] Role assignment is audit logged
- [ ] User lands in correct area after onboarding
- [ ] No open self-registration into privileged roles

## Required Tests

- Test invite creation permission
- Test valid invite acceptance
- Test expired/invalid invite rejection
- Test role assignment after acceptance

## Documentation Updates

- Document onboarding flow in /docs/product or /docs/security
- Document invite ownership and expiry assumptions

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

/docs/tickets/phase-1-1/18-04-user-invitation-onboarding-flow.md

Use this ticket file as the source of truth.

Task:
Implement only Ticket 18.04 — User Invitation and First-Time Onboarding Flow.

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
