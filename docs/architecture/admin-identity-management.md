# Admin Identity Management

## Purpose

Admin identity management lets Platform Admin users manage Phase 1 users,
organizations and role assignments without deleting critical history or creating
unrestricted access paths.

## Surfaces

- `/app/admin/users` - review users, assign roles and disable users.
- `/app/admin/invitations` - create and review invitation links for breeder
  and breeding-station users.
- `/app/admin/organizations` - create, edit and disable organizations.
- `/app/admin/roles` - review active Phase 1 and prepared future roles.

All routes require an active `PLATFORM_ADMIN` context.

## Supported Actions

- Create organizations.
- Edit organization name and type.
- Disable organizations.
- Assign existing active users to active organizations with an assignable Phase
  1 role.
- Disable users.
- Create breeder or breeding-station invitations with queued email delivery and
  expiring token links.

Role assignments use the domain role-assignment helper and create
`CHANGE_PERMISSION` audit logs. User and organization admin changes create
`ADMIN_EDIT` audit logs.

## Disabled Access

Disabled users cannot create managed-auth sessions. Disabled organizations are
filtered out of session role context, so their assignments do not produce an
active app context.

## No-Delete Policy

The admin UI disables users and organizations instead of deleting them. Role
assignment rows are preserved for audit and due-diligence review.

## Invitation Workflow

Ticket 18.04 implements invitation tokens, queued invitation links, acceptance
pages and first-time onboarding. The detailed product flow and expiry/provider
assumptions are documented in
[User Invitation And Onboarding Flow](../product/onboarding-flow.md).
