# Environment Configuration and Secrets

## Purpose

This document defines the Phase 1 environment-variable contract for CoriTech.
It covers local development, staging and production separation without choosing
real vendors or committing secrets.

## Non-Negotiable Rules

- Never commit real secrets, `.env` files, staging values or production values.
- Never paste production credentials into markdown, pull requests, tickets or
  chat logs.
- Keep the same variable names across local, staging and production. Only the
  values should change.
- Store secrets in environment variables today and move them into a
  CoriTech-controlled secrets vault once one is selected.
- Do not assume a vendor-owned account is acceptable for production-critical
  access.

## Current Files

| File | Role |
| --- | --- |
| `.env.example` | Canonical variable list and local-safe placeholder values |
| `.env.local.example` | Developer-machine example with safe local defaults |
| `.env.staging.example` | Staging variable names and placeholder structure |
| `.env.production.example` | Production variable names and placeholder structure |
| `packages/config/src/environment.mjs` | Reusable runtime validation for future API/app startup |
| `packages/config/src/environment.d.ts` | Type definitions for future TypeScript consumers |

Real `.env`, `.env.local`, `.env.staging` and `.env.production` files are
ignored by git and must stay outside version control.

Local npm entry points load the repository root `.env` before starting Next.js,
Prisma and backup/restore helpers. Docker Compose also receives the root `.env`
explicitly and injects it into the app-side runtime containers. Explicit shell
variables remain the highest-priority local override. `NODE_ENV` is intentionally
left under the control of Next.js, npm commands and Docker runtime configuration
rather than being imported from `.env`.

Local browser-facing URLs and server bind hosts are separate concerns:

| Setting | Local value | Purpose |
| --- | --- | --- |
| `APP_BASE_URL` | `http://localhost:3000` | Public browser app URL, auth logout return and generated app links |
| `API_BASE_URL` | `http://localhost:3000` | Public callback/API origin used by browser/provider flows |
| `SERVER_BIND_HOST` | `0.0.0.0` | Development server listen address only |

`0.0.0.0` must never be used as a browser-facing base URL. The config loader
rejects it for `APP_BASE_URL` and `API_BASE_URL`.

## Environment Separation

| Environment | Purpose | Secret source | Placeholder policy |
| --- | --- | --- | --- |
| Local | Developer build and test work | Local machine env file only | Placeholder provider credentials are allowed until hosted auth testing is enabled |
| Staging | Internal review, integration testing and demos | CoriTech-controlled deployment secrets or future vault | No placeholders allowed |
| Production | Live operational workflow | CoriTech-controlled deployment secrets or future vault | No placeholders allowed |

## Required Variables

| Variable | Purpose | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Primary relational database connection | Use local-only database values in development; staging/production values stay outside git |
| `AUTH_PROVIDER_CLIENT_ID` | Google OAuth Web client ID | Required before auth routes are enabled; use a separate client per environment |
| `AUTH_PROVIDER_CLIENT_SECRET` | Google OAuth Web client secret | Must never appear in docs or commits |
| `AUTH_PROVIDER_DOMAIN` | Managed auth issuer | Use `https://accounts.google.com` for Google hosted login |
| `AUTH_SESSION_SECRET` | Optional CoriTech session-cookie signing secret | Recommended for staging and production; falls back to `AUTH_PROVIDER_CLIENT_SECRET` when omitted |
| `EMAIL_PROVIDER` | Outbound email provider selector | Use `console` only for local development; use `http_api` in staging and production |
| `EMAIL_PROVIDER_API_KEY` | Outbound email provider API key | Secret-managed outside local examples |
| `EMAIL_PROVIDER_ENDPOINT` | Outbound email provider send endpoint | Staging and production must point to a CoriTech-controlled provider account endpoint |
| `EMAIL_FROM_ADDRESS` | Outbound sender email address | Must be a CoriTech-controlled sender address/domain before live use |
| `EMAIL_FROM_NAME` | Outbound sender display name | Human-readable product sender name |
| `MONITORING_PROVIDER` | Monitoring/error integration selector | Use `console` only for local development; use a hosted provider value once selected |
| `MONITORING_ENDPOINT` | Monitoring ingestion endpoint | Staging and production must point to a CoriTech-controlled monitoring account endpoint |
| `ERROR_TRACKING_DSN` | Error tracking project DSN or equivalent project key | Store outside git for staging and production |
| `OBJECT_STORAGE_PROVIDER` | Object storage provider selector | Use `minio` for local development; use `s3-compatible` for replaceable production-compatible storage |
| `OBJECT_STORAGE_ENDPOINT` | Object storage endpoint host | Local Compose uses `minio`; developer-machine MinIO uses `localhost`; production must point to a CoriTech-controlled account endpoint |
| `OBJECT_STORAGE_PORT` | Object storage API port | Local MinIO uses `9000`; TLS-backed production storage commonly uses `443` |
| `OBJECT_STORAGE_USE_SSL` | Object storage TLS switch | `false` only for local MinIO; staging and production should use `true` |
| `OBJECT_STORAGE_BUCKET` | Controlled document storage bucket/container name | Bucket is private by default and may change after provider selection |
| `OBJECT_STORAGE_REGION` | Object storage region or local region label | Local MinIO uses `local-dev`; production should match the selected CoriTech-controlled storage region |
| `OBJECT_STORAGE_ACCESS_KEY` | Object storage access key | Secret-managed outside local examples |
| `OBJECT_STORAGE_SECRET_KEY` | Object storage secret key | Secret-managed outside local examples |
| `PAYMENT_PROVIDER_SECRET` | Future payment-provider secret | Not used by the Ticket 10.2 placeholder; reserved for a later real provider adapter |
| `LOGISTICS_PROVIDER_API_KEY` | Future logistics adapter credential | Placeholder only until the logistics adapter ticket |
| `APP_BASE_URL` | Frontend/application public base URL | Must be an absolute URL |
| `API_BASE_URL` | API public base URL | Must be an absolute URL |
| `SERVER_BIND_HOST` | Local dev server listen host | Optional local-only bind value; not a browser-facing URL |
| `AUDIT_LOG_RETENTION_DAYS` | Minimum retention policy for audit-aware logs | Positive integer only |

## Naming Conventions

- Use upper snake case for all shared configuration keys.
- Keep provider-specific keys descriptive and replaceable, for example
  `AUTH_PROVIDER_CLIENT_SECRET` rather than a vendor-branded key name.
- Reuse the same key names in every environment so deployment automation can
  remain provider-agnostic.
- Put secret values in a CoriTech-controlled system, not in markdown or source
  files.

## Validation Behavior

The reusable loader in `packages/config/src/environment.mjs` is intentionally small and
has no provider SDK dependencies.

It validates that:

- all required variables are present;
- `CORITECH_ENVIRONMENT` is one of `local`, `staging` or `production`;
- `APP_BASE_URL` and `API_BASE_URL` are absolute URLs;
- `EMAIL_PROVIDER` is `console` or `http_api`;
- `EMAIL_PROVIDER=console` is local-only;
- `EMAIL_PROVIDER_ENDPOINT` is an absolute URL;
- `EMAIL_FROM_ADDRESS` is a valid email address;
- `MONITORING_ENDPOINT` is an absolute URL;
- `OBJECT_STORAGE_PORT` is a positive integer;
- `OBJECT_STORAGE_USE_SSL` is either `true` or `false`;
- `AUDIT_LOG_RETENTION_DAYS` is a positive integer;
- staging and production values are not placeholder strings;
- staging and production base/provider/monitoring URLs do not point to
  `localhost`.

The Ticket 2.1 managed auth contract adds a second guard that prevents hosted
auth routes from being enabled with placeholder provider values, including in
local development.

Google hosted login uses the same env names in each environment:

- `AUTH_PROVIDER_DOMAIN=https://accounts.google.com`
- `AUTH_PROVIDER_CLIENT_ID=<environment-specific Google OAuth Web client ID>`
- `AUTH_PROVIDER_CLIENT_SECRET=<environment-specific Google OAuth Web client secret>`
- `AUTH_SESSION_SECRET=<environment-specific session signing secret>` in staging
  and production

The Google Cloud Console OAuth client must authorize `${API_BASE_URL}/auth/callback`
as the redirect URI and `${APP_BASE_URL}` as the web origin for the same
environment.

The object storage foundation adds a second provider-level guard in
`packages/domain/src/storage/object-storage.mjs`. It rejects placeholder object
storage credentials before initializing the storage provider, even in local
development. The example files therefore use MinIO-only development credentials
that must not be reused outside a developer machine.

## Object Storage Boundary

Local development uses MinIO as S3-compatible commodity storage. The local
bucket is private by default and raw public document links must not be exposed.
Production object storage credentials, buckets and account administration must
be CoriTech-controlled and managed outside version control.

Ticket 6.1 will implement document upload, metadata persistence, controlled
access URLs, file validation, malware-scanning placeholder behavior and audit
hooks. This prerequisite only provides configuration and provider foundation.

## Email Provider Boundary

Local development can use the `console` email provider so notification rendering
and logging can be tested without a live vendor. Staging and production must use
`http_api` with a CoriTech-controlled provider account, sender domain/address,
API key and endpoint stored outside version control. The provider adapter is
generic HTTPS JSON; template ownership, recipient rules and delivery logging
remain in CoriTech code and database records.

## Secrets Vault Placeholder

Current status: `[PENDING_SECRETS_VAULT_SELECTION]`

Before any live staging or production launch, CoriTech should document:

- the chosen secrets manager or vault;
- the CoriTech-owned account that controls it;
- administrator and backup administrator access;
- rotation and recovery steps;
- handover steps for a future internal team or software partner.

## Monitoring and Error Tracking Boundary

Local development uses `MONITORING_PROVIDER=console` and a local monitoring
endpoint placeholder. Staging and production must use a CoriTech-controlled
monitoring/error account, a non-local ingestion endpoint and secret-managed
error tracking project key. This ticket documents and validates the environment
contract only; it does not add a monitoring SDK or provider-specific runtime
client.
