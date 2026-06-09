# Deployment Overview

## Purpose

This starter overview defines the expected Phase 1 deployment posture. It does
not configure infrastructure.

Detailed environment-variable and secret-handling guidance is documented in
`docs/deployment/environment-configuration.md`.

## Environments

| Environment | Purpose | Data policy | Status |
| --- | --- | --- | --- |
| Local development | Developer build and test work | No production data | `[PENDING_SETUP]` |
| Staging | Pre-production validation and demo review | Sanitized or approved test data only | `[PENDING_SETUP]` |
| Production | Live operational workflow | Production data under CoriTech control | `[PENDING_SETUP]` |

## Deployment Principles

- Production infrastructure must be under CoriTech-controlled accounts.
- Secrets must be stored outside the repository.
- Staging and production configuration must be separated.
- Backups and restore process must be documented before production launch.
- Audit logs must be retained in a controlled system.
- Provider access must be reviewable and transferable.

## Open Placeholders

| Area | Placeholder |
| --- | --- |
| Hosting provider | `[PENDING_VENDOR_SELECTION]` |
| Database provider | `[PENDING_VENDOR_SELECTION]` |
| Object storage provider | `[PENDING_VENDOR_SELECTION]` |
| CI/CD provider | `[PENDING_VENDOR_SELECTION]` |
| Secrets vault / secret manager | `[PENDING_VENDOR_SELECTION]` |
| Backup schedule | `[PENDING_ARCHITECTURE_DECISION]` |
| Restore target | `[PENDING_ARCHITECTURE_DECISION]` |
| Production launch owner | `[PENDING_CONFIRMATION]` |

## Explicit Non-Goals

This document does not implement infrastructure, CI/CD, database migrations,
authentication, AI, blockchain/token features, full federation automation, full
data-space automation or sensor/wearable ingestion.
