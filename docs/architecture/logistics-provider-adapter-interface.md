# Logistics Provider Adapter Interface

Ticket 5.2 adds a provider-neutral shipment connector boundary without adding a
production carrier integration.

## Adapter Contract

`packages/domain/src/shipments/logistics-provider-adapter.mjs` defines a
`LogisticsProviderAdapter` shape with:

- `createShipment`
- `attachTrackingReference`
- `recordTrackingEvent`
- `normalizeTrackingEvent`
- provider metadata and an explicit `supportsExternalAutomation` flag

Adapter writes delegate to `ShipmentService`, so tracking events, audit logs,
proof hooks and notification hooks keep the same behavior as manual station
shipment actions.

## Phase 1 Implementations

`manual` is the Phase 1 adapter. It records manual shipment creation and
tracking events through the shared service.

`external_placeholder` exposes the future carrier seam and can normalize a
carrier-shaped tracking payload, but mutation methods throw
`LogisticsProviderAdapterUnavailableError` until a later provider ticket
supplies a real implementation.

## Event Normalization

`normalizeLogisticsTrackingEvent` maps known provider statuses such as
`picked_up`, `in_transit`, `out_for_delivery`, `delivered`, `delayed`,
`failed` and `cancelled` into the existing `ShipmentTrackingEvent` status
model. Unrecognized provider statuses are rejected unless the caller supplies an
explicit CoriTech `toStatus`.

The normalized event preserves provider references as metadata:

- provider name
- provider tracking id
- tracking URL
- source event id
- provider status
- location
- notes

## Boundaries

The adapter does not select a carrier, create production carrier credentials,
implement webhooks, poll provider APIs or automate logistics fulfilment. Future
provider integrations should implement this interface without changing the core
shipment proof logic.
