import test from "node:test";
import assert from "node:assert/strict";

import {
  StationDashboardAuthorizationError,
  StationDashboardValidationError,
  createStationDashboardErrorState,
  createStationDashboardLoadingState,
  createStationDashboardViewModel,
  renderStationDashboard,
} from "./station-dashboard.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const submittedAt = "2026-06-09T09:00:00.000Z";
const receivedAt = "2026-06-09T10:00:00.000Z";
const confirmedAt = "2026-06-09T11:00:00.000Z";
const shipmentUpdatedAt = "2026-06-09T12:00:00.000Z";
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

const breederActor = {
  userId: "user-breeder-a",
  roles: [
    {
      userId: "user-breeder-a",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const multiStationActor = {
  userId: "user-multi-station",
  roles: [
    {
      userId: "user-multi-station",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
    {
      userId: "user-multi-station",
      organizationId: otherStationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const activeOwnListingRecord = {
  listing: {
    id: "listing-own-active",
    stallionId: "stallion-own-active",
    breedingStationOrganizationId: stationOrganizationId,
    availabilityStatus: "AVAILABLE",
    listingStatus: "ACTIVE",
    termsSummary: "Fresh semen available weekdays",
  },
  stallion: {
    id: "stallion-own-active",
    name: "Northern Light",
    breed: "Warmblood",
    breedingStationOrganizationId: stationOrganizationId,
    status: "ACTIVE",
  },
};

const inactiveOwnListingRecord = {
  listing: {
    ...activeOwnListingRecord.listing,
    id: "listing-own-inactive",
    listingStatus: "INACTIVE",
  },
  stallion: {
    ...activeOwnListingRecord.stallion,
    id: "stallion-own-inactive",
    name: "Hidden Star",
  },
};

const otherStationListingRecord = {
  listing: {
    ...activeOwnListingRecord.listing,
    id: "listing-other-station",
    breedingStationOrganizationId: otherStationOrganizationId,
  },
  stallion: {
    ...activeOwnListingRecord.stallion,
    id: "stallion-other-station",
    name: "Blue Meridian",
    breedingStationOrganizationId: otherStationOrganizationId,
  },
};

const submittedOrder = {
  id: "order-submitted",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-own-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "SUBMITTED",
  requestedDeliveryDate: "2026-06-12",
  shippingContactName: "Avery Stone",
  shippingContactPhone: "+27 21 555 0100",
  shippingAddressLine1: "42 Blue Oak Road",
  shippingAddressLine2: null,
  shippingCity: "Cape Town",
  shippingRegion: "Western Cape",
  shippingPostalCode: "8001",
  shippingCountry: "South Africa",
  specialInstructions: "Call before dispatch.",
  createdByUserId: "user-breeder-a",
  updatedByUserId: "user-breeder-a",
  createdAt: timestamp,
  updatedAt: submittedAt,
};

const receivedOrder = {
  ...submittedOrder,
  id: "order-received",
  orderNumber: "SO-20260609-000002",
  status: "RECEIVED",
  updatedByUserId: "user-station-a",
  updatedAt: receivedAt,
};

const confirmedOrder = {
  ...submittedOrder,
  id: "order-confirmed",
  orderNumber: "SO-20260609-000003",
  status: "CONFIRMED",
  updatedByUserId: "user-station-a",
  updatedAt: confirmedAt,
};

const otherStationOrder = {
  ...submittedOrder,
  id: "order-other-station",
  orderNumber: "SO-20260609-000004",
  breedingStationOrganizationId: otherStationOrganizationId,
};

const receivedHistory = {
  id: "history-received",
  semenOrderId: "order-received",
  orderNumber: "SO-20260609-000002",
  fromStatus: "SUBMITTED",
  toStatus: "RECEIVED",
  actorUserId: "user-station-a",
  actorRoleCode: "BREEDING_STATION",
  actorOrganizationId: stationOrganizationId,
  reason: "Station intake recorded",
  changedAt: receivedAt,
};

const otherStationHistory = {
  ...receivedHistory,
  id: "history-other-station",
  semenOrderId: "order-other-station",
  orderNumber: "SO-20260609-000004",
  actorOrganizationId: otherStationOrganizationId,
};

const preparedShipment = {
  id: "shipment-prepared",
  semenOrderId: "order-submitted",
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "PREPARED",
  providerName: "Manual logistics record",
  providerTrackingId: "MANUAL-1",
  trackingUrl: null,
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: confirmedAt,
  updatedAt: shipmentUpdatedAt,
};

const otherStationShipment = {
  ...preparedShipment,
  id: "shipment-other-station",
  semenOrderId: "order-other-station",
  orderNumber: "SO-20260609-000004",
  breedingStationOrganizationId: otherStationOrganizationId,
};

const trackingEvent = {
  id: "tracking-prepared",
  shipmentId: "shipment-prepared",
  semenOrderId: "order-submitted",
  orderNumber: "SO-20260609-000001",
  fromStatus: null,
  toStatus: "PREPARED",
  eventSource: "MANUAL",
  sourceEventId: null,
  providerStatus: "Packed",
  location: "Station",
  notes: "Manual tracking record",
  actorUserId: "user-station-a",
  actorRoleCode: "BREEDING_STATION",
  actorOrganizationId: stationOrganizationId,
  occurredAt: shipmentUpdatedAt,
  recordedAt: shipmentUpdatedAt,
};

const stationDocument = {
  id: "document-station",
  documentType: "Station Confirmation",
  description: null,
  targetType: "SemenOrder",
  targetId: "order-received",
  semenOrderId: "order-received",
  shipmentId: null,
  proofEventId: null,
  orderNumber: "SO-20260609-000002",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  originalFileName: "station-confirmation.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 2048,
  checksumSha256: null,
  storageProvider: "s3",
  storageBucket: "coritech-documents",
  storageObjectKey: "orders/order-received/station-confirmation.pdf",
  storageRegion: "eu-west-1",
  storageVersionId: null,
  accessClassification: "ORDER_PARTICIPANTS",
  uploadedByUserId: "user-station-a",
  uploaderRoleCode: "BREEDING_STATION",
  uploaderOrganizationId: stationOrganizationId,
  createdAt: shipmentUpdatedAt,
  updatedAt: shipmentUpdatedAt,
};

const otherStationDocument = {
  ...stationDocument,
  id: "document-other-station",
  targetId: "order-other-station",
  semenOrderId: "order-other-station",
  orderNumber: "SO-20260609-000004",
  breedingStationOrganizationId: otherStationOrganizationId,
  originalFileName: "other-station.pdf",
};

test("station dashboard scopes listings, orders, shipments and documents to the station organization", () => {
  const dashboard = createStationDashboardViewModel({
    actor: stationActor,
    organizationName: "North Valley Station",
    listingRecords: [
      activeOwnListingRecord,
      inactiveOwnListingRecord,
      otherStationListingRecord,
    ],
    orders: [submittedOrder, receivedOrder, confirmedOrder, otherStationOrder],
    statusHistory: [receivedHistory, otherStationHistory],
    shipments: [preparedShipment, otherStationShipment],
    shipmentTrackingEvents: [trackingEvent],
    documents: [stationDocument, otherStationDocument],
  });

  assert.equal(dashboard.organizationContext.organizationId, stationOrganizationId);
  assert.equal(dashboard.organizationContext.organizationName, "North Valley Station");
  assert.deepEqual(
    dashboard.sections.activeListings.items.map((listing) => listing.id),
    ["listing-own-active"],
  );
  assert.equal(
    dashboard.sections.incomingOrders.items.some((order) => order.id === "order-other-station"),
    false,
  );
  assert.deepEqual(
    dashboard.sections.incomingOrders.items.map((order) => order.id),
    ["order-confirmed", "order-received", "order-submitted"],
  );
  assert.deepEqual(
    dashboard.sections.recentDocuments.items.map((document) => document.id),
    ["document-station"],
  );
  assert.equal(
    dashboard.sections.shipmentsToUpdate.items.some((item) => item.shipmentId === "shipment-other-station"),
    false,
  );
});

test("station dashboard exposes order detail, receive, confirm, reject, shipment and document action entry points", () => {
  const dashboard = createStationDashboardViewModel({
    actor: stationActor,
    orders: [submittedOrder, receivedOrder, confirmedOrder],
    shipments: [preparedShipment],
    documents: [stationDocument],
  });
  const receivedActions = dashboard.sections.incomingOrders.items.find((order) =>
    order.id === "order-received"
  )?.actions ?? [];
  const submittedActions = dashboard.sections.incomingOrders.items.find((order) =>
    order.id === "order-submitted"
  )?.actions ?? [];
  const receiveAction = submittedActions.find((action) =>
    action.actionKind === "RECEIVE_ORDER"
  );
  const confirmAction = receivedActions.find((action) =>
    action.actionKind === "CONFIRM_ORDER"
  );
  const rejectAction = receivedActions.find((action) =>
    action.actionKind === "REJECT_ORDER"
  );
  const shipmentCreate = dashboard.sections.shipmentsToUpdate.items.find((item) =>
    item.actionKind === "CREATE_SHIPMENT"
  );
  const shipmentUpdate = dashboard.sections.shipmentsToUpdate.items.find((item) =>
    item.actionKind === "UPDATE_SHIPMENT"
  );
  const uploadAction = dashboard.sections.ordersNeedingAction.items.find((action) =>
    action.actionKind === "UPLOAD_DOCUMENT"
  );
  const receiveActionItem = dashboard.sections.ordersNeedingAction.items.find((action) =>
    action.actionKind === "RECEIVE_ORDER"
  );
  const orderDetail = dashboard.sections.incomingOrders.items.find((order) =>
    order.id === "order-received"
  );
  const html = renderStationDashboard(dashboard);

  assert.equal(orderDetail?.detailHref, "/station-dashboard?orderId=order-received");
  assert.equal(receiveAction?.auditAction, "SEMEN_ORDER_RECEIVED");
  assert.equal(receiveAction?.proofSource, "ORDER_STATUS_CHANGE");
  assert.equal(receiveAction?.auditProofReady, true);
  assert.match(receiveAction?.actionHref ?? "", /action=receive/);
  assert.equal(confirmAction?.auditAction, "SEMEN_ORDER_CONFIRMED");
  assert.equal(confirmAction?.proofSource, "ORDER_STATUS_CHANGE");
  assert.equal(confirmAction?.auditProofReady, true);
  assert.match(confirmAction?.actionHref ?? "", /action=confirm/);
  assert.equal(rejectAction?.auditAction, "SEMEN_ORDER_REJECTED");
  assert.match(rejectAction?.actionHref ?? "", /action=reject/);
  assert.equal(shipmentCreate?.auditAction, "SHIPMENT_CREATED");
  assert.equal(shipmentCreate?.proofSource, "SHIPMENT_TRACKING_EVENT");
  assert.equal(shipmentUpdate?.auditAction, "SHIPMENT_STATUS_UPDATED");
  assert.equal(uploadAction?.auditAction, "DOCUMENT_UPLOADED");
  assert.equal(receiveActionItem?.orderNumber, submittedOrder.orderNumber);
  assert.match(html, /data-action-kind="RECEIVE_ORDER"/);
  assert.match(html, /data-audit-action="SEMEN_ORDER_RECEIVED"/);
  assert.match(html, /data-action-kind="CONFIRM_ORDER"/);
  assert.match(html, /data-audit-action="SEMEN_ORDER_CONFIRMED"/);
  assert.match(html, /data-proof-source="SHIPMENT_TRACKING_EVENT"/);
});

test("station dashboard opens assigned order detail without exposing another station order", () => {
  const dashboard = createStationDashboardViewModel({
    actor: stationActor,
    selectedOrderId: "order-received",
    orders: [receivedOrder, otherStationOrder],
    statusHistory: [receivedHistory, otherStationHistory],
    documents: [stationDocument, otherStationDocument],
  });

  assert.equal(dashboard.selectedOrder?.id, "order-received");
  assert.equal(dashboard.selectedOrder?.shippingDestination, "42 Blue Oak Road, Cape Town, Western Cape, 8001, South Africa");
  assert.deepEqual(
    dashboard.selectedOrder?.statusHistory.map((history) => history.id),
    ["history-received"],
  );
  assert.deepEqual(
    dashboard.selectedOrder?.documents.map((document) => document.id),
    ["document-station"],
  );

  assert.throws(
    () =>
      createStationDashboardViewModel({
        actor: stationActor,
        selectedOrderId: "order-other-station",
        orders: [receivedOrder, otherStationOrder],
      }),
    StationDashboardAuthorizationError,
  );
});

test("station dashboard rejects non-station and ambiguous multi-organization contexts", () => {
  assert.throws(
    () =>
      createStationDashboardViewModel({
        actor: breederActor,
      }),
    StationDashboardAuthorizationError,
  );

  assert.throws(
    () =>
      createStationDashboardViewModel({
        actor: multiStationActor,
      }),
    (error) =>
      error instanceof StationDashboardValidationError &&
      error.issues.includes(
        "organizationId is required when actor has multiple active BREEDING_STATION roles.",
      ),
  );

  const dashboard = createStationDashboardViewModel({
    actor: multiStationActor,
    organizationId: otherStationOrganizationId,
    orders: [submittedOrder, otherStationOrder],
  });

  assert.equal(dashboard.organizationContext.organizationId, otherStationOrganizationId);
  assert.deepEqual(
    dashboard.sections.incomingOrders.items.map((order) => order.id),
    ["order-other-station"],
  );
});

test("station dashboard renders loading, error and empty states", () => {
  const loadingHtml = renderStationDashboard(
    createStationDashboardLoadingState({ organizationName: "North Valley Station" }),
  );
  const errorHtml = renderStationDashboard(
    createStationDashboardErrorState(
      new StationDashboardAuthorizationError("actor cannot view this station"),
    ),
  );
  const emptyDashboard = createStationDashboardViewModel({
    actor: stationActor,
  });
  const emptyHtml = renderStationDashboard(emptyDashboard);

  assert.match(loadingHtml, /aria-busy="true"/);
  assert.match(loadingHtml, /Loading North Valley Station dashboard/);
  assert.match(errorHtml, /role="alert"/);
  assert.match(errorHtml, /actor cannot view this station/);
  assert.equal(emptyDashboard.isEmpty, true);
  assert.match(emptyHtml, /No active semen listings are owned by this station/);
  assert.match(emptyHtml, /No semen orders are assigned to this station/);
  assert.match(emptyHtml, /No station order action is currently available/);
});
