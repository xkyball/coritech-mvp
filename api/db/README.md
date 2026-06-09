# CoriTech API Database

This directory contains database-facing assets introduced by approved Phase 1
tickets.

## Migrations

| Migration | Ticket | Purpose |
| --- | --- | --- |
| `migrations/20260609_0101_user_organization_role_model.sql` | 1.1 | Creates the `users`, `organizations`, `roles` and `user_organization_roles` foundation. |

The Ticket 1.1 migration is PostgreSQL-oriented and uses CoriTech-owned records
linked to managed authentication identities. It does not add custom
authentication, RBAC middleware, admin screens or the full audit-log table.

Role assignment writes must call the identity role-model helper so the
`ROLE_ASSIGNMENT` audit hook can be forwarded to the AuditLog implementation
introduced by Ticket 1.8.
