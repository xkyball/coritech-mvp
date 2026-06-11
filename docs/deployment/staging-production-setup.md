# Staging and Production Setup

## Purpose

Ticket 14.1 defines the deployment structure needed before CoriTech can move
from local development into a controlled staging environment and, later,
production. This document keeps the setup provider-neutral while requiring
CoriTech-owned accounts, separated secrets and repeatable deployment commands.

## Current Status

| Environment | Status | Deployment path |
| --- | --- | --- |
| Local | Available | Docker Compose with PostgreSQL, MinIO and the web app |
| Staging | Deployable after CoriTech-owned provider/secrets are populated | Production Docker image plus `.env.staging.example` contract and the `Deploy` GitHub workflow |
| Production | Structure documented, launch pending protected environment approval and provider selection | Production Docker image plus `.env.production.example` contract and protected `production` GitHub environment |

Staging and production must not depend on one developer's laptop, shell
profile, local database, local MinIO instance or personal cloud account.

## CoriTech-Controlled Ownership Checklist

Before staging or production is used with real users or sensitive data,
CoriTech must control:

- the source repository and GitHub Actions environment settings;
- the hosting account that runs the web container;
- the PostgreSQL database account and backups;
- the private object-storage account and buckets;
- the Google OAuth project/client for managed login;
- the outbound email provider account and sender domain/address;
- the monitoring/error tracking account and alert recipients;
- the secret manager or vault containing deployment credentials;
- at least one primary and one backup administrator for every provider account.

Vendor accounts created by an individual developer are not acceptable for
production-critical access unless ownership is transferred to CoriTech before
use.

## Required Services

| Area | Staging requirement | Production requirement |
| --- | --- | --- |
| Hosting | Runs the repository Docker image or equivalent Node 22 build under CoriTech control | Same, with production access restricted through CoriTech administrators |
| Database | Dedicated PostgreSQL database with sanitized/test data | Dedicated PostgreSQL database with production data and backup policy |
| Object storage | Private bucket/container using the documented object storage variables | Private production bucket/container with public listing disabled |
| Auth provider | Environment-specific Google OAuth Web client | Separate production Google OAuth Web client |
| Email provider | `EMAIL_PROVIDER=http_api` and a CoriTech-controlled sender | Production sender/domain and provider key controlled by CoriTech |
| Monitoring | `MONITORING_PROVIDER=http_api`, endpoint and error DSN configured outside git | Production monitoring/error account with alert ownership documented |

## Environment Files

Use the example files only as variable-name contracts:

- `.env.staging.example`
- `.env.production.example`

Real staging and production values must live in deployment secrets or a future
CoriTech-controlled secrets vault. The runtime validator rejects placeholders
and localhost URLs outside local development.

## Deployment Flow

1. Select or confirm CoriTech-owned hosting, database, storage, auth, email and
   monitoring providers.
2. Create separated staging and production resources.
3. Populate provider secrets from `.env.staging.example` or
   `.env.production.example` into the deployment platform or vault.
4. Configure GitHub environments named `staging` and `production`.
5. Protect the `production` environment with required reviewers.
6. Run the `Deploy` workflow with `target_environment=staging`.
7. Run database migrations against the staging database.
8. Start the production-mode web container from `Dockerfile`.
9. Validate `/api/health`, auth redirect configuration, private object storage,
   email sender access and monitoring ingestion.
10. Repeat the same process for production only after approval, backup and
    restore readiness are documented.

Backup and restore readiness lives in
`docs/deployment/backup-restore-baseline.md` and must be completed before
production launch.

## Docker Image

`Dockerfile` now installs dependencies, generates Prisma artifacts, builds the
Next.js app and starts the web workspace with `next start`. Local Docker Compose
continues to override the command with the developer server for local workflow.

The image is intentionally provider-neutral. Runtime secrets must be injected by
the hosting platform, not baked into the image.

## Deployment Workflow Boundary

`.github/workflows/deploy.yml` provides the manual staging/production workflow
shape and runs the full verification suite before the placeholder deploy step.
It does not push to a specific cloud target because no hosting vendor is
selected in Phase 1. Once a provider is selected, the deploy step should be
replaced with provider-specific commands that read from CoriTech-controlled
environment secrets.

## Explicit Non-Goals

This setup does not provision cloud infrastructure, select a vendor, store real
secrets, create production data, enable payment processing, enable carrier
automation or add public document links.
