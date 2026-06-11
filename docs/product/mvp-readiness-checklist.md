# MVP Readiness Checklist

## Purpose

This go/no-go checklist is used before an investor demo, staging handover or
technical diligence review. It consolidates product, auth, workflow, proof,
audit, documents, security, infrastructure, testing, demo and DD evidence into
one review surface.

## Status Values

| Status | Meaning |
| --- | --- |
| `PASS` | Evidence exists and no immediate blocker is known. |
| `FAIL` | Evidence contradicts the readiness requirement. |
| `BLOCKED` | Work is structurally present, but an external decision, account setup, legal review or provider configuration is missing. |
| `PENDING_REVIEW` | Evidence exists, but a named reviewer must confirm it before go/no-go. |
| `NOT_IN_SCOPE` | Explicitly excluded from Phase 1/Phase 1.1. |

## Go/No-Go Summary

| Decision area | Current status | Evidence | Owner | Review date | Notes |
| --- | --- | --- | --- | --- | --- |
| Local MVP demo | `PASS` | `npm run test:e2e`; `docs/development/minimal-e2e-happy-path.md` | Product/engineering | `[PENDING_DATE]` | Deterministic happy path exists without external providers. |
| Staging handover | `BLOCKED` | `docs/deployment/staging-production-setup.md` | CoriTech operations | `[PENDING_DATE]` | Provider resources, secrets and ownership evidence still pending. |
| Production launch | `BLOCKED` | `docs/deployment/backup-restore-baseline.md`; `docs/source-control/repository-ownership.md` | CoriTech leadership/legal/ops | `[PENDING_DATE]` | Legal review, source-control ownership proof, provider accounts, backup drill and secrets vault remain pending. |
| Investor DD package | `PENDING_REVIEW` | This checklist and linked evidence | CoriTech leadership | `[PENDING_DATE]` | Core code evidence exists; external ownership/legal evidence still needs attachments. |

## Product

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| MVP scope and exclusions documented | `PASS` | `docs/product/mvp-scope.md`; `README.md` | Product | `[PENDING_DATE]` | AI, blockchain/token, unrestricted buyer access and full automation are excluded. |
| Public/static pages exist | `PASS` | `/privacy`, `/terms`, `/imprint`, `/contact`, `/data-access`; `apps/web/features/static-pages/static-pages.test.mjs` | Product/legal | `[PENDING_DATE]` | Placeholder/legal-review status is explicit. |
| Onboarding/invitation flow documented | `PASS` | `docs/product/onboarding-flow.md`; `/app/admin/invitations`; `/accept-invite` | Product | `[PENDING_DATE]` | Final email delivery provider remains external setup. |

## Auth

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Auth/login checks pass | `PASS` | `docs/security/managed-auth-provider.md`; `apps/web/features/auth/*test.mjs` | Engineering | `[PENDING_DATE]` | Managed login, callback, logout, reset and verification surfaces exist. |
| No local password handling | `PASS` | `docs/security/managed-auth-provider.md` | Engineering/security | `[PENDING_DATE]` | Passwords and reset tokens stay with provider. |
| Admin MFA/provider ownership evidence | `BLOCKED` | `docs/security/managed-auth-provider.md`; `docs/vendor-ip/account-ownership-checklist.md` | CoriTech ops | `[PENDING_DATE]` | Requires selected CoriTech-controlled provider account evidence. |

## Roles

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Role redirect/context checks pass | `PASS` | `apps/web/features/auth/active-context-runtime.test.mjs`; `apps/web/features/navigation.test.mjs` | Engineering | `[PENDING_DATE]` | Multi-role users must choose a validated active context. |
| Permission boundaries documented | `PASS` | `docs/security/role-permission-matrix.md`; `packages/domain/src/auth/rbac-middleware.test.mjs` | Security/engineering | `[PENDING_DATE]` | Future buyer/federation/vet roles are prepared but inactive. |
| Permission management admin path exists | `PASS` | `/app/admin/permissions`; `apps/web/features/permission-management/*test.mjs` | Engineering | `[PENDING_DATE]` | Grants are scoped, revocable and audit logged. |

## Workflow

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Breeder-to-station order flow checks pass | `PASS` | `e2e/baseline.test.mjs`; `docs/development/minimal-e2e-happy-path.md` | Engineering/product | `[PENDING_DATE]` | Covers breeder draft/submit and assigned station receive/confirm. |
| Draft-to-submit check passes | `PASS` | `apps/web/features/order-creation/semen-order-creation.test.mjs` | Engineering | `[PENDING_DATE]` | Draft save, edit, submit and cancel behavior is covered. |
| Rejection/cancellation flow visible | `PASS` | `apps/web/features/station-order-management/station-order-management.test.mjs`; breeder order detail tests | Product/engineering | `[PENDING_DATE]` | Reasons are captured in status history. |
| Admin support/amendment workflow exists | `PASS` | `/app/admin/orders`; `/app/admin/amendments`; `docs/architecture/admin-order-support.md` | Support/product | `[PENDING_DATE]` | Corrections route through amendment evidence, not silent overwrite. |

## Proof/Audit

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Proof/audit checks pass | `PASS` | `apps/web/features/proof-timeline/proof-timeline.test.mjs`; `packages/domain/src/audit/audit-log.test.mjs` | Engineering/security | `[PENDING_DATE]` | Proof events are workflow-generated and audit records are append-only. |
| Audit viewer available to Platform Admin | `PASS` | `/app/admin/audit`; `apps/web/features/audit-logs/audit-log-viewer.test.mjs` | Security/support | `[PENDING_DATE]` | Normal users do not mutate audit logs. |
| No blockchain/token dependency | `PASS` | `docs/security/security-gdpr-note.md`; `README.md` | Product/security | `[PENDING_DATE]` | MVP proof relies on controlled records, documents and audit trail. |

## Documents

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Shipment/document checks pass | `PASS` | `apps/web/features/shipments/*test.mjs`; `packages/domain/src/documents/document-evidence.test.mjs` | Engineering | `[PENDING_DATE]` | Upload, metadata, access URL, revocation and replacement are covered. |
| No public document links | `PASS` | `docs/architecture/document-storage-and-access.md`; `docs/security/security-gdpr-note.md` | Security/engineering | `[PENDING_DATE]` | Controlled access URLs require authorization and audit logging. |
| Object storage production account | `BLOCKED` | `docs/integrations/object-storage.md`; `docs/vendor-ip/account-ownership-checklist.md` | CoriTech ops | `[PENDING_DATE]` | Provider selection/account ownership still pending. |

## Security

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| No hardcoded secrets check | `PASS` | `.gitignore`; `.env*.example`; `docs/deployment/environment-configuration.md` | Engineering/security | `[PENDING_DATE]` | Examples contain placeholders only; real `.env*` ignored. |
| Security/GDPR note exists | `PASS` | `docs/security/security-gdpr-note.md`; `docs/security/security-gdpr-note.test.mjs` | Security/legal | `[PENDING_DATE]` | Legal placeholders are explicit. |
| Lawful basis/legal review complete | `BLOCKED` | `docs/security/security-gdpr-note.md` | Legal/GDPR adviser | `[PENDING_DATE]` | Must be assessed per data flow before production. |
| Admin access/ownership checks | `BLOCKED` | `docs/vendor-ip/account-ownership-checklist.md`; `docs/source-control/repository-ownership.md` | CoriTech ops | `[PENDING_DATE]` | External account evidence is not yet attached. |

## Infrastructure

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Staging/deployment checks documented | `PASS` | `docs/deployment/staging-production-setup.md`; `.github/workflows/deploy.yml` | Engineering/ops | `[PENDING_DATE]` | Workflow is a placeholder until hosted target is selected. |
| CI baseline exists | `PASS` | `.github/workflows/ci.yml`; `docs/deployment/cicd-baseline.md` | Engineering | `[PENDING_DATE]` | PRs run lint, typecheck, tests, E2E and build in CI. |
| Backup/error tracking checks documented | `PASS` | `docs/deployment/backup-restore-baseline.md`; `docs/deployment/environment-configuration.md` | Ops/security | `[PENDING_DATE]` | Monitoring/error env contract exists; provider account pending. |
| Source-control branch protection live | `BLOCKED` | `docs/source-control/branch-protection.md` | CoriTech source-control admin | `[PENDING_DATE]` | Requires external GitHub/GitLab/Bitbucket setting evidence. |

## Testing

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Unit and integration test command passes | `PASS` | `npm run test:unit`; `npm test` | Engineering | `[PENDING_DATE]` | Includes domain, config, web, scripts and docs tests. |
| Complete MVP E2E journey passes locally | `PASS` | `npm run test:e2e`; `e2e/baseline.test.mjs`; `docs/development/minimal-e2e-happy-path.md` | Engineering/product | `[PENDING_DATE]` | Covers admin onboarding, catalog, order, shipment, document, proof, audit, notifications and access denial without browser/provider dependency. |
| Production build passes | `PASS` | `npm run build` | Engineering | `[PENDING_DATE]` | Build currently emits known Next/Turbopack warnings only. |
| Browser smoke for public pages | `PASS` | `/privacy` and `/contact` checked locally | Engineering | `[PENDING_DATE]` | Static routes render with footer links and placeholder status. |

## Demo

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| Local investor-demo script readiness | `PASS` | `docs/development/minimal-e2e-happy-path.md`; `/app` role redirects | Product | `[PENDING_DATE]` | Demo can follow admin onboarding -> breeder -> station -> shipment/document -> proof/audit/notification story. |
| Demo seed data exists | `PASS` | `packages/database/src/seed.ts`; README database commands | Engineering/product | `[PENDING_DATE]` | Local seed supports demo workspaces. |
| Hosted staging-demo readiness | `BLOCKED` | Deployment/auth/email/provider docs; `docs/development/minimal-e2e-happy-path.md` | Product/ops | `[PENDING_DATE]` | Real hosted auth/email/storage/monitoring accounts and staging secrets still need setup before relying on staging demo. |

## DD

| Check | Status | Evidence | Owner | Date | Notes |
| --- | --- | --- | --- | --- | --- |
| DD evidence links/fields present | `PASS` | `docs/vendor-ip/vendor-register.md`; `docs/vendor-ip/account-ownership-checklist.md`; this checklist | CoriTech leadership | `[PENDING_DATE]` | Rows include owner/status/evidence fields. |
| Vendor/IP handover checklist present | `PASS` | `docs/vendor-ip/ip-assignment-handover-checklist.md` | Legal/ops | `[PENDING_DATE]` | Use before vendor contract signature or final handover. |
| Repository ownership proof attached | `BLOCKED` | `docs/source-control/repository-ownership.md` | CoriTech source-control admin | `[PENDING_DATE]` | Current local remote is not sufficient proof of CoriTech ownership. |
| Final legal pages approved | `BLOCKED` | `/privacy`; `/terms`; `/imprint`; `/contact`; `/data-access` | Legal/GDPR adviser | `[PENDING_DATE]` | App pages are placeholders pending legal/company-detail review. |

## Manual Verification Steps

1. Run `npm ci`.
2. Run `npm run lint`.
3. Run `npm run typecheck`.
4. Run `npm run test:unit`.
5. Run `npm run test:e2e`.
6. Run `npm run build`.
7. Start the app and open `/privacy`, `/login`, `/app`, `/app/station/orders`,
   `/app/admin/audit` and `/app/admin/orders`.
8. Confirm no real secrets are present in committed files.
9. Confirm account ownership, branch protection, provider and legal review
   blockers have named owners and evidence locations.
