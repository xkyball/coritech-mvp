# User Invitation And Onboarding Flow

## Purpose

Ticket 18.04 adds the practical path for bringing breeder and breeding-station
users into CoriTech without opening self-registration into privileged roles.

## Admin Workflow

Platform Admin users create invitations at `/app/admin/invitations`.

Each invitation records:

- invitee email
- target organization
- intended Phase 1 role, limited to `BREEDER` or `BREEDING_STATION`
- status: `PENDING`, `ACCEPTED`, `EXPIRED` or `REVOKED`
- expiry timestamp
- inviting Platform Admin user and organization
- accepted timestamp, accepted user and accepted role assignment when complete
- queued email-delivery status

Invite tokens are generated as unguessable random tokens and only the token hash
is stored. The raw token appears in the invitation link only at creation time.

## Invitee Workflow

The invitation link opens `/accept-invite?token=...`.

A valid pending invitation shows the invited email, organization, role and
expiry. The invitee completes profile basics by entering a display name. On
acceptance, CoriTech creates or links the user record, creates the
`UserOrganizationRole`, records the role-assignment audit log and sends the user
to managed login with the assigned workspace as the return target.

Invalid, expired, accepted or revoked invitations render clear unavailable
states and do not create users or roles.

## Email And Provider Boundary

Ticket 18.04 queues invitation email delivery and exposes the invitation link.
Concrete email-provider delivery remains owned by Ticket 9.1. Managed
authentication remains provider-owned; CoriTech does not collect passwords.

Accepted invitations create an internal user with an invitation-placeholder
managed-auth subject when no user exists yet. During the first managed-auth
login, only that invitation-placeholder user may be claimed by a matching
provider email. This keeps invite acceptance compatible with managed auth
without enabling open email self-registration.

## Security Assumptions

- Only active Platform Admin users can create invitations.
- The public accept page never lets users choose a role or organization.
- Invitation acceptance grants the role only after token validation.
- Invitations expire by default after seven days and can be configured up to 30
  days from the admin form.
- Revocation is represented in the data model, but the P0 UI does not expose a
  revoke action yet.
