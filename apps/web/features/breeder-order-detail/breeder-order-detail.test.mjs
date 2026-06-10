import test from "node:test";
import assert from "node:assert/strict";

import {
  BreederOrderDetailAuthorizationError,
  BreederOrderDetailNotFoundError,
  BreederOrderDetailValidationError,
  createBreederOrderDetailErrorState,
  createBreederOrderDetailLoadingState,
  createBreederOrderDetailViewModel,
  renderBreederOrderDetail,
} from "./breeder-order-detail.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const submittedAt = "2026-06-09T09:00:00.000Z";
const confirmedAt = "2026-06-09T10:00:00.000Z";
const shippedAt = "2026-06-09T11:00:00.000Z";
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

const otherBreederActor = {
  userId: "user-breeder-b",
  roles: [
    {
      userId: "user-breeder-b",
      organizationId: otherBreederOrganizationId,
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

const buyerActor = {
  userId: "user-buyer-a",
  roles: [
    {
      userId: "user-buyer-a",
      organizationId: "org-buyer-a",
      roleCode: "BUYER",
      revokedAt: null,
    },
  ],
};

const ownOrder = {
  id: "order-a",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-a",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "CONFIRMED",
  requestedDeliveryDate: "2026-06-10",
  mareName: "Willow Queen",
  mareRegistrationReference: "M-REG-2048",
  mareBreed: "Warmblood",
  mareOwnerName: "Ava Breeder",
  intendedInseminationContext: "Fresh semen insemination at home yard.",
  vetOrRecipientContact: "Dr. Ndlovu, +27 82 555 0102",
  shippingContactName: "Avery Stone",
  shippingContactPhone: "+27 21 555 0100",
  shippingAddressLine1: "42 Blue Oak Road",
  shippingAddressLine2: "Stable office",
  shippingCity: "Cape Town",
  shippingRegion: "Western Cape",
  shippingPostalCode: "8001",
  shippingCountry: "South Africa",
  specialInstructions: "Call before dispatch.",
  createdByUserId: "user-breeder-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: confirmedAt,
};

const otherBreederOrder = {
  ...ownOrder,
  id: "order-b",
  orderNumber: "SO-20260609-000002",
  breederOrganizationId: otherBreederOrganizationId,
};

const draftHistory = {
  id: "history-draft",
  semenOrderId: "order-a",
  orderNumber: "SO-20260609-000001",
  fromStatus: null,
  toStatus: "DRAFT",
  actorUserId: "user-breeder-a",
  actorRoleCode: "BREEDER",
  actorOrganizationId: breederOrganizationId,
  reason: "Draft created",
  changedAt: timestamp,
};

const submittedHistory = {
  ...draftHistory,
  id: "history-submitted",
  fromStatus: "DRAFT",
  toStatus: "SUBMITTED",
  reason: "Submitted to station",
  changedAt: submittedAt,
};

const confirmedHistory = {
  ...draftHistory,
  id: "history-confirmed",
  fromStatus: "RECEIVED",
  toStatus: "CONFIRMED",
  actorUserId: "user-station-a",
  actorRoleCode: "BREEDING_STATION",
  actorOrganizationId: stationOrganizationId,
  reason: "Station confirmed availability",
  changedAt: confirmedAt,
};

const otherHistory = {
  ...draftHistory,
  id: "history-other",
  semenOrderId: "order-b",
  orderNumber: "SO-20260609-000002",
  actorOrganizationId: otherBreederOrganizationId,
};

const shipment = {
  id: "shipment-a",
  semenOrderId: "order-a",
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "IN_TRANSIT",
  providerName: "Manual logistics record",
  providerTrackingId: "MANUAL-001",
  trackingUrl: null,
  deliveredAt: null,
  confirmedReceivedAt: null,
  confirmedByUserId: null,
  confirmationSource: null,
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: confirmedAt,
  updatedAt: shippedAt,
};

const otherShipment = {
  ...shipment,
  id: "shipment-b",
  semenOrderId: "order-b",
  orderNumber: "SO-20260609-000002",
  breederOrganizationId: otherBreederOrganizationId,
};

const preparedTrackingEvent = {
  id: "tracking-prepared",
  shipmentId: "shipment-a",
  semenOrderId: "order-a",
  orderNumber: "SO-20260609-000001",
  fromStatus: null,
  toStatus: "PREPARED",
  eventSource: "MANUAL",
  sourceEventId: null,
  providerStatus: "Packed",
  location: "Station",
  notes: "Packed after confirmation",
  actorUserId: "user-station-a",
  actorRoleCode: "BREEDING_STATION",
  actorOrganizationId: stationOrganizationId,
  occurredAt: confirmedAt,
  recordedAt: confirmedAt,
};

const transitTrackingEvent = {
  ...preparedTrackingEvent,
  id: "tracking-transit",
  fromStatus: "PREPARED",
  toStatus: "IN_TRANSIT",
  providerStatus: "Courier handoff",
  occurredAt: shippedAt,
  recordedAt: shippedAt,
};

const otherTrackingEvent = {
  ...preparedTrackingEvent,
  id: "tracking-other",
  shipmentId: "shipment-b",
  semenOrderId: "order-b",
  orderNumber: "SO-20260609-000002",
};

const orderDocument = {
  id: "document-order",
  documentType: "Station Confirmation",
  description: null,
  targetType: "SemenOrder",
  targetId: "order-a",
  semenOrderId: "order-a",
  shipmentId: null,
  proofEventId: null,
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  originalFileName: "station-confirmation.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 2048,
  checksumSha256: null,
  storageProvider: "s3",
  storageBucket: "coritech-documents",
  storageObjectKey: "orders/order-a/station-confirmation.pdf",
  storageRegion: "eu-west-1",
  storageVersionId: null,
  accessClassification: "ORDER_PARTICIPANTS",
  uploadedByUserId: "user-station-a",
  uploaderRoleCode: "BREEDING_STATION",
  uploaderOrganizationId: stationOrganizationId,
  createdAt: confirmedAt,
  updatedAt: confirmedAt,
};

const shipmentDocument = {
  ...orderDocument,
  id: "document-shipment",
  documentType: "Shipment Handoff",
  targetType: "Shipment",
  targetId: "shipment-a",
  shipmentId: "shipment-a",
  originalFileName: "shipment-handoff.pdf",
  createdAt: shippedAt,
  updatedAt: shippedAt,
};

const internalStationDocument = {
  ...orderDocument,
  id: "document-internal",
  accessClassification: "INTERNAL",
  originalFileName: "station-internal-note.pdf",
};

const otherBreederDocument = {
  ...orderDocument,
  id: "document-other",
  targetId: "order-b",
  semenOrderId: "order-b",
  orderNumber: "SO-20260609-000002",
  breederOrganizationId: otherBreederOrganizationId,
  originalFileName: "other-breeder-document.pdf",
};

const submittedProofEvent = {
  id: "proof-submitted",
  eventType: "SUBMITTED",
  source: "ORDER_STATUS_CHANGE",
  triggerType: "SEMEN_ORDER_STATUS_CHANGE",
  triggerRef: {
    targetType: "SemenOrder",
    targetId: "order-a",
  },
  semenOrderId: "order-a",
  shipmentId: null,
  horseId: null,
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  lifecycleStage: "ORDER_SUBMITTED",
  verificationLevel: "SELF_REPORTED",
  status: "RECORDED",
  actorUserId: "user-breeder-a",
  actorRoleCode: "BREEDER",
  actorOrganizationId: breederOrganizationId,
  documentationRefs: [],
  signatureRef: {
    type: "MANAGED_AUTH_ACTOR_CONTEXT",
    actorUserId: "user-breeder-a",
  },
  attestationRefs: [],
  auditLogId: null,
  auditHookRef: {
    eventType: "SEMEN_ORDER_STATUS_CHANGE",
    action: "SEMEN_ORDER_SUBMITTED",
    occurredAt: submittedAt,
  },
  occurredAt: submittedAt,
  createdAt: submittedAt,
  updatedAt: submittedAt,
};

const shipmentProofEvent = {
  ...submittedProofEvent,
  id: "proof-shipment",
  eventType: "SHIPMENT_STATUS_UPDATED",
  source: "SHIPMENT_TRACKING_EVENT",
  triggerType: "SHIPMENT_TRACKING_EVENT",
  triggerRef: {
    targetType: "Shipment",
    targetId: "shipment-a",
  },
  shipmentId: "shipment-a",
  lifecycleStage: "SHIPMENT_UPDATED",
  verificationLevel: "STATION_CONFIRMED",
  actorUserId: "user-station-a",
  actorRoleCode: "BREEDING_STATION",
  actorOrganizationId: stationOrganizationId,
  documentationRefs: [
    {
      documentId: "document-shipment",
    },
  ],
  occurredAt: shippedAt,
  createdAt: shippedAt,
  updatedAt: shippedAt,
};

const otherProofEvent = {
  ...submittedProofEvent,
  id: "proof-other",
  semenOrderId: "order-b",
  orderNumber: "SO-20260609-000002",
  breederOrganizationId: otherBreederOrganizationId,
};

test("breeder can view own order detail with history, shipment, documents and proof events", () => {
  const detail = createBreederOrderDetailViewModel({
    actor: breederActor,
    orderId: "order-a",
    organizationName: "Northern Breeding",
    orders: [ownOrder, otherBreederOrder],
    statusHistory: [
      confirmedHistory,
      otherHistory,
      draftHistory,
      submittedHistory,
    ],
    shipments: [shipment, otherShipment],
    shipmentTrackingEvents: [
      transitTrackingEvent,
      otherTrackingEvent,
      preparedTrackingEvent,
    ],
    documents: [
      orderDocument,
      internalStationDocument,
      otherBreederDocument,
      shipmentDocument,
    ],
    proofEvents: [otherProofEvent, shipmentProofEvent, submittedProofEvent],
  });
  const html = renderBreederOrderDetail(detail);

  assert.equal(detail.organizationContext.organizationId, breederOrganizationId);
  assert.equal(detail.order.orderNumber, "SO-20260609-000001");
  assert.equal(detail.order.mareName, "Willow Queen");
  assert.equal(detail.order.mareRegistrationReference, "M-REG-2048");
  assert.equal(detail.currentStatus.status, "CONFIRMED");
  assert.equal(detail.currentStatus.latestChange?.id, "history-confirmed");
  assert.deepEqual(
    detail.sections.statusHistory.items.map((history) => history.id),
    ["history-draft", "history-submitted", "history-confirmed"],
  );
  assert.equal(detail.sections.shipments.items[0].status, "IN_TRANSIT");
  assert.equal(detail.sections.shipments.items[0].canConfirmReceived, true);
  assert.equal(
    detail.sections.shipments.items[0].confirmationSummary,
    "Receipt confirmation available",
  );
  assert.deepEqual(
    detail.sections.shipments.items[0].trackingEvents.map((event) => event.id),
    ["tracking-prepared", "tracking-transit"],
  );
  assert.deepEqual(
    detail.sections.documents.items.map((document) => document.id),
    ["document-shipment", "document-order"],
  );
  assert.deepEqual(
    detail.sections.proofEvents.items.map((event) => event.id),
    ["proof-submitted", "proof-shipment"],
  );
  assert.match(html, /Order SO-20260609-000001/);
  assert.match(html, /Willow Queen/);
  assert.match(html, /Status history/);
  assert.match(html, /Shipment information/);
  assert.match(html, /Receipt confirmation available/);
  assert.match(html, /shipment-handoff.pdf/);
  assert.match(html, /Proof events/);
  assert.match(html, /station confirmed/);
  assert.doesNotMatch(html, /station-internal-note.pdf/);
  assert.doesNotMatch(html, /other-breeder-document.pdf/);
});

test("order detail blocks unrelated breeder, station and buyer access", () => {
  const input = {
    orderId: "order-a",
    orders: [ownOrder],
  };

  assert.throws(
    () =>
      createBreederOrderDetailViewModel({
        ...input,
        actor: otherBreederActor,
      }),
    BreederOrderDetailAuthorizationError,
  );

  assert.throws(
    () =>
      createBreederOrderDetailViewModel({
        ...input,
        actor: stationActor,
      }),
    BreederOrderDetailAuthorizationError,
  );

  assert.throws(
    () =>
      createBreederOrderDetailViewModel({
        ...input,
        actor: buyerActor,
      }),
    BreederOrderDetailAuthorizationError,
  );

  assert.throws(
    () =>
      createBreederOrderDetailViewModel({
        ...input,
        actor: breederActor,
        organizationId: otherBreederOrganizationId,
      }),
    BreederOrderDetailAuthorizationError,
  );
});

test("order detail renders empty shipment, document and proof states without inventing future automation", () => {
  const detail = createBreederOrderDetailViewModel({
    actor: breederActor,
    orderId: "order-a",
    orders: [ownOrder],
    statusHistory: [draftHistory],
  });
  const html = renderBreederOrderDetail(detail);

  assert.deepEqual(
    detail.sections.shipments.items,
    [],
  );
  assert.deepEqual(
    detail.sections.documents.items,
    [],
  );
  assert.deepEqual(
    detail.sections.proofEvents.items,
    [],
  );
  assert.match(html, /No shipment has been recorded/);
  assert.match(html, /No permissioned documents are visible/);
  assert.match(html, /No proof events have been recorded/);
});

test("order detail reports validation, not found, loading and error states", () => {
  assert.throws(
    () =>
      createBreederOrderDetailViewModel({
        actor: breederActor,
        orderId: "",
        orders: [ownOrder],
      }),
    (error) =>
      error instanceof BreederOrderDetailValidationError &&
      error.issues.includes("orderId is required."),
  );

  assert.throws(
    () =>
      createBreederOrderDetailViewModel({
        actor: breederActor,
        orderId: "missing-order",
        orders: [ownOrder],
      }),
    BreederOrderDetailNotFoundError,
  );

  const loadingHtml = renderBreederOrderDetail(
    createBreederOrderDetailLoadingState({ orderLabel: "SO-20260609-000001" }),
  );
  const errorHtml = renderBreederOrderDetail(
    createBreederOrderDetailErrorState(
      new BreederOrderDetailAuthorizationError("actor is not authorized"),
    ),
  );

  assert.match(loadingHtml, /aria-busy="true"/);
  assert.match(loadingHtml, /Loading SO-20260609-000001/);
  assert.match(errorHtml, /role="alert"/);
  assert.match(errorHtml, /actor is not authorized/);
});
