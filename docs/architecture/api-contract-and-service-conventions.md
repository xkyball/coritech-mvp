# API Contract and Service Conventions

## Purpose

This document is the Phase 1.1 convention for CoriTech API routes, server
actions and service-layer boundaries. New backend routes and mutation actions
must follow this convention so auth, validation, permission failures, audit
hooks and proof hooks stay predictable across tickets.

## Route Naming

API routes and server actions use product nouns and explicit workflow verbs.
Prefer stable resource paths over UI-specific names.

| Route kind | Convention | Example |
| --- | --- | --- |
| Collection read | `GET /api/<resource>` | `GET /api/orders` |
| Item read | `GET /api/<resource>/<id>` | `GET /api/orders/ord_123` |
| Collection command | `POST /api/<resource>` | `POST /api/orders` |
| Item command | `POST /api/<resource>/<id>/<command>` | `POST /api/orders/ord_123/receive` |
| Server action | `<verb><Resource>` | `submitOrder` |

Routes stay thin: parse input, resolve auth context, call the service, map the
result to the standard response shape and return.

## Response Shapes

Successful responses wrap returned data in `data`. If a command has no useful
payload, return a small confirmation object rather than `null`.

```json
{
  "data": {
    "id": "ord_123",
    "status": "SUBMITTED"
  }
}
```

List responses use `items` plus one pagination strategy. Cursor pagination is
preferred for mutable operational records; page pagination is acceptable for
small administrative lists.

```json
{
  "data": {
    "items": [],
    "page": {
      "cursor": "next_cursor",
      "hasMore": false
    }
  }
}
```

When exact totals are expensive or could reveal sensitive object existence,
omit `total`. Do not mix cursor and page-number fields in one response.

## Error Shape

Errors use one predictable envelope and never expose stack traces, SQL, secrets,
provider tokens or internal payloads.

```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Check the highlighted fields and try again.",
    "details": {
      "issues": [
        {
          "field": "quantity",
          "message": "Quantity must be at least 1."
        }
      ]
    }
  }
}
```

Use stable `code` values for frontend behavior. `message` is safe to display to
users. `details` is optional and must contain only safe, non-secret context.
Frontend mapping and runtime error surfaces are documented in
[Error Handling](./error-handling.md).

## Status Semantics

| Status | Meaning |
| --- | --- |
| `401 Unauthorized` | No valid authenticated session was resolved. Redirect or guide the user to login. |
| `403 Forbidden` | The user is authenticated but lacks permission in the active context. Do not reveal whether a sensitive object exists. |
| `404 Not Found` | The resource is public to the actor's context but does not exist, or the route itself is unknown. |
| `409 Conflict` | The request conflicts with current state, such as an invalid workflow transition or stale update. |
| `422 Unprocessable Entity` | The request was understood but failed validation. Include safe validation details. |
| `500 Internal Server Error` | Unexpected failure. Return a safe generic message and log through the runtime hook. |

For sensitive order, document, proof and permission objects, prefer controlled
`403` behavior when disclosing existence would leak business information.

## Validation Pattern

Use explicit parser/normalizer functions near the service or route boundary.
The current codebase uses framework-neutral validation helpers and typed
validation errors in `packages/domain`; continue that pattern unless a later
ticket selects a shared validation library.

Validation helpers should:

- Coerce only safe transport differences, such as trimming strings.
- Reject missing required fields with human-readable issues.
- Return normalized command objects for services.
- Throw typed validation errors that can map to `422`.
- Avoid accepting future-phase enum values unless the ticket explicitly enables
  them.

## Auth Context

Every protected route or mutation resolves one active context before calling a
service.

```ts
type ActiveRequestContext = {
  userId: string;
  organizationId: string;
  role: "BREEDER" | "STATION" | "PLATFORM_ADMIN";
};
```

The browser may request a preferred organization/role, but the server validates
that selection against the user's assigned roles. Services must receive the
validated active context, not raw client claims.

Users with no valid active organization and role are routed to the no-role or
role-selection flow instead of receiving partial protected data.

## Service Layer

Services live in `packages/domain/src/<area>/` unless a later architecture
ticket creates a dedicated application package. A service owns business rules
for one workflow area. Routes, pages and server actions must not duplicate those
rules.

Service responsibilities:

- Validate active organization and role context for mutations.
- Load current state through a repository interface.
- Apply domain transition or command rules.
- Execute writes through the provided transaction boundary when available.
- Prepare audit, proof and notification hooks.
- Return immutable, serializable result objects.

Repository responsibilities:

- Persist and retrieve records.
- Enforce database-level uniqueness or append-only constraints where relevant.
- Avoid embedding user-facing workflow policy that belongs to services.

## Transactions

Commands that write an operational record plus status history, audit hooks or
proof hooks should run inside one transaction boundary supplied by the runtime
adapter. Framework-neutral services may accept a `transaction` or
`runInTransaction` callback rather than importing the database client directly.

## Audit and Proof Hooks

Mutation services emit hook contracts instead of writing cross-cutting evidence
inline in UI components or route handlers.

Audit hooks include:

- actor user ID
- actor organization ID
- actor role
- action name
- object type and object ID
- timestamp
- safe metadata

Proof hooks include:

- source workflow event
- object type and object ID
- verification level allowed by the current Phase 1 taxonomy
- source actor and organization
- safe metadata needed to reconstruct the event

Hooks must not overstate verification strength. For example, station
acknowledgement remains station acknowledgement unless a later ticket adds a
stronger verified source.

## Example

`POST /api/orders/:orderId/receive` should:

1. Resolve the authenticated user.
2. Resolve and validate active organization and role context.
3. Parse the route parameter and optional note.
4. Call `OrderService.receiveOrder`.
5. Return `{ "data": { "order": ..., "statusHistory": ..., "auditResult": ... } }`.
6. Map validation errors to `422`, forbidden active-context failures to `403`,
   invalid workflow state to `409` and unexpected failures to a safe `500`.

The route must not reimplement order status transitions or station ownership
checks outside `OrderService`.

## Phase 1 Boundaries

This convention does not add AI, blockchain/token logic, marketplace expansion,
federation automation, sensor ingestion, unrestricted buyer access, production
payment processing or external logistics-provider implementation.
