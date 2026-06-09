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
| `AUTH_PROVIDER_CLIENT_ID` | Managed auth application client ID | Required before auth routes are enabled |
| `AUTH_PROVIDER_CLIENT_SECRET` | Managed auth application secret | Must never appear in docs or commits |
| `AUTH_PROVIDER_DOMAIN` | Managed auth issuer or tenant domain | Must point to the CoriTech-controlled provider tenant |
| `EMAIL_PROVIDER_API_KEY` | Outbound email provider API key | Placeholder only until Ticket 9.1 |
| `OBJECT_STORAGE_BUCKET` | Controlled document storage bucket/container name | Bucket name may change after vendor selection |
| `OBJECT_STORAGE_ACCESS_KEY` | Object storage access key | Secret-managed outside local examples |
| `OBJECT_STORAGE_SECRET_KEY` | Object storage secret key | Secret-managed outside local examples |
| `PAYMENT_PROVIDER_SECRET` | Future payment-reference provider secret | Placeholder only until Ticket 10.2 |
| `LOGISTICS_PROVIDER_API_KEY` | Future logistics adapter credential | Placeholder only until the logistics adapter ticket |
| `APP_BASE_URL` | Frontend/application public base URL | Must be an absolute URL |
| `API_BASE_URL` | API public base URL | Must be an absolute URL |
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
- `AUDIT_LOG_RETENTION_DAYS` is a positive integer;
- staging and production values are not placeholder strings;
- staging and production base URLs do not point to `localhost`.

The Ticket 2.1 managed auth contract adds a second guard that prevents hosted
auth routes from being enabled with placeholder provider values, including in
local development.

## Secrets Vault Placeholder

Current status: `[PENDING_SECRETS_VAULT_SELECTION]`

Before any live staging or production launch, CoriTech should document:

- the chosen secrets manager or vault;
- the CoriTech-owned account that controls it;
- administrator and backup administrator access;
- rotation and recovery steps;
- handover steps for a future internal team or software partner.
