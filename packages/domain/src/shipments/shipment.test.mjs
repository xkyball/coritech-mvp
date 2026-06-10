import test from "node:test";
import assert from "node:assert/strict";

import {
  SHIPMENT_ROUTES,
  SHIPMENT_SERVICE_COMMANDS,
  SHIPMENT_STATUSES,
  SHIPMENT_TRACKING_EVENT_SOURCES,
  ShipmentAuthorizationError,
  ShipmentValidationError,
  canConfirmShipmentReceived,
  canManageShipment,
  canViewShipment,
  createShipmentService,
  createShipmentEndpoint,
  createShipmentTrackingEventEndpoint,
  getShipmentEndpoint,
  listOrderShipmentsEndpoint,
  listShipmentTrackingEventsEndpoint,
  prepareCreateShipment,
  prepareConfirmShipmentReceived,
  prepareCreateShipmentTrackingEvent,
} from "./shipment.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";

const stationActor = {
  userId: "user-station",
  roles: [
    {
      userId: "user-station",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const otherStationActor = {
  userId: "user-other-station",
  roles: [
    {
      userId: "user-other-station",
      organizationId: "org-station-b",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const breederActor = {
  userId: "user-breeder",
  roles: [
    {
      userId: "user-breeder",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const adminActor = {
  userId: "user-admin",
  roles: [
    {
      userId: "user-admin",
      organizationId: "org-platform",
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    },
  ],
};

const futureBuyerActor = {
  userId: "user-buyer",
  roles: [
    {
      userId: "user-buyer",
      organizationId: "org-buyer",
      roleCode: "BUYER",
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
  createdByUserId: "user-breeder",
  updatedByUserId: "user-station",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const draftOrder = {
  ...confirmedOrder,
  id: "order-draft",
  status: "DRAFT",
};

const preparedShipment = {
  id: "shipment-1",
  semenOrderId: "order-confirmed",
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "PREPARED",
  providerName: "Manual Courier",
  providerTrackingId: "TRACK-1",
  trackingUrl: "https://carrier.example/track/TRACK-1",
  deliveredAt: null,
  confirmedReceivedAt: null,
  confirmedByUserId: null,
  confirmationSource: null,
  createdByUserId: "user-station",
  updatedByUserId: "user-station",
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("shipment route contract and enums stay inside the Phase 1 tracking model", () => {
  assert.deepEqual(SHIPMENT_STATUSES, [
    "PREPARED",
    "DISPATCHED",
    "IN_TRANSIT",
    "DELIVERED",
    "DELAYED",
    "FAILED",
    "CANCELLED",
  ]);
  assert.deepEqual(SHIPMENT_TRACKING_EVENT_SOURCES, [
    "MANUAL",
    "LOGISTICS_PROVIDER",
    "SYSTEM",
  ]);
  assert.deepEqual(SHIPMENT_SERVICE_COMMANDS, [
    "CREATE_SHIPMENT",
    "UPDATE_SHIPMENT_STATUS",
    "ATTACH_TRACKING_REFERENCE",
    "MARK_DELIVERED",
    "MARK_DELAYED",
    "CONFIRM_RECEIVED",
  ]);
  assert.deepEqual(
    SHIPMENT_ROUTES.map((route) => `${route.method} ${route.path}`),
    [
      "POST /semen-orders/:orderId/shipments",
      "GET /semen-orders/:orderId/shipments",
      "GET /shipments/:shipmentId",
      "POST /shipments/:shipmentId/tracking-events",
      "GET /shipments/:shipmentId/tracking-events",
    ],
  );
});

test("station can create shipment for a confirmed order with initial tracking event", () => {
  const prepared = prepareCreateShipment({
    shipmentId: "shipment-1",
    trackingEventId: "tracking-event-1",
    existingOrder: confirmedOrder,
    providerName: " Manual Courier ",
    providerTrackingId: " TRACK-1 ",
    trackingUrl: "https://carrier.example/track/TRACK-1",
    notes: " Prepared by the station ",
    actor: stationActor,
    createdAt: timestamp,
  });

  assert.deepEqual(prepared.shipment, preparedShipment);
  assert.deepEqual(prepared.trackingEvent, {
    id: "tracking-event-1",
    shipmentId: "shipment-1",
    semenOrderId: "order-confirmed",
    orderNumber: "SO-20260609-000001",
    fromStatus: null,
    toStatus: "PREPARED",
    eventSource: "MANUAL",
    sourceEventId: null,
    providerStatus: null,
    location: null,
    notes: "Prepared by the station",
    actorUserId: "user-station",
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: stationOrganizationId,
    occurredAt: timestamp,
    recordedAt: timestamp,
  });
  assert.equal(prepared.auditHook.action, "SHIPMENT_CREATED");
  assert.equal(prepared.auditHook.trackingEventId, "tracking-event-1");
  assert.equal(prepared.auditHook.newValue.status, "PREPARED");
  assert.equal(prepared.proofHook.hookType, "PROOF_EVENT_REQUEST");
  assert.equal(prepared.proofHook.triggerRef.trackingEventId, "tracking-event-1");
  assert.equal(prepared.proofHook.triggerRef.eventSource, "MANUAL");
});

test("shipment creation is limited to confirmed orders and assigned stations", () => {
  assert.throws(
    () =>
      prepareCreateShipment({
        existingOrder: draftOrder,
        actor: stationActor,
        createdAt: timestamp,
      }),
    (error) =>
      error instanceof ShipmentValidationError &&
      error.issues.includes("shipment can only be created for a CONFIRMED semen order."),
  );

  assert.throws(
    () =>
      prepareCreateShipment({
        existingOrder: confirmedOrder,
        actor: breederActor,
        createdAt: timestamp,
      }),
    (error) =>
      error instanceof ShipmentValidationError &&
      error.issues.includes(
        "actor must be an active BREEDING_STATION user for the assigned station or PLATFORM_ADMIN.",
      ),
  );

  assert.equal(canManageShipment(stationActor, confirmedOrder), true);
  assert.equal(canManageShipment(adminActor, confirmedOrder), true);
  assert.equal(canManageShipment(breederActor, confirmedOrder), false);
  assert.equal(canManageShipment(otherStationActor, confirmedOrder), false);
});

test("station can manually update shipment status with audit and proof hooks", () => {
  const prepared = prepareCreateShipmentTrackingEvent({
    trackingEventId: "tracking-event-2",
    existingShipment: preparedShipment,
    toStatus: "DISPATCHED",
    notes: "Handed to courier",
    actor: stationActor,
    now: timestamp,
  });

  assert.equal(prepared.shipment.status, "DISPATCHED");
  assert.equal(prepared.shipment.updatedByUserId, "user-station");
  assert.deepEqual(prepared.trackingEvent, {
    id: "tracking-event-2",
    shipmentId: "shipment-1",
    semenOrderId: "order-confirmed",
    orderNumber: "SO-20260609-000001",
    fromStatus: "PREPARED",
    toStatus: "DISPATCHED",
    eventSource: "MANUAL",
    sourceEventId: null,
    providerStatus: null,
    location: null,
    notes: "Handed to courier",
    actorUserId: "user-station",
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: stationOrganizationId,
    occurredAt: timestamp,
    recordedAt: timestamp,
  });
  assert.equal(prepared.auditHook.action, "SHIPMENT_STATUS_UPDATED");
  assert.equal(prepared.auditHook.previousValue?.status, "PREPARED");
  assert.equal(prepared.auditHook.newValue.status, "DISPATCHED");
  assert.equal(prepared.proofHook.auditHookRef.action, "SHIPMENT_STATUS_UPDATED");
  assert.equal(prepared.proofHook.triggerRef.toStatus, "DISPATCHED");
});

test("tracking event structure accepts normalized future provider metadata without integration automation", () => {
  const prepared = prepareCreateShipmentTrackingEvent({
    existingShipment: {
      ...preparedShipment,
      status: "DISPATCHED",
    },
    toStatus: "IN_TRANSIT",
    eventSource: "LOGISTICS_PROVIDER",
    sourceEventId: "provider-event-42",
    providerStatus: "departed_sorting_hub",
    location: "Johannesburg hub",
    notes: "Normalized provider milestone",
    actor: adminActor,
    occurredAt: timestamp,
    now: timestamp,
  });

  assert.equal(prepared.trackingEvent.eventSource, "LOGISTICS_PROVIDER");
  assert.equal(prepared.trackingEvent.sourceEventId, "provider-event-42");
  assert.equal(prepared.trackingEvent.providerStatus, "departed_sorting_hub");
  assert.equal(prepared.trackingEvent.location, "Johannesburg hub");
  assert.equal(prepared.auditHook.eventSource, "LOGISTICS_PROVIDER");
  assert.equal(prepared.proofHook.triggerRef.eventSource, "LOGISTICS_PROVIDER");
});

test("shipment view permissions include breeder, assigned station and platform admin only", () => {
  assert.equal(canViewShipment(breederActor, preparedShipment), true);
  assert.equal(canViewShipment(stationActor, preparedShipment), true);
  assert.equal(canViewShipment(adminActor, preparedShipment), true);
  assert.equal(canViewShipment(otherStationActor, preparedShipment), false);
  assert.equal(canViewShipment(futureBuyerActor, preparedShipment), false);
});

test("breeder can confirm receipt for in-transit or delivered shipment", () => {
  const inTransitShipment = {
    ...preparedShipment,
    status: "IN_TRANSIT",
  };
  const prepared = prepareConfirmShipmentReceived({
    trackingEventId: "tracking-event-receipt",
    existingShipment: inTransitShipment,
    notes: "Received at breeding yard",
    actor: breederActor,
    now: timestamp,
  });

  assert.equal(canConfirmShipmentReceived(breederActor, preparedShipment), true);
  assert.equal(canConfirmShipmentReceived(stationActor, preparedShipment), false);
  assert.equal(prepared.shipment.status, "DELIVERED");
  assert.equal(prepared.shipment.deliveredAt, timestamp);
  assert.equal(prepared.shipment.confirmedReceivedAt, timestamp);
  assert.equal(prepared.shipment.confirmedByUserId, "user-breeder");
  assert.equal(prepared.shipment.confirmationSource, "BREEDER_CONFIRMED_RECEIVED");
  assert.equal(prepared.trackingEvent.actorRoleCode, "BREEDER");
  assert.equal(prepared.auditHook.action, "SHIPMENT_RECEIPT_CONFIRMED");
  assert.equal(prepared.proofHook.triggerRef.toStatus, "DELIVERED");

  assert.throws(
    () =>
      prepareConfirmShipmentReceived({
        existingShipment: preparedShipment,
        actor: otherStationActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof ShipmentValidationError &&
      error.issues.includes("actor must be the active BREEDER user for the shipment order."),
  );
});

test("shipment endpoints persist shipment and tracking event timeline", async () => {
  const repository = buildRepository({
    orders: [confirmedOrder],
  });

  const created = await createShipmentEndpoint({
    actor: stationActor,
    repository,
    auditContext: {
      ipAddress: "203.0.113.11",
      userAgent: "node-test/shipment-create",
    },
    params: {
      orderId: "order-confirmed",
    },
    body: {
      providerName: "Manual Courier",
      providerTrackingId: "TRACK-1",
      trackingUrl: "https://carrier.example/track/TRACK-1",
      notes: "Initial shipment prep",
      createdAt: timestamp,
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.shipment.id, "shipment-1");
  assert.equal(created.body.shipment.status, "PREPARED");
  assert.equal(created.body.trackingEvent.id, "tracking-event-1");
  assert.equal(created.body.trackingEvent.shipmentId, "shipment-1");
  assert.equal(created.auditHook?.targetId, "shipment-1");
  assert.equal(created.auditLog?.action, "CREATE");
  assert.equal(created.auditLog?.sourceAction, "SHIPMENT_CREATED");
  assert.equal(created.auditLog?.objectId, "shipment-1");
  assert.equal(created.auditLog?.ipAddress, "203.0.113.11");
  assert.equal(created.proofHook?.triggerRef.trackingEventId, "tracking-event-1");
  assert.equal(created.proofResult?.proofEvent.eventType, "SHIPMENT_CREATED");
  assert.equal(created.proofResult?.proofEvent.shipmentId, "shipment-1");
  assert.equal(created.proofResult?.proofEvent.semenOrderId, "order-confirmed");
  assert.equal(created.proofResult?.proofEvent.auditLogId, created.auditLog?.id);

  const updated = await createShipmentTrackingEventEndpoint({
    actor: stationActor,
    repository,
    params: {
      shipmentId: "shipment-1",
    },
    body: {
      toStatus: "DELIVERED",
      notes: "Delivered to breeder",
      now: timestamp,
    },
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.shipment.status, "DELIVERED");
  assert.equal(updated.body.trackingEvent.fromStatus, "PREPARED");
  assert.equal(updated.body.trackingEvent.toStatus, "DELIVERED");
  assert.equal(updated.auditHook?.previousValue?.status, "PREPARED");
  assert.equal(updated.auditHook?.newValue.status, "DELIVERED");
  assert.equal(updated.auditLog?.action, "STATUS_CHANGE");
  assert.equal(updated.auditLog?.previousValues?.status, "PREPARED");
  assert.equal(updated.auditLog?.newValues?.status, "DELIVERED");
  assert.equal(updated.proofResult?.proofEvent.eventType, "SHIPMENT_CONFIRMED");
  assert.equal(updated.proofResult?.proofEvent.verificationLevel, "STATION_CONFIRMED");
  assert.equal(updated.proofResult?.auditLog.action, "CREATE_PROOF_EVENT");

  const listedForOrder = await listOrderShipmentsEndpoint({
    actor: breederActor,
    repository,
    params: {
      orderId: "order-confirmed",
    },
    body: {},
  });

  assert.deepEqual(
    listedForOrder.body.shipments.map((shipment) => shipment.status),
    ["DELIVERED"],
  );

  const timeline = await listShipmentTrackingEventsEndpoint({
    actor: stationActor,
    repository,
    params: {
      shipmentId: "shipment-1",
    },
    body: {},
  });

  assert.deepEqual(
    timeline.body.trackingEvents.map((event) => event.toStatus),
    ["PREPARED", "DELIVERED"],
  );

  const fetched = await getShipmentEndpoint({
    actor: breederActor,
    repository,
    params: {
      shipmentId: "shipment-1",
    },
    body: {},
  });

  assert.equal(fetched.body.shipment.status, "DELIVERED");
  assert.deepEqual(
    repository.listProofEvents().map((proofEvent) => proofEvent.eventType),
    ["SHIPMENT_CREATED", "SHIPMENT_CONFIRMED"],
  );

  await assert.rejects(
    () =>
      getShipmentEndpoint({
        actor: futureBuyerActor,
        repository,
        params: {
          shipmentId: "shipment-1",
        },
        body: {},
      }),
    ShipmentAuthorizationError,
  );
});

test("ShipmentService centralizes create, provider reference and named status commands", async () => {
  const repository = buildRepository({
    orders: [confirmedOrder, draftOrder],
  });
  let transactionCount = 0;
  const notifications = [];
  const service = createShipmentService({
    repository,
    auditContext: {
      userAgent: "node-test/shipment-service",
    },
    notificationService: {
      recordShipmentNotificationHook(hook) {
        notifications.push(hook);
        return { recorded: true };
      },
    },
    transaction: async (operation) => {
      transactionCount += 1;
      return operation(repository);
    },
  });

  await assert.rejects(
    () =>
      service.createShipment({
        actor: stationActor,
        orderId: "order-draft",
        body: {
          createdAt: timestamp,
        },
      }),
    (error) =>
      error instanceof ShipmentValidationError &&
      error.issues.includes("shipment can only be created for a CONFIRMED semen order."),
  );

  const created = await service.createShipment({
    actor: stationActor,
    orderId: "order-confirmed",
    body: {
      providerName: "Manual Courier",
      providerTrackingId: "TRACK-1",
      trackingUrl: "https://carrier.example/track/TRACK-1",
      notes: "Initial shipment prep",
      createdAt: timestamp,
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.shipment.status, "PREPARED");
  assert.equal(created.proofResult.proofEvent.eventType, "SHIPMENT_CREATED");
  assert.equal(created.notificationHook.eventType, "SHIPMENT_CREATED");

  const attached = await service.attachTrackingReference({
    actor: stationActor,
    shipmentId: "shipment-1",
    body: {
      providerTrackingId: "TRACK-2",
      trackingUrl: "https://carrier.example/track/TRACK-2",
      eventSource: "LOGISTICS_PROVIDER",
      sourceEventId: "provider-event-42",
      providerStatus: "tracking_reference_updated",
      notes: "Provider tracking reference attached",
      now: timestamp,
    },
  });

  assert.equal(attached.shipment.providerTrackingId, "TRACK-2");
  assert.equal(attached.trackingEvent.eventSource, "LOGISTICS_PROVIDER");
  assert.equal(attached.trackingEvent.sourceEventId, "provider-event-42");
  assert.equal(attached.notificationHook.eventType, "SHIPMENT_TRACKING_REFERENCE_ATTACHED");

  const delayed = await service.markDelayed({
    actor: stationActor,
    shipmentId: "shipment-1",
    body: {
      notes: "Courier delay",
      now: timestamp,
    },
  });

  assert.equal(delayed.shipment.status, "DELAYED");
  assert.equal(delayed.notificationHook.eventType, "SHIPMENT_DELAYED");

  const delivered = await service.markDelivered({
    actor: stationActor,
    shipmentId: "shipment-1",
    body: {
      notes: "Delivered to breeder",
      now: timestamp,
    },
  });

  assert.equal(delivered.shipment.status, "DELIVERED");
  assert.equal(delivered.proofResult.proofEvent.eventType, "SHIPMENT_CONFIRMED");
  assert.equal(delivered.proofResult.proofEvent.verificationLevel, "STATION_CONFIRMED");

  const confirmedReceived = await service.confirmReceived({
    actor: breederActor,
    shipmentId: "shipment-1",
    body: {
      notes: "Breeder received shipment",
      now: timestamp,
    },
  });

  assert.equal(confirmedReceived.shipment.confirmedReceivedAt, timestamp);
  assert.equal(confirmedReceived.shipment.confirmedByUserId, "user-breeder");
  assert.equal(confirmedReceived.notificationHook.eventType, "SHIPMENT_RECEIPT_CONFIRMED");
  assert.equal(confirmedReceived.proofResult.proofEvent.eventType, "SHIPMENT_CONFIRMED");
  assert.equal(confirmedReceived.proofResult.proofEvent.verificationLevel, "SYSTEM_RECORDED");
  assert.equal(transactionCount, 6);
  assert.deepEqual(
    notifications.map((hook) => hook.eventType),
    [
      "SHIPMENT_CREATED",
      "SHIPMENT_TRACKING_REFERENCE_ATTACHED",
      "SHIPMENT_DELAYED",
      "SHIPMENT_DELIVERED",
      "SHIPMENT_RECEIPT_CONFIRMED",
    ],
  );

  await assert.rejects(
    () =>
      service.markDelivered({
        actor: otherStationActor,
        shipmentId: "shipment-1",
        body: {
          notes: "Unauthorized delivery",
          now: timestamp,
        },
      }),
    (error) =>
      error instanceof ShipmentValidationError &&
      error.issues.includes(
        "actor must be an active BREEDING_STATION user for the assigned station or PLATFORM_ADMIN.",
      ),
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
      const persistedShipment = {
        ...shipment,
      };
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

      return persistedAuditLog;
    },
    async createProofEvent(proofEvent) {
      const existingProofEvent = Array.from(proofEventStore.values()).find(
        (existing) =>
          existing.eventType === proofEvent.eventType &&
          existing.source === proofEvent.source &&
          existing.triggerType === proofEvent.triggerType &&
          existing.shipmentId === proofEvent.shipmentId &&
          existing.semenOrderId === proofEvent.semenOrderId &&
          existing.orderNumber === proofEvent.orderNumber &&
          stableJson(existing.triggerRef) === stableJson(proofEvent.triggerRef),
      );

      if (existingProofEvent) {
        return existingProofEvent;
      }

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
    listProofEvents() {
      return Array.from(proofEventStore.values());
    },
  };
}

function stableJson(value) {
  return JSON.stringify(sortJson(value));
}

function sortJson(value) {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJson(item)]),
    );
  }

  return value;
}
