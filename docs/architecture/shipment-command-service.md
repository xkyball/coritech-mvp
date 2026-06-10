# Shipment Command Service

## Purpose

The Phase 1.1 shipment command layer keeps shipment mutations behind one
application service so shipment status, tracking history, audit logs, proof
events and notification hooks are applied consistently.

## Service Boundary

`ShipmentService` lives in `packages/domain/src/shipments/shipment.mjs`.

Shipment mutation endpoints, server actions and provider adapters must call
`ShipmentService` instead of writing shipment and tracking-event records
directly. The service owns these commands:

- `createShipment`
- `updateShipmentStatus`
- `attachTrackingReference`
- `markDelivered`
- `markDelayed`
- `confirmReceived`

Read-only shipment queries remain outside the command service.

## Command Rules

- Shipment creation is allowed only for eligible confirmed semen orders.
- Station-side create/update commands require an active assigned
  `BREEDING_STATION` role or an active `PLATFORM_ADMIN` role.
- Breeder receipt confirmation is allowed only for the breeder organization on
  the order, and only while the shipment is `IN_TRANSIT` or `DELIVERED`.
- Status changes append a `ShipmentTrackingEvent`; existing events are not
  overwritten.
- Manual and provider-originated tracking updates use the same normalized
  tracking-event shape (`eventSource`, `sourceEventId`, `providerStatus`,
  `location`, notes and timestamps).

## Delivery Confirmation Policy

Station users may mark a shipment delivered, which records `deliveredAt` and a
`STATION_MARKED_DELIVERED` confirmation source. A breeder may then confirm
receipt, which records `confirmedReceivedAt`, `confirmedByUserId` and
`BREEDER_CONFIRMED_RECEIVED`.

Station delivery creates a `SHIPMENT_CONFIRMED` proof event with station-derived
verification. Breeder receipt confirmation also creates a shipment confirmation
proof event, but its verification level remains workflow/system recorded rather
than overstating external verification.

Order completion is still controlled by the order command service. Receipt
confirmation does not silently complete an order.

## Transaction Boundary

The service accepts an optional transaction wrapper. Shipment writes, tracking
event writes and audit/proof persistence run inside that boundary when the
runtime supplies one.

## Hook Contracts

- Audit hooks are written through the audit repository integration.
- Proof hooks are persisted through repositories that support proof-event
  writes, or dispatched through an injected proof service when supplied.
- Notification hooks are emitted as provider-neutral request objects only.

This ticket does not select an external carrier, notification provider or
automation queue.

## Phase 1 Boundaries

This service does not implement AI scoring, blockchain/token logic,
marketplace expansion, federation automation, unrestricted buyer access or
production carrier integrations.
