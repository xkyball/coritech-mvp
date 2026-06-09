# CoriTech API Database

This directory contains database-facing assets introduced by approved Phase 1
tickets.

## Migrations

| Migration | Ticket | Purpose |
| --- | --- | --- |
| `migrations/20260609_0101_user_organization_role_model.sql` | 1.1 | Creates the `users`, `organizations`, `roles` and `user_organization_roles` foundation. |
| `migrations/20260609_0102_stallion_semen_listing_model.sql` | 1.2 | Creates station-owned `stallions` and `semen_listings` catalog tables with status enums and search indexes. |

The Ticket 1.1 migration is PostgreSQL-oriented and uses CoriTech-owned records
linked to managed authentication identities. It does not add custom
authentication, RBAC middleware, admin screens or the full audit-log table.

Role assignment writes must call the identity role-model helper so the
`ROLE_ASSIGNMENT` audit hook can be forwarded to the AuditLog implementation
introduced by Ticket 1.8.

## Catalog Notes

Ticket 1.2 adds the semen catalog foundation only. Listing writes must call the
catalog helper so the `SEMEN_LISTING_CHANGE` audit hook can be forwarded to the
future AuditLog table introduced by Ticket 1.8.

`semen_listings.listing_status = 'INACTIVE'` records must not be orderable.
Order creation remains owned by a later ticket and must call the catalog
orderability helper before accepting an order.
