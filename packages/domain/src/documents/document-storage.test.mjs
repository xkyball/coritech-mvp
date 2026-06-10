import test from "node:test";
import assert from "node:assert/strict";

import { DocumentEvidenceAuthorizationError } from "./document-evidence.mjs";
import {
  DocumentStorageValidationError,
  createControlledDocumentAccessUrl,
  replaceDocumentFile,
  revokeDocumentFile,
  uploadDocumentFile,
} from "./document-storage.mjs";

const order = Object.freeze({
  id: "order-1",
  orderNumber: "SO-20260610-000001",
  breederOrganizationId: "breeder-org-1",
  breedingStationOrganizationId: "station-org-1",
});

const stationActor = Object.freeze({
  userId: "station-user-1",
  roles: Object.freeze([
    Object.freeze({
      userId: "station-user-1",
      organizationId: "station-org-1",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    }),
  ]),
});

const breederActor = Object.freeze({
  userId: "breeder-user-1",
  roles: Object.freeze([
    Object.freeze({
      userId: "breeder-user-1",
      organizationId: "breeder-org-1",
      roleCode: "BREEDER",
      revokedAt: null,
    }),
  ]),
});

const otherBreederActor = Object.freeze({
  userId: "other-breeder-user",
  roles: Object.freeze([
    Object.freeze({
      userId: "other-breeder-user",
      organizationId: "other-breeder-org",
      roleCode: "BREEDER",
      revokedAt: null,
    }),
  ]),
});

test("uploadDocumentFile stores bytes, metadata and upload audit log", async () => {
  const repository = createMemoryDocumentRepository();
  const storageProvider = createMemoryStorageProvider();

  const result = await uploadDocumentFile({
    actor: stationActor,
    repository,
    storageProvider,
    auditContext: {
      ipAddress: "127.0.0.1",
      userAgent: "node-test",
    },
    targetType: "SemenOrder",
    targetId: order.id,
    documentType: "Station Confirmation",
    description: "Collection confirmation",
    originalFileName: "station-confirmation.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 2048,
    accessClassification: "ORDER_PARTICIPANTS",
    body: new TextEncoder().encode("pdf-bytes"),
    objectKey: "documents/SemenOrder/order-1/station-confirmation.pdf",
    now: "2026-06-10T12:00:00.000Z",
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.document.id, "document-1");
  assert.equal(result.body.document.storageProvider, "minio");
  assert.equal(result.body.document.storageBucket, "coritech-local-dev");
  assert.equal(
    result.body.document.storageObjectKey,
    "documents/SemenOrder/order-1/station-confirmation.pdf",
  );
  assert.equal(result.body.document.storageVersionId, "version-1");
  assert.equal(result.body.malwareScan.status, "NOT_SCANNED_PLACEHOLDER");
  assert.equal(result.body.malwareScan.provider, "PHASE_1_PLACEHOLDER");
  assert.equal(result.body.proofResult?.proofEvent.eventType, "DOCUMENT_UPLOADED");
  assert.equal(result.body.proofResult?.proofEvent.verificationLevel, "SYSTEM_RECORDED");
  assert.equal(
    result.body.proofResult?.evidenceAttachment.documentId,
    result.body.document.id,
  );
  assert.equal(
    result.body.proofResult?.proofEvent.documentationRefs[0]?.accessClassification,
    "ORDER_PARTICIPANTS",
  );
  assert.equal(storageProvider.puts.length, 1);
  assert.equal(storageProvider.puts[0].contentType, "application/pdf");
  assert.equal(
    storageProvider.puts[0].metadata["malware-scan-status"],
    "NOT_SCANNED_PLACEHOLDER",
  );
  assert.equal(repository.auditLogs.length, 3);
  assert.equal(repository.auditLogs[0].action, "UPLOAD_DOCUMENT");
  assert.equal(repository.auditLogs[0].sourceAction, "DOCUMENT_UPLOADED");
  assert.equal(repository.auditLogs[1].sourceAction, "PROOF_EVENT_CREATED");
  assert.equal(repository.auditLogs[2].action, "CREATE");
  assert.equal(repository.auditLogs[2].sourceAction, "EVIDENCE_ATTACHMENT_CREATED");
  assert.equal(repository.auditLogs[0].ipAddress, "127.0.0.1");
});

test("createControlledDocumentAccessUrl logs document view and returns a time-limited URL", async () => {
  const repository = createMemoryDocumentRepository();
  const storageProvider = createMemoryStorageProvider();
  const upload = await uploadDocumentFile({
    actor: stationActor,
    repository,
    storageProvider,
    targetType: "SemenOrder",
    targetId: order.id,
    documentType: "Certificate",
    originalFileName: "certificate.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 4096,
    accessClassification: "ORDER_PARTICIPANTS",
    body: "certificate-bytes",
    objectKey: "documents/SemenOrder/order-1/certificate.pdf",
    now: "2026-06-10T12:00:00.000Z",
  });

  const result = await createControlledDocumentAccessUrl({
    actor: breederActor,
    repository,
    storageProvider,
    documentId: upload.body.document.id,
    expiresInSeconds: 120,
    now: "2026-06-10T12:30:00.000Z",
  });

  assert.equal(result.status, 200);
  assert.equal(
    result.body.accessUrl,
    "https://controlled.example.invalid/documents/SemenOrder/order-1/certificate.pdf?ttl=120",
  );
  assert.equal(result.body.expiresInSeconds, 120);
  assert.equal(result.body.expiresAt, "2026-06-10T12:32:00.000Z");
  assert.equal(repository.auditLogs.at(-1).action, "VIEW_DOCUMENT");
  assert.equal(repository.auditLogs.at(-1).sourceAction, "DOCUMENT_VIEWED");
});

test("createControlledDocumentAccessUrl rejects unauthorized actors before creating URL", async () => {
  const repository = createMemoryDocumentRepository();
  const storageProvider = createMemoryStorageProvider();
  const upload = await uploadDocumentFile({
    actor: stationActor,
    repository,
    storageProvider,
    targetType: "SemenOrder",
    targetId: order.id,
    documentType: "Vet Report prepared",
    originalFileName: "vet-report.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 4096,
    accessClassification: "ORDER_PARTICIPANTS",
    body: "vet-report-bytes",
    objectKey: "documents/SemenOrder/order-1/vet-report.pdf",
    now: "2026-06-10T12:00:00.000Z",
  });

  await assert.rejects(
    () =>
      createControlledDocumentAccessUrl({
        actor: otherBreederActor,
        repository,
        storageProvider,
        documentId: upload.body.document.id,
      }),
    DocumentEvidenceAuthorizationError,
  );
  assert.equal(storageProvider.presignedUrls.length, 0);
  assert.equal(repository.auditLogs.filter((log) => log.action === "VIEW_DOCUMENT").length, 0);
});

test("uploadDocumentFile validates content type, size and scanner block result", async () => {
  const repository = createMemoryDocumentRepository();
  const storageProvider = createMemoryStorageProvider();

  await assert.rejects(
    () =>
      uploadDocumentFile({
        actor: stationActor,
        repository,
        storageProvider,
        targetType: "SemenOrder",
        targetId: order.id,
        documentType: "Other Evidence",
        originalFileName: "script.js",
        contentType: "application/javascript",
        fileSizeBytes: 1,
        accessClassification: "ORDER_PARTICIPANTS",
        body: "alert(1)",
      }),
    (error) =>
      error instanceof DocumentStorageValidationError &&
      error.issues.some((issue) => issue.startsWith("contentType must be one of:")),
  );

  await assert.rejects(
    () =>
      uploadDocumentFile({
        actor: stationActor,
        repository,
        storageProvider,
        targetType: "SemenOrder",
        targetId: order.id,
        documentType: "Other Evidence",
        originalFileName: "large.pdf",
        contentType: "application/pdf",
        fileSizeBytes: 26 * 1024 * 1024,
        accessClassification: "ORDER_PARTICIPANTS",
        body: "large",
      }),
    (error) =>
      error instanceof DocumentStorageValidationError &&
      error.issues.includes("fileSizeBytes must be 26214400 bytes or smaller."),
  );

  await assert.rejects(
    () =>
      uploadDocumentFile({
        actor: stationActor,
        repository,
        storageProvider,
        targetType: "SemenOrder",
        targetId: order.id,
        documentType: "Other Evidence",
        originalFileName: "blocked.pdf",
        contentType: "application/pdf",
        fileSizeBytes: 1024,
        accessClassification: "ORDER_PARTICIPANTS",
        body: "blocked",
        malwareScanner: {
          async scan() {
            return {
              status: "BLOCKED",
              provider: "test-scanner",
              checkedAt: "2026-06-10T12:00:00.000Z",
              reference: "scan-1",
              details: "blocked by test scanner",
            };
          },
        },
      }),
    (error) =>
      error instanceof DocumentStorageValidationError &&
      error.issues.includes("malware scanner blocked this document upload."),
  );
  assert.equal(storageProvider.puts.length, 0);
  assert.equal(repository.documents.length, 0);
});

test("revokeDocumentFile updates lifecycle and records audit log", async () => {
  const repository = createMemoryDocumentRepository();
  const storageProvider = createMemoryStorageProvider();
  const upload = await uploadDocumentFile({
    actor: stationActor,
    repository,
    storageProvider,
    targetType: "SemenOrder",
    targetId: order.id,
    documentType: "Other Evidence",
    originalFileName: "evidence.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 1024,
    accessClassification: "ORDER_PARTICIPANTS",
    body: "evidence",
    objectKey: "documents/SemenOrder/order-1/evidence.pdf",
    now: "2026-06-10T12:00:00.000Z",
  });

  const result = await revokeDocumentFile({
    actor: stationActor,
    repository,
    documentId: upload.body.document.id,
    reason: "Uploaded against the wrong order.",
    now: "2026-06-10T13:00:00.000Z",
  });

  assert.equal(result.status, 200);
  assert.equal(result.body.document.status, "REVOKED");
  assert.equal(result.body.document.revocationReason, "Uploaded against the wrong order.");
  assert.equal(repository.auditLogs.at(-1).sourceAction, "DOCUMENT_REVOKED");
  assert.equal(repository.auditLogs.at(-1).action, "UPDATE");
});

test("replaceDocumentFile uploads replacement and supersedes original", async () => {
  const repository = createMemoryDocumentRepository();
  const storageProvider = createMemoryStorageProvider();
  const upload = await uploadDocumentFile({
    actor: stationActor,
    repository,
    storageProvider,
    targetType: "SemenOrder",
    targetId: order.id,
    documentType: "Certificate",
    originalFileName: "certificate.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 1024,
    accessClassification: "ORDER_PARTICIPANTS",
    body: "certificate",
    objectKey: "documents/SemenOrder/order-1/certificate.pdf",
    now: "2026-06-10T12:00:00.000Z",
  });

  const result = await replaceDocumentFile({
    actor: stationActor,
    repository,
    storageProvider,
    documentId: upload.body.document.id,
    reason: "Updated signed certificate.",
    documentType: "Certificate",
    originalFileName: "certificate-v2.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 2048,
    accessClassification: "ORDER_PARTICIPANTS",
    body: "certificate-v2",
    objectKey: "documents/SemenOrder/order-1/certificate-v2.pdf",
    now: "2026-06-10T14:00:00.000Z",
  });

  assert.equal(result.status, 201);
  assert.equal(result.body.originalDocument.status, "SUPERSEDED");
  assert.equal(
    result.body.originalDocument.replacedByDocumentId,
    result.body.replacementDocument.id,
  );
  assert.equal(result.body.replacementDocument.status, "ACTIVE");
  assert.equal(repository.auditLogs.at(-1).sourceAction, "DOCUMENT_REPLACED");
  assert.equal(repository.documents.length, 2);
});

function createMemoryDocumentRepository() {
  const documents = [];
  const auditLogs = [];
  const proofEvents = [];
  const evidenceAttachments = [];

  return {
    documents,
    auditLogs,
    proofEvents,
    evidenceAttachments,
    async findSemenOrderById(orderId) {
      return orderId === order.id ? { ...order } : null;
    },
    async findShipmentById() {
      return null;
    },
    async findProofEventById() {
      return null;
    },
    async createDocument(document) {
      const persisted = {
        ...document,
        id: document.id ?? `document-${documents.length + 1}`,
      };

      documents.push(persisted);

      return persisted;
    },
    async updateDocument(document) {
      const index = documents.findIndex((item) => item.id === document.id);

      if (index === -1) {
        throw new Error("document not found");
      }

      documents[index] = { ...document };

      return documents[index];
    },
    async findDocumentById(documentId) {
      return documents.find((document) => document.id === documentId) ?? null;
    },
    async listDocumentsForOrder(orderId) {
      return documents.filter((document) => document.semenOrderId === orderId);
    },
    async listDocumentsForShipment(shipmentId) {
      return documents.filter((document) => document.shipmentId === shipmentId);
    },
    async createEvidenceAttachment(evidenceAttachment) {
      const persisted = {
        ...evidenceAttachment,
        id: evidenceAttachment.id ?? `evidence-attachment-${evidenceAttachments.length + 1}`,
      };

      evidenceAttachments.push(persisted);

      return persisted;
    },
    async listEvidenceAttachmentsForProofEvent() {
      return evidenceAttachments;
    },
    async createProofEvent(proofEvent) {
      const persisted = {
        ...proofEvent,
        id: proofEvent.id ?? `proof-event-${proofEvents.length + 1}`,
      };

      proofEvents.push(persisted);

      return persisted;
    },
    async createAuditLog(auditLog) {
      const persisted = {
        ...auditLog,
        id: auditLog.id ?? `audit-${auditLogs.length + 1}`,
      };

      auditLogs.push(persisted);

      return persisted;
    },
  };
}

function createMemoryStorageProvider() {
  const puts = [];
  const presignedUrls = [];

  return {
    puts,
    presignedUrls,
    config: {
      kind: "S3_COMPATIBLE_OBJECT_STORAGE",
      provider: "minio",
      endpoint: "localhost",
      port: 9000,
      useSsl: false,
      bucket: "coritech-local-dev",
      region: "local-dev",
      baseUrl: "http://localhost:9000",
      accessKeyEnvironmentKey: "OBJECT_STORAGE_ACCESS_KEY",
      secretKeyEnvironmentKey: "OBJECT_STORAGE_SECRET_KEY",
      accessKeyConfigured: true,
      secretKeyConfigured: true,
      bucketPrivateByDefault: true,
      publicLinksAllowed: false,
    },
    async putObject(input) {
      puts.push(input);

      return {
        provider: "minio",
        bucket: "coritech-local-dev",
        key: input.key,
        etag: "etag-1",
        versionId: "version-1",
      };
    },
    async getObject() {
      return "body";
    },
    async deleteObject() {
      return {
        provider: "minio",
        bucket: "coritech-local-dev",
        key: "deleted",
        deleted: true,
      };
    },
    async headObject() {
      return {};
    },
    async objectExists() {
      return true;
    },
    async createInfrastructurePresignedGetUrl(input) {
      presignedUrls.push(input);

      return `https://controlled.example.invalid/${input.key}?ttl=${input.expiresInSeconds}`;
    },
  };
}
