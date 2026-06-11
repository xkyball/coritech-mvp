# Codebase Scan Summary

Status: SOURCE EXTRACTION ONLY

## Project Shape

| Area | Extracted source information | Evidence | Status | Confidence |
|---|---|---|---|---|
| Product wedge | CoriTech is an MVP for breeder ordering, breeding station fulfillment, shipment traceability, document handling, audit logs, and proof events. The README also states explicit Phase 1 exclusions. | `README.md`; `docs/current-implementation-status.md` | IMPLEMENTED / DOCUMENTED | HIGH |
| Workspace framework | The repository uses npm workspaces. The web app is a Next.js App Router application under `apps/web`. Shared database and domain packages live under `packages/database` and `packages/domain`. | `package.json`; `apps/web/package.json`; `README.md`; `apps/web/app/` | IMPLEMENTED | HIGH |
| Frontend runtime | The web app depends on Next.js, React, and Prisma-backed repositories. Route files are in `apps/web/app/**/page.tsx`, `layout.tsx`, `route.ts`, and related feature modules. | `apps/web/package.json`; `apps/web/app`; `apps/web/features` | IMPLEMENTED | HIGH |
| Backend/domain runtime | Domain behavior is implemented as package-level services and repositories in `packages/domain/src`, with Prisma models in `packages/database/prisma/schema.prisma`. | `packages/domain/src`; `packages/database/prisma/schema.prisma` | IMPLEMENTED | HIGH |
| Local infrastructure | Docker Compose defines PostgreSQL, MinIO object storage, a migrate/seed service, web app service, and Adminer. | `docker-compose.yml`; `.env.example` | IMPLEMENTED | HIGH |
| Environment configuration | `.env.example` includes managed auth placeholders, email defaults, object storage settings, and placeholder payment/logistics configuration. | `.env.example` | PARTIALLY_IMPLEMENTED | HIGH |
| Routing structure | Public routes include `/`, `/login`, `/logout`, `/logged-out`, `/password-reset`, `/accept-invite`, static legal/support pages, and error pages. Authenticated app routes sit under `/app`, `/breeder-dashboard`, and `/station-dashboard`. | `apps/web/app`; `apps/web/features/navigation.mjs` | IMPLEMENTED | HIGH |
| Authentication approach | Authentication is managed-provider based. The app uses managed-auth session cookies, provider redirects, active user/org/role context, role selection, and route guards. Login and reset are disabled when provider config is not present. | `apps/web/features/auth/server-session.ts`; `apps/web/features/auth/auth-routes.mjs`; `apps/web/features/auth/role-routing.mjs`; `apps/web/app/login/page.tsx`; `apps/web/app/password-reset/page.tsx` | PARTIALLY_IMPLEMENTED | HIGH |
| Middleware approach | `apps/web/middleware.ts` performs lightweight cookie-presence protection and redirects. Full RBAC is implemented in app/domain context checks rather than entirely in middleware. | `apps/web/middleware.ts`; `packages/domain/src/auth/rbac-middleware.mjs`; `apps/web/features/auth/active-context-runtime.mjs` | PARTIALLY_IMPLEMENTED | HIGH |
| Active context | Users operate through an active organization and role context selected through `/app/select-role` and changed through `/app/context/switch`. | `apps/web/app/app/select-role/page.tsx`; `apps/web/app/app/context/switch/route.ts`; `apps/web/components/ActiveContextBar.tsx`; `packages/domain/src/identity/active-context.mjs` | IMPLEMENTED | HIGH |
| Data model | Prisma defines users, organizations, role assignments, stallions, semen listings, orders, shipments, documents, evidence attachments, proof events, audit logs, access permissions, amendments, support requests, notifications, payment references, and invitations. | `packages/database/prisma/schema.prisma` | IMPLEMENTED | HIGH |
| Available active roles | Active Phase 1 roles are `BREEDER`, `BREEDING_STATION`, and `PLATFORM_ADMIN`. Future-prepared roles exist in schema/domain but are not active app roles. | `packages/database/prisma/schema.prisma`; `packages/domain/src/identity/role-model.mjs`; `apps/web/features/navigation.mjs` | IMPLEMENTED | HIGH |
| Available app areas | Breeder dashboard, catalog, order creation/detail, station dashboard, station order management, station shipments, station stallions/listings, document upload/detail, admin dashboard, admin users, invitations, organizations, roles, orders, support, proof, audit, permissions, amendments. | `apps/web/app`; `apps/web/features/navigation.mjs` | IMPLEMENTED / PARTIALLY_IMPLEMENTED | HIGH |
| Placeholder/demo areas | Static legal/support pages contain placeholder copy; login/reset depend on provider config; payment processing is reference-only; logistics provider integration is manual/reference based; no in-app notification center was found. | `apps/web/features/static-pages/static-pages.mjs`; `.env.example`; `packages/domain/src/payments/payment-reference.mjs`; `packages/domain/src/shipments/shipment.mjs`; `packages/domain/src/notifications` | PARTIALLY_IMPLEMENTED / PLACEHOLDER | HIGH |
| Existing documentation sources | Current implementation status, role matrix, architecture notes, MVP scope, and ticket docs provide useful background, but some older product docs are stale compared with live code. | `docs/current-implementation-status.md`; `docs/security/role-permission-matrix.md`; `docs/architecture`; `docs/product/mvp-scope.md`; `docs/tickets` | PARTIALLY_IMPLEMENTED | MEDIUM |
| Test coverage relevant to users | Unit/integration tests cover auth, active context, role routing, breeder/station screens, order workflows, documents, proof/audit, payments, support, notifications, admin permissions/amendments, and the baseline E2E happy path. | `apps/web/**/__tests__`; `packages/domain/src/**/__tests__`; `e2e/baseline.test.mjs`; `docs/development/minimal-e2e-happy-path.md` | IMPLEMENTED | HIGH |

## Minimum Path Check

| Requested path | Actual result | Evidence | Notes |
|---|---|---|---|
| `README.md` | Found | `README.md` | High-level scope, stack, exclusions, setup. |
| `package.json` | Found at root and app package | `package.json`; `apps/web/package.json` | Root scripts and workspace setup. |
| `.env.example` | Found | `.env.example` | Auth, database, email, object storage, payment/logistics placeholders. |
| `docker-compose.yml` | Found | `docker-compose.yml` | Local Postgres, MinIO, web, migration/seed, Adminer. |
| `prisma/schema.prisma` | Found under package | `packages/database/prisma/schema.prisma` | Actual path differs from requested root path. |
| `prisma/migrations/` | Found under package | `packages/database/prisma/migrations/` | Actual path differs from requested root path. |
| `src/` | Found inside app and packages | `apps/web/src`; `packages/domain/src` | Domain logic is package-based. |
| `app/` | Found under app | `apps/web/app` | Next.js App Router root. |
| `pages/` | Not found as primary router | `apps/web/app` | App Router is used instead of Pages Router. |
| `components/` | Found under app | `apps/web/components` | Shared React components including context bar. |
| `lib/` | Found under app | `apps/web/lib` | App support utilities. |
| `server/` | Not a top-level app area | `apps/web/features/auth/server-session.ts`; `packages/domain/src` | Server behavior is route/domain-service based. |
| `api/` | Found as App Router APIs | `apps/web/app/api` | Document upload/access, health, admin audit logs. |
| `routes/` | Not a top-level route folder | `apps/web/app`; `apps/web/features/auth/auth-routes.mjs` | Route constants live in feature files. |
| `middleware.*` | Found | `apps/web/middleware.ts` | Lightweight auth redirect middleware. |
| `tests/` | Found as colocated tests and e2e | `apps/web/**/__tests__`; `packages/domain/src/**/__tests__`; `e2e` | No single root `tests/` folder is required for coverage. |
| `e2e/` | Found | `e2e/baseline.test.mjs` | Baseline MVP journey. |
| `docs/` | Found | `docs/` | Architecture, product, security, tickets, status. |
| `docs/tickets/` | Found | `docs/tickets/` | Phase ticket source docs. |

## Implementation Cautions for Future Manual Work

- The user manual should describe only active roles `BREEDER`, `BREEDING_STATION`, and `PLATFORM_ADMIN` unless future code activates additional roles. Evidence: `packages/domain/src/identity/role-model.mjs`; `apps/web/features/navigation.mjs`.
- Static legal/support pages should not be treated as finalized policies or support operations. Evidence: `apps/web/features/static-pages/static-pages.mjs`.
- Payment features should be described as payment reference tracking only, not real card or payment processing. Evidence: `packages/domain/src/payments/payment-reference.mjs`; `apps/web/features/payment-reference/PaymentReferencePanel.tsx`; `.env.example`.
- Shipment features should be described as manual/provider-reference tracking, not integrated logistics automation. Evidence: `packages/domain/src/shipments/shipment.mjs`; `.env.example`.
- Notification behavior is email-template/log oriented; no user-facing notification center was found. Evidence: `packages/domain/src/notifications`; `apps/web/features/station-dashboard/StationDashboard.tsx`; `apps/web/features/admin-dashboard/admin-dashboard.mjs`.
- Older docs should be verified against live routes and services before manual writing because some product docs predate implemented document, shipment, proof, and audit workflows. Evidence: `docs/product/mvp-scope.md`; `docs/current-implementation-status.md`; `apps/web/app`.

