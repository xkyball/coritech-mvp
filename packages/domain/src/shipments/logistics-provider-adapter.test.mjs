// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import {
  LogisticsProviderAdapterConfigError,
  LogisticsProviderAdapterUnavailableError,
  LogisticsTrackingEventNormalizationError,
  createExternalProviderAdapter,
  createLogisticsProviderAdapter,
  createManualLogisticsAdapter,
  normalizeLogisticsTrackingEvent,
} from "./logistics-provider-adapter.mjs";

const timestamp = "2026-06-10T08:00:00.000Z";
const breederOrganizationId = "org-breeder";
const stationOrganizationId = "org-station";
const stationActor = Object.freeze({
  userId: "user-station",
  roles: Object.freeze([
    Object.freeze({
      userId: "user-station",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    }),
  ]),
});
const confirmedOrder = Object.freeze({
  id: "order-confirmed",
  orderNumber: "SO-20260610-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "CONFIRMED",
  createdByUserId: "user-breeder",
  updatedByUserId: "user-station",
  createdAt: timestamp,
  updatedAt: timestamp,
});

test("manual logistics adapter creates shipments through the shared shipment service", async () => {
  const repository = buildRepository({
    orders: [confirmedOrder],
  });
  const adapter = createManualLogisticsAdapter({
    repository,
  });
  const result = await adapter.createShipment({
    actor: stationActor,
    orderId: confirmedOrder.id,
    body: {
      providerTrackingId: "TRACK-1",
      trackingUrl: "https://carrier.example/track/TRACK-1",
      notes: "Manual dispatch preparation.",
      now: timestamp,
    },
  });

  assert.equal(adapter.providerKind, "manual");
  assert.equal(adapter.supportsExternalAutomation, false);
  assert.equal(result.shipment.providerName, "Manual logistics");
  assert.equal(result.trackingEvent.eventSource, "MANUAL");
  assert.equal(
    repository.auditLogs.some((auditLog) => auditLog.sourceAction === "SHIPMENT_CREATED"),
    true,
  );
});

test("manual and future external adapters use the same normalized tracking event shape", async () => {
  const repository = buildRepository({
    orders: [confirmedOrder],
  });
  const adapter = createLogisticsProviderAdapter(
    {
      provider: "manual",
      providerName: "Manual courier",
    },
    {
      repository,
    },
  );
  const created = await adapter.createShipment({
    actor: stationActor,
    orderId: confirmedOrder.id,
    body: {
      providerTrackingId: "TRACK-2",
      providerStatus: "prepared",
      now: timestamp,
    },
  });
  const updated = await adapter.recordTrackingEvent({
    actor: stationActor,
    shipmentId: created.shipment.id,
    event: {
      providerTrackingId: "TRACK-2",
      providerStatus: "out-for-delivery",
      sourceEventId: "carrier-event-1",
      location: "Cape Town",
      occurredAt: "2026-06-10T10:00:00.000Z",
    },
  });
  const externalPlaceholder = createExternalProviderAdapter({
    providerName: "future_carrier",
  });
  const normalizedExternal = externalPlaceholder.normalizeTrackingEvent({
    providerStatus: "delivered",
    sourceEventId: "future-event-1",
  });

  assert.equal(updated.shipment.status, "IN_TRANSIT");
  assert.equal(updated.trackingEvent.providerStatus, "out-for-delivery");
  assert.equal(updated.trackingEvent.sourceEventId, "carrier-event-1");
  assert.equal(normalizedExternal.toStatus, "DELIVERED");
  assert.equal(normalizedExternal.eventSource, "LOGISTICS_PROVIDER");
  assert.equal(normalizedExternal.providerName, "future_carrier");
});

test("external logistics adapter is a placeholder and fails closed", async () => {
  const adapter = createExternalProviderAdapter({
    providerName: "future_carrier",
  });

  await assert.rejects(
    () =>
      adapter.recordTrackingEvent({
        actor: stationActor,
        shipmentId: "shipment-1",
        event: {
          providerStatus: "delivered",
        },
      }),
    (error) =>
      error instanceof LogisticsProviderAdapterUnavailableError &&
      error.providerName === "future_carrier",
  );
});

test("tracking event normalization requires a known shipment status", () => {
  assert.deepEqual(
    normalizeLogisticsTrackingEvent({
      providerStatus: "picked up",
      providerTrackingId: "TRACK-3",
    }),
    {
      toStatus: "IN_TRANSIT",
      providerName: null,
      providerTrackingId: "TRACK-3",
      trackingUrl: null,
      eventSource: "LOGISTICS_PROVIDER",
      sourceEventId: null,
      providerStatus: "picked up",
      location: null,
      notes: null,
      occurredAt: undefined,
      now: undefined,
    },
  );

  assert.throws(
    () =>
      normalizeLogisticsTrackingEvent({
        providerStatus: "carrier invented a new status",
      }),
    (error) =>
      error instanceof LogisticsTrackingEventNormalizationError &&
      error.issues.includes("toStatus or a recognized providerStatus is required."),
  );
});

test("logistics adapter config stays provider-neutral", () => {
  assert.throws(
    () =>
      createLogisticsProviderAdapter({
        provider: "carrier_x",
      }),
    (error) =>
      error instanceof LogisticsProviderAdapterConfigError &&
      error.issues.includes("provider must be one of: manual, external_placeholder."),
  );
  assert.throws(
    () =>
      createLogisticsProviderAdapter({
        provider: "manual",
      }),
    (error) =>
      error instanceof LogisticsProviderAdapterConfigError &&
      error.issues.includes("repository is required for the manual logistics adapter."),
  );
});

function buildRepository({ orders }) {
  const orderStore = new Map(orders.map((order) => [order.id, order]));
  const shipmentStore = new Map();
  const eventStore = new Map();
  const auditLogStore = new Map();
  const proofEventStore = new Map();
  let shipmentSequence = 1;
  let eventSequence = 1;
  let auditLogSequence = 1;
  let proofEventSequence = 1;

  return {
    auditLogs: [],
    async findSemenOrderById(orderId) {
      return orderStore.get(orderId) ?? null;
    },
    async createShipmentWithTrackingEvent(shipment, trackingEvent) {
      const persistedShipment = {
        ...shipment,
        id: shipment.id ?? `shipment-${shipmentSequence++}`,
      };
      const persistedTrackingEvent = {
        ...trackingEvent,
        id: trackingEvent.id ?? `tracking-event-${eventSequence++}`,
        shipmentId: persistedShipment.id,
      };

      shipmentStore.set(persistedShipment.id, persistedShipment);
      eventStore.set(persistedShipment.id, [persistedTrackingEvent]);

      return {
        shipment: persistedShipment,
        trackingEvent: persistedTrackingEvent,
      };
    },
    async findShipmentById(shipmentId) {
      return shipmentStore.get(shipmentId) ?? null;
    },
    async updateShipmentWithTrackingEvent(shipment, trackingEvent) {
      const persistedShipment = { ...shipment };
      const persistedTrackingEvent = {
        ...trackingEvent,
        id: trackingEvent.id ?? `tracking-event-${eventSequence++}`,
        shipmentId: persistedShipment.id,
      };
      const timeline = eventStore.get(persistedShipment.id) ?? [];

      shipmentStore.set(persistedShipment.id, persistedShipment);
      timeline.push(persistedTrackingEvent);
      eventStore.set(persistedShipment.id, timeline);

      return {
        shipment: persistedShipment,
        trackingEvent: persistedTrackingEvent,
      };
    },
    async listShipmentsForOrder(orderId) {
      return Array.from(shipmentStore.values()).filter(
        (shipment) => shipment.semenOrderId === orderId,
      );
    },
    async listShipmentTrackingEvents(shipmentId) {
      return eventStore.get(shipmentId) ?? [];
    },
    async createAuditLog(auditLog) {
      const persistedAuditLog = {
        ...auditLog,
        id: auditLog.id ?? `audit-log-${auditLogSequence++}`,
      };
      const objectLogs = auditLogStore.get(persistedAuditLog.objectId) ?? [];

      objectLogs.push(persistedAuditLog);
      auditLogStore.set(persistedAuditLog.objectId, objectLogs);
      this.auditLogs.push(persistedAuditLog);

      return persistedAuditLog;
    },
    async createProofEvent(proofEvent) {
      const persistedProofEvent = {
        ...proofEvent,
        id: proofEvent.id ?? `proof-event-${proofEventSequence++}`,
      };

      proofEventStore.set(persistedProofEvent.id, persistedProofEvent);

      return persistedProofEvent;
    },
    async listProofEventsForShipment(shipmentId) {
      return Array.from(proofEventStore.values()).filter(
        (proofEvent) => proofEvent.shipmentId === shipmentId,
      );
    },
  };
}
