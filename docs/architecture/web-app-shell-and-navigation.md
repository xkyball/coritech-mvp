# Web App Shell and Navigation

## Purpose

CoriTech Phase 1.1 separates the public site, authenticated app boundary and
role-scoped workspaces while keeping navigation in one reusable configuration.

## Layout Responsibilities

| Layer | Responsibility |
| --- | --- |
| `apps/web/app/layout.tsx` | Public root layout, global metadata and shared CSS. |
| `apps/web/app/app/layout.tsx` | Authenticated app boundary. It redirects unauthenticated requests before protected child routes render. |
| `DashboardShell` | Reusable role-scoped shell with CoriTech wordmark, sidebar navigation, active organization/role display, user area and sign-out action. |
| Feature pages | Provide page content and active route, but do not define global navigation policy. |

The shell is intentionally not an authorization layer. Routes, server actions
and services must still use managed-auth session context, active role context
and RBAC checks before reading or mutating protected data.

## Navigation Configuration

Role-aware navigation lives in `apps/web/features/navigation.mjs`.

| Role | Navigation group |
| --- | --- |
| `BREEDER` | Breeder dashboard, catalog and order creation. |
| `BREEDING_STATION` | Station dashboard, order management and listing management. |
| `PLATFORM_ADMIN` | Admin overview. |

Unknown or future roles receive no protected navigation links until a later
ticket explicitly activates them.

## Runtime States

Reusable UI primitives cover later-ticket states:

- `LoadingState`
- `EmptyState`
- `ErrorState`
- `Alert`
- `Notice`
- `ValidationErrorList`
- `ToastMessage`

Breadcrumb support is available through `PageHeader` and `Breadcrumbs`, so
feature pages can expose location without duplicating shell markup.

## Boundaries

This ticket does not add new business workflows, grant buyer access, implement
provider-specific session exchange, add AI, blockchain/token logic, payment
processing, federation automation, marketplace expansion, logistics automation
or sensor ingestion.
