import test from "node:test";
import assert from "node:assert/strict";

import {
  ORDER_SERVICE_COMMANDS,
  SEMEN_ORDER_ROUTES,
  SEMEN_ORDER_STATUS_TRANSITIONS,
  SemenOrderValidationError,
  canTransitionSemenOrderStatus,
  canViewSemenOrder,
  createOrderService,
  createDraftSemenOrderEndpoint,
  generateSemenOrderNumber,
  getSemenOrderEndpoint,
  isAllowedSemenOrderStatusTransition,
  listOrderStatusHistoryEndpoint,
  prepareCreateDraftSemenOrder,
  prepareTransitionSemenOrderStatus,
  transitionSemenOrderStatusEndpoint,
  validateSemenOrderSubmissionDetails,
} from "./semen-order.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";

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

const activeListing = {
  id: "listing-active",
  stallionId: "stallion-a",
  breedingStationOrganizationId: stationOrganizationId,
  availabilityStatus: "AVAILABLE",
  listingStatus: "ACTIVE",
  termsSummary: "Fresh semen available weekdays",
};

const completeOrderDetails = {
  requestedDeliveryDate: "2026-06-12",
  shippingContactName: "Ava Breeder",
  shippingContactPhone: "+27 82 555 0101",
  shippingAddressLine1: "42 Foaling Barn Road",
  shippingAddressLine2: "Gate 3",
  shippingCity: "Pretoria",
  shippingRegion: "Gauteng",
  shippingPostalCode: "0081",
  shippingCountry: "South Africa",
  specialInstructions: "Call before dispatch.",
};

const draftOrder = {
  id: "order-1",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "DRAFT",
  ...completeOrderDetails,
  createdByUserId: "user-breeder",
  updatedByUserId: "user-breeder",
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("semen order route contract and transitions stay inside Phase 1 workflow", () => {
  assert.deepEqual(ORDER_SERVICE_COMMANDS, [
    "CREATE_DRAFT_ORDER",
    "UPDATE_DRAFT_ORDER",
    "SUBMIT_ORDER",
    "RECEIVE_ORDER",
    "CONFIRM_ORDER",
    "REJECT_ORDER",
    "MOVE_TO_FULFILMENT",
    "COMPLETE_ORDER",
    "TRANSITION_ORDER_STATUS",
  ]);

  assert.deepEqual(
    SEMEN_ORDER_ROUTES.map((route) => `${route.method} ${route.path}`),
    [
      "POST /semen-orders",
      "POST /semen-orders/:orderId/status-transitions",
      "GET /semen-orders/:orderId",
      "GET /semen-orders/:orderId/status-history",
    ],
  );

  assert.deepEqual(SEMEN_ORDER_STATUS_TRANSITIONS, {
    DRAFT: ["SUBMITTED", "CANCELLED"],
    SUBMITTED: ["RECEIVED", "CANCELLED"],
    RECEIVED: ["CONFIRMED", "REJECTED", "CANCELLED"],
    CONFIRMED: ["IN_FULFILMENT", "CANCELLED"],
    REJECTED: [],
    IN_FULFILMENT: ["SHIPPED", "CANCELLED"],
    SHIPPED: ["DELIVERED"],
    DELIVERED: ["COMPLETED"],
    COMPLETED: [],
    CANCELLED: [],
  });

  assert.equal(isAllowedSemenOrderStatusTransition("DRAFT", "SUBMITTED"), true);
  assert.equal(isAllowedSemenOrderStatusTransition("SUBMITTED", "CONFIRMED"), false);
});

test("breeder can create a draft semen order with order number, history, audit and proof hooks", () => {
  assert.equal(
    generateSemenOrderNumber({
      sequence: 42,
      occurredAt: timestamp,
    }),
    "SO-20260609-000042",
  );

  const prepared = prepareCreateDraftSemenOrder({
    orderId: "order-draft",
    statusHistoryId: "history-draft",
    listing: activeListing,
    breederOrganizationId,
    orderNumberSequence: 42,
    ...completeOrderDetails,
    reason: "Mare owner requested fresh semen",
    actor: breederActor,
    createdAt: timestamp,
  });

  assert.deepEqual(prepared.order, {
    id: "order-draft",
    orderNumber: "SO-20260609-000042",
    semenListingId: "listing-active",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    status: "DRAFT",
    ...completeOrderDetails,
    createdByUserId: "user-breeder",
    updatedByUserId: "user-breeder",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  assert.deepEqual(prepared.statusHistory, {
    id: "history-draft",
    semenOrderId: "order-draft",
    orderNumber: "SO-20260609-000042",
    fromStatus: null,
    toStatus: "DRAFT",
    actorUserId: "user-breeder",
    actorRoleCode: "BREEDER",
    actorOrganizationId: breederOrganizationId,
    reason: "Mare owner requested fresh semen",
    changedAt: timestamp,
  });
  assert.equal(prepared.auditHook.action, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(prepared.auditHook.statusHistoryId, "history-draft");
  assert.equal(prepared.auditHook.newValue.requestedDeliveryDate, "2026-06-12");
  assert.equal(prepared.proofHook.hookType, "PROOF_EVENT_REQUEST");
  assert.equal(prepared.proofHook.triggerRef.toStatus, "DRAFT");
  assert.deepEqual(prepared.proofHook.documentationRefs, []);
});

test("breeder can submit own draft order", () => {
  const prepared = prepareTransitionSemenOrderStatus({
    existingOrder: draftOrder,
    toStatus: "SUBMITTED",
    reason: "Ready for station review",
    actor: breederActor,
    now: timestamp,
  });

  assert.equal(prepared.order.status, "SUBMITTED");
  assert.equal(prepared.statusHistory.fromStatus, "DRAFT");
  assert.equal(prepared.statusHistory.toStatus, "SUBMITTED");
  assert.equal(prepared.statusHistory.actorRoleCode, "BREEDER");
  assert.equal(prepared.auditHook.action, "SEMEN_ORDER_SUBMITTED");
  assert.equal(prepared.proofHook.auditHookRef.action, "SEMEN_ORDER_SUBMITTED");
});

test("submission requires delivery and shipping details", () => {
  const incompleteDraft = {
    ...draftOrder,
    requestedDeliveryDate: null,
    shippingContactName: null,
    shippingContactPhone: null,
    shippingAddressLine1: null,
    shippingCity: null,
    shippingPostalCode: null,
    shippingCountry: null,
  };

  assert.deepEqual(
    validateSemenOrderSubmissionDetails(incompleteDraft),
    [
      "requestedDeliveryDate is required before submitting semen order.",
      "shippingContactName is required before submitting semen order.",
      "shippingContactPhone is required before submitting semen order.",
      "shippingAddressLine1 is required before submitting semen order.",
      "shippingCity is required before submitting semen order.",
      "shippingPostalCode is required before submitting semen order.",
      "shippingCountry is required before submitting semen order.",
    ],
  );

  assert.throws(
    () =>
      prepareTransitionSemenOrderStatus({
        existingOrder: incompleteDraft,
        toStatus: "SUBMITTED",
        actor: breederActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes(
        "requestedDeliveryDate is required before submitting semen order.",
      ),
  );
});

test("breeding station can receive, confirm or reject assigned order", () => {
  const submittedOrder = {
    ...draftOrder,
    status: "SUBMITTED",
  };
  const received = prepareTransitionSemenOrderStatus({
    existingOrder: submittedOrder,
    toStatus: "RECEIVED",
    reason: "Station reviewed incoming request",
    actor: stationActor,
    now: timestamp,
  });

  assert.equal(received.order.status, "RECEIVED");
  assert.equal(received.statusHistory.actorRoleCode, "BREEDING_STATION");
  assert.equal(received.statusHistory.actorOrganizationId, stationOrganizationId);

  const confirmed = prepareTransitionSemenOrderStatus({
    existingOrder: received.order,
    toStatus: "CONFIRMED",
    reason: "Collection slot available",
    actor: stationActor,
    now: timestamp,
  });

  assert.equal(confirmed.order.status, "CONFIRMED");
  assert.equal(confirmed.auditHook.action, "SEMEN_ORDER_CONFIRMED");

  const rejected = prepareTransitionSemenOrderStatus({
    existingOrder: received.order,
    toStatus: "REJECTED",
    reason: "No collection slot available",
    actor: stationActor,
    now: timestamp,
  });

  assert.equal(rejected.order.status, "REJECTED");
  assert.equal(rejected.auditHook.action, "SEMEN_ORDER_REJECTED");
});

test("invalid order status transitions are rejected", () => {
  assert.throws(
    () =>
      prepareTransitionSemenOrderStatus({
        existingOrder: draftOrder,
        toStatus: "RECEIVED",
        actor: stationActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes("cannot transition semen order from DRAFT to RECEIVED."),
  );

  assert.throws(
    () =>
      prepareTransitionSemenOrderStatus({
        existingOrder: {
          ...draftOrder,
          status: "REJECTED",
        },
        toStatus: "RECEIVED",
        actor: stationActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes("cannot transition semen order from REJECTED to RECEIVED."),
  );
});

test("order transition and view permissions reject unrelated or future roles", () => {
  assert.equal(canViewSemenOrder(breederActor, draftOrder), true);
  assert.equal(canViewSemenOrder(stationActor, draftOrder), true);
  assert.equal(canViewSemenOrder(adminActor, draftOrder), true);
  assert.equal(canViewSemenOrder(futureBuyerActor, draftOrder), false);

  assert.equal(
    canTransitionSemenOrderStatus(stationActor, draftOrder, "SUBMITTED"),
    false,
  );

  assert.throws(
    () =>
      prepareTransitionSemenOrderStatus({
        existingOrder: {
          ...draftOrder,
          status: "SUBMITTED",
        },
        toStatus: "RECEIVED",
        actor: otherStationActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes(
        "actor is not authorized for this semen order status transition.",
      ),
  );

  assert.throws(
    () =>
      prepareCreateDraftSemenOrder({
        listing: activeListing,
        breederOrganizationId,
        orderNumberSequence: 1,
        actor: futureBuyerActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes(
        "actor must be an active BREEDER user for the breeder organization or PLATFORM_ADMIN.",
      ),
  );
});

test("endpoint handlers persist every status change with refreshed audit and proof hooks", async () => {
  const repository = buildRepository({
    listings: [activeListing],
    sequenceStart: 7,
  });

  const created = await createDraftSemenOrderEndpoint({
    actor: breederActor,
    repository,
    auditContext: {
      ipAddress: "203.0.113.10",
      userAgent: "node-test/order-create",
    },
    body: {
      semenListingId: "listing-active",
      breederOrganizationId,
      ...completeOrderDetails,
      reason: "Initial draft",
      createdAt: timestamp,
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.order.id, "order-1");
  assert.equal(created.body.order.orderNumber, "SO-20260609-000007");
  assert.equal(created.body.statusHistory.id, "history-1");
  assert.equal(created.body.statusHistory.semenOrderId, "order-1");
  assert.equal(created.auditHook?.targetId, "order-1");
  assert.equal(created.auditLog?.action, "CREATE");
  assert.equal(created.auditLog?.sourceAction, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(created.auditLog?.objectId, "order-1");
  assert.equal(created.auditLog?.actorRoleCode, "BREEDER");
  assert.equal(created.auditLog?.actorOrganizationId, breederOrganizationId);
  assert.equal(created.auditLog?.ipAddress, "203.0.113.10");
  assert.equal(created.auditLog?.userAgent, "node-test/order-create");
  assert.equal(created.proofHook?.triggerRef.statusHistoryId, "history-1");

  const submitted = await transitionSemenOrderStatusEndpoint({
    actor: breederActor,
    repository,
    params: {
      orderId: "order-1",
    },
    body: {
      toStatus: "SUBMITTED",
      reason: "Submitted to station",
      now: timestamp,
    },
  });

  assert.equal(submitted.status, 200);
  assert.equal(submitted.body.order.status, "SUBMITTED");
  assert.equal(submitted.body.statusHistory.id, "history-2");
  assert.equal(submitted.auditHook?.previousValue?.status, "DRAFT");
  assert.equal(submitted.auditHook?.newValue.status, "SUBMITTED");
  assert.equal(submitted.auditLog?.action, "STATUS_CHANGE");
  assert.equal(submitted.auditLog?.previousValues?.status, "DRAFT");
  assert.equal(submitted.auditLog?.newValues?.status, "SUBMITTED");

  const received = await transitionSemenOrderStatusEndpoint({
    actor: stationActor,
    repository,
    params: {
      orderId: "order-1",
    },
    body: {
      toStatus: "RECEIVED",
      reason: "Station received the order",
      now: timestamp,
    },
  });

  assert.equal(received.body.order.status, "RECEIVED");
  assert.equal(received.body.statusHistory.actorRoleCode, "BREEDING_STATION");

  const history = await listOrderStatusHistoryEndpoint({
    actor: breederActor,
    repository,
    params: {
      orderId: "order-1",
    },
    body: {},
  });

  assert.deepEqual(
    history.body.statusHistory.map((entry) => entry.toStatus),
    ["DRAFT", "SUBMITTED", "RECEIVED"],
  );

  const fetched = await getSemenOrderEndpoint({
    actor: stationActor,
    repository,
    params: {
      orderId: "order-1",
    },
    body: {},
  });

  assert.equal(fetched.body.order.status, "RECEIVED");
});

test("OrderService orchestrates create, update and status commands with audit, proof and notification hooks", async () => {
  const repository = buildRepository({
    listings: [activeListing],
    sequenceStart: 11,
  });
  const proofHooks = [];
  const notificationHooks = [];
  let transactionCount = 0;
  const service = createOrderService({
    repository,
    auditContext: {
      ipAddress: "203.0.113.25",
      userAgent: "node-test/order-service",
    },
    proofService: {
      recordProofHook(hook) {
        proofHooks.push(hook);
        return { recorded: true, hook };
      },
    },
    notificationService: {
      recordOrderNotificationHook(hook) {
        notificationHooks.push(hook);
        return { queued: true, hook };
      },
    },
    async transaction(operation) {
      transactionCount += 1;
      return operation(repository);
    },
  });

  const created = await service.createDraftOrder({
    actor: breederActor,
    body: {
      semenListingId: "listing-active",
      breederOrganizationId,
      ...completeOrderDetails,
      reason: "Create through service",
      createdAt: timestamp,
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.order.id, "order-1");
  assert.equal(created.statusHistory?.toStatus, "DRAFT");
  assert.equal(created.auditHook?.action, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(created.auditLog?.sourceAction, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(created.proofResult?.recorded, true);
  assert.equal(created.notificationHook, null);

  const updated = await service.updateDraftOrder({
    actor: breederActor,
    orderId: "order-1",
    body: {
      ...completeOrderDetails,
      shippingCity: "Johannesburg",
      reason: "Correct dispatch city",
      now: timestamp,
    },
  });

  assert.equal(updated.order.shippingCity, "Johannesburg");
  assert.equal(updated.statusHistory, null);
  assert.equal(updated.auditHook?.action, "SEMEN_ORDER_DRAFT_UPDATED");
  assert.equal(updated.proofHook, null);

  const submitted = await service.submitOrder({
    actor: breederActor,
    orderId: "order-1",
    body: {
      reason: "Submit through service",
      now: timestamp,
    },
  });
  const received = await service.receiveOrder({
    actor: stationActor,
    orderId: "order-1",
    body: {
      reason: "Station received order",
      now: timestamp,
    },
  });
  const confirmed = await service.confirmOrder({
    actor: stationActor,
    orderId: "order-1",
    body: {
      reason: "Station confirmed order",
      now: timestamp,
    },
  });
  const inFulfilment = await service.moveToFulfilment({
    actor: stationActor,
    orderId: "order-1",
    body: {
      reason: "Preparing fulfilment",
      now: timestamp,
    },
  });

  await service.transitionOrder({
    actor: stationActor,
    orderId: "order-1",
    commandName: "TRANSITION_ORDER_STATUS",
    toStatus: "SHIPPED",
    body: {
      reason: "Shipment created",
      now: timestamp,
    },
  });
  await service.transitionOrder({
    actor: stationActor,
    orderId: "order-1",
    commandName: "TRANSITION_ORDER_STATUS",
    toStatus: "DELIVERED",
    body: {
      reason: "Delivered to breeder",
      now: timestamp,
    },
  });
  const completed = await service.completeOrder({
    actor: breederActor,
    orderId: "order-1",
    body: {
      reason: "Breeder completed receipt",
      now: timestamp,
    },
  });

  assert.equal(submitted.order.status, "SUBMITTED");
  assert.equal(received.order.status, "RECEIVED");
  assert.equal(confirmed.order.status, "CONFIRMED");
  assert.equal(inFulfilment.order.status, "IN_FULFILMENT");
  assert.equal(completed.order.status, "COMPLETED");
  assert.deepEqual(
    notificationHooks.map((hook) => hook.eventType),
    [
      "ORDER_SUBMITTED",
      "ORDER_RECEIVED",
      "ORDER_CONFIRMED",
      "ORDER_IN_FULFILMENT",
      "ORDER_COMPLETED",
    ],
  );
  assert.equal(proofHooks.length, 8);
  assert.equal(transactionCount, 9);

  const duplicateComplete = await service.completeOrder({
    actor: breederActor,
    orderId: "order-1",
    body: {
      reason: "Duplicate click",
      now: timestamp,
    },
  });

  assert.equal(duplicateComplete.idempotent, true);
  assert.equal(duplicateComplete.statusHistory, null);
});

test("OrderService rejects permission failures, ambiguous context and invalid transitions", async () => {
  const repository = buildRepository({
    listings: [activeListing],
    sequenceStart: 21,
  });
  const service = createOrderService({ repository });

  await service.createDraftOrder({
    actor: breederActor,
    body: {
      semenListingId: "listing-active",
      breederOrganizationId,
      ...completeOrderDetails,
      createdAt: timestamp,
    },
  });

  await assert.rejects(
    () =>
      service.submitOrder({
        actor: stationActor,
        orderId: "order-1",
        body: {
          reason: "Station cannot submit breeder draft",
          now: timestamp,
        },
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes("actor is not authorized for this semen order status transition."),
  );

  await assert.rejects(
    () =>
      service.confirmOrder({
        actor: stationActor,
        orderId: "order-1",
        body: {
          reason: "Cannot confirm draft",
          now: timestamp,
        },
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes("cannot transition semen order from DRAFT to CONFIRMED."),
  );

  await assert.rejects(
    () =>
      service.submitOrder({
        actor: {
          userId: "user-multi",
          roles: [
            {
              userId: "user-multi",
              organizationId: breederOrganizationId,
              roleCode: "BREEDER",
              revokedAt: null,
            },
            {
              userId: "user-multi",
              organizationId: stationOrganizationId,
              roleCode: "BREEDING_STATION",
              revokedAt: null,
            },
          ],
        },
        orderId: "order-1",
        body: {
          reason: "Ambiguous context",
          now: timestamp,
        },
      }),
    (error) =>
      error instanceof SemenOrderValidationError &&
      error.issues.includes(
        "actor.roles must contain exactly one validated active organization role context.",
      ),
  );
});

test("OrderService can reject a received order with audit, proof and notification hooks", async () => {
  const repository = buildRepository({
    listings: [activeListing],
    sequenceStart: 31,
  });
  const notificationHooks = [];
  const service = createOrderService({
    repository,
    notificationService: {
      enqueueOrderNotification(hook) {
        notificationHooks.push(hook);
        return { queued: true };
      },
    },
  });

  await service.createDraftOrder({
    actor: breederActor,
    body: {
      semenListingId: "listing-active",
      breederOrganizationId,
      ...completeOrderDetails,
      createdAt: timestamp,
    },
  });
  await service.submitOrder({
    actor: breederActor,
    orderId: "order-1",
    body: {
      now: timestamp,
    },
  });
  await service.receiveOrder({
    actor: stationActor,
    orderId: "order-1",
    body: {
      now: timestamp,
    },
  });

  const rejected = await service.rejectOrder({
    actor: stationActor,
    orderId: "order-1",
    body: {
      reason: "Collection window unavailable",
      now: timestamp,
    },
  });

  assert.equal(rejected.order.status, "REJECTED");
  assert.equal(rejected.statusHistory?.reason, "Collection window unavailable");
  assert.equal(rejected.auditHook?.action, "SEMEN_ORDER_REJECTED");
  assert.equal(rejected.proofHook?.triggerRef.toStatus, "REJECTED");
  assert.equal(notificationHooks.at(-1)?.eventType, "ORDER_REJECTED");
});

function buildRepository({ listings, sequenceStart }) {
  const listingStore = new Map(listings.map((listing) => [listing.id, listing]));
  const orderStore = new Map();
  const historyStore = new Map();
  const auditLogStore = new Map();
  let orderSequence = 1;
  let historySequence = 1;
  let auditLogSequence = 1;
  let orderNumberSequence = sequenceStart;

  return {
    async findSemenListingById(listingId) {
      return listingStore.get(listingId) ?? null;
    },
    async nextSemenOrderNumberSequence() {
      return orderNumberSequence++;
    },
    async createSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = {
        ...order,
        id: order.id ?? `order-${orderSequence++}`,
      };
      const persistedHistory = {
        ...statusHistory,
        id: statusHistory.id ?? `history-${historySequence++}`,
        semenOrderId: persistedOrder.id,
      };
      orderStore.set(persistedOrder.id, persistedOrder);
      historyStore.set(persistedOrder.id, [persistedHistory]);

      return {
        order: persistedOrder,
        statusHistory: persistedHistory,
      };
    },
    async updateSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = {
        ...order,
      };
      const persistedHistory = {
        ...statusHistory,
        id: statusHistory.id ?? `history-${historySequence++}`,
        semenOrderId: persistedOrder.id,
      };
      const orderHistory = historyStore.get(persistedOrder.id) ?? [];

      orderStore.set(persistedOrder.id, persistedOrder);
      orderHistory.push(persistedHistory);
      historyStore.set(persistedOrder.id, orderHistory);

      return {
        order: persistedOrder,
        statusHistory: persistedHistory,
      };
    },
    async updateDraftSemenOrder(order) {
      const persistedOrder = {
        ...order,
      };

      orderStore.set(persistedOrder.id, persistedOrder);

      return persistedOrder;
    },
    async findSemenOrderById(orderId) {
      return orderStore.get(orderId) ?? null;
    },
    async listOrderStatusHistory(orderId) {
      return historyStore.get(orderId) ?? [];
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
  };
}
