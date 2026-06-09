import test from "node:test";
import assert from "node:assert/strict";

import {
  SEMEN_ORDER_ROUTES,
  SEMEN_ORDER_STATUS_TRANSITIONS,
  SemenOrderValidationError,
  canTransitionSemenOrderStatus,
  canViewSemenOrder,
  createDraftSemenOrderEndpoint,
  generateSemenOrderNumber,
  getSemenOrderEndpoint,
  listOrderStatusHistoryEndpoint,
  prepareCreateDraftSemenOrder,
  prepareTransitionSemenOrderStatus,
  transitionSemenOrderStatusEndpoint,
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

const draftOrder = {
  id: "order-1",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "DRAFT",
  createdByUserId: "user-breeder",
  updatedByUserId: "user-breeder",
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("semen order route contract and transitions stay inside Phase 1 workflow", () => {
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
    body: {
      semenListingId: "listing-active",
      breederOrganizationId,
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

function buildRepository({ listings, sequenceStart }) {
  const listingStore = new Map(listings.map((listing) => [listing.id, listing]));
  const orderStore = new Map();
  const historyStore = new Map();
  let orderSequence = 1;
  let historySequence = 1;
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
    async findSemenOrderById(orderId) {
      return orderStore.get(orderId) ?? null;
    },
    async listOrderStatusHistory(orderId) {
      return historyStore.get(orderId) ?? [];
    },
  };
}
