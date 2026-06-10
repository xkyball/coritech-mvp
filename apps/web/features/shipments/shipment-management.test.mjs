import test from "node:test";
import assert from "node:assert/strict";

import {
  createShipmentManagementViewModel,
  executeShipmentManagementAction,
} from "./shipment-management.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";

const stationActor = {
  userId: "user-station-a",
  roles: [
    {
      userId: "user-station-a",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const otherStationActor = {
  userId: "user-station-b",
  roles: [
    {
      userId: "user-station-b",
      organizationId: "org-station-b",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const confirmedOrder = {
  id: "order-confirmed",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "CONFIRMED",
  requestedDeliveryDate: "2026-06-12",
  createdByUserId: "user-breeder-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("shipment management view model exposes create and update forms for station shipments", () => {
  const createView = createShipmentManagementViewModel({
    actor: stationActor,
    organizationName: "North Valley Station",
    order: confirmedOrder,
  });

  assert.equal(createView.operation, "CREATE");
  assert.equal(createView.form.action, "create");
  assert.equal(createView.form.status, "PREPARED");
  assert.equal(createView.navigation.orderManagementHref, "/app/station/orders?orderId=order-confirmed");

  const updateView = createShipmentManagementViewModel({
    actor: stationActor,
    organizationName: "North Valley Station",
    order: confirmedOrder,
    shipment: {
      id: "shipment-1",
      semenOrderId: "order-confirmed",
      orderNumber: "SO-20260609-000001",
      breederOrganizationId,
      breedingStationOrganizationId: stationOrganizationId,
      status: "IN_TRANSIT",
      providerName: "Manual courier",
      providerTrackingId: "TRACK-1",
      trackingUrl: null,
      deliveredAt: null,
      confirmedReceivedAt: null,
      confirmedByUserId: null,
      confirmationSource: null,
      createdByUserId: "user-station-a",
      updatedByUserId: "user-station-a",
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  assert.equal(updateView.operation, "UPDATE");
  assert.equal(updateView.form.action, "update");
  assert.equal(updateView.form.status, "IN_TRANSIT");
  assert.equal(updateView.form.providerTrackingId, "TRACK-1");
});

test("shipment management action creates and updates durable shipment workflow records", async () => {
  const repository = buildRepository({ orders: [confirmedOrder] });

  const created = await executeShipmentManagementAction({
    action: "create",
    actor: stationActor,
    orderId: "order-confirmed",
    shipmentId: "",
    repository,
    form: {
      providerName: "Manual courier",
      providerTrackingId: "TRACK-1",
      trackingUrl: "https://carrier.example/track/TRACK-1",
      status: "PREPARED",
      eventSource: "MANUAL",
      notes: "Prepared at station",
    },
    auditContext: {
      userAgent: "node-test/shipment-management",
    },
  });

  assert.equal(created.ok, true);
  assert.equal(created.ok && created.shipment.status, "PREPARED");
  assert.equal(created.ok && created.proofResult.proofEvent.eventType, "SHIPMENT_CREATED");

  const updated = await executeShipmentManagementAction({
    action: "update",
    actor: stationActor,
    orderId: "order-confirmed",
    shipmentId: "shipment-1",
    repository,
    form: {
      providerName: "Manual courier",
      providerTrackingId: "TRACK-1",
      trackingUrl: "https://carrier.example/track/TRACK-1",
      status: "DELIVERED",
      eventSource: "MANUAL",
      notes: "Delivered to breeder",
    },
  });

  assert.equal(updated.ok, true);
  assert.equal(updated.ok && updated.shipment.status, "DELIVERED");
  assert.equal(updated.ok && updated.proofResult.proofEvent.eventType, "SHIPMENT_CONFIRMED");
  assert.deepEqual(
    repository.listTrackingStatuses(),
    ["PREPARED", "DELIVERED"],
  );

  const unauthorized = await executeShipmentManagementAction({
    action: "update",
    actor: otherStationActor,
    orderId: "order-confirmed",
    shipmentId: "shipment-1",
    repository,
    form: {
      status: "DELAYED",
      eventSource: "MANUAL",
      notes: "Cross-station update",
    },
  });

  assert.equal(unauthorized.ok, false);
  assert.match(
    unauthorized.ok ? "" : unauthorized.issues.join("\n"),
    /actor must be an active BREEDING_STATION user/,
  );
});

function buildRepository({ orders }) {
  const orderStore = new Map(orders.map((order) => [order.id, order]));
  const shipmentStore = new Map();
  const eventStore = new Map();
  const proofEventStore = new Map();
  let eventSequence = 1;
  let auditLogSequence = 1;
  let proofEventSequence = 1;

  return {
    async findSemenOrderById(orderId) {
      return orderStore.get(orderId) ?? null;
    },
    async createShipmentWithTrackingEvent(shipment, trackingEvent) {
      const persistedShipment = {
        ...shipment,
        id: shipment.id ?? "shipment-1",
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
      const persistedTrackingEvent = {
        ...trackingEvent,
        id: trackingEvent.id ?? `tracking-event-${eventSequence++}`,
        shipmentId: shipment.id,
      };
      const timeline = eventStore.get(shipment.id) ?? [];

      shipmentStore.set(shipment.id, shipment);
      timeline.push(persistedTrackingEvent);
      eventStore.set(shipment.id, timeline);

      return {
        shipment,
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
      return {
        ...auditLog,
        id: auditLog.id ?? `audit-log-${auditLogSequence++}`,
      };
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
    listTrackingStatuses() {
      return Array.from(eventStore.values())
        .flat()
        .map((event) => event.toStatus);
    },
  };
}
