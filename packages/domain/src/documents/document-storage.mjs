// @ts-check

import { randomUUID } from "node:crypto";

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import {
  buildEvidenceAttachmentAuditHook,
  createDocumentEndpoint,
  getDocumentEndpoint,
  prepareCreateEvidenceAttachment,
  prepareRevokeDocument,
  prepareSupersedeDocument,
} from "./document-evidence.mjs";
import {
  buildProofEventCreationAuditHook,
  prepareCreateProofEvent,
} from "../proof/proof-event.mjs";

export const DOCUMENT_STORAGE_ALLOWED_CONTENT_TYPES = Object.freeze([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const DOCUMENT_STORAGE_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const DOCUMENT_STORAGE_DEFAULT_ACCESS_URL_TTL_SECONDS = 300;
export const DOCUMENT_STORAGE_MAX_ACCESS_URL_TTL_SECONDS = 900;

export class DocumentStorageValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech document storage input:\n- ${issues.join("\n- ")}`);
    this.name = "DocumentStorageValidationError";
    this.issues = issues;
  }
}

/**
 * @param {import("./document-storage.d.ts").UploadDocumentFileInput} input
 * @returns {Promise<Readonly<import("./document-storage.d.ts").UploadDocumentFileResult>>}
 */
export async function uploadDocumentFile(input) {
  const normalized = normalizeUploadDocumentFileInput(input);
  const occurredAt = toIsoTimestamp(normalized.now ?? new Date());
  const malwareScan = await runMalwareScan(normalized, occurredAt);
  const objectKey = normalized.objectKey ?? buildDocumentObjectKey({
    targetType: normalized.targetType,
    targetId: normalized.targetId,
    originalFileName: normalized.originalFileName,
    occurredAt,
  });

  if (malwareScan.status === "BLOCKED") {
    throw new DocumentStorageValidationError([
      "malware scanner blocked this document upload.",
    ]);
  }

  const storageReference = await normalized.storageProvider.putObject({
    key: objectKey,
    body: normalized.body,
    contentType: normalized.contentType,
    metadata: {
      "document-type": normalized.documentType,
      "original-file-name": normalized.originalFileName,
      "access-classification": normalized.accessClassification,
      "malware-scan-status": malwareScan.status,
    },
  });

  try {
    const response = await createDocumentEndpoint({
      actor: normalized.actor,
      repository: normalized.repository,
      auditContext: normalized.auditContext,
      body: {
        targetType: normalized.targetType,
        targetId: normalized.targetId,
        documentType: normalized.documentType,
        description: normalized.description,
        originalFileName: normalized.originalFileName,
        contentType: normalized.contentType,
        fileSizeBytes: normalized.fileSizeBytes,
        checksumSha256: normalized.checksumSha256,
        storageProvider: storageReference.provider,
        storageBucket: storageReference.bucket,
        storageObjectKey: storageReference.key,
        storageRegion: normalized.storageProvider.config.region,
        storageVersionId: storageReference.versionId,
        accessClassification: normalized.accessClassification,
        uploadedAt: occurredAt,
      },
    });

    const proofResult = await createDocumentUploadProofResult({
      actor: normalized.actor,
      auditContext: normalized.auditContext,
      auditHook: response.auditHook,
      auditLog: response.auditLog,
      document: response.body.document,
      repository: normalized.repository,
    });

    return deepFreeze({
      status: 201,
      body: {
        document: response.body.document,
        storageReference,
        malwareScan,
        proofResult,
      },
      auditHook: response.auditHook,
      auditLog: response.auditLog,
    });
  } catch (error) {
    await normalized.storageProvider.deleteObject({ key: storageReference.key })
      .catch(() => undefined);
    throw error;
  }
}

/**
 * @param {import("./document-storage.d.ts").ControlledDocumentAccessUrlInput} input
 * @returns {Promise<Readonly<import("./document-storage.d.ts").ControlledDocumentAccessUrlResult>>}
 */
export async function createControlledDocumentAccessUrl(input) {
  const normalized = normalizeControlledDocumentAccessUrlInput(input);
  const response = await getDocumentEndpoint({
    actor: normalized.actor,
    repository: normalized.repository,
    auditContext: normalized.auditContext,
    params: {
      documentId: normalized.documentId,
    },
    body: {},
  });
  const document = response.body.document;

  validateDocumentMatchesStorageProvider(document, normalized.storageProvider);

  const accessUrl = await normalized.storageProvider.createInfrastructurePresignedGetUrl({
    key: document.storageObjectKey,
    expiresInSeconds: normalized.expiresInSeconds,
  });
  const expiresAt = new Date(
    normalized.now.getTime() + normalized.expiresInSeconds * 1000,
  ).toISOString();

  return deepFreeze({
    status: 200,
    body: {
      document,
      accessUrl,
      expiresInSeconds: normalized.expiresInSeconds,
      expiresAt,
    },
    auditHook: response.auditHook,
    auditLog: response.auditLog,
  });
}

/**
 * @param {import("./document-storage.d.ts").RevokeDocumentFileInput} input
 * @returns {Promise<Readonly<import("./document-storage.d.ts").DocumentLifecycleResult>>}
 */
export async function revokeDocumentFile(input) {
  const normalized = normalizeDocumentLifecycleServiceInput(input, "revoke");
  const document = await findRequiredDocument(
    normalized.repository,
    normalized.documentId,
  );
  const prepared = prepareRevokeDocument({
    actor: normalized.actor,
    document,
    reason: normalized.reason,
    now: normalized.now,
  });
  const persisted = await updateDocumentLifecycle(
    normalized.repository,
    prepared.document,
  );
  const auditHook = {
    ...prepared.auditHook,
    documentRef: buildServiceDocumentRef(persisted),
  };
  const auditLog = await createAuditLogFromHook({
    repository: normalized.repository,
    auditHook,
    requestContext: normalized.auditContext,
  });

  return deepFreeze({
    status: 200,
    body: { document: persisted },
    auditHook,
    auditLog,
  });
}

/**
 * @param {import("./document-storage.d.ts").ReplaceDocumentFileInput} input
 * @returns {Promise<Readonly<import("./document-storage.d.ts").ReplaceDocumentFileResult>>}
 */
export async function replaceDocumentFile(input) {
  const normalized = normalizeReplaceDocumentFileInput(input);
  const originalDocument = await findRequiredDocument(
    normalized.repository,
    normalized.documentId,
  );
  const replacement = await uploadDocumentFile({
    ...normalized,
    targetType: originalDocument.targetType,
    targetId: originalDocument.targetId,
    accessClassification: originalDocument.accessClassification,
    description: normalized.description ?? originalDocument.description,
  });
  const prepared = prepareSupersedeDocument({
    actor: normalized.actor,
    document: originalDocument,
    replacementDocumentId: replacement.body.document.id ?? "",
    reason: normalized.reason,
    now: normalized.now,
  });
  const superseded = await updateDocumentLifecycle(
    normalized.repository,
    prepared.document,
  );
  const auditHook = {
    ...prepared.auditHook,
    documentRef: buildServiceDocumentRef(superseded),
  };
  const auditLog = await createAuditLogFromHook({
    repository: normalized.repository,
    auditHook,
    requestContext: normalized.auditContext,
  });

  return deepFreeze({
    status: 201,
    body: {
      originalDocument: superseded,
      replacementDocument: replacement.body.document,
      storageReference: replacement.body.storageReference,
      malwareScan: replacement.body.malwareScan,
    },
    auditHook,
    auditLog,
  });
}

/**
 * @param {import("./document-storage.d.ts").UploadDocumentFileInput} input
 * @returns {Required<Omit<import("./document-storage.d.ts").UploadDocumentFileInput, "malwareScanner" | "objectKey" | "description" | "checksumSha256" | "auditContext" | "now">> & {
 *   malwareScanner: import("./document-storage.d.ts").DocumentMalwareScanner | null,
 *   objectKey: string | null,
 *   description: string | null,
 *   checksumSha256: string | null,
 *   auditContext: import("../audit/audit-log.d.ts").AuditRequestContext | null,
 *   now: Date | null,
 * }}
 */
function normalizeUploadDocumentFileInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    throw new DocumentStorageValidationError([
      "document upload input is required.",
    ]);
  }

  validateRequiredObject(input.actor, "actor", issues);
  validateRequiredObject(input.repository, "repository", issues);
  validateRequiredObject(input.storageProvider, "storageProvider", issues);
  validateRequiredNonBlankString(input.targetType, "targetType", issues);
  validateRequiredNonBlankString(input.targetId, "targetId", issues);
  validateRequiredNonBlankString(input.documentType, "documentType", issues);
  validateRequiredNonBlankString(input.originalFileName, "originalFileName", issues);
  validateRequiredNonBlankString(input.accessClassification, "accessClassification", issues);
  validateOptionalNonBlankString(input.description, "description", issues);
  validateOptionalNonBlankString(input.checksumSha256, "checksumSha256", issues);
  validateOptionalNonBlankString(input.objectKey, "objectKey", issues);

  if (input.body == null) {
    issues.push("body is required.");
  }

  const contentType = normalizeContentType(input.contentType);

  if (!contentType) {
    issues.push("contentType is required.");
  } else if (!DOCUMENT_STORAGE_ALLOWED_CONTENT_TYPES.includes(contentType)) {
    issues.push(
      `contentType must be one of: ${DOCUMENT_STORAGE_ALLOWED_CONTENT_TYPES.join(", ")}.`,
    );
  }

  if (!Number.isInteger(input.fileSizeBytes) || input.fileSizeBytes <= 0) {
    issues.push("fileSizeBytes must be a positive integer.");
  } else if (input.fileSizeBytes > DOCUMENT_STORAGE_MAX_FILE_SIZE_BYTES) {
    issues.push(
      `fileSizeBytes must be ${DOCUMENT_STORAGE_MAX_FILE_SIZE_BYTES} bytes or smaller.`,
    );
  }

  const now = input.now == null ? null : normalizeDate(input.now, "now", issues);

  if (issues.length > 0) {
    throw new DocumentStorageValidationError(issues);
  }

  return {
    actor: input.actor,
    repository: input.repository,
    storageProvider: input.storageProvider,
    auditContext: input.auditContext ?? null,
    targetType: normalizeRequiredString(input.targetType),
    targetId: normalizeRequiredString(input.targetId),
    documentType: normalizeRequiredString(input.documentType),
    description: normalizeOptionalString(input.description),
    originalFileName: normalizeRequiredString(input.originalFileName),
    contentType,
    fileSizeBytes: input.fileSizeBytes,
    checksumSha256: normalizeOptionalString(input.checksumSha256),
    accessClassification: normalizeRequiredString(input.accessClassification),
    body: input.body,
    malwareScanner: input.malwareScanner ?? null,
    objectKey: normalizeOptionalString(input.objectKey),
    now,
  };
}

/**
 * @param {import("./document-storage.d.ts").ControlledDocumentAccessUrlInput} input
 * @returns {{
 *   actor: import("./document-evidence.d.ts").DocumentActorContext,
 *   repository: import("./document-evidence.d.ts").DocumentEvidenceRepository,
 *   storageProvider: import("../storage/object-storage.d.ts").ObjectStorageProvider,
 *   auditContext: import("../audit/audit-log.d.ts").AuditRequestContext | null,
 *   documentId: string,
 *   expiresInSeconds: number,
 *   now: Date,
 * }}
 */
function normalizeControlledDocumentAccessUrlInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    throw new DocumentStorageValidationError([
      "controlled document access input is required.",
    ]);
  }

  validateRequiredObject(input.actor, "actor", issues);
  validateRequiredObject(input.repository, "repository", issues);
  validateRequiredObject(input.storageProvider, "storageProvider", issues);
  validateRequiredNonBlankString(input.documentId, "documentId", issues);

  const expiresInSeconds = normalizePositiveInteger(
    input.expiresInSeconds ?? DOCUMENT_STORAGE_DEFAULT_ACCESS_URL_TTL_SECONDS,
  );

  if (
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds <= 0 ||
    expiresInSeconds > DOCUMENT_STORAGE_MAX_ACCESS_URL_TTL_SECONDS
  ) {
    issues.push(
      `expiresInSeconds must be between 1 and ${DOCUMENT_STORAGE_MAX_ACCESS_URL_TTL_SECONDS}.`,
    );
  }

  const now = input.now == null
    ? new Date()
    : normalizeDate(input.now, "now", issues);

  if (issues.length > 0) {
    throw new DocumentStorageValidationError(issues);
  }

  return {
    actor: input.actor,
    repository: input.repository,
    storageProvider: input.storageProvider,
    auditContext: input.auditContext ?? null,
    documentId: normalizeRequiredString(input.documentId),
    expiresInSeconds,
    now,
  };
}

/**
 * @param {import("./document-storage.d.ts").RevokeDocumentFileInput} input
 * @param {"revoke" | "replace"} actionName
 * @returns {{
 *   actor: import("./document-evidence.d.ts").DocumentActorContext,
 *   repository: import("./document-evidence.d.ts").DocumentEvidenceRepository,
 *   auditContext: import("../audit/audit-log.d.ts").AuditRequestContext | null,
 *   documentId: string,
 *   reason: string,
 *   now: Date | null,
 * }}
 */
function normalizeDocumentLifecycleServiceInput(input, actionName) {
  const issues = [];

  if (!input || typeof input !== "object") {
    throw new DocumentStorageValidationError([
      `document ${actionName} input is required.`,
    ]);
  }

  validateRequiredObject(input.actor, "actor", issues);
  validateRequiredObject(input.repository, "repository", issues);
  validateRequiredNonBlankString(input.documentId, "documentId", issues);
  validateRequiredNonBlankString(input.reason, "reason", issues);

  const now = input.now == null ? null : normalizeDate(input.now, "now", issues);

  if (issues.length > 0) {
    throw new DocumentStorageValidationError(issues);
  }

  return {
    actor: input.actor,
    repository: input.repository,
    auditContext: input.auditContext ?? null,
    documentId: normalizeRequiredString(input.documentId),
    reason: normalizeRequiredString(input.reason),
    now,
  };
}

/**
 * @param {import("./document-storage.d.ts").ReplaceDocumentFileInput} input
 * @returns {ReturnType<typeof normalizeUploadDocumentFileInput> & {
 *   documentId: string,
 *   reason: string,
 * }}
 */
function normalizeReplaceDocumentFileInput(input) {
  const lifecycle = normalizeDocumentLifecycleServiceInput(input, "replace");
  const upload = normalizeUploadDocumentFileInput({
    ...input,
    targetType: "SemenOrder",
    targetId: "placeholder",
    accessClassification: "ORDER_PARTICIPANTS",
  });

  return {
    ...upload,
    documentId: lifecycle.documentId,
    reason: lifecycle.reason,
    auditContext: lifecycle.auditContext,
    now: lifecycle.now,
  };
}

/**
 * @param {import("./document-evidence.d.ts").DocumentEvidenceRepository} repository
 * @param {string} documentId
 * @returns {Promise<import("./document-evidence.d.ts").Document>}
 */
async function findRequiredDocument(repository, documentId) {
  const findDocumentById = requireRepositoryMethod(repository, "findDocumentById");
  const document = await findDocumentById(documentId);

  if (!document) {
    throw new DocumentStorageValidationError([
      `Document was not found: ${documentId}`,
    ]);
  }

  return document;
}

/**
 * @param {import("./document-evidence.d.ts").DocumentEvidenceRepository} repository
 * @param {import("./document-evidence.d.ts").Document} document
 * @returns {Promise<import("./document-evidence.d.ts").Document>}
 */
async function updateDocumentLifecycle(repository, document) {
  const updateDocument = requireRepositoryMethod(repository, "updateDocument");

  return updateDocument(document);
}

/**
 * @param {unknown} repository
 * @param {string} methodName
 * @returns {Function}
 */
function requireRepositoryMethod(repository, methodName) {
  const method = repository?.[methodName];

  if (typeof method !== "function") {
    throw new DocumentStorageValidationError([
      `repository.${methodName} is required.`,
    ]);
  }

  return method.bind(repository);
}

/**
 * @param {import("./document-evidence.d.ts").Document} document
 * @returns {Readonly<Record<string, unknown>>}
 */
function buildServiceDocumentRef(document) {
  return Object.freeze({
    documentType: document.documentType,
    originalFileName: document.originalFileName,
    contentType: document.contentType,
    fileSizeBytes: document.fileSizeBytes,
    checksumSha256: document.checksumSha256,
    storageProvider: document.storageProvider,
    storageBucket: document.storageBucket,
    storageObjectKey: document.storageObjectKey,
    storageRegion: document.storageRegion,
    storageVersionId: document.storageVersionId,
    accessClassification: document.accessClassification,
    status: document.status,
    replacedByDocumentId: document.replacedByDocumentId,
    revocationReason: document.revocationReason,
    replacementReason: document.replacementReason,
  });
}

/**
 * @param {{
 *   actor: import("./document-evidence.d.ts").DocumentActorContext,
 *   auditContext: import("../audit/audit-log.d.ts").AuditRequestContext | null,
 *   auditHook: import("./document-evidence.d.ts").DocumentAuditHook | undefined,
 *   auditLog: import("../audit/audit-log.d.ts").AuditLog | undefined,
 *   document: import("./document-evidence.d.ts").Document,
 *   repository: import("./document-evidence.d.ts").DocumentEvidenceRepository,
 * }} input
 * @returns {Promise<import("./document-storage.d.ts").DocumentUploadProofResult | null>}
 */
async function createDocumentUploadProofResult(input) {
  if (
    typeof input.repository.createProofEvent !== "function" ||
    typeof input.repository.createEvidenceAttachment !== "function"
  ) {
    return null;
  }

  if (
    !input.document.semenOrderId &&
    !input.document.shipmentId &&
    !input.document.proofEventId
  ) {
    return null;
  }

  const proofInput = prepareCreateProofEvent({
    eventType: "DOCUMENT_UPLOADED",
    source: "DOCUMENT_UPLOAD",
    triggerType: "DOCUMENT_ACCESS",
    triggerRef: {
      targetType: "Document",
      targetId: input.document.id,
      documentType: input.document.documentType,
      accessClassification: input.document.accessClassification,
      status: input.document.status,
    },
    semenOrderId: input.document.semenOrderId,
    shipmentId: input.document.shipmentId,
    orderNumber: input.document.orderNumber,
    breederOrganizationId: input.document.breederOrganizationId,
    breedingStationOrganizationId: input.document.breedingStationOrganizationId,
    lifecycleStage: "DOCUMENTATION",
    actor: {
      userId: input.document.uploadedByUserId,
      roleCode: input.document.uploaderRoleCode,
      organizationId: input.document.uploaderOrganizationId,
    },
    documentationRefs: [
      {
        documentId: input.document.id,
        documentType: input.document.documentType,
        targetType: input.document.targetType,
        targetId: input.document.targetId,
        accessClassification: input.document.accessClassification,
        status: input.document.status,
      },
    ],
    auditLogId: input.auditLog?.id ?? null,
    auditHookRef: {
      eventType: input.auditHook?.eventType ?? "DOCUMENT_ACCESS",
      action: input.auditHook?.action ?? "DOCUMENT_UPLOADED",
      targetType: input.auditHook?.targetType ?? "Document",
      targetId: input.auditHook?.targetId ?? input.document.id,
      occurredAt: input.auditHook?.occurredAt ?? input.document.createdAt,
    },
    occurredAt: input.document.createdAt,
    createdAt: input.document.createdAt,
  });

  const proofEvent = await input.repository.createProofEvent(proofInput.proofEvent);
  const proofAuditHook = buildProofEventCreationAuditHook({ proofEvent });
  const proofAuditLog = await createAuditLogFromHook({
    repository: input.repository,
    auditHook: proofAuditHook,
    requestContext: input.auditContext,
  });

  const preparedAttachment = prepareCreateEvidenceAttachment({
    actor: input.actor,
    document: input.document,
    proofEvent,
    attachedAt: input.document.createdAt,
  });
  const evidenceAttachment = await input.repository.createEvidenceAttachment(
    preparedAttachment.evidenceAttachment,
  );
  const evidenceAttachmentAuditHook = buildEvidenceAttachmentAuditHook({
    evidenceAttachment,
    document: input.document,
    proofEvent,
    actorRole: {
      userId: evidenceAttachment.attachedByUserId,
      roleCode: evidenceAttachment.actorRoleCode,
      organizationId: evidenceAttachment.actorOrganizationId,
      revokedAt: null,
    },
  });
  const evidenceAttachmentAuditLog = await createAuditLogFromHook({
    repository: input.repository,
    auditHook: evidenceAttachmentAuditHook,
    requestContext: input.auditContext,
  });

  return Object.freeze({
    proofEvent,
    evidenceAttachment,
    proofAuditLog,
    evidenceAttachmentAuditLog,
  });
}

/**
 * @param {ReturnType<typeof normalizeUploadDocumentFileInput>} input
 * @param {string} occurredAt
 * @returns {Promise<Readonly<import("./document-storage.d.ts").DocumentMalwareScanResult>>}
 */
async function runMalwareScan(input, occurredAt) {
  if (input.malwareScanner && typeof input.malwareScanner.scan === "function") {
    return normalizeMalwareScanResult(
      await input.malwareScanner.scan({
        body: input.body,
        originalFileName: input.originalFileName,
        contentType: input.contentType,
        fileSizeBytes: input.fileSizeBytes,
      }),
      occurredAt,
    );
  }

  return Object.freeze({
    status: "NOT_SCANNED_PLACEHOLDER",
    provider: "PHASE_1_PLACEHOLDER",
    checkedAt: occurredAt,
    reference: null,
    details: "Malware scanning provider is a Phase 1 placeholder; no clean-file claim is made.",
  });
}

/**
 * @param {unknown} result
 * @param {string} fallbackCheckedAt
 * @returns {Readonly<import("./document-storage.d.ts").DocumentMalwareScanResult>}
 */
function normalizeMalwareScanResult(result, fallbackCheckedAt) {
  if (!result || typeof result !== "object") {
    throw new DocumentStorageValidationError([
      "malware scanner must return a scan result.",
    ]);
  }

  const scan = /** @type {Partial<import("./document-storage.d.ts").DocumentMalwareScanResult>} */ (
    result
  );

  if (!["NOT_SCANNED_PLACEHOLDER", "CLEAN", "BLOCKED"].includes(scan.status ?? "")) {
    throw new DocumentStorageValidationError([
      "malware scan status must be NOT_SCANNED_PLACEHOLDER, CLEAN or BLOCKED.",
    ]);
  }

  return Object.freeze({
    status:
      /** @type {import("./document-storage.d.ts").DocumentMalwareScanStatus} */ (
        scan.status
      ),
    provider: normalizeRequiredString(scan.provider) || "UNKNOWN",
    checkedAt: normalizeOptionalString(scan.checkedAt) ?? fallbackCheckedAt,
    reference: normalizeOptionalString(scan.reference),
    details: normalizeOptionalString(scan.details),
  });
}

/**
 * @param {{
 *   targetType: string,
 *   targetId: string,
 *   originalFileName: string,
 *   occurredAt: string,
 * }} input
 * @returns {string}
 */
function buildDocumentObjectKey(input) {
  const timestamp = input.occurredAt.replace(/[^0-9TZ]/g, "").replace(/Z$/, "Z");
  const safeFileName = normalizeFileName(input.originalFileName);

  return [
    "documents",
    input.targetType,
    input.targetId,
    `${timestamp}-${randomUUID()}-${safeFileName}`,
  ].join("/");
}

/**
 * @param {import("./document-evidence.d.ts").Document} document
 * @param {import("../storage/object-storage.d.ts").ObjectStorageProvider} storageProvider
 * @returns {void}
 */
function validateDocumentMatchesStorageProvider(document, storageProvider) {
  const issues = [];

  if (document.storageProvider !== storageProvider.config.provider) {
    issues.push("document storage provider does not match the configured provider.");
  }

  if (document.storageBucket !== storageProvider.config.bucket) {
    issues.push("document storage bucket does not match the configured bucket.");
  }

  if (issues.length > 0) {
    throw new DocumentStorageValidationError(issues);
  }
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizePositiveInteger(value) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = normalizeRequiredString(value);
  const parsed = Number.parseInt(normalized, 10);

  return String(parsed) === normalized ? parsed : NaN;
}

/**
 * @param {string | Date} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {Date}
 */
function normalizeDate(value, fieldName, issues) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    issues.push(`${fieldName} must be a valid timestamp.`);
  }

  return date;
}

/**
 * @param {Date | string} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new DocumentStorageValidationError(["timestamp must be valid."]);
  }

  return date.toISOString();
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeContentType(value) {
  return normalizeRequiredString(value).split(";")[0].toLowerCase();
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeFileName(value) {
  const normalized = normalizeRequiredString(value)
    .replace(/[/\\]/g, "-")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");

  return normalized || "document";
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredObject(value, fieldName, issues) {
  if (!value || typeof value !== "object") {
    issues.push(`${fieldName} is required.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredNonBlankString(value, fieldName, issues) {
  if (!normalizeRequiredString(value)) {
    issues.push(`${fieldName} is required.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value !== undefined && value !== null && !normalizeRequiredString(value)) {
    issues.push(`${fieldName} must not be blank when provided.`);
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  const normalized = normalizeRequiredString(value);
  return normalized || null;
}

/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      if (child && typeof child === "object") {
        deepFreeze(child);
      }
    }

    Object.freeze(value);
  }

  return /** @type {Readonly<T>} */ (value);
}
