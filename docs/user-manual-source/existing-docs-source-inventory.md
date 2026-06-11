# Existing Documentation Source Inventory

Status: SOURCE EXTRACTION ONLY

## Documentation Sources

| Source file | Useful content summary | Manual section it may support | Reliability | Notes |
|---|---|---|---|---|
| `README.md` | Product wedge, stack, local setup, Phase 1 scope, explicit exclusions. | Introduction, system overview, implementation boundaries. | HIGH for setup/scope; MEDIUM for current feature detail. | Verify features against live code before final manual. |
| `.env.example` | Managed auth placeholders, email console defaults, object storage, payment/logistics placeholders. | Admin/setup appendix, limitations. | HIGH | Do not expose secrets; use placeholders only. |
| `docker-compose.yml` | Local Postgres, MinIO, migration/seed, web, Adminer services. | Developer/admin setup appendix, not end-user manual. | HIGH | Useful for environment notes, not user workflow copy. |
| `docs/current-implementation-status.md` | Current status snapshot for app areas, routes, and implemented/partial capabilities. | Manual planning and gap cross-check. | MEDIUM/HIGH | Live code remains source of truth. |
| `docs/security/role-permission-matrix.md` | Role and permission intent, route access, active roles. | Role chapter and permissions appendix. | MEDIUM/HIGH | Verify against route/domain enforcement. |
| `docs/architecture/web-app-shell-and-navigation.md` | App shell, navigation, role/context behavior. | Navigation and role context guidance. | MEDIUM/HIGH | Check against `apps/web/features/navigation.mjs`. |
| `docs/architecture/status-display-system.md` | User-facing status display strategy. | Status reference appendix. | MEDIUM/HIGH | Pair with `status-display-registry.mjs`. |
| `docs/architecture/order-command-service.md` | Order command service design and transitions. | Order workflow source. | MEDIUM | Verify against `packages/domain/src/orders/semen-order.mjs`. |
| `docs/architecture/shipment-command-service.md` | Shipment command design and lifecycle. | Shipment workflow source. | MEDIUM | Verify against `packages/domain/src/shipments/shipment.mjs`. |
| `docs/architecture/support-request-flow.md` | Support request design. | Support section. | MEDIUM | UI support resolution may still be partial. |
| `docs/architecture/payment-reference-model.md` | Reference-only payment model and sensitive data boundary. | Payment reference section and limitations. | HIGH | Aligns with service code. |
| `docs/development/minimal-e2e-happy-path.md` | Local deterministic end-to-end workflow description. | Manual workflow validation source. | MEDIUM/HIGH | Test-oriented language; not manual copy. |
| `e2e/baseline.test.mjs` | Covers baseline MVP journey from admin/user setup through order, station actions, shipment, docs, proof/audit/payment/support. | End-to-end workflow evidence. | HIGH for tested local behavior. | Uses deterministic/local test assumptions. |
| `docs/product/mvp-scope.md` | Product scope and feature boundaries. | Scope/exclusions. | LOW/MEDIUM for current implementation. | Some sections appear stale compared with live route/service implementation. |
| `docs/tickets/phase-1/` | Ticket-level feature intent and acceptance criteria. | Feature provenance and source of intended behavior. | MEDIUM | Some tickets may predate later consolidation; verify live code. |
| `docs/tickets/phase-1-1/` | Later app/admin/document/auth tickets and route work. | Current app/manual source context. | MEDIUM/HIGH | Useful for current route and admin scope. |
| `apps/web/features/static-pages/static-pages.mjs` | Public static page copy. | Legal/support page inventory only. | LOW for final legal content. | Explicit placeholder/static content. |
| `apps/web/features/status-display/status-display-registry.mjs` | User-facing labels/descriptions for order, shipment, payment, verification statuses. | Status glossary. | HIGH | Good future manual source; missing some status groups. |
| `packages/domain/src/**/__tests__` | Domain tests for auth, orders, shipments, documents, proof, audit, permissions, amendments, payments, support, notifications. | Evidence and QA appendix. | HIGH for tested service behavior. | Not user-facing copy. |
| `apps/web/**/__tests__` | UI/route tests for dashboards, order creation/detail, station workflows, documents/admin, auth. | Screen/workflow evidence. | HIGH for route behavior covered. | Use alongside route source. |

## Source Reliability Types

| Source type | Use in future manual | Caution |
|---|---|---|
| Live route/component/service code | Primary source for implemented user behavior. | Re-check before publishing. |
| Tests | Strong evidence that behavior is expected and currently exercised. | Some tests may use mocked or deterministic data. |
| Current implementation status docs | Helpful planning summary. | Can drift; verify with live code. |
| Ticket docs | Helpful intent/acceptance source. | Do not treat planned or older acceptance criteria as implemented without code. |
| Static public page copy | Source for what users currently see. | Legal/support text appears placeholder and should not be used as final policy. |
| Seed/demo scripts | Useful for sample screenshots/data. | Do not imply real production data or final workflows. |

