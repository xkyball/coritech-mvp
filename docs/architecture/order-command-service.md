# Order Command Service

## Purpose

The Phase 1.1 order command layer keeps semen order mutations behind one
application service so permissions, status transitions, audit hooks, proof hooks
and notification hooks are applied consistently.

## Service Boundary

`OrderService` lives in `packages/domain/src/orders/semen-order.mjs`.

Order mutation endpoints and server actions must call `OrderService` instead of
calling raw preparation helpers or repository write methods directly. The
service owns these commands:

- `createDraftOrder`
- `updateDraftOrder`
- `submitOrder`
- `receiveOrder`
- `confirmOrder`
- `rejectOrder`
- `moveToFulfilment`
- `completeOrder`
- `transitionOrder` for explicit status transitions covered by the centralized
  transition map

Read-only order queries remain outside the command service.

## Command Rules

- The centralized status transition map remains the source of truth for allowed
  order movement.
- Each command validates that the actor has exactly one active Phase 1 role
  context before mutating an order.
- Draft updates are allowed only while the order is still `DRAFT`.
- Status transitions create status history and append audit and proof hooks.
- Duplicate status commands that target the order's current status return an
  idempotent result without writing another history, audit or proof event.
- Admin overrides must use an explicit active platform-admin context and are
  still audited through the same service path.

## Transaction Boundary

The service accepts an optional transaction wrapper. Repository writes,
status-history creation and hook dispatch preparation are performed inside that
boundary where the runtime supplies one. This keeps future API/database adapters
from duplicating order workflow rules.

## Hook Contracts

The service emits framework-neutral hook objects:

- Audit hooks are written through the audit repository integration.
- Proof hooks are dispatched through an injected proof service when available.
- Notification hooks are dispatched through an injected notification service when
  available.

The notification hook is intentionally only a request contract. This ticket does
not select or implement an email, SMS or in-app notification provider.

## Phase 1 Boundaries

This service does not implement AI scoring, blockchain/token logic,
marketplace expansion, federation automation, payment processing, unrestricted
buyer access or production vendor integrations.
