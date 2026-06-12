# Deployment Overview

## Purpose

This starter overview defines the expected Phase 1 deployment posture. It does
not configure infrastructure.

Detailed setup, environment-variable and secret-handling guidance is documented
in `docs/deployment/staging-production-setup.md` and
`docs/deployment/environment-configuration.md`.
The small-VM all-in-one container variant is documented in
`docs/deployment/azure-vm-all-in-one-container.md`.
Backup and restore readiness is documented in
`docs/deployment/backup-restore-baseline.md`.

## Environments

| Environment | Purpose | Data policy | Status |
| --- | --- | --- | --- |
| Local development | Developer build and test work | No production data | Docker Compose includes PostgreSQL, local MinIO and app services |
| Staging | Pre-production validation and demo review | Sanitized or approved test data only | Deployment structure ready; provider resources and secrets pending |
| Production | Live operational workflow | Production data under CoriTech control | Structure documented; launch pending provider, backup and approval setup |

## Deployment Principles

- Production infrastructure must be under CoriTech-controlled accounts.
- Secrets must be stored outside the repository.
- Staging and production configuration must be separated.
- Backups and restore process must be documented before production launch.
- Audit logs must be retained in a controlled system.
- Provider access must be reviewable and transferable.
- Hosted staging and production must not depend on a developer-owned machine or
  personal cloud account.

## Open Placeholders

| Area | Placeholder |
| --- | --- |
| Hosting provider | `[PENDING_VENDOR_SELECTION]`; must be CoriTech-controlled |
| Database provider | `[PENDING_VENDOR_SELECTION]`; must be CoriTech-controlled |
| Object storage provider | Local MinIO configured for development; production provider selection pending |
| CI/CD provider | GitHub Actions baseline under CoriTech-controlled repository; hosted deploy target pending |
| Secrets vault / secret manager | `[PENDING_VENDOR_SELECTION]` |
| Monitoring/error tracking provider | `[PENDING_VENDOR_SELECTION]`; account must be CoriTech-controlled |
| Backup schedule | Baseline policy documented; provider schedule pending selection |
| Restore target | Baseline procedure documented; disposable staging target pending provider setup |
| Production launch owner | `[PENDING_CONFIRMATION]` |

## Explicit Non-Goals

This document does not provision infrastructure, run live staging/production
migrations, configure production secrets, implement AI, blockchain/token
features, full federation automation, full data-space automation or
sensor/wearable ingestion.
