import test from "node:test";
import assert from "node:assert/strict";

import {
  createSemenListingEndpoint,
  updateSemenListingEndpoint,
} from "../catalog/semen-catalog.mjs";
import {
  getDocumentEndpoint,
} from "../documents/document-evidence.mjs";
import {
  createDraftSemenOrderEndpoint,
  getSemenOrderEndpoint,
  transitionSemenOrderStatusEndpoint,
} from "../orders/semen-order.mjs";
import {
  RBAC_PROTECTED_ROUTES,
  evaluateRbacPermission,
  hasPhase1ActorRole,
  withRbacPermission,
} from "./rbac-middleware.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const otherBreederOrganizationId = "org-breeder-b";
const stationOrganizationId = "org-station-a";
const otherStationOrganizationId = "org-station-b";

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

const stallion = {
  id: "stallion-a",
  name: "Northern Light",
  breed: "Warmblood",
  ueln: "276020000000001",
  microchipNumber: null,
  breedingStationOrganizationId: stationOrganizationId,
  status: "ACTIVE",
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const activeListing = {
  id: "listing-active",
  stallionId: "stallion-a",
  breedingStationOrganizationId: stationOrganizationId,
  availabilityStatus: "AVAILABLE",
  listingStatus: "ACTIVE",
  termsSummary: "Fresh semen available weekdays",
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const submittedOrder = {
  id: "order-submitted",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "SUBMITTED",
  createdByUserId: "user-breeder-a",
  updatedByUserId: "user-breeder-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const orderParticipantDocument = {
  id: "document-order-1",
  documentType: "HEALTH_CERTIFICATE",
  description: "Visible to order participants",
  targetType: "SemenOrder",
  targetId: "order-submitted",
  semenOrderId: "order-submitted",
  shipmentId: null,
  proofEventId: null,
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  originalFileName: "health-certificate.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 123456,
  checksumSha256: "a".repeat(64),
  storageProvider: "s3",
  storageBucket: "coritech-documents",
  storageObjectKey: "orders/order-submitted/health-certificate.pdf",
  storageRegion: "eu-west-1",
  storageVersionId: null,
  accessClassification: "ORDER_PARTICIPANTS",
  uploadedByUserId: "user-station-a",
  uploaderRoleCode: "BREEDING_STATION",
  uploaderOrganizationId: stationOrganizationId,
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("RBAC route contract covers Phase 1 order, listing and document permission boundaries", () => {
  assert.deepEqual(
    RBAC_PROTECTED_ROUTES.map((route) => `${route.method} ${route.path} ${route.permission}`),
    [
      "POST /semen-orders CREATE_SEMEN_ORDER",
      "POST /semen-orders/:orderId/status-transitions TRANSITION_SEMEN_ORDER_STATUS",
      "GET /semen-orders/:orderId VIEW_SEMEN_ORDER",
      "GET /semen-orders/:orderId/status-history VIEW_SEMEN_ORDER",
      "POST /stallions MANAGE_STALLION",
      "GET /stallions LIST_STALLIONS",
      "GET /stallions/:stallionId MANAGE_STALLION",
      "PATCH /stallions/:stallionId MANAGE_STALLION",
      "DELETE /stallions/:stallionId MANAGE_STALLION",
      "GET /semen-listings SEARCH_SEMEN_LISTINGS",
      "POST /semen-listings MANAGE_SEMEN_LISTING",
      "GET /semen-listings/:listingId VIEW_SEMEN_LISTING",
      "PATCH /semen-listings/:listingId MANAGE_SEMEN_LISTING",
      "DELETE /semen-listings/:listingId MANAGE_SEMEN_LISTING",
      "POST /documents CREATE_DOCUMENT",
      "GET /documents/:documentId VIEW_DOCUMENT",
      "GET /semen-orders/:orderId/documents LIST_ORDER_DOCUMENTS",
      "GET /shipments/:shipmentId/documents LIST_SHIPMENT_DOCUMENTS",
      "POST /proof-events/:proofEventId/evidence-attachments ATTACH_PROOF_EVIDENCE",
      "GET /proof-events/:proofEventId/evidence-attachments LIST_PROOF_EVIDENCE_ATTACHMENTS",
    ],
  );

  assert.equal(hasPhase1ActorRole(breederActor), true);
  assert.equal(hasPhase1ActorRole(futureBuyerActor), false);
});

test("RBAC middleware lets breeders create own orders and returns 403 for other breeder organizations", async () => {
  const repository = buildRepository({
    stallions: [stallion],
    listings: [activeListing],
    orders: [],
    documents: [],
  });
  const protectedCreateOrder = withRbacPermission(
    createDraftSemenOrderEndpoint,
    {
      action: "CREATE_SEMEN_ORDER",
      handlerName: "createDraftSemenOrderEndpoint",
      now: timestamp,
    },
  );

  const created = await protectedCreateOrder({
    actor: breederActor,
    repository,
    body: {
      semenListingId: "listing-active",
      breederOrganizationId,
      reason: "Mare owner requested fresh semen",
      createdAt: timestamp,
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.order.breederOrganizationId, breederOrganizationId);

  const denied = await protectedCreateOrder({
    actor: otherBreederActor,
    repository,
    body: {
      semenListingId: "listing-active",
      breederOrganizationId,
      reason: "Trying another breeder organization",
      createdAt: timestamp,
    },
  });

  assert.equal(denied.status, 403);
  assert.equal(denied.body.error.code, "RBAC_FORBIDDEN");
  assert.deepEqual(repository.rbacDecisions.map((decision) => decision.outcome), [
    "DENY",
  ]);
  assert.equal(repository.rbacDecisions[0].action, "CREATE_SEMEN_ORDER");
  assert.equal(repository.rbacDecisions[0].actorOrganizationId, otherBreederOrganizationId);
  assert.equal(
    repository.rbacDecisions[0].reason,
    "Breeder may create orders only for their own organization.",
  );
});

test("RBAC middleware lets stations manage own listings and assigned orders only", async () => {
  const repository = buildRepository({
    stallions: [stallion],
    listings: [activeListing],
    orders: [submittedOrder],
    documents: [],
  });
  const protectedCreateListing = withRbacPermission(
    createSemenListingEndpoint,
    {
      action: "MANAGE_SEMEN_LISTING",
      handlerName: "createSemenListingEndpoint",
      now: timestamp,
    },
  );
  const protectedUpdateListing = withRbacPermission(
    updateSemenListingEndpoint,
    {
      action: "MANAGE_SEMEN_LISTING",
      handlerName: "updateSemenListingEndpoint",
      now: timestamp,
    },
  );
  const protectedTransitionOrder = withRbacPermission(
    transitionSemenOrderStatusEndpoint,
    {
      action: "TRANSITION_SEMEN_ORDER_STATUS",
      handlerName: "transitionSemenOrderStatusEndpoint",
      now: timestamp,
    },
  );

  const createdListing = await protectedCreateListing({
    actor: stationActor,
    repository,
    body: {
      listingId: "listing-station-owned",
      stallionId: "stallion-a",
      availabilityStatus: "AVAILABLE",
      listingStatus: "ACTIVE",
      termsSummary: "Station-owned listing",
      changeReason: "Initial listing",
      createdAt: timestamp,
    },
  });

  assert.equal(createdListing.status, 201);
  assert.equal(createdListing.body.listing.breedingStationOrganizationId, stationOrganizationId);

  const updatedListing = await protectedUpdateListing({
    actor: stationActor,
    repository,
    params: {
      listingId: "listing-station-owned",
    },
    body: {
      availabilityStatus: "LIMITED",
      changeReason: "Collection slot reduced",
      now: timestamp,
    },
  });

  assert.equal(updatedListing.status, 200);
  assert.equal(updatedListing.body.listing.availabilityStatus, "LIMITED");

  const receivedOrder = await protectedTransitionOrder({
    actor: stationActor,
    repository,
    params: {
      orderId: "order-submitted",
    },
    body: {
      toStatus: "RECEIVED",
      reason: "Station received the order",
      now: timestamp,
    },
  });

  assert.equal(receivedOrder.status, 200);
  assert.equal(receivedOrder.body.order.status, "RECEIVED");

  const deniedListing = await protectedUpdateListing({
    actor: otherStationActor,
    repository,
    params: {
      listingId: "listing-station-owned",
    },
    body: {
      availabilityStatus: "UNAVAILABLE",
      changeReason: "Wrong station edit",
      now: timestamp,
    },
  });

  const deniedOrder = await protectedTransitionOrder({
    actor: otherStationActor,
    repository,
    params: {
      orderId: "order-submitted",
    },
    body: {
      toStatus: "CONFIRMED",
      reason: "Wrong station order transition",
      now: timestamp,
    },
  });

  assert.equal(deniedListing.status, 403);
  assert.equal(deniedOrder.status, 403);
  assert.deepEqual(
    repository.rbacDecisions
      .filter((decision) => decision.outcome === "DENY")
      .map((decision) => decision.action),
    ["MANAGE_SEMEN_LISTING", "TRANSITION_SEMEN_ORDER_STATUS"],
  );
});

test("platform admin access is allowed and logged by the RBAC middleware", async () => {
  const repository = buildRepository({
    stallions: [stallion],
    listings: [activeListing],
    orders: [submittedOrder],
    documents: [],
  });
  const protectedGetOrder = withRbacPermission(
    getSemenOrderEndpoint,
    {
      action: "VIEW_SEMEN_ORDER",
      handlerName: "getSemenOrderEndpoint",
      now: timestamp,
    },
  );

  const response = await protectedGetOrder({
    actor: adminActor,
    repository,
    params: {
      orderId: "order-submitted",
    },
    body: {},
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.order.id, "order-submitted");
  assert.deepEqual(repository.rbacDecisions.map((decision) => decision.outcome), [
    "ALLOW",
  ]);
  assert.equal(repository.rbacDecisions[0].actorRoleCode, "PLATFORM_ADMIN");
  assert.equal(repository.rbacDecisions[0].action, "VIEW_SEMEN_ORDER");
  assert.equal(repository.rbacDecisions[0].targetId, "order-submitted");
});

test("document access denies unrelated users with 403 and logs the permission failure", async () => {
  const repository = buildRepository({
    stallions: [stallion],
    listings: [activeListing],
    orders: [submittedOrder],
    documents: [orderParticipantDocument],
  });
  const protectedGetDocument = withRbacPermission(
    getDocumentEndpoint,
    {
      action: "VIEW_DOCUMENT",
      handlerName: "getDocumentEndpoint",
      now: timestamp,
    },
  );

  const visible = await protectedGetDocument({
    actor: breederActor,
    repository,
    params: {
      documentId: "document-order-1",
    },
    body: {},
  });

  assert.equal(visible.status, 200);
  assert.equal(visible.body.document.id, "document-order-1");

  const denied = await protectedGetDocument({
    actor: otherBreederActor,
    repository,
    params: {
      documentId: "document-order-1",
    },
    body: {},
  });

  assert.equal(denied.status, 403);
  assert.equal(denied.body.error.message, "Forbidden");
  assert.equal(repository.rbacDecisions.length, 1);
  assert.equal(repository.rbacDecisions[0].outcome, "DENY");
  assert.equal(repository.rbacDecisions[0].action, "VIEW_DOCUMENT");
  assert.equal(repository.rbacDecisions[0].targetRef.accessClassification, "ORDER_PARTICIPANTS");
});

test("RBAC policy evaluation rejects future buyer catalog search access", async () => {
  const repository = buildRepository({
    stallions: [stallion],
    listings: [activeListing],
    orders: [submittedOrder],
    documents: [],
  });

  const decision = await evaluateRbacPermission({
    action: "SEARCH_SEMEN_LISTINGS",
    request: {
      actor: futureBuyerActor,
      repository,
      body: {},
      query: {},
    },
    handlerName: "searchSemenListingsEndpoint",
    now: timestamp,
  });

  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 403);
  assert.equal(
    decision.reason,
    "Only authenticated Phase 1 roles may search semen listings; buyer access is not active.",
  );
});

function buildRepository({
  stallions = [],
  listings = [],
  orders = [],
  documents = [],
  shipments = [],
  proofEvents = [],
}) {
  const stallionStore = new Map(stallions.map((item) => [item.id, item]));
  const listingStore = new Map(listings.map((item) => [item.id, item]));
  const orderStore = new Map(orders.map((item) => [item.id, item]));
  const shipmentStore = new Map(shipments.map((item) => [item.id, item]));
  const proofEventStore = new Map(proofEvents.map((item) => [item.id, item]));
  const documentStore = new Map(documents.map((item) => [item.id, item]));
  const evidenceAttachmentStore = new Map();
  const statusHistoryStore = new Map();
  const rbacDecisions = [];
  let orderSequence = 1;
  let orderNumberSequence = 1;
  let historySequence = 1;
  let auditLogSequence = 1;
  let evidenceAttachmentSequence = 1;

  return {
    rbacDecisions,
    async recordRbacAccessDecision(decision) {
      const persistedDecision = {
        ...decision,
        id: `rbac-decision-${rbacDecisions.length + 1}`,
      };

      rbacDecisions.push(persistedDecision);

      return persistedDecision;
    },
    async createAuditLog(auditLog) {
      return {
        ...auditLog,
        id: auditLog.id ?? `audit-log-${auditLogSequence++}`,
      };
    },
    async findStallionById(stallionId) {
      return stallionStore.get(stallionId) ?? null;
    },
    async listStallions() {
      return Array.from(stallionStore.values());
    },
    async createStallion(stallionToCreate) {
      stallionStore.set(stallionToCreate.id, stallionToCreate);
      return stallionToCreate;
    },
    async updateStallion(stallionToUpdate) {
      stallionStore.set(stallionToUpdate.id, stallionToUpdate);
      return stallionToUpdate;
    },
    async findSemenListingById(listingId) {
      return listingStore.get(listingId) ?? null;
    },
    async findSemenListingRecordById(listingId) {
      const listing = listingStore.get(listingId);

      if (!listing) {
        return null;
      }

      const listingStallion = stallionStore.get(listing.stallionId);

      return listingStallion ? { listing, stallion: listingStallion } : null;
    },
    async listSemenListingRecords() {
      return Array.from(listingStore.values())
        .map((listing) => {
          const listingStallion = stallionStore.get(listing.stallionId);
          return listingStallion ? { listing, stallion: listingStallion } : null;
        })
        .filter(Boolean);
    },
    async createSemenListing(listingToCreate) {
      listingStore.set(listingToCreate.id, listingToCreate);
      return listingToCreate;
    },
    async updateSemenListing(listingToUpdate) {
      listingStore.set(listingToUpdate.id, listingToUpdate);
      return listingToUpdate;
    },
    async findSemenOrderById(orderId) {
      return orderStore.get(orderId) ?? null;
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
      statusHistoryStore.set(persistedOrder.id, [persistedHistory]);

      return {
        order: persistedOrder,
        statusHistory: persistedHistory,
      };
    },
    async updateSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedHistory = {
        ...statusHistory,
        id: statusHistory.id ?? `history-${historySequence++}`,
        semenOrderId: order.id,
      };
      const history = statusHistoryStore.get(order.id) ?? [];

      history.push(persistedHistory);
      orderStore.set(order.id, order);
      statusHistoryStore.set(order.id, history);

      return {
        order,
        statusHistory: persistedHistory,
      };
    },
    async listOrderStatusHistory(orderId) {
      return statusHistoryStore.get(orderId) ?? [];
    },
    async findShipmentById(shipmentId) {
      return shipmentStore.get(shipmentId) ?? null;
    },
    async findProofEventById(proofEventId) {
      return proofEventStore.get(proofEventId) ?? null;
    },
    async createDocument(documentToCreate) {
      documentStore.set(documentToCreate.id, documentToCreate);
      return documentToCreate;
    },
    async findDocumentById(documentId) {
      return documentStore.get(documentId) ?? null;
    },
    async listDocumentsForOrder(orderId) {
      return Array.from(documentStore.values()).filter(
        (document) => document.semenOrderId === orderId,
      );
    },
    async listDocumentsForShipment(shipmentId) {
      return Array.from(documentStore.values()).filter(
        (document) => document.shipmentId === shipmentId,
      );
    },
    async createEvidenceAttachment(evidenceAttachment) {
      const persistedAttachment = {
        ...evidenceAttachment,
        id: evidenceAttachment.id ?? `evidence-attachment-${evidenceAttachmentSequence++}`,
      };
      const attachments = evidenceAttachmentStore.get(persistedAttachment.proofEventId) ?? [];

      attachments.push(persistedAttachment);
      evidenceAttachmentStore.set(persistedAttachment.proofEventId, attachments);

      return persistedAttachment;
    },
    async listEvidenceAttachmentsForProofEvent(proofEventId) {
      return evidenceAttachmentStore.get(proofEventId) ?? [];
    },
  };
}
