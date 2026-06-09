import test from "node:test";
import assert from "node:assert/strict";

import {
  DOCUMENT_ACCESS_CLASSIFICATIONS,
  DOCUMENT_AUDIT_ACTIONS,
  DOCUMENT_EVIDENCE_ROUTES,
  DOCUMENT_LINK_TARGET_TYPES,
  DocumentEvidenceAuthorizationError,
  DocumentEvidenceValidationError,
  canAttachEvidenceToProofEvent,
  canUploadDocument,
  canViewDocument,
  createDocumentEndpoint,
  createEvidenceAttachmentEndpoint,
  getDocumentEndpoint,
  listEvidenceAttachmentsForProofEventEndpoint,
  listOrderDocumentsEndpoint,
  listShipmentDocumentsEndpoint,
  prepareCreateDocument,
  prepareCreateEvidenceAttachment,
} from "./document-evidence.mjs";

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

const semenOrder = {
  id: "order-confirmed",
  targetType: "SemenOrder",
  targetId: "order-confirmed",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "CONFIRMED",
};

const shipment = {
  id: "shipment-1",
  targetType: "Shipment",
  targetId: "shipment-1",
  semenOrderId: "order-confirmed",
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "PREPARED",
};

const proofEvent = {
  id: "proof-event-1",
  targetType: "ProofEvent",
  targetId: "proof-event-1",
  semenOrderId: "order-confirmed",
  shipmentId: "shipment-1",
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
};

const documentInput = {
  documentId: "document-1",
  linkTarget: shipment,
  documentType: "HEALTH_CERTIFICATE",
  description: " Required shipment evidence ",
  originalFileName: " health-certificate.pdf ",
  contentType: "application/pdf",
  fileSizeBytes: 123456,
  checksumSha256: "A".repeat(64),
  storageProvider: "s3",
  storageBucket: "coritech-documents",
  storageObjectKey: "orders/order-confirmed/health-certificate.pdf",
  storageRegion: "eu-west-1",
  storageVersionId: "version-1",
  accessClassification: "ORDER_PARTICIPANTS",
  actor: stationActor,
  uploadedAt: timestamp,
};

test("document route contract, classifications and audit actions stay inside Ticket 1.5 scope", () => {
  assert.deepEqual(DOCUMENT_ACCESS_CLASSIFICATIONS, [
    "INTERNAL",
    "ORDER_PARTICIPANTS",
    "RESTRICTED",
    "BUYER_VIEW_ELIGIBLE",
    "ADMIN_ONLY",
  ]);
  assert.deepEqual(DOCUMENT_LINK_TARGET_TYPES, [
    "SemenOrder",
    "Shipment",
    "ProofEvent",
  ]);
  assert.deepEqual(DOCUMENT_AUDIT_ACTIONS, [
    "DOCUMENT_UPLOADED",
    "DOCUMENT_VIEWED",
    "EVIDENCE_ATTACHMENT_CREATED",
  ]);
  assert.deepEqual(
    DOCUMENT_EVIDENCE_ROUTES.map((route) => `${route.method} ${route.path}`),
    [
      "POST /documents",
      "GET /documents/:documentId",
      "GET /semen-orders/:orderId/documents",
      "GET /shipments/:shipmentId/documents",
      "POST /proof-events/:proofEventId/evidence-attachments",
      "GET /proof-events/:proofEventId/evidence-attachments",
    ],
  );
});

test("station can prepare shipment-linked document metadata with object-storage references", () => {
  const prepared = prepareCreateDocument(documentInput);

  assert.deepEqual(prepared.document, {
    id: "document-1",
    documentType: "HEALTH_CERTIFICATE",
    description: "Required shipment evidence",
    targetType: "Shipment",
    targetId: "shipment-1",
    semenOrderId: "order-confirmed",
    shipmentId: "shipment-1",
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
    storageObjectKey: "orders/order-confirmed/health-certificate.pdf",
    storageRegion: "eu-west-1",
    storageVersionId: "version-1",
    accessClassification: "ORDER_PARTICIPANTS",
    uploadedByUserId: "user-station",
    uploaderRoleCode: "BREEDING_STATION",
    uploaderOrganizationId: stationOrganizationId,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  assert.equal(prepared.auditHook.action, "DOCUMENT_UPLOADED");
  assert.equal(prepared.auditHook.targetId, "document-1");
  assert.equal(prepared.auditHook.documentRef.storageProvider, "s3");
  assert.equal(prepared.auditHook.documentRef.fileSizeBytes, 123456);
});

test("access classification is mandatory and local filesystem payloads are rejected", () => {
  assert.throws(
    () =>
      prepareCreateDocument({
        ...documentInput,
        accessClassification: undefined,
        storageProvider: "LOCAL_FILESYSTEM",
        storageObjectKey: "/tmp/health-certificate.pdf",
        localFilePath: "/tmp/health-certificate.pdf",
      }),
    (error) =>
      error instanceof DocumentEvidenceValidationError &&
      error.issues.includes("accessClassification is required.") &&
      error.issues.includes(
        "localFilePath is not supported; production documents must use object-storage references only.",
      ) &&
      error.issues.includes(
        "storageProvider must reference an object-storage provider, not a local filesystem.",
      ) &&
      error.issues.includes(
        "storageObjectKey must be an object-storage key, not a local filesystem path.",
      ),
  );
});

test("document visibility is controlled by classification without granting buyer access", () => {
  const { document } = prepareCreateDocument(documentInput);
  const buyerEligible = {
    ...document,
    accessClassification: "BUYER_VIEW_ELIGIBLE",
  };
  const internal = {
    ...document,
    accessClassification: "INTERNAL",
  };
  const restricted = {
    ...document,
    accessClassification: "RESTRICTED",
  };
  const adminOnly = {
    ...document,
    accessClassification: "ADMIN_ONLY",
  };

  assert.equal(canUploadDocument(stationActor, shipment, "INTERNAL"), true);
  assert.equal(canUploadDocument(breederActor, shipment, "INTERNAL"), false);
  assert.equal(canViewDocument(breederActor, buyerEligible), true);
  assert.equal(canViewDocument(stationActor, buyerEligible), true);
  assert.equal(canViewDocument(adminActor, buyerEligible), true);
  assert.equal(canViewDocument(futureBuyerActor, buyerEligible), false);
  assert.equal(canViewDocument(breederActor, internal), false);
  assert.equal(canViewDocument(stationActor, internal), true);
  assert.equal(canViewDocument(breederActor, restricted), false);
  assert.equal(canViewDocument(stationActor, restricted), true);
  assert.equal(canViewDocument(stationActor, adminOnly), false);
  assert.equal(canViewDocument(adminActor, adminOnly), true);
});

test("evidence attachments can link existing documents to proof events", () => {
  const orderDocument = prepareCreateDocument({
    ...documentInput,
    documentId: "document-order-1",
    linkTarget: semenOrder,
    accessClassification: "ORDER_PARTICIPANTS",
    actor: breederActor,
  }).document;

  const prepared = prepareCreateEvidenceAttachment({
    attachmentId: "evidence-attachment-1",
    document: orderDocument,
    proofEvent,
    actor: stationActor,
    attachedAt: timestamp,
  });

  assert.equal(
    canAttachEvidenceToProofEvent(stationActor, orderDocument, proofEvent),
    true,
  );
  assert.equal(
    canAttachEvidenceToProofEvent(futureBuyerActor, orderDocument, proofEvent),
    false,
  );
  assert.deepEqual(prepared.evidenceAttachment, {
    id: "evidence-attachment-1",
    proofEventId: "proof-event-1",
    documentId: "document-order-1",
    documentTargetType: "SemenOrder",
    documentTargetId: "order-confirmed",
    attachedByUserId: "user-station",
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: stationOrganizationId,
    attachedAt: timestamp,
  });
  assert.equal(prepared.auditHook.action, "EVIDENCE_ATTACHMENT_CREATED");
  assert.equal(prepared.auditHook.targetId, "proof-event-1");
  assert.equal(prepared.auditHook.targetRef.documentId, "document-order-1");
});

test("document endpoints persist metadata, emit view audit hooks and attach evidence", async () => {
  const repository = buildRepository({
    orders: [semenOrder],
    shipments: [shipment],
    proofEvents: [proofEvent],
  });

  const created = await createDocumentEndpoint({
    actor: stationActor,
    repository,
    body: {
      targetType: "Shipment",
      targetId: "shipment-1",
      documentType: "HEALTH_CERTIFICATE",
      originalFileName: "health-certificate.pdf",
      contentType: "application/pdf",
      fileSizeBytes: 123456,
      storageProvider: "s3",
      storageBucket: "coritech-documents",
      storageObjectKey: "orders/order-confirmed/health-certificate.pdf",
      accessClassification: "ORDER_PARTICIPANTS",
      uploadedAt: timestamp,
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.document.id, "document-1");
  assert.equal(created.body.document.shipmentId, "shipment-1");
  assert.equal(created.auditHook?.action, "DOCUMENT_UPLOADED");

  const fetched = await getDocumentEndpoint({
    actor: breederActor,
    repository,
    params: {
      documentId: "document-1",
    },
    body: {},
  });

  assert.equal(fetched.status, 200);
  assert.equal(fetched.body.document.id, "document-1");
  assert.equal(fetched.auditHook?.action, "DOCUMENT_VIEWED");
  assert.equal(fetched.auditHook?.actorRoleCode, "BREEDER");

  const orderDocuments = await listOrderDocumentsEndpoint({
    actor: breederActor,
    repository,
    params: {
      orderId: "order-confirmed",
    },
    body: {},
  });

  assert.equal(orderDocuments.body.documents.length, 1);

  const shipmentDocuments = await listShipmentDocumentsEndpoint({
    actor: stationActor,
    repository,
    params: {
      shipmentId: "shipment-1",
    },
    body: {},
  });

  assert.equal(shipmentDocuments.body.documents.length, 1);

  const attached = await createEvidenceAttachmentEndpoint({
    actor: stationActor,
    repository,
    params: {
      proofEventId: "proof-event-1",
    },
    body: {
      documentId: "document-1",
      attachedAt: timestamp,
    },
  });

  assert.equal(attached.status, 201);
  assert.equal(attached.body.evidenceAttachment.id, "evidence-attachment-1");
  assert.equal(attached.auditHook?.action, "EVIDENCE_ATTACHMENT_CREATED");

  const evidenceTimeline = await listEvidenceAttachmentsForProofEventEndpoint({
    actor: adminActor,
    repository,
    params: {
      proofEventId: "proof-event-1",
    },
    body: {},
  });

  assert.deepEqual(
    evidenceTimeline.body.evidenceAttachments.map((attachment) => attachment.documentId),
    ["document-1"],
  );

  await assert.rejects(
    () =>
      getDocumentEndpoint({
        actor: futureBuyerActor,
        repository,
        params: {
          documentId: "document-1",
        },
        body: {},
      }),
    DocumentEvidenceAuthorizationError,
  );
});

function buildRepository({ orders, shipments, proofEvents }) {
  const orderStore = new Map(orders.map((order) => [order.id, order]));
  const shipmentStore = new Map(shipments.map((item) => [item.id, item]));
  const proofEventStore = new Map(proofEvents.map((event) => [event.id, event]));
  const documentStore = new Map();
  const evidenceAttachmentStore = new Map();
  let documentSequence = 1;
  let evidenceAttachmentSequence = 1;

  return {
    async findSemenOrderById(orderId) {
      return orderStore.get(orderId) ?? null;
    },
    async findShipmentById(shipmentId) {
      return shipmentStore.get(shipmentId) ?? null;
    },
    async findProofEventById(proofEventId) {
      return proofEventStore.get(proofEventId) ?? null;
    },
    async createDocument(document) {
      const persistedDocument = {
        ...document,
        id: document.id ?? `document-${documentSequence++}`,
      };

      documentStore.set(persistedDocument.id, persistedDocument);
      return persistedDocument;
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
      const existing = evidenceAttachmentStore.get(
        persistedAttachment.proofEventId,
      ) ?? [];

      existing.push(persistedAttachment);
      evidenceAttachmentStore.set(persistedAttachment.proofEventId, existing);
      return persistedAttachment;
    },
    async listEvidenceAttachmentsForProofEvent(proofEventId) {
      return evidenceAttachmentStore.get(proofEventId) ?? [];
    },
  };
}
