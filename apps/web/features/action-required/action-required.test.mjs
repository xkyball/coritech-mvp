import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminActionRequiredItems,
  createBreederActionRequiredItems,
  createStationActionRequiredItems,
} from "./action-required.mjs";

const timestamp = "2026-06-10T10:00:00.000Z";
const breederOrganizationId = "org-breeder";
const otherBreederOrganizationId = "org-breeder-other";
const stationOrganizationId = "org-station";
const otherStationOrganizationId = "org-station-other";
const platformOrganizationId = "org-platform";

const breederActor = Object.freeze({
  userId: "user-breeder",
  roles: Object.freeze([
    roleFixture({
      userId: "user-breeder",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
    }),
  ]),
});

const stationActor = Object.freeze({
  userId: "user-station",
  roles: Object.freeze([
    roleFixture({
      userId: "user-station",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
    }),
  ]),
});

const adminActor = Object.freeze({
  userId: "user-admin",
  roles: Object.freeze([
    roleFixture({
      userId: "user-admin",
      organizationId: platformOrganizationId,
      roleCode: "PLATFORM_ADMIN",
    }),
  ]),
});

test("breeder action query returns visible drafts, confirmed orders and shipment receipts", () => {
  const items = createBreederActionRequiredItems({
    actor: breederActor,
    orders: [
      orderFixture({
        id: "order-draft",
        orderNumber: "SO-20260610-000001",
        status: "DRAFT",
      }),
      orderFixture({
        id: "order-confirmed",
        orderNumber: "SO-20260610-000002",
        status: "CONFIRMED",
        updatedAt: "2026-06-10T11:00:00.000Z",
      }),
      orderFixture({
        id: "order-other-breeder",
        orderNumber: "SO-20260610-000003",
        breederOrganizationId: otherBreederOrganizationId,
        status: "CONFIRMED",
      }),
    ],
    shipments: [
      shipmentFixture({
        id: "shipment-delivered",
        semenOrderId: "order-confirmed",
        orderNumber: "SO-20260610-000002",
        status: "DELIVERED",
        deliveredAt: "2026-06-10T12:00:00.000Z",
      }),
      shipmentFixture({
        id: "shipment-confirmed",
        semenOrderId: "order-confirmed",
        orderNumber: "SO-20260610-000002",
        status: "DELIVERED",
        confirmedReceivedAt: "2026-06-10T12:30:00.000Z",
      }),
    ],
  });

  assert.deepEqual(
    [...items.map((item) => item.actionType)].sort(),
    [
      "CONFIRM_SHIPMENT_RECEIPT",
      "REVIEW_CONFIRMED_ORDER",
      "SUBMIT_DRAFT_ORDER",
    ],
  );
  assert.equal(
    items.find((item) => item.actionType === "SUBMIT_DRAFT_ORDER")?.href,
    "/app/orders/new?draftOrderId=order-draft",
  );
  assert.equal(
    items.find((item) => item.actionType === "CONFIRM_SHIPMENT_RECEIPT")?.href,
    "/app/orders/order-confirmed",
  );
  assert.equal(
    items.some((item) => item.objectId === "order-other-breeder"),
    false,
  );
});

test("station action query returns order and shipment actions with authorized links", () => {
  const items = createStationActionRequiredItems({
    actor: stationActor,
    orders: [
      orderFixture({
        id: "order-submitted",
        orderNumber: "SO-20260610-000004",
        status: "SUBMITTED",
      }),
      orderFixture({
        id: "order-received",
        orderNumber: "SO-20260610-000005",
        status: "RECEIVED",
      }),
      orderFixture({
        id: "order-confirmed",
        orderNumber: "SO-20260610-000006",
        status: "CONFIRMED",
      }),
    ],
    shipments: [
      shipmentFixture({
        id: "shipment-delayed",
        semenOrderId: "order-received",
        orderNumber: "SO-20260610-000005",
        status: "DELAYED",
      }),
    ],
  });

  assert.deepEqual(
    [...items.map((item) => item.actionType)].sort(),
    [
      "CONFIRM_ORDER",
      "CREATE_SHIPMENT",
      "RECEIVE_ORDER",
      "REJECT_ORDER",
      "UPDATE_SHIPMENT",
    ],
  );
  assert.match(
    items.find((item) => item.actionType === "RECEIVE_ORDER")?.href ?? "",
    /^\/station-dashboard\?orderId=order-submitted&action=receive$/,
  );
  assert.match(
    items.find((item) => item.actionType === "UPDATE_SHIPMENT")?.href ?? "",
    /^\/app\/station\/shipments\?action=update&orderId=order-received&shipmentId=shipment-delayed$/,
  );
  assert.match(
    items.find((item) => item.actionType === "CREATE_SHIPMENT")?.href ?? "",
    /^\/app\/station\/shipments\?action=create&orderId=order-confirmed$/,
  );
});

test("action queries filter by actor permissions before generating items", () => {
  assert.deepEqual(
    createBreederActionRequiredItems({
      actor: breederActor,
      organizationId: otherBreederOrganizationId,
      orders: [
        orderFixture({
          id: "order-other-breeder",
          breederOrganizationId: otherBreederOrganizationId,
          status: "DRAFT",
        }),
      ],
    }),
    [],
  );
  assert.deepEqual(
    createStationActionRequiredItems({
      actor: stationActor,
      organizationId: otherStationOrganizationId,
      orders: [
        orderFixture({
          id: "order-other-station",
          breedingStationOrganizationId: otherStationOrganizationId,
          status: "SUBMITTED",
        }),
      ],
    }),
    [],
  );
});

test("admin action query covers support, amendment and failed notification items", () => {
  const items = createAdminActionRequiredItems({
    actor: adminActor,
    supportRequests: [
      supportRequestFixture({
        id: "support-1",
        status: "OPEN",
      }),
      supportRequestFixture({
        id: "support-closed",
        status: "CLOSED",
      }),
    ],
    amendments: [
      amendmentFixture({
        id: "amendment-1",
        status: "SUBMITTED",
      }),
    ],
    notificationLogs: [
      notificationLogFixture({
        id: "notification-1",
        status: "FAILED",
      }),
    ],
  });

  assert.deepEqual(
    items.map((item) => item.actionType),
    [
      "REVIEW_SUPPORT_REQUEST",
      "REVIEW_AMENDMENT",
      "REVIEW_FAILED_NOTIFICATION",
    ],
  );
  assert.equal(
    items.find((item) => item.actionType === "REVIEW_SUPPORT_REQUEST")?.href,
    "/app/admin/support?status=OPEN",
  );
  assert.equal(
    items.find((item) => item.actionType === "REVIEW_AMENDMENT")?.href,
    "/app/admin/amendments?targetType=SemenOrder&targetId=order-1",
  );
  assert.equal(
    items.find((item) => item.actionType === "REVIEW_FAILED_NOTIFICATION")?.href,
    "/app/admin/audit?objectType=NotificationLog&objectId=notification-1",
  );
  assert.deepEqual(
    createAdminActionRequiredItems({
      actor: breederActor,
      supportRequests: [
        supportRequestFixture({
          id: "support-1",
          status: "OPEN",
        }),
      ],
    }),
    [],
  );
});

function roleFixture(overrides = {}) {
  return Object.freeze({
    id: "role-1",
    userId: "user-1",
    organizationId: breederOrganizationId,
    roleCode: "BREEDER",
    effectiveAt: "2026-06-01T00:00:00.000Z",
    revokedAt: null,
    ...overrides,
  });
}

function orderFixture(overrides = {}) {
  return Object.freeze({
    id: "order-1",
    orderNumber: "SO-20260610-000001",
    semenListingId: "listing-1",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    status: "DRAFT",
    mareName: null,
    mareRegistrationReference: null,
    mareBreed: null,
    mareOwnerName: null,
    intendedInseminationContext: null,
    requestedDeliveryDate: "2026-06-12",
    shippingContactName: null,
    shippingContactPhone: null,
    shippingAddressLine1: null,
    shippingAddressLine2: null,
    shippingCity: null,
    shippingRegion: null,
    shippingPostalCode: null,
    shippingCountry: null,
    vetOrRecipientContact: null,
    specialInstructions: null,
    createdByUserId: "user-breeder",
    submittedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    cancellationActorUserId: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  });
}

function shipmentFixture(overrides = {}) {
  return Object.freeze({
    id: "shipment-1",
    semenOrderId: "order-1",
    orderNumber: "SO-20260610-000001",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    status: "PREPARED",
    providerName: null,
    providerTrackingId: null,
    trackingUrl: null,
    deliveredAt: null,
    confirmedReceivedAt: null,
    confirmedByUserId: null,
    confirmationSource: null,
    createdByUserId: "user-station",
    updatedByUserId: "user-station",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  });
}

function supportRequestFixture(overrides = {}) {
  return Object.freeze({
    id: "support-1",
    objectType: "SemenOrder",
    objectId: "order-1",
    objectRef: Object.freeze({
      orderNumber: "SO-20260610-000001",
    }),
    category: "ORDER_STATUS",
    message: "Need help with the order status.",
    status: "OPEN",
    createdByUserId: "user-breeder",
    createdByOrganizationId: breederOrganizationId,
    createdByRole: "BREEDER",
    adminNotificationStatus: "QUEUED",
    adminNotificationQueuedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  });
}

function amendmentFixture(overrides = {}) {
  return Object.freeze({
    id: "amendment-1",
    targetType: "SemenOrder",
    targetId: "order-1",
    targetField: "mareName",
    targetRef: Object.freeze({
      orderNumber: "SO-20260610-000001",
    }),
    originalValue: Object.freeze({ mareName: "Before" }),
    amendedValue: Object.freeze({ mareName: "After" }),
    reason: "Correction request.",
    status: "SUBMITTED",
    actorUserId: "user-admin",
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: platformOrganizationId,
    approverUserId: null,
    approverRoleCode: null,
    approverOrganizationId: null,
    decidedAt: null,
    auditLogId: null,
    proofEventId: null,
    semenOrderId: "order-1",
    shipmentId: null,
    horseId: null,
    orderNumber: "SO-20260610-000001",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    occurredAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  });
}

function notificationLogFixture(overrides = {}) {
  return Object.freeze({
    id: "notification-1",
    eventType: "ORDER_SUBMITTED",
    templateId: "tmpl-order-submitted",
    channel: "EMAIL",
    recipientRule: "STATION_USERS_FOR_ORDER",
    recipientUserId: "user-station",
    recipientOrganizationId: stationOrganizationId,
    recipientRole: "BREEDING_STATION",
    recipientRef: Object.freeze({ email: "station@example.test" }),
    payload: Object.freeze({ orderNumber: "SO-20260610-000001" }),
    status: "FAILED",
    providerMessageId: null,
    attemptCount: 1,
    nextRetryAt: null,
    lastError: "Provider rejected the message.",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  });
}
