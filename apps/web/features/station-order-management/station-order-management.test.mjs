import assert from "node:assert/strict";
import test from "node:test";

import { createInMemorySemenOrderRepository } from "../order-creation/semen-order-creation.mjs";
import {
  createStationOrderManagementViewModel,
  executeStationOrderAction,
} from "./station-order-management.mjs";
import { createBreederOrderDetailViewModel } from "../breeder-order-detail/breeder-order-detail.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const stationOrganizationId = "org-station-a";
const otherStationOrganizationId = "org-station-b";
const breederOrganizationId = "org-breeder-a";

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
      organizationId: otherStationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const submittedOrder = createOrder({
  id: "order-submitted",
  orderNumber: "SO-20260609-000001",
  status: "SUBMITTED",
});

const receivedOrder = createOrder({
  id: "order-received",
  orderNumber: "SO-20260609-000002",
  status: "RECEIVED",
});

const rejectedOrder = createOrder({
  id: "order-rejected",
  orderNumber: "SO-20260609-000004",
  status: "REJECTED",
});

const otherStationOrder = createOrder({
  id: "order-other-station",
  orderNumber: "SO-20260609-000003",
  status: "RECEIVED",
  breedingStationOrganizationId: otherStationOrganizationId,
});

test("station order management exposes receive command for submitted orders", () => {
  const viewModel = createStationOrderManagementViewModel({
    actor: stationActor,
    organizationId: stationOrganizationId,
    organizationName: "North Station",
    orders: [submittedOrder],
    selectedOrderId: "order-submitted",
  });

  assert.deepEqual(
    viewModel.selectedOrder?.commandActions.map((action) => action.action),
    ["receive"],
  );
  assert.equal(
    viewModel.selectedOrder?.commandActions[0]?.title,
    "Mark as received",
  );
});

test("station order management scopes orders to the active station organization", () => {
  const viewModel = createStationOrderManagementViewModel({
    actor: stationActor,
    organizationId: stationOrganizationId,
    organizationName: "North Station",
    orders: [submittedOrder, receivedOrder, otherStationOrder],
    statusHistory: [historyFor(receivedOrder, "SUBMITTED", "RECEIVED")],
    selectedOrderId: "order-received",
  });

  assert.deepEqual(
    viewModel.orders.map((order) => order.id).sort(),
    ["order-received", "order-submitted"],
  );
  assert.equal(viewModel.selectedOrder?.id, "order-received");
  assert.equal(viewModel.selectedOrder?.mareName, "Willow Queen");
  assert.equal(viewModel.selectedOrder?.mareRegistrationReference, "M-REG-2048");
  assert.deepEqual(
    viewModel.selectedOrder?.commandActions.map((action) => action.action),
    ["confirm", "reject"],
  );
});

test("assigned station can receive a submitted order with audit, status history and notification hook", async () => {
  const repository = createRepository([submittedOrder], []);
  const proofHooks = [];
  const notificationHooks = [];
  const result = await executeStationOrderAction({
    action: "receive",
    actor: stationActor,
    orderId: "order-submitted",
    reason: "Station intake note.",
    repository,
    proofService: {
      recordProofHook(hook) {
        proofHooks.push(hook);
        return { recorded: true };
      },
    },
    notificationService: {
      recordOrderNotificationHook(hook) {
        notificationHooks.push(hook);
        return { queued: true };
      },
    },
    now: "2026-06-09T08:30:00.000Z",
  });
  const updatedOrder = await repository.findSemenOrderById("order-submitted");
  const statusHistory = await repository.listOrderStatusHistory("order-submitted");
  const breederDetail = createBreederOrderDetailViewModel({
    actor: {
      userId: "user-breeder-a",
      roles: [
        {
          userId: "user-breeder-a",
          organizationId: breederOrganizationId,
          roleCode: "BREEDER",
          revokedAt: null,
        },
      ],
    },
    orderId: "order-submitted",
    orders: [updatedOrder],
    statusHistory,
  });

  assert.equal(result.ok, true);
  assert.equal(result.order.status, "RECEIVED");
  assert.equal(result.statusHistory?.fromStatus, "SUBMITTED");
  assert.equal(result.statusHistory?.toStatus, "RECEIVED");
  assert.equal(result.statusHistory?.actorUserId, "user-station-a");
  assert.equal(result.statusHistory?.actorRoleCode, "BREEDING_STATION");
  assert.equal(result.statusHistory?.actorOrganizationId, stationOrganizationId);
  assert.equal(result.statusHistory?.changedAt, "2026-06-09T08:30:00.000Z");
  assert.equal(result.statusHistory?.reason, "Station intake note.");
  assert.equal(result.auditHook?.action, "SEMEN_ORDER_RECEIVED");
  assert.equal(result.auditLog?.sourceAction, "SEMEN_ORDER_RECEIVED");
  assert.equal(result.proofHook?.triggerRef.toStatus, "RECEIVED");
  assert.equal(result.notificationHook?.eventType, "ORDER_RECEIVED");
  assert.equal(proofHooks.length, 1);
  assert.equal(notificationHooks.length, 1);
  assert.equal((await repository.listAuditLogs()).length, 1);
  assert.equal(updatedOrder.status, "RECEIVED");
  assert.equal(statusHistory.length, 1);
  assert.equal(statusHistory[0].toStatus, "RECEIVED");
  assert.equal(breederDetail.currentStatus.status, "RECEIVED");
});

test("station can confirm a received order with reason, audit and proof hooks", async () => {
  const repository = createRepository([receivedOrder], [historyFor(receivedOrder, "SUBMITTED", "RECEIVED")]);
  const proofHooks = [];
  const result = await executeStationOrderAction({
    action: "confirm",
    actor: stationActor,
    orderId: "order-received",
    reason: "Availability confirmed.",
    repository,
    proofService: {
      recordProofHook(hook) {
        proofHooks.push(hook);
        return { recorded: true };
      },
    },
    now: "2026-06-09T09:00:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.order.status, "CONFIRMED");
  assert.equal(result.statusHistory?.toStatus, "CONFIRMED");
  assert.equal(result.statusHistory?.reason, "Availability confirmed.");
  assert.equal(result.auditHook?.action, "SEMEN_ORDER_CONFIRMED");
  assert.equal(result.auditLog?.sourceAction, "SEMEN_ORDER_CONFIRMED");
  assert.equal(result.proofHook?.triggerRef.toStatus, "CONFIRMED");
  assert.equal(proofHooks.length, 1);
});

test("station can reject a received order and status history captures reason", async () => {
  const repository = createRepository([receivedOrder], [historyFor(receivedOrder, "SUBMITTED", "RECEIVED")]);
  const result = await executeStationOrderAction({
    action: "reject",
    actor: stationActor,
    orderId: "order-received",
    reason: "Collection window unavailable.",
    repository,
    now: "2026-06-09T09:05:00.000Z",
  });

  assert.equal(result.ok, true);
  assert.equal(result.order.status, "REJECTED");
  assert.equal(result.statusHistory?.toStatus, "REJECTED");
  assert.equal(result.statusHistory?.reason, "Collection window unavailable.");
  assert.equal((await repository.listAuditLogs()).length, 1);
});

test("invalid receive transitions and cross-station receive are rejected", async () => {
  const repository = createRepository([submittedOrder, rejectedOrder], []);
  const invalid = await executeStationOrderAction({
    action: "receive",
    actor: stationActor,
    orderId: "order-rejected",
    reason: "Cannot receive terminal order.",
    repository,
    now: timestamp,
  });
  const crossStation = await executeStationOrderAction({
    action: "receive",
    actor: otherStationActor,
    orderId: "order-submitted",
    reason: "Wrong station.",
    repository,
    now: timestamp,
  });

  assert.equal(invalid.ok, false);
  assert.match(invalid.issues.join("\n"), /cannot transition semen order from REJECTED to RECEIVED/);
  assert.equal(crossStation.ok, false);
  assert.match(crossStation.issues.join("\n"), /actor is not authorized/);
});

function createRepository(orders, statusHistory) {
  return createInMemorySemenOrderRepository({
    orders,
    statusHistory,
  });
}

function createOrder(overrides) {
  return {
    id: overrides.id,
    orderNumber: overrides.orderNumber,
    semenListingId: "listing-active",
    breederOrganizationId,
    breedingStationOrganizationId: overrides.breedingStationOrganizationId ?? stationOrganizationId,
    status: overrides.status,
  requestedDeliveryDate: "2026-06-12",
  mareName: "Willow Queen",
  mareRegistrationReference: "M-REG-2048",
  mareBreed: "Warmblood",
  mareOwnerName: "Ava Breeder",
  intendedInseminationContext: "Fresh semen insemination at home yard.",
  vetOrRecipientContact: "Dr. Ndlovu, +27 82 555 0102",
  shippingContactName: "Avery Stone",
    shippingContactPhone: "+27 21 555 0100",
    shippingAddressLine1: "42 Blue Oak Road",
    shippingAddressLine2: null,
    shippingCity: "Cape Town",
    shippingRegion: "Western Cape",
    shippingPostalCode: "8001",
    shippingCountry: "South Africa",
    specialInstructions: "Station review requested.",
    createdByUserId: "user-breeder-a",
    updatedByUserId: "user-breeder-a",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function historyFor(order, fromStatus, toStatus) {
  return {
    id: `history-${order.id}-${toStatus}`,
    semenOrderId: order.id,
    orderNumber: order.orderNumber,
    fromStatus,
    toStatus,
    actorUserId: "user-station-a",
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: stationOrganizationId,
    reason: `${toStatus} reason`,
    changedAt: timestamp,
  };
}
