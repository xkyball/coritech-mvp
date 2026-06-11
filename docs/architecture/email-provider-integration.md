# Email Provider Integration

## Purpose

Ticket 9.1 integrates outbound email as commodity delivery while keeping
workflow orchestration, templates, recipient rules and delivery evidence inside
CoriTech-owned code and data.

Implementation:

- sender contract: `packages/domain/src/notifications/email-provider.mjs`
- template registry: `packages/domain/src/notifications/notification-template-registry.mjs`
- delivery log table: `notification_logs`
- Prisma log adapter: `apps/web/features/notifications/prisma-notification-log-repository.ts`

## Provider Model

The domain service supports two provider modes:

| Provider | Environment use | Behavior |
| --- | --- | --- |
| `console` | Local development only | Renders the same message contract and writes to an injected local sink. |
| `http_api` | Staging and production | Sends a provider-neutral HTTPS JSON payload to the configured endpoint with the configured API key. |

The HTTP adapter is intentionally not tied to a vendor SDK. CoriTech can choose
or replace the commodity email provider without changing notification event,
template or log contracts.

## Environment Contract

Email delivery uses these variables:

| Variable | Purpose |
| --- | --- |
| `EMAIL_PROVIDER` | `console` locally, `http_api` for staging and production |
| `EMAIL_PROVIDER_API_KEY` | Provider API key stored outside version control |
| `EMAIL_PROVIDER_ENDPOINT` | Provider HTTPS send endpoint |
| `EMAIL_FROM_ADDRESS` | CoriTech-controlled sender address |
| `EMAIL_FROM_NAME` | Sender display name |

`packages/config/src/environment.mjs` rejects `EMAIL_PROVIDER=console` outside
local development and rejects placeholder provider values for staging and
production. No real secrets are committed.

## Delivery Logging

`sendNotificationEmail` renders the event template, calls the configured
provider and writes one `notification_logs` record per send attempt.

Successful sends are logged as `SENT` with the template id, event type,
recipient rule, recipient context and `provider_message_id` when supplied.
Provider exceptions are logged as `FAILED` with `last_error`.

Ticket 9.2 owns recipient resolution and workflow orchestration. Retry
scheduling remains a future queue responsibility.

## Ownership Boundary

The selected notification provider account, sender domain, API key and backup
administrator must be CoriTech-controlled before staging or production use.
Vendor-owned production-critical accounts are not acceptable. The external
systems register tracks this account-evidence requirement.

## Security Boundary

Email templates do not include public document links. Messages direct users to
open CoriTech, where existing role and permission checks control object access.
The provider payload carries only the rendered subject/body, recipient address
and event metadata needed for delivery.
