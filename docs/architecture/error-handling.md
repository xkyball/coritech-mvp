# Error Handling

## Purpose

CoriTech Phase 1.1 uses one frontend error convention for runtime failures,
auth failures, forbidden routes, not-found states and validation issues.

## User-Facing Surfaces

| Case | Surface | Behavior |
| --- | --- | --- |
| `401` unauthenticated | Login redirect or unauthenticated page | Guides the user to managed login. |
| `403` forbidden | Access denied page/component | Explains that the active organization and role cannot open the workspace without revealing object existence. |
| `404` not found | Global not-found page | Uses a safe message that works for missing pages and sensitive records. |
| `422` validation | Inline validation list | Shows field-level issues and next action. |
| Unexpected runtime error | App/global error boundary | Shows a safe retry message and reports a sanitized placeholder event. |

## API Error Mapping

Frontend code maps the standard API envelope from
[API Contract and Service Conventions](./api-contract-and-service-conventions.md)
through `apps/web/features/errors/error-handling.mjs`.

The mapper treats `message` as user-facing only when it is safe for the current
status class. Server errors always use a generic message; stack traces, SQL,
tokens, secrets and provider payloads are not shown.

## Validation Display

Validation errors use `details.issues` with items shaped as:

```json
{
  "field": "quantity",
  "message": "Quantity must be at least 1."
}
```

The UI helper also accepts string issues from existing domain validation errors
and displays them in the same inline list pattern.

## Logging Placeholder

`reportRuntimeError` creates a sanitized runtime error event with the surface,
error name and digest when available. It intentionally drops token, password,
cookie, authorization and secret-like context fields. A future hosted error
tracking adapter can replace the placeholder logger without changing page-level
error handling.

## Boundaries

This ticket does not add a hosted monitoring provider, reveal protected object
existence, implement predictive error analysis, or add any AI, blockchain,
payment, federation, marketplace or sensor workflow.
