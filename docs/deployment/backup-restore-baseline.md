# Backup and Restore Baseline

## Purpose

Ticket 14.3 defines the Phase 1 baseline for preserving and restoring CoriTech
MVP data. The baseline covers PostgreSQL records, private object-storage
documents, administrator ownership, restore testing and due-diligence evidence.

## Backup Policy

| Area | Baseline policy | Evidence to keep |
| --- | --- | --- |
| PostgreSQL database | Staging and production must use provider-managed automated backups or a CoriTech-run scheduled `pg_dump` job using `npm run backup:database`. | Provider backup policy export or scheduled job logs, last successful backup timestamp, restore drill result |
| Object storage | Buckets must be private, versioning or provider backup enabled where available, and lifecycle/deletion rules documented before production use. | Bucket policy export, versioning/backup setting export, lifecycle policy, admin list |
| Backup retention | Placeholder: `[PENDING_RPO_RTO_DECISION]`; keep at least enough restore points for investor/demo recovery before production launch. | Retention setting export and approval note |
| Backup admins | CoriTech primary admin plus at least one CoriTech backup admin for database, storage and secrets/backup tooling. | Account ownership checklist row plus provider admin export |

No production-critical backup system may exist only under a vendor-owned
personal or agency account.

## RPO/RTO Placeholders

| Environment | Recovery point objective | Recovery time objective | Status |
| --- | --- | --- | --- |
| Local | Best effort developer recovery | Best effort | Developer-only |
| Staging | `[PENDING_RPO_DECISION]` | `[PENDING_RTO_DECISION]` | Must be confirmed before external demo reliance |
| Production | `[PENDING_RPO_DECISION]` | `[PENDING_RTO_DECISION]` | Must be approved before launch |

## Database Backup Trigger

Local Compose backup:

```bash
npm run backup:database -- --output backups/database/local.dump
```

Dry run:

```bash
npm run backup:database -- --dry-run
```

Provider-managed staging/production backup using a secret-managed database URL:

```bash
npm run backup:database -- --database-url "$DATABASE_URL" --output backups/database/staging.dump
```

The script redacts database credentials in console output and writes backup
files under `backups/`, which is ignored by git.

## Database Restore Procedure

Restore into local Compose from a custom-format dump:

```bash
npm run restore:database -- --input backups/database/local.dump --confirm-restore
```

Restore with clean/drop behavior into an empty disposable staging restore
database:

```bash
npm run restore:database -- --database-url "$RESTORE_DATABASE_URL" --input backups/database/staging.dump --clean --confirm-restore
```

Plain `.sql` files are restored with `psql`; other file extensions are restored
with `pg_restore`.

Before any staging or production restore:

1. Restore into a disposable database first.
2. Confirm the target environment and connection string are correct.
3. Confirm backup administrator approval.
4. Run migrations only after the restored schema state is understood.
5. Validate `/api/health`, sign-in, order listing, document metadata, proof
   timeline and audit log access.
6. Record the restore drill in the DD evidence tracker.

## Object Storage Backup Policy

Staging and production object storage must be configured in a
CoriTech-controlled account with:

- private buckets or containers;
- public listing disabled;
- versioning or provider backup enabled where the provider supports it;
- lifecycle rules that do not delete Phase 1 evidence unexpectedly;
- documented restore/export procedure for document bytes;
- separate staging and production buckets;
- primary and backup CoriTech administrators;
- evidence export showing bucket ownership, versioning/backup settings and
  access policies.

Document metadata lives in PostgreSQL. Document bytes live in object storage.
A full restore drill must verify both parts together.

## Restore Test Cadence

| Environment | Cadence | Required result |
| --- | --- | --- |
| Local | On demand before DD/demo readiness checks | Backup script can create a dump and restore script can plan or restore into local Compose |
| Staging | Before investor demo reliance and after provider changes | Restore into disposable staging database and verify core order/document/proof/audit read paths |
| Production | Before launch and after major infrastructure changes | Approved restore drill with RPO/RTO and backup admin evidence |

## DD Evidence Checklist

Keep the following evidence in the approved CoriTech data room:

- latest successful database backup log or provider backup export;
- latest restore drill notes with date, owner and target database;
- object storage versioning/backup policy export;
- object storage restore/export procedure;
- admin and backup admin evidence for database, storage and secrets tooling;
- RPO/RTO approval note;
- confirmation that no backup artifact contains production secrets in git.

## Explicit Non-Goals

This baseline does not provision a cloud backup vendor, automate production
restore approvals, store real secrets, expose public document links, add
blockchain/token logic, add AI features or implement federation/sensor
automation.
