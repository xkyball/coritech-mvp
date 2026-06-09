import test from "node:test";
import assert from "node:assert/strict";

import {
  BreederDashboardAuthorizationError,
  BreederDashboardValidationError,
  createBreederDashboardErrorState,
  createBreederDashboardLoadingState,
  createBreederDashboardViewModel,
  renderBreederDashboard,
} from "./breeder-dashboard.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const laterTimestamp = "2026-06-09T11:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const otherBreederOrganizationId = "org-breeder-b";
const stationOrganizationId = "org-station-a";

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

const multiBreederActor = {
  userId: "user-multi-breeder",
  roles: [
    {
      userId: "user-multi-breeder",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
    {
      userId: "user-multi-breeder",
      organizationId: otherBreederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const activeListingRecord = {
  listing: {
    id: "listing-active",
    stallionId: "stallion-a",
    breedingStationOrganizationId: stationOrganizationId,
    availabilityStatus: "AVAILABLE",
    listingStatus: "ACTIVE",
    termsSummary: "Fresh semen available weekdays",
  },
  stallion: {
    id: "stallion-a",
    name: "Northern Light",
    breed: "Warmblood",
    breedingStationOrganizationId: stationOrganizationId,
    status: "ACTIVE",
  },
};

const unavailableListingRecord = {
  listing: {
    ...activeListingRecord.listing,
    id: "listing-unavailable",
    availabilityStatus: "UNAVAILABLE",
    termsSummary: "Temporarily unavailable",
  },
  stallion: {
    ...activeListingRecord.stallion,
    id: "stallion-b",
    name: "River Crown",
    breed: "Hanoverian",
  },
};

const inactiveListingRecord = {
  listing: {
    ...activeListingRecord.listing,
    id: "listing-inactive",
    listingStatus: "INACTIVE",
  },
  stallion: {
    ...activeListingRecord.stallion,
    id: "stallion-c",
    name: "Hidden Star",
  },
};

const draftOrder = {
  id: "order-draft",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "DRAFT",
  createdByUserId: "user-breeder-a",
  updatedByUserId: "user-breeder-a",
  createdAt: timestamp,
  updatedAt: laterTimestamp,
};

const submittedOrder = {
  ...draftOrder,
  id: "order-submitted",
  orderNumber: "SO-20260609-000002",
  status: "SUBMITTED",
  updatedAt: timestamp,
};

const otherBreederOrder = {
  ...draftOrder,
  id: "order-other-breeder",
  orderNumber: "SO-20260609-000003",
  breederOrganizationId: otherBreederOrganizationId,
};

const ownDraftHistory = {
  id: "history-draft",
  semenOrderId: "order-draft",
  orderNumber: "SO-20260609-000001",
  fromStatus: null,
  toStatus: "DRAFT",
  actorUserId: "user-breeder-a",
  actorRoleCode: "BREEDER",
  actorOrganizationId: breederOrganizationId,
  reason: "Started order",
  changedAt: timestamp,
};

const ownSubmitHistory = {
  ...ownDraftHistory,
  id: "history-submit",
  fromStatus: "DRAFT",
  toStatus: "SUBMITTED",
  reason: "Submitted to station",
  changedAt: laterTimestamp,
};

const otherBreederHistory = {
  ...ownDraftHistory,
  id: "history-other",
  semenOrderId: "order-other-breeder",
  orderNumber: "SO-20260609-000003",
  actorOrganizationId: otherBreederOrganizationId,
};

const orderParticipantDocument = {
  id: "document-order-participant",
  documentType: "Collection certificate",
  description: null,
  targetType: "SemenOrder",
  targetId: "order-draft",
  semenOrderId: "order-draft",
  shipmentId: null,
  proofEventId: null,
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  originalFileName: "collection-certificate.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 2048,
  checksumSha256: null,
  storageProvider: "s3",
  storageBucket: "coritech-documents",
  storageObjectKey: "orders/order-draft/collection-certificate.pdf",
  storageRegion: "eu-west-1",
  storageVersionId: null,
  accessClassification: "ORDER_PARTICIPANTS",
  uploadedByUserId: "user-station-a",
  uploaderRoleCode: "BREEDING_STATION",
  uploaderOrganizationId: stationOrganizationId,
  createdAt: laterTimestamp,
  updatedAt: laterTimestamp,
};

const otherBreederDocument = {
  ...orderParticipantDocument,
  id: "document-other-breeder",
  targetId: "order-other-breeder",
  semenOrderId: "order-other-breeder",
  orderNumber: "SO-20260609-000003",
  breederOrganizationId: otherBreederOrganizationId,
  originalFileName: "other-breeder-document.pdf",
};

const internalStationDocument = {
  ...orderParticipantDocument,
  id: "document-internal",
  accessClassification: "INTERNAL",
  originalFileName: "station-internal.pdf",
};

test("breeder dashboard scopes orders, status history and documents to the selected breeder organization", () => {
  const dashboard = createBreederDashboardViewModel({
    actor: breederActor,
    organizationName: "Northern Breeding",
    listingRecords: [
      activeListingRecord,
      unavailableListingRecord,
      inactiveListingRecord,
    ],
    orders: [draftOrder, submittedOrder, otherBreederOrder],
    statusHistory: [ownDraftHistory, ownSubmitHistory, otherBreederHistory],
    documents: [
      orderParticipantDocument,
      otherBreederDocument,
      internalStationDocument,
    ],
  });

  assert.equal(dashboard.organizationContext.organizationId, breederOrganizationId);
  assert.equal(dashboard.organizationContext.organizationName, "Northern Breeding");

  assert.deepEqual(
    dashboard.sections.activeListings.items.map((listing) => listing.id),
    ["listing-active", "listing-unavailable"],
  );
  assert.deepEqual(
    dashboard.sections.myOrders.items.map((order) => order.id),
    ["order-draft", "order-submitted"],
  );
  assert.equal(
    dashboard.sections.myOrders.items.some((order) => order.id === "order-other-breeder"),
    false,
  );
  assert.deepEqual(
    dashboard.sections.myOrders.items[0].statusHistory.map((history) => history.id),
    ["history-submit", "history-draft"],
  );
  assert.equal(
    dashboard.sections.myOrders.items[0].statusHistory.some((history) => history.id === "history-other"),
    false,
  );
  assert.deepEqual(
    dashboard.sections.recentDocuments.items.map((document) => document.id),
    ["document-order-participant"],
  );
});

test("dashboard exposes catalog, create-order, order detail and status history navigation", () => {
  const dashboard = createBreederDashboardViewModel({
    actor: breederActor,
    listingRecords: [activeListingRecord, unavailableListingRecord],
    orders: [draftOrder],
    statusHistory: [ownDraftHistory],
    documents: [orderParticipantDocument],
  });
  const orderableListing = dashboard.sections.activeListings.items.find((listing) =>
    listing.id === "listing-active"
  );
  const unavailableListing = dashboard.sections.activeListings.items.find((listing) =>
    listing.id === "listing-unavailable"
  );
  const order = dashboard.sections.myOrders.items[0];
  const html = renderBreederDashboard(dashboard);

  assert.equal(dashboard.navigation.catalogHref, "/app/catalog");
  assert.equal(orderableListing?.canCreateOrder, true);
  assert.equal(
    orderableListing?.createOrderHref,
    "/app/orders/new?semenListingId=listing-active",
  );
  assert.equal(unavailableListing?.canCreateOrder, false);
  assert.equal(unavailableListing?.createOrderHref, null);
  assert.equal(order.detailHref, "/app/orders/order-draft");
  assert.equal(order.statusHistoryHref, "/app/orders/order-draft#status-history");
  assert.match(html, /href="\/app\/catalog"/);
  assert.match(html, /href="\/app\/orders\/new\?semenListingId=listing-active"/);
  assert.match(html, /href="\/app\/orders\/order-draft#status-history"/);
  assert.match(html, /href="\/app\/documents\/document-order-participant"/);
});

test("dashboard rejects non-breeder and ambiguous multi-organization contexts", () => {
  assert.throws(
    () =>
      createBreederDashboardViewModel({
        actor: stationActor,
      }),
    BreederDashboardAuthorizationError,
  );

  assert.throws(
    () =>
      createBreederDashboardViewModel({
        actor: multiBreederActor,
      }),
    (error) =>
      error instanceof BreederDashboardValidationError &&
      error.issues.includes(
        "organizationId is required when actor has multiple active BREEDER roles.",
      ),
  );

  const dashboard = createBreederDashboardViewModel({
    actor: multiBreederActor,
    organizationId: otherBreederOrganizationId,
    orders: [draftOrder, otherBreederOrder],
  });

  assert.equal(dashboard.organizationContext.organizationId, otherBreederOrganizationId);
  assert.deepEqual(
    dashboard.sections.myOrders.items.map((order) => order.id),
    ["order-other-breeder"],
  );
});

test("dashboard renders loading, error and empty states", () => {
  const loadingHtml = renderBreederDashboard(
    createBreederDashboardLoadingState({ organizationName: "Northern Breeding" }),
  );
  const errorHtml = renderBreederDashboard(
    createBreederDashboardErrorState(
      new BreederDashboardAuthorizationError("actor cannot view this organization"),
    ),
  );
  const emptyDashboard = createBreederDashboardViewModel({
    actor: breederActor,
  });
  const emptyHtml = renderBreederDashboard(emptyDashboard);

  assert.match(loadingHtml, /aria-busy="true"/);
  assert.match(loadingHtml, /Loading Northern Breeding dashboard/);
  assert.match(errorHtml, /role="alert"/);
  assert.match(errorHtml, /actor cannot view this organization/);
  assert.equal(emptyDashboard.isEmpty, true);
  assert.match(emptyHtml, /No active semen listings are available/);
  assert.match(emptyHtml, /No semen orders have been created/);
  assert.match(emptyHtml, /No breeder action is required/);
});
