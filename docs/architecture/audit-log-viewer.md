# Audit Log Viewer

## Purpose

The audit log viewer gives Platform Admin users a read-only way to inspect
Phase 1 audit evidence without creating a second mutation path for audit data.

## Surfaces

- `/app/admin/audit` - server-rendered Platform Admin viewer.
- `/api/admin/audit-logs` - admin-only query endpoint for the same filter and
  pagination contract.

Both surfaces require an active `PLATFORM_ADMIN` role. Non-admin users are
denied before audit records are queried.

## Supported Filters

The viewer and API support these canonical filters:

- `objectType`
- `objectId`
- `actorUserId`
- `actorOrganizationId`
- `action`
- `fromOccurredAt`
- `toOccurredAt`
- `limit`
- `page`

Unsupported action values are ignored by the viewer model rather than expanded
into future audit semantics. Timestamp filters must be valid date-time strings.

## Detail Inspection

Each row can be expanded to inspect normalized object references, previous
values, new values and metadata. The detail payload is rendered as formatted
JSON so admins can inspect the evidence shape while preserving the append-only
record as stored.

## Pagination

Pagination is page-based. The repository applies `limit` and `page` as
database `take` and `skip` values. The UI exposes previous, first-page and next
links while preserving active filters.

## Limitations

- Audit records are read-only in Phase 1.
- The viewer does not export audit logs.
- The viewer does not add audit-log amendments or corrections.
- The viewer does not expose unrestricted buyer or public audit access.
- The viewer only displays records returned by the canonical audit repository;
  it does not synthesize implementation evidence.
