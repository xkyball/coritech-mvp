// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";

export const DOCUMENT_ACCESS_CLASSIFICATIONS = /** @type {const} */ ([
  "INTERNAL",
  "ORDER_PARTICIPANTS",
  "RESTRICTED",
  "BUYER_VIEW_ELIGIBLE",
  "ADMIN_ONLY",
]);

export const DOCUMENT_LINK_TARGET_TYPES = /** @type {const} */ ([
  "SemenOrder",
  "Shipment",
  "ProofEvent",
]);

export const DOCUMENT_AUDIT_ACTIONS = /** @type {const} */ ([
  "DOCUMENT_UPLOADED",
  "DOCUMENT_VIEWED",
  "EVIDENCE_ATTACHMENT_CREATED",
]);

export const DOCUMENT_EVIDENCE_ROUTES = Object.freeze([
  Object.freeze({
    method: "POST",
    path: "/documents",
    handler: "createDocumentEndpoint",
    access: "BREEDER, assigned BREEDING_STATION, or PLATFORM_ADMIN according to linked target and classification",
  }),
  Object.freeze({
    method: "GET",
    path: "/documents/:documentId",
    handler: "getDocumentEndpoint",
    access: "classification-aware participant or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-orders/:orderId/documents",
    handler: "listOrderDocumentsEndpoint",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or PLATFORM_ADMIN; filtered by classification",
  }),
  Object.freeze({
    method: "GET",
    path: "/shipments/:shipmentId/documents",
    handler: "listShipmentDocumentsEndpoint",
    access: "BREEDER-owned order shipment, assigned BREEDING_STATION shipment, or PLATFORM_ADMIN; filtered by classification",
  }),
  Object.freeze({
    method: "POST",
    path: "/proof-events/:proofEventId/evidence-attachments",
    handler: "createEvidenceAttachmentEndpoint",
    access: "classification-aware document viewer and proof-event participant or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/proof-events/:proofEventId/evidence-attachments",
    handler: "listEvidenceAttachmentsForProofEventEndpoint",
    access: "proof-event participant or PLATFORM_ADMIN",
  }),
]);

const UNSUPPORTED_FILE_PAYLOAD_FIELDS = Object.freeze([
  "localFilePath",
  "filesystemPath",
  "filePath",
  "rawFile",
  "rawFileContent",
  "fileBytes",
]);

export class DocumentEvidenceValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech document evidence input:\n- ${issues.join("\n- ")}`);
    this.name = "DocumentEvidenceValidationError";
    this.issues = issues;
  }
}

export class DocumentEvidenceAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "DocumentEvidenceAuthorizationError";
  }
}

export class DocumentEvidenceNotFoundError extends Error {
  /**
   * @param {string} entityName
   * @param {string} entityId
   */
  constructor(entityName, entityId) {
    super(`${entityName} was not found: ${entityId}`);
    this.name = "DocumentEvidenceNotFoundError";
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./document-evidence.d.ts").DocumentAccessClassification}
 */
export function isDocumentAccessClassification(value) {
  return typeof value === "string" && DOCUMENT_ACCESS_CLASSIFICATIONS.includes(
    /** @type {import("./document-evidence.d.ts").DocumentAccessClassification} */ (
      value
    ),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./document-evidence.d.ts").DocumentLinkTargetType}
 */
export function isDocumentLinkTargetType(value) {
  return typeof value === "string" && DOCUMENT_LINK_TARGET_TYPES.includes(
    /** @type {import("./document-evidence.d.ts").DocumentLinkTargetType} */ (
      value
    ),
  );
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("./document-evidence.d.ts").DocumentLinkTargetLike} target
 * @param {import("./document-evidence.d.ts").DocumentAccessClassification | string} accessClassification
 * @returns {boolean}
 */
export function canUploadDocument(actor, target, accessClassification) {
  if (!isDocumentAccessClassification(accessClassification)) {
    return false;
  }

  const normalizedTarget = normalizeDocumentLinkTarget(target);

  if (!normalizedTarget) {
    return false;
  }

  return Boolean(
    findCreateDocumentActorRole(actor, normalizedTarget, accessClassification),
  );
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("./document-evidence.d.ts").DocumentLike} document
 * @returns {boolean}
 */
export function canViewDocument(actor, document) {
  return Boolean(findViewDocumentActorRole(actor, document));
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("./document-evidence.d.ts").DocumentLike} document
 * @param {import("./document-evidence.d.ts").ProofEventLinkTargetLike} proofEvent
 * @returns {boolean}
 */
export function canAttachEvidenceToProofEvent(actor, document, proofEvent) {
  return Boolean(findEvidenceAttachmentActorRole(actor, document, proofEvent));
}

/**
 * @param {import("./document-evidence.d.ts").CreateDocumentInput} input
 * @returns {string[]}
 */
export function validateCreateDocumentInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const accessClassification = normalizeRequiredString(input.accessClassification);
  const target = normalizeDocumentLinkTarget(input.linkTarget);

  issues.push(...actorIssues);

  for (const fieldName of UNSUPPORTED_FILE_PAYLOAD_FIELDS) {
    if (hasOwn(input, fieldName) && /** @type {Record<string, unknown>} */ (input)[fieldName] != null) {
      issues.push(
        `${fieldName} is not supported; production documents must use object-storage references only.`,
      );
    }
  }

  if (!target) {
    validateDocumentLinkTarget(input.linkTarget, issues);
  }

  validateRequiredNonBlankString(input.documentType, "documentType", issues);
  validateRequiredNonBlankString(input.originalFileName, "originalFileName", issues);
  validateRequiredNonBlankString(input.contentType, "contentType", issues);
  validateFileSize(input.fileSizeBytes, issues);
  validateOptionalChecksum(input.checksumSha256, issues);
  validateObjectStorageReference(input, issues);

  if (!accessClassification) {
    issues.push("accessClassification is required.");
  } else if (!isDocumentAccessClassification(accessClassification)) {
    issues.push(
      `accessClassification must be one of: ${DOCUMENT_ACCESS_CLASSIFICATIONS.join(", ")}.`,
    );
  }

  validateOptionalNonBlankString(input.documentId, "documentId", issues);
  validateOptionalNonBlankString(input.storageRegion, "storageRegion", issues);
  validateOptionalNonBlankString(input.storageVersionId, "storageVersionId", issues);
  validateOptionalNonBlankString(input.description, "description", issues);
  validateOptionalTimestamp(input.uploadedAt, "uploadedAt", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (
    actorIssues.length === 0 &&
    target &&
    isDocumentAccessClassification(accessClassification) &&
    !findCreateDocumentActorRole(input.actor, target, accessClassification)
  ) {
    issues.push(
      "actor is not authorized to upload this document for the linked target and access classification.",
    );
  }

  return issues;
}

/**
 * @param {import("./document-evidence.d.ts").CreateDocumentInput} input
 * @returns {import("./document-evidence.d.ts").PreparedDocumentChange}
 */
export function prepareCreateDocument(input) {
  const issues = validateCreateDocumentInput(input);

  if (issues.length > 0) {
    throw new DocumentEvidenceValidationError(issues);
  }

  const target = normalizeDocumentLinkTarget(input.linkTarget);
  const accessClassification =
    /** @type {import("./document-evidence.d.ts").DocumentAccessClassification} */ (
      input.accessClassification.trim()
    );
  const actorRole = findCreateDocumentActorRole(
    input.actor,
    /** @type {import("./document-evidence.d.ts").NormalizedDocumentLinkTarget} */ (
      target
    ),
    accessClassification,
  );

  if (!actorRole) {
    throw new DocumentEvidenceAuthorizationError(
      "actor must be authorized before uploading a document.",
    );
  }

  const occurredAt = toIsoTimestamp(
    input.uploadedAt ?? input.createdAt ?? input.now ?? new Date(),
  );
  const document = Object.freeze({
    id: normalizeOptionalString(input.documentId),
    documentType: normalizeRequiredString(input.documentType),
    description: normalizeOptionalString(input.description),
    targetType: target.targetType,
    targetId: target.targetId,
    semenOrderId: target.semenOrderId,
    shipmentId: target.shipmentId,
    proofEventId: target.proofEventId,
    orderNumber: target.orderNumber,
    breederOrganizationId: target.breederOrganizationId,
    breedingStationOrganizationId: target.breedingStationOrganizationId,
    originalFileName: normalizeRequiredString(input.originalFileName),
    contentType: normalizeRequiredString(input.contentType),
    fileSizeBytes: Number(input.fileSizeBytes),
    checksumSha256: normalizeChecksum(input.checksumSha256),
    storageProvider: normalizeRequiredString(input.storageProvider),
    storageBucket: normalizeRequiredString(input.storageBucket),
    storageObjectKey: normalizeRequiredString(input.storageObjectKey),
    storageRegion: normalizeOptionalString(input.storageRegion),
    storageVersionId: normalizeOptionalString(input.storageVersionId),
    accessClassification,
    uploadedByUserId: input.actor.userId.trim(),
    uploaderRoleCode:
      /** @type {import("./document-evidence.d.ts").DocumentActorRoleCode} */ (
        actorRole.roleCode
      ),
    uploaderOrganizationId: actorRole.organizationId,
    createdAt: occurredAt,
    updatedAt: occurredAt,
  });
  const auditHook = buildDocumentUploadAuditHook({
    document,
    actorRole,
    occurredAt,
  });

  return Object.freeze({
    document,
    auditHook,
  });
}

/**
 * @param {import("./document-evidence.d.ts").CreateEvidenceAttachmentInput} input
 * @returns {string[]}
 */
export function validateCreateEvidenceAttachmentInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);

  issues.push(...actorIssues);
  validateDocumentForEvidenceAttachment(input.document, issues);
  validateProofEventForEvidenceAttachment(input.proofEvent, issues);
  validateOptionalNonBlankString(input.attachmentId, "attachmentId", issues);
  validateOptionalTimestamp(input.attachedAt, "attachedAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (
    actorIssues.length === 0 &&
    input.document &&
    input.proofEvent &&
    !findEvidenceAttachmentActorRole(input.actor, input.document, input.proofEvent)
  ) {
    issues.push(
      "actor must be able to view the document and participate in the proof event before attaching evidence.",
    );
  }

  return issues;
}

/**
 * @param {import("./document-evidence.d.ts").CreateEvidenceAttachmentInput} input
 * @returns {import("./document-evidence.d.ts").PreparedEvidenceAttachmentChange}
 */
export function prepareCreateEvidenceAttachment(input) {
  const issues = validateCreateEvidenceAttachmentInput(input);

  if (issues.length > 0) {
    throw new DocumentEvidenceValidationError(issues);
  }

  const actorRole = findEvidenceAttachmentActorRole(
    input.actor,
    input.document,
    input.proofEvent,
  );

  if (!actorRole) {
    throw new DocumentEvidenceAuthorizationError(
      "actor must be authorized before attaching evidence to a proof event.",
    );
  }

  const attachedAt = toIsoTimestamp(input.attachedAt ?? input.now ?? new Date());
  const evidenceAttachment = Object.freeze({
    id: normalizeOptionalString(input.attachmentId),
    proofEventId: normalizeRequiredString(input.proofEvent.id),
    documentId: normalizeRequiredString(input.document.id),
    documentTargetType: input.document.targetType,
    documentTargetId: input.document.targetId,
    attachedByUserId: input.actor.userId.trim(),
    actorRoleCode:
      /** @type {import("./document-evidence.d.ts").DocumentActorRoleCode} */ (
        actorRole.roleCode
      ),
    actorOrganizationId: actorRole.organizationId,
    attachedAt,
  });
  const auditHook = buildEvidenceAttachmentAuditHook({
    evidenceAttachment,
    document: input.document,
    proofEvent: input.proofEvent,
    actorRole,
  });

  return Object.freeze({
    evidenceAttachment,
    auditHook,
  });
}

/**
 * @param {import("./document-evidence.d.ts").DocumentUploadAuditHookInput} input
 * @returns {import("./document-evidence.d.ts").DocumentAuditHook}
 */
export function buildDocumentUploadAuditHook(input) {
  return Object.freeze({
    eventType: "DOCUMENT_ACCESS",
    action: "DOCUMENT_UPLOADED",
    actorUserId: input.document.uploadedByUserId,
    actorRoleCode: input.document.uploaderRoleCode,
    actorOrganizationId: input.document.uploaderOrganizationId,
    targetType: "Document",
    targetId: input.document.id,
    targetRef: documentTargetRef(input.document),
    documentRef: documentAuditValue(input.document),
    reason: input.document.description,
    occurredAt: input.occurredAt,
  });
}

/**
 * @param {import("./document-evidence.d.ts").DocumentViewAuditHookInput} input
 * @returns {import("./document-evidence.d.ts").DocumentAuditHook}
 */
export function buildDocumentViewAuditHook(input) {
  return Object.freeze({
    eventType: "DOCUMENT_ACCESS",
    action: "DOCUMENT_VIEWED",
    actorUserId: input.actor.userId.trim(),
    actorRoleCode:
      /** @type {import("./document-evidence.d.ts").DocumentActorRoleCode} */ (
        input.actorRole.roleCode
      ),
    actorOrganizationId: input.actorRole.organizationId,
    targetType: "Document",
    targetId: input.document.id,
    targetRef: documentTargetRef(input.document),
    documentRef: documentAuditValue(input.document),
    reason: null,
    occurredAt: input.occurredAt,
  });
}

/**
 * @param {import("./document-evidence.d.ts").EvidenceAttachmentAuditHookInput} input
 * @returns {import("./document-evidence.d.ts").EvidenceAttachmentAuditHook}
 */
export function buildEvidenceAttachmentAuditHook(input) {
  return Object.freeze({
    eventType: "DOCUMENT_ACCESS",
    action: "EVIDENCE_ATTACHMENT_CREATED",
    actorUserId: input.evidenceAttachment.attachedByUserId,
    actorRoleCode: input.evidenceAttachment.actorRoleCode,
    actorOrganizationId: input.evidenceAttachment.actorOrganizationId,
    targetType: "ProofEvent",
    targetId: input.evidenceAttachment.proofEventId,
    targetRef: Object.freeze({
      proofEventId: input.evidenceAttachment.proofEventId,
      documentId: input.evidenceAttachment.documentId,
      documentTargetType: input.evidenceAttachment.documentTargetType,
      documentTargetId: input.evidenceAttachment.documentTargetId,
    }),
    evidenceAttachmentId: input.evidenceAttachment.id,
    documentRef: documentAuditValue(input.document),
    reason: null,
    occurredAt: input.evidenceAttachment.attachedAt,
  });
}

/**
 * @param {import("./document-evidence.d.ts").EndpointRequest<import("./document-evidence.d.ts").CreateDocumentInputBody>} request
 * @returns {Promise<import("./document-evidence.d.ts").EndpointResponse<{ document: import("./document-evidence.d.ts").Document }, import("./document-evidence.d.ts").DocumentAuditHook>>}
 */
export async function createDocumentEndpoint(request) {
  const createDocument = requireRepositoryMethod(request.repository, "createDocument");
  const targetType = requireBodyField(request.body, "targetType");
  const targetId = requireBodyField(request.body, "targetId");
  const linkTarget = await loadDocumentLinkTarget(
    request.repository,
    targetType,
    targetId,
  );
  const prepared = prepareCreateDocument({
    ...request.body,
    linkTarget,
    actor: request.actor,
  });
  const document = await createDocument(prepared.document);
  const actorRole = findViewDocumentActorRole(request.actor, document);

  if (!actorRole) {
    throw new DocumentEvidenceAuthorizationError(
      "actor must retain access to the persisted document after upload.",
    );
  }

  const refreshedAuditHook = buildDocumentUploadAuditHook({
    document,
    actorRole,
    occurredAt: document.createdAt,
  });

  const auditLog = await createAuditLogFromHook({
    repository: request.repository,
    auditHook: refreshedAuditHook,
    requestContext: request.auditContext,
  });

  return Object.freeze({
    status: 201,
    body: Object.freeze({ document }),
    auditHook: refreshedAuditHook,
    auditLog,
  });
}

/**
 * @param {import("./document-evidence.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./document-evidence.d.ts").EndpointResponse<{ document: import("./document-evidence.d.ts").Document }, import("./document-evidence.d.ts").DocumentAuditHook>>}
 */
export async function getDocumentEndpoint(request) {
  const findDocumentById = requireRepositoryMethod(
    request.repository,
    "findDocumentById",
  );
  const documentId = requireParam(request.params, "documentId");
  const document = await findRequiredEntity(
    () => findDocumentById(documentId),
    "Document",
    documentId,
  );
  const actorRole = findViewDocumentActorRole(request.actor, document);

  if (!actorRole) {
    throw new DocumentEvidenceAuthorizationError(
      "actor may only view documents allowed by the document access classification.",
    );
  }

  const auditHook = buildDocumentViewAuditHook({
    actor: request.actor,
    actorRole,
    document,
    occurredAt: toIsoTimestamp(new Date()),
  });
  const auditLog = await createAuditLogFromHook({
    repository: request.repository,
    auditHook,
    requestContext: request.auditContext,
  });

  return Object.freeze({
    status: 200,
    body: Object.freeze({ document }),
    auditHook,
    auditLog,
  });
}

/**
 * @param {import("./document-evidence.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./document-evidence.d.ts").EndpointResponse<{ documents: import("./document-evidence.d.ts").Document[] }>>}
 */
export async function listOrderDocumentsEndpoint(request) {
  const findSemenOrderById = requireRepositoryMethod(
    request.repository,
    "findSemenOrderById",
  );
  const listDocumentsForOrder = requireRepositoryMethod(
    request.repository,
    "listDocumentsForOrder",
  );
  const orderId = requireParam(request.params, "orderId");
  const order = await findRequiredEntity(
    () => findSemenOrderById(orderId),
    "SemenOrder",
    orderId,
  );
  const target = normalizeDocumentLinkTarget({
    ...order,
    targetType: "SemenOrder",
    targetId: order.id,
  });

  if (!target || !findTargetParticipantRole(request.actor, target)) {
    throw new DocumentEvidenceAuthorizationError(
      "actor may only list documents for visible semen orders.",
    );
  }

  const documents = await listDocumentsForOrder(orderId);

  return Object.freeze({
    status: 200,
    body: Object.freeze({
      documents: documents.filter((document) => canViewDocument(request.actor, document)),
    }),
  });
}

/**
 * @param {import("./document-evidence.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./document-evidence.d.ts").EndpointResponse<{ documents: import("./document-evidence.d.ts").Document[] }>>}
 */
export async function listShipmentDocumentsEndpoint(request) {
  const findShipmentById = requireRepositoryMethod(
    request.repository,
    "findShipmentById",
  );
  const listDocumentsForShipment = requireRepositoryMethod(
    request.repository,
    "listDocumentsForShipment",
  );
  const shipmentId = requireParam(request.params, "shipmentId");
  const shipment = await findRequiredEntity(
    () => findShipmentById(shipmentId),
    "Shipment",
    shipmentId,
  );
  const target = normalizeDocumentLinkTarget({
    ...shipment,
    targetType: "Shipment",
    targetId: shipment.id,
  });

  if (!target || !findTargetParticipantRole(request.actor, target)) {
    throw new DocumentEvidenceAuthorizationError(
      "actor may only list documents for visible shipments.",
    );
  }

  const documents = await listDocumentsForShipment(shipmentId);

  return Object.freeze({
    status: 200,
    body: Object.freeze({
      documents: documents.filter((document) => canViewDocument(request.actor, document)),
    }),
  });
}

/**
 * @param {import("./document-evidence.d.ts").EndpointRequest<import("./document-evidence.d.ts").CreateEvidenceAttachmentInputBody>} request
 * @returns {Promise<import("./document-evidence.d.ts").EndpointResponse<{ evidenceAttachment: import("./document-evidence.d.ts").EvidenceAttachment }, import("./document-evidence.d.ts").EvidenceAttachmentAuditHook>>}
 */
export async function createEvidenceAttachmentEndpoint(request) {
  const findDocumentById = requireRepositoryMethod(
    request.repository,
    "findDocumentById",
  );
  const findProofEventById = requireRepositoryMethod(
    request.repository,
    "findProofEventById",
  );
  const createEvidenceAttachment = requireRepositoryMethod(
    request.repository,
    "createEvidenceAttachment",
  );
  const proofEventId = requireParam(request.params, "proofEventId");
  const documentId = requireBodyField(request.body, "documentId");
  const document = await findRequiredEntity(
    () => findDocumentById(documentId),
    "Document",
    documentId,
  );
  const proofEvent = await findRequiredEntity(
    () => findProofEventById(proofEventId),
    "ProofEvent",
    proofEventId,
  );
  const prepared = prepareCreateEvidenceAttachment({
    attachmentId: request.body.attachmentId,
    document,
    proofEvent,
    actor: request.actor,
    attachedAt: request.body.attachedAt,
    now: request.body.now,
  });
  const evidenceAttachment = await createEvidenceAttachment(
    prepared.evidenceAttachment,
  );
  const refreshedAuditHook = buildEvidenceAttachmentAuditHook({
    evidenceAttachment,
    document,
    proofEvent,
    actorRole:
      /** @type {import("../identity/role-model.d.ts").UserOrganizationRoleLike} */ ({
        userId: evidenceAttachment.attachedByUserId,
        roleCode: evidenceAttachment.actorRoleCode,
        organizationId: evidenceAttachment.actorOrganizationId,
        revokedAt: null,
      }),
  });

  const auditLog = await createAuditLogFromHook({
    repository: request.repository,
    auditHook: refreshedAuditHook,
    requestContext: request.auditContext,
  });

  return Object.freeze({
    status: 201,
    body: Object.freeze({ evidenceAttachment }),
    auditHook: refreshedAuditHook,
    auditLog,
  });
}

/**
 * @param {import("./document-evidence.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./document-evidence.d.ts").EndpointResponse<{ evidenceAttachments: import("./document-evidence.d.ts").EvidenceAttachment[] }>>}
 */
export async function listEvidenceAttachmentsForProofEventEndpoint(request) {
  const findProofEventById = requireRepositoryMethod(
    request.repository,
    "findProofEventById",
  );
  const listEvidenceAttachmentsForProofEvent = requireRepositoryMethod(
    request.repository,
    "listEvidenceAttachmentsForProofEvent",
  );
  const proofEventId = requireParam(request.params, "proofEventId");
  const proofEvent = await findRequiredEntity(
    () => findProofEventById(proofEventId),
    "ProofEvent",
    proofEventId,
  );

  if (!findTargetParticipantRole(request.actor, proofEvent)) {
    throw new DocumentEvidenceAuthorizationError(
      "actor may only list evidence attachments for visible proof events.",
    );
  }

  const evidenceAttachments = await listEvidenceAttachmentsForProofEvent(proofEventId);

  return Object.freeze({
    status: 200,
    body: Object.freeze({ evidenceAttachments }),
  });
}

/**
 * @param {unknown} repository
 * @param {string} targetType
 * @param {string} targetId
 * @returns {Promise<import("./document-evidence.d.ts").NormalizedDocumentLinkTarget>}
 */
async function loadDocumentLinkTarget(repository, targetType, targetId) {
  if (!isDocumentLinkTargetType(targetType)) {
    throw new DocumentEvidenceValidationError([
      `targetType must be one of: ${DOCUMENT_LINK_TARGET_TYPES.join(", ")}.`,
    ]);
  }

  if (targetType === "SemenOrder") {
    const findSemenOrderById = requireRepositoryMethod(repository, "findSemenOrderById");
    const order = await findRequiredEntity(
      () => findSemenOrderById(targetId),
      "SemenOrder",
      targetId,
    );
    const target = normalizeDocumentLinkTarget({
      ...order,
      targetType,
      targetId: order.id,
    });

    return /** @type {import("./document-evidence.d.ts").NormalizedDocumentLinkTarget} */ (
      target
    );
  }

  if (targetType === "Shipment") {
    const findShipmentById = requireRepositoryMethod(repository, "findShipmentById");
    const shipment = await findRequiredEntity(
      () => findShipmentById(targetId),
      "Shipment",
      targetId,
    );
    const target = normalizeDocumentLinkTarget({
      ...shipment,
      targetType,
      targetId: shipment.id,
    });

    return /** @type {import("./document-evidence.d.ts").NormalizedDocumentLinkTarget} */ (
      target
    );
  }

  const findProofEventById = requireRepositoryMethod(repository, "findProofEventById");
  const proofEvent = await findRequiredEntity(
    () => findProofEventById(targetId),
    "ProofEvent",
    targetId,
  );
  const target = normalizeDocumentLinkTarget({
    ...proofEvent,
    targetType,
    targetId: proofEvent.id,
  });

  return /** @type {import("./document-evidence.d.ts").NormalizedDocumentLinkTarget} */ (
    target
  );
}

/**
 * @param {unknown} value
 * @returns {import("./document-evidence.d.ts").NormalizedDocumentLinkTarget | null}
 */
function normalizeDocumentLinkTarget(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const target = /** @type {Partial<import("./document-evidence.d.ts").DocumentLinkTargetLike>} */ (
    value
  );
  const targetType = normalizeRequiredString(target.targetType);

  if (!isDocumentLinkTargetType(targetType)) {
    return null;
  }

  if (targetType === "SemenOrder") {
    const targetId = normalizeRequiredString(target.targetId ?? target.id);

    if (
      !targetId ||
      !normalizeRequiredString(target.orderNumber) ||
      !normalizeRequiredString(target.breederOrganizationId) ||
      !normalizeRequiredString(target.breedingStationOrganizationId)
    ) {
      return null;
    }

    return Object.freeze({
      targetType,
      targetId,
      semenOrderId: targetId,
      shipmentId: null,
      proofEventId: null,
      orderNumber: normalizeRequiredString(target.orderNumber),
      breederOrganizationId: normalizeRequiredString(target.breederOrganizationId),
      breedingStationOrganizationId: normalizeRequiredString(
        target.breedingStationOrganizationId,
      ),
    });
  }

  if (targetType === "Shipment") {
    const targetId = normalizeRequiredString(target.targetId ?? target.id);
    const semenOrderId = normalizeRequiredString(target.semenOrderId);

    if (
      !targetId ||
      !semenOrderId ||
      !normalizeRequiredString(target.orderNumber) ||
      !normalizeRequiredString(target.breederOrganizationId) ||
      !normalizeRequiredString(target.breedingStationOrganizationId)
    ) {
      return null;
    }

    return Object.freeze({
      targetType,
      targetId,
      semenOrderId,
      shipmentId: targetId,
      proofEventId: null,
      orderNumber: normalizeRequiredString(target.orderNumber),
      breederOrganizationId: normalizeRequiredString(target.breederOrganizationId),
      breedingStationOrganizationId: normalizeRequiredString(
        target.breedingStationOrganizationId,
      ),
    });
  }

  const targetId = normalizeRequiredString(target.targetId ?? target.id);

  if (!targetId) {
    return null;
  }

  return Object.freeze({
    targetType,
    targetId,
    semenOrderId: normalizeOptionalString(target.semenOrderId),
    shipmentId: normalizeOptionalString(target.shipmentId),
    proofEventId: targetId,
    orderNumber: normalizeOptionalString(target.orderNumber),
    breederOrganizationId: normalizeOptionalString(target.breederOrganizationId),
    breedingStationOrganizationId: normalizeOptionalString(
      target.breedingStationOrganizationId,
    ),
  });
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateDocumentLinkTarget(value, issues) {
  if (!value || typeof value !== "object") {
    issues.push("linkTarget is required.");
    return;
  }

  const target = /** @type {Partial<import("./document-evidence.d.ts").DocumentLinkTargetLike>} */ (
    value
  );
  const targetType = normalizeRequiredString(target.targetType);

  if (!targetType) {
    issues.push("linkTarget.targetType is required.");
  } else if (!isDocumentLinkTargetType(targetType)) {
    issues.push(`linkTarget.targetType must be one of: ${DOCUMENT_LINK_TARGET_TYPES.join(", ")}.`);
  }

  if (!normalizeRequiredString(target.targetId ?? target.id)) {
    issues.push("linkTarget.targetId is required.");
  }

  if (targetType === "SemenOrder" || targetType === "Shipment") {
    if (!normalizeRequiredString(target.orderNumber)) {
      issues.push("linkTarget.orderNumber is required for order or shipment documents.");
    }

    if (!normalizeRequiredString(target.breederOrganizationId)) {
      issues.push(
        "linkTarget.breederOrganizationId is required for order or shipment documents.",
      );
    }

    if (!normalizeRequiredString(target.breedingStationOrganizationId)) {
      issues.push(
        "linkTarget.breedingStationOrganizationId is required for order or shipment documents.",
      );
    }
  }

  if (targetType === "Shipment" && !normalizeRequiredString(target.semenOrderId)) {
    issues.push("linkTarget.semenOrderId is required for shipment documents.");
  }
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("./document-evidence.d.ts").NormalizedDocumentLinkTarget} target
 * @param {import("./document-evidence.d.ts").DocumentAccessClassification} accessClassification
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findCreateDocumentActorRole(actor, target, accessClassification) {
  if (accessClassification === "ADMIN_ONLY") {
    return findActorRole(actor, "PLATFORM_ADMIN");
  }

  if (accessClassification === "INTERNAL") {
    return findScopedActorRole(
      actor,
      "BREEDING_STATION",
      target.breedingStationOrganizationId,
    ) ??
      findActorRole(actor, "PLATFORM_ADMIN");
  }

  return findTargetParticipantRole(actor, target);
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("./document-evidence.d.ts").DocumentLike | import("./document-evidence.d.ts").ProofEventLinkTargetLike} target
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findTargetParticipantRole(actor, target) {
  return findScopedActorRole(actor, "BREEDER", target.breederOrganizationId) ??
    findScopedActorRole(
      actor,
      "BREEDING_STATION",
      target.breedingStationOrganizationId,
    ) ??
    findActorRole(actor, "PLATFORM_ADMIN");
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("./document-evidence.d.ts").DocumentLike} document
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findViewDocumentActorRole(actor, document) {
  if (!isDocumentAccessClassification(document.accessClassification)) {
    return undefined;
  }

  if (document.accessClassification === "ADMIN_ONLY") {
    return findActorRole(actor, "PLATFORM_ADMIN");
  }

  if (document.accessClassification === "INTERNAL") {
    return findScopedActorRole(
      actor,
      "BREEDING_STATION",
      document.breedingStationOrganizationId,
    ) ?? findActorRole(actor, "PLATFORM_ADMIN");
  }

  if (document.accessClassification === "RESTRICTED") {
    return findScopedActorRole(actor, "BREEDER", document.uploaderOrganizationId) ??
      findScopedActorRole(actor, "BREEDING_STATION", document.uploaderOrganizationId) ??
      findActorRole(actor, "PLATFORM_ADMIN");
  }

  return findTargetParticipantRole(actor, document);
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("./document-evidence.d.ts").DocumentLike} document
 * @param {import("./document-evidence.d.ts").ProofEventLinkTargetLike} proofEvent
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findEvidenceAttachmentActorRole(actor, document, proofEvent) {
  if (!findViewDocumentActorRole(actor, document)) {
    return undefined;
  }

  return findTargetParticipantRole(actor, proofEvent);
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("../identity/role-model.d.ts").RoleCode} roleCode
 * @param {string | null | undefined} organizationId
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findScopedActorRole(actor, roleCode, organizationId) {
  if (!organizationId) {
    return undefined;
  }

  return findActorRole(actor, roleCode, organizationId);
}

/**
 * @param {import("./document-evidence.d.ts").DocumentActorContext} actor
 * @param {import("../identity/role-model.d.ts").RoleCode} roleCode
 * @param {string | null | undefined} [organizationId]
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findActorRole(actor, roleCode, organizationId) {
  if (!actor || !Array.isArray(actor.roles)) {
    return undefined;
  }

  return actor.roles.find((assignment) =>
    assignment.userId === actor.userId &&
    assignment.roleCode === roleCode &&
    isActiveRoleAssignment(assignment) &&
    (organizationId == null || assignment.organizationId === organizationId),
  );
}

/**
 * @param {import("./document-evidence.d.ts").DocumentLike} document
 * @returns {Readonly<import("./document-evidence.d.ts").DocumentAuditValue>}
 */
function documentAuditValue(document) {
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
  });
}

/**
 * @param {import("./document-evidence.d.ts").DocumentLike} document
 * @returns {Readonly<import("./document-evidence.d.ts").DocumentTargetRef>}
 */
function documentTargetRef(document) {
  return Object.freeze({
    targetType: document.targetType,
    targetId: document.targetId,
    semenOrderId: document.semenOrderId,
    shipmentId: document.shipmentId,
    proofEventId: document.proofEventId,
    orderNumber: document.orderNumber,
    breederOrganizationId: document.breederOrganizationId,
    breedingStationOrganizationId: document.breedingStationOrganizationId,
  });
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function validateActor(value) {
  const issues = [];

  if (!value || typeof value !== "object") {
    return ["actor is required."];
  }

  const actor = /** @type {Partial<import("./document-evidence.d.ts").DocumentActorContext>} */ (
    value
  );

  if (!normalizeRequiredString(actor.userId)) {
    issues.push("actor.userId is required.");
  }

  if (!Array.isArray(actor.roles)) {
    issues.push("actor.roles must list the actor's active role context.");
  }

  return issues;
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateDocumentForEvidenceAttachment(value, issues) {
  if (!value || typeof value !== "object") {
    issues.push("document is required.");
    return;
  }

  const document = /** @type {Partial<import("./document-evidence.d.ts").DocumentLike>} */ (
    value
  );

  if (!normalizeRequiredString(document.id)) {
    issues.push("document.id is required.");
  }

  if (!isDocumentLinkTargetType(document.targetType)) {
    issues.push(`document.targetType must be one of: ${DOCUMENT_LINK_TARGET_TYPES.join(", ")}.`);
  }

  if (!normalizeRequiredString(document.targetId)) {
    issues.push("document.targetId is required.");
  }

  if (!isDocumentAccessClassification(document.accessClassification)) {
    issues.push(
      `document.accessClassification must be one of: ${DOCUMENT_ACCESS_CLASSIFICATIONS.join(", ")}.`,
    );
  }
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateProofEventForEvidenceAttachment(value, issues) {
  if (!value || typeof value !== "object") {
    issues.push("proofEvent is required.");
    return;
  }

  const proofEvent = /** @type {Partial<import("./document-evidence.d.ts").ProofEventLinkTargetLike>} */ (
    value
  );

  if (!normalizeRequiredString(proofEvent.id)) {
    issues.push("proofEvent.id is required.");
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredNonBlankString(value, fieldName, issues) {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${fieldName} is required.`);
  }
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateFileSize(value, issues) {
  if (!Number.isInteger(value) || Number(value) <= 0) {
    issues.push("fileSizeBytes must be a positive integer.");
  }
}

/**
 * @param {import("./document-evidence.d.ts").CreateDocumentInput} input
 * @param {string[]} issues
 * @returns {void}
 */
function validateObjectStorageReference(input, issues) {
  validateRequiredNonBlankString(input.storageProvider, "storageProvider", issues);
  validateRequiredNonBlankString(input.storageBucket, "storageBucket", issues);
  validateRequiredNonBlankString(input.storageObjectKey, "storageObjectKey", issues);

  const storageProvider = normalizeRequiredString(input.storageProvider).toUpperCase();
  const storageObjectKey = normalizeRequiredString(input.storageObjectKey);

  if (["LOCAL", "LOCAL_FILESYSTEM", "FILESYSTEM"].includes(storageProvider)) {
    issues.push("storageProvider must reference an object-storage provider, not a local filesystem.");
  }

  if (/^(file:\/\/|\/|\.{1,2}\/|~)/.test(storageObjectKey)) {
    issues.push("storageObjectKey must be an object-storage key, not a local filesystem path.");
  }
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalChecksum(value, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string" || !/^[a-fA-F0-9]{64}$/.test(value.trim())) {
    issues.push("checksumSha256 must be a 64-character hex SHA-256 digest when provided.");
  }
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeChecksum(value) {
  const normalized = normalizeOptionalString(value);

  return normalized ? normalized.toLowerCase() : null;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${fieldName} cannot be blank when provided.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalTimestamp(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (!isValidTimestamp(value)) {
    issues.push(`${fieldName} must be a valid date or ISO timestamp.`);
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidTimestamp(value) {
  if (!(typeof value === "string" || value instanceof Date)) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
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
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}

/**
 * @param {object} value
 * @param {string} fieldName
 * @returns {boolean}
 */
function hasOwn(value, fieldName) {
  return Object.prototype.hasOwnProperty.call(value, fieldName);
}

/**
 * @param {unknown} repository
 * @param {string} methodName
 * @returns {Function}
 */
function requireRepositoryMethod(repository, methodName) {
  if (!repository || typeof repository !== "object") {
    throw new TypeError("repository is required.");
  }

  const method = /** @type {Record<string, unknown>} */ (repository)[methodName];

  if (typeof method !== "function") {
    throw new TypeError(`repository.${methodName} is required.`);
  }

  return method.bind(repository);
}

/**
 * @template T
 * @param {() => Promise<T | null | undefined>} lookup
 * @param {string} entityName
 * @param {string} entityId
 * @returns {Promise<T>}
 */
async function findRequiredEntity(lookup, entityName, entityId) {
  const entity = await lookup();

  if (!entity) {
    throw new DocumentEvidenceNotFoundError(entityName, entityId);
  }

  return entity;
}

/**
 * @param {Record<string, string | undefined> | undefined} params
 * @param {string} paramName
 * @returns {string}
 */
function requireParam(params, paramName) {
  const value = normalizeRequiredString(params?.[paramName]);

  if (!value) {
    throw new DocumentEvidenceValidationError([
      `${paramName} route parameter is required.`,
    ]);
  }

  return value;
}

/**
 * @param {Record<string, unknown>} body
 * @param {string} fieldName
 * @returns {string}
 */
function requireBodyField(body, fieldName) {
  const value = normalizeRequiredString(body?.[fieldName]);

  if (!value) {
    throw new DocumentEvidenceValidationError([`${fieldName} is required.`]);
  }

  return value;
}
