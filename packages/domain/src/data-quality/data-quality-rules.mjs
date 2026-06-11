// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import {
  isDocumentAccessClassification,
  isDocumentLinkTargetType,
  isDocumentStatus,
} from "../documents/document-evidence.mjs";
import {
  isAllowedSemenOrderStatusTransition,
  isSemenOrderStatus,
  validateSemenOrderSubmissionDetails,
} from "../orders/semen-order.mjs";
import {
  isProofEventSource,
  isProofEventStatus,
  isProofEventType,
  isActivePhase1VerificationLevel,
} from "../proof/proof-event.mjs";
import {
  isShipmentStatus,
} from "../shipments/shipment.mjs";

export const DATA_QUALITY_ENTITY_TYPES = /** @type {const} */ ([
  "SemenOrder",
  "Shipment",
  "Document",
  "ProofEvent",
]);

export const DATA_QUALITY_SEVERITIES = /** @type {const} */ ([
  "ERROR",
  "WARNING",
]);

export const DATA_QUALITY_RULES = Object.freeze([
  rule("ORDER_REQUIRED_FIELDS", "SemenOrder", "ERROR", "Orders require stable identifiers, organization context, status and timestamps."),
  rule("ORDER_SUBMISSION_FIELDS", "SemenOrder", "ERROR", "Submitted and later orders require operational order details."),
  rule("ORDER_STATUS_TRANSITION", "SemenOrder", "ERROR", "Order status transitions must follow the Phase 1 workflow."),
  rule("SHIPMENT_REQUIRED_FIELDS", "Shipment", "ERROR", "Shipments require linked order context, status, actor and timestamps."),
  rule("DOCUMENT_REQUIRED_FIELDS", "Document", "ERROR", "Documents require target, storage, classification and uploader context."),
  rule("PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", "ERROR", "Proof events require trigger, actor, verification, timestamp and audit context."),
]);

const RULE_BY_ID = new Map(DATA_QUALITY_RULES.map((item) => [item.id, item]));

/**
 * @param {import("./data-quality-rules.d.ts").SemenOrderDataQualityInput} order
 * @param {import("./data-quality-rules.d.ts").SemenOrderQualityOptions} [options]
 * @returns {import("./data-quality-rules.d.ts").DataQualityFinding[]}
 */
export function validateSemenOrderDataQuality(order, options = {}) {
  const findings = [];

  if (!isRecord(order)) {
    return [
      finding({
        ruleId: "ORDER_REQUIRED_FIELDS",
        entityType: "SemenOrder",
        field: "order",
        message: "order record is required.",
      }),
    ];
  }

  requireField(order.id, "id", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireField(order.orderNumber, "orderNumber", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireField(order.semenListingId, "semenListingId", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireField(order.breederOrganizationId, "breederOrganizationId", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireField(order.breedingStationOrganizationId, "breedingStationOrganizationId", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireField(order.createdByUserId, "createdByUserId", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireField(order.updatedByUserId, "updatedByUserId", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireTimestamp(order.createdAt, "createdAt", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);
  requireTimestamp(order.updatedAt, "updatedAt", "ORDER_REQUIRED_FIELDS", "SemenOrder", findings);

  if (!normalizeString(order.status)) {
    findings.push(finding({
      ruleId: "ORDER_REQUIRED_FIELDS",
      entityType: "SemenOrder",
      objectId: normalizeString(order.id),
      field: "status",
      message: "status is required.",
    }));
  } else if (!isSemenOrderStatus(order.status)) {
    findings.push(finding({
      ruleId: "ORDER_REQUIRED_FIELDS",
      entityType: "SemenOrder",
      objectId: normalizeString(order.id),
      field: "status",
      message: "status must be a valid semen order status.",
    }));
  }

  if (isSemenOrderStatus(order.status) && order.status !== "DRAFT") {
    for (const issue of validateSemenOrderSubmissionDetails(
      /** @type {import("../orders/semen-order.d.ts").SemenOrderLike} */ (order),
    )) {
      findings.push(finding({
        ruleId: "ORDER_SUBMISSION_FIELDS",
        entityType: "SemenOrder",
        objectId: normalizeString(order.id),
        field: fieldFromIssue(issue),
        message: issue,
      }));
    }
  }

  if (options.previousStatus != null) {
    findings.push(...validateSemenOrderStatusTransitionDataQuality({
      fromStatus: options.previousStatus,
      objectId: normalizeString(order.id),
      toStatus: order.status,
    }));
  }

  return findings;
}

/**
 * @param {import("./data-quality-rules.d.ts").SemenOrderStatusTransitionQualityInput} input
 * @returns {import("./data-quality-rules.d.ts").DataQualityFinding[]}
 */
export function validateSemenOrderStatusTransitionDataQuality(input) {
  const findings = [];
  const fromStatus = normalizeString(input?.fromStatus);
  const toStatus = normalizeString(input?.toStatus);

  if (!fromStatus) {
    findings.push(finding({
      ruleId: "ORDER_STATUS_TRANSITION",
      entityType: "SemenOrder",
      objectId: normalizeString(input?.objectId),
      field: "fromStatus",
      message: "fromStatus is required for order transition quality checks.",
    }));
  } else if (!isSemenOrderStatus(fromStatus)) {
    findings.push(finding({
      ruleId: "ORDER_STATUS_TRANSITION",
      entityType: "SemenOrder",
      objectId: normalizeString(input?.objectId),
      field: "fromStatus",
      message: "fromStatus must be a valid semen order status.",
    }));
  }

  if (!toStatus) {
    findings.push(finding({
      ruleId: "ORDER_STATUS_TRANSITION",
      entityType: "SemenOrder",
      objectId: normalizeString(input?.objectId),
      field: "toStatus",
      message: "toStatus is required for order transition quality checks.",
    }));
  } else if (!isSemenOrderStatus(toStatus)) {
    findings.push(finding({
      ruleId: "ORDER_STATUS_TRANSITION",
      entityType: "SemenOrder",
      objectId: normalizeString(input?.objectId),
      field: "toStatus",
      message: "toStatus must be a valid semen order status.",
    }));
  }

  if (
    isSemenOrderStatus(fromStatus) &&
    isSemenOrderStatus(toStatus) &&
    !isAllowedSemenOrderStatusTransition(fromStatus, toStatus)
  ) {
    findings.push(finding({
      ruleId: "ORDER_STATUS_TRANSITION",
      entityType: "SemenOrder",
      objectId: normalizeString(input?.objectId),
      field: "status",
      message: `cannot transition semen order from ${fromStatus} to ${toStatus}.`,
    }));
  }

  return findings;
}

/**
 * @param {import("./data-quality-rules.d.ts").ShipmentDataQualityInput} shipment
 * @returns {import("./data-quality-rules.d.ts").DataQualityFinding[]}
 */
export function validateShipmentDataQuality(shipment) {
  const findings = [];

  if (!isRecord(shipment)) {
    return [
      finding({
        ruleId: "SHIPMENT_REQUIRED_FIELDS",
        entityType: "Shipment",
        field: "shipment",
        message: "shipment record is required.",
      }),
    ];
  }

  requireField(shipment.id, "id", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireField(shipment.semenOrderId, "semenOrderId", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireField(shipment.orderNumber, "orderNumber", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireField(shipment.breederOrganizationId, "breederOrganizationId", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireField(shipment.breedingStationOrganizationId, "breedingStationOrganizationId", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireField(shipment.createdByUserId, "createdByUserId", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireField(shipment.updatedByUserId, "updatedByUserId", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireTimestamp(shipment.createdAt, "createdAt", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);
  requireTimestamp(shipment.updatedAt, "updatedAt", "SHIPMENT_REQUIRED_FIELDS", "Shipment", findings);

  if (!normalizeString(shipment.status)) {
    findings.push(finding({
      ruleId: "SHIPMENT_REQUIRED_FIELDS",
      entityType: "Shipment",
      objectId: normalizeString(shipment.id),
      field: "status",
      message: "status is required.",
    }));
  } else if (!isShipmentStatus(shipment.status)) {
    findings.push(finding({
      ruleId: "SHIPMENT_REQUIRED_FIELDS",
      entityType: "Shipment",
      objectId: normalizeString(shipment.id),
      field: "status",
      message: "status must be a valid shipment status.",
    }));
  }

  return findings;
}

/**
 * @param {import("./data-quality-rules.d.ts").DocumentDataQualityInput} document
 * @returns {import("./data-quality-rules.d.ts").DataQualityFinding[]}
 */
export function validateDocumentDataQuality(document) {
  const findings = [];

  if (!isRecord(document)) {
    return [
      finding({
        ruleId: "DOCUMENT_REQUIRED_FIELDS",
        entityType: "Document",
        field: "document",
        message: "document record is required.",
      }),
    ];
  }

  requireField(document.id, "id", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.documentType, "documentType", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.targetType, "targetType", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.targetId, "targetId", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.originalFileName, "originalFileName", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.contentType, "contentType", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.storageProvider, "storageProvider", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.storageBucket, "storageBucket", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.storageObjectKey, "storageObjectKey", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.uploadedByUserId, "uploadedByUserId", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.uploaderRoleCode, "uploaderRoleCode", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireField(document.uploaderOrganizationId, "uploaderOrganizationId", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireTimestamp(document.createdAt, "createdAt", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);
  requireTimestamp(document.updatedAt, "updatedAt", "DOCUMENT_REQUIRED_FIELDS", "Document", findings);

  if (!Number.isInteger(document.fileSizeBytes) || document.fileSizeBytes <= 0) {
    findings.push(finding({
      ruleId: "DOCUMENT_REQUIRED_FIELDS",
      entityType: "Document",
      objectId: normalizeString(document.id),
      field: "fileSizeBytes",
      message: "fileSizeBytes must be a positive integer.",
    }));
  }

  if (!isDocumentLinkTargetType(document.targetType)) {
    findings.push(finding({
      ruleId: "DOCUMENT_REQUIRED_FIELDS",
      entityType: "Document",
      objectId: normalizeString(document.id),
      field: "targetType",
      message: "targetType must be a valid document link target type.",
    }));
  }

  if (!isDocumentAccessClassification(document.accessClassification)) {
    findings.push(finding({
      ruleId: "DOCUMENT_REQUIRED_FIELDS",
      entityType: "Document",
      objectId: normalizeString(document.id),
      field: "accessClassification",
      message: "accessClassification must be a valid document access classification.",
    }));
  }

  if (!isDocumentStatus(document.status)) {
    findings.push(finding({
      ruleId: "DOCUMENT_REQUIRED_FIELDS",
      entityType: "Document",
      objectId: normalizeString(document.id),
      field: "status",
      message: "status must be a valid document status.",
    }));
  }

  return findings;
}

/**
 * @param {import("./data-quality-rules.d.ts").ProofEventDataQualityInput} proofEvent
 * @returns {import("./data-quality-rules.d.ts").DataQualityFinding[]}
 */
export function validateProofEventDataQuality(proofEvent) {
  const findings = [];

  if (!isRecord(proofEvent)) {
    return [
      finding({
        ruleId: "PROOF_EVENT_REQUIRED_FIELDS",
        entityType: "ProofEvent",
        field: "proofEvent",
        message: "proof event record is required.",
      }),
    ];
  }

  requireField(proofEvent.id, "id", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireField(proofEvent.triggerType, "triggerType", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireField(proofEvent.lifecycleStage, "lifecycleStage", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireField(proofEvent.actorUserId, "actorUserId", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireField(proofEvent.actorRoleCode, "actorRoleCode", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireField(proofEvent.actorOrganizationId, "actorOrganizationId", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireTimestamp(proofEvent.occurredAt, "occurredAt", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireTimestamp(proofEvent.createdAt, "createdAt", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireJsonObject(proofEvent.triggerRef, "triggerRef", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);
  requireJsonObject(proofEvent.auditHookRef, "auditHookRef", "PROOF_EVENT_REQUIRED_FIELDS", "ProofEvent", findings);

  if (!isProofEventType(proofEvent.eventType)) {
    findings.push(finding({
      ruleId: "PROOF_EVENT_REQUIRED_FIELDS",
      entityType: "ProofEvent",
      objectId: normalizeString(proofEvent.id),
      field: "eventType",
      message: "eventType must be a valid proof event type.",
    }));
  }

  if (!isProofEventSource(proofEvent.source)) {
    findings.push(finding({
      ruleId: "PROOF_EVENT_REQUIRED_FIELDS",
      entityType: "ProofEvent",
      objectId: normalizeString(proofEvent.id),
      field: "source",
      message: "source must be a valid proof event source.",
    }));
  }

  if (!isProofEventStatus(proofEvent.status)) {
    findings.push(finding({
      ruleId: "PROOF_EVENT_REQUIRED_FIELDS",
      entityType: "ProofEvent",
      objectId: normalizeString(proofEvent.id),
      field: "status",
      message: "status must be a valid proof event status.",
    }));
  }

  if (!isActivePhase1VerificationLevel(proofEvent.verificationLevel)) {
    findings.push(finding({
      ruleId: "PROOF_EVENT_REQUIRED_FIELDS",
      entityType: "ProofEvent",
      objectId: normalizeString(proofEvent.id),
      field: "verificationLevel",
      message: "verificationLevel must be an active Phase 1 verification level.",
    }));
  }

  return findings;
}

/**
 * @param {import("./data-quality-rules.d.ts").ValidateDataQualityRecordsInput} input
 * @returns {import("./data-quality-rules.d.ts").DataQualityReport}
 */
export function validateDataQualityRecords(input = {}) {
  const findings = [
    ...(input.orders ?? []).flatMap((order) => validateSemenOrderDataQuality(order)),
    ...(input.orderStatusTransitions ?? []).flatMap((transition) =>
      validateSemenOrderStatusTransitionDataQuality(transition)
    ),
    ...(input.shipments ?? []).flatMap((shipment) => validateShipmentDataQuality(shipment)),
    ...(input.documents ?? []).flatMap((document) => validateDocumentDataQuality(document)),
    ...(input.proofEvents ?? []).flatMap((proofEvent) => validateProofEventDataQuality(proofEvent)),
  ];

  return Object.freeze({
    checkedAt: toIsoTimestamp(input.checkedAt ?? new Date()),
    findingCount: findings.length,
    hasFailures: findings.some((item) => item.severity === "ERROR"),
    findings: Object.freeze(findings),
  });
}

/**
 * @param {import("./data-quality-rules.d.ts").BuildDataQualityFailureAuditHookInput} input
 * @returns {import("./data-quality-rules.d.ts").DataQualityFailureAuditHook}
 */
export function buildDataQualityFailureAuditHook(input) {
  const findings = [...(input.findings ?? [])];
  const occurredAt = toIsoTimestamp(input.occurredAt ?? new Date());
  const targetType = normalizeString(input.targetType) ?? "DataQualityReport";
  const targetId = normalizeString(input.targetId) ?? firstFindingObjectId(findings) ?? "data-quality-failure";

  return Object.freeze({
    eventType: "DATA_QUALITY",
    action: "DATA_QUALITY_VALIDATION_FAILED",
    actorUserId: requiredActorField(input.actor, "userId"),
    actorRoleCode: requiredActorField(input.actor, "roleCode"),
    actorOrganizationId: requiredActorField(input.actor, "organizationId"),
    targetType,
    targetId,
    targetRef: Object.freeze({
      ...(input.targetRef ?? {}),
      failureCount: findings.length,
    }),
    previousValue: null,
    newValue: Object.freeze({
      findingCount: findings.length,
      findings: Object.freeze(findings.map(summarizeFinding)),
    }),
    reason: `${findings.length} data quality finding${findings.length === 1 ? "" : "s"} recorded.`,
    occurredAt,
  });
}

/**
 * @param {import("./data-quality-rules.d.ts").RecordDataQualityFailuresInput} input
 * @returns {Promise<import("../audit/audit-log.d.ts").AuditLog | null>}
 */
export async function recordDataQualityFailures(input) {
  const findings = [...(input.findings ?? [])];

  if (findings.length === 0) {
    return null;
  }

  return createAuditLogFromHook({
    repository: input.repository,
    auditHook: buildDataQualityFailureAuditHook({
      actor: input.actor,
      findings,
      targetId: input.targetId,
      targetRef: input.targetRef,
      targetType: input.targetType,
      occurredAt: input.occurredAt ?? input.now,
    }),
    requestContext: input.auditContext,
    now: input.now,
  });
}

/**
 * @param {string} id
 * @returns {import("./data-quality-rules.d.ts").DataQualityRule | null}
 */
export function dataQualityRuleById(id) {
  return RULE_BY_ID.get(id) ?? null;
}

/**
 * @param {string} id
 * @param {import("./data-quality-rules.d.ts").DataQualityEntityType} entityType
 * @param {import("./data-quality-rules.d.ts").DataQualitySeverity} severity
 * @param {string} description
 * @returns {import("./data-quality-rules.d.ts").DataQualityRule}
 */
function rule(id, entityType, severity, description) {
  return Object.freeze({ id, entityType, severity, description });
}

/**
 * @param {object} input
 * @param {string} input.ruleId
 * @param {import("./data-quality-rules.d.ts").DataQualityEntityType} input.entityType
 * @param {string} input.field
 * @param {string} input.message
 * @param {string | null} [input.objectId]
 * @returns {import("./data-quality-rules.d.ts").DataQualityFinding}
 */
function finding(input) {
  const qualityRule = dataQualityRuleById(input.ruleId);

  return Object.freeze({
    ruleId: input.ruleId,
    entityType: input.entityType,
    severity: qualityRule?.severity ?? "ERROR",
    objectId: input.objectId ?? null,
    field: input.field,
    message: input.message,
  });
}

/**
 * @param {unknown} value
 * @param {string} field
 * @param {string} ruleId
 * @param {import("./data-quality-rules.d.ts").DataQualityEntityType} entityType
 * @param {import("./data-quality-rules.d.ts").DataQualityFinding[]} findings
 */
function requireField(value, field, ruleId, entityType, findings) {
  if (!normalizeString(value)) {
    findings.push(finding({
      ruleId,
      entityType,
      field,
      message: `${field} is required.`,
    }));
  }
}

/**
 * @param {unknown} value
 * @param {string} field
 * @param {string} ruleId
 * @param {import("./data-quality-rules.d.ts").DataQualityEntityType} entityType
 * @param {import("./data-quality-rules.d.ts").DataQualityFinding[]} findings
 */
function requireTimestamp(value, field, ruleId, entityType, findings) {
  if (!normalizeString(value)) {
    findings.push(finding({
      ruleId,
      entityType,
      field,
      message: `${field} is required.`,
    }));
    return;
  }

  if (Number.isNaN(new Date(/** @type {string | Date} */ (value)).getTime())) {
    findings.push(finding({
      ruleId,
      entityType,
      field,
      message: `${field} must be a valid date or ISO timestamp.`,
    }));
  }
}

/**
 * @param {unknown} value
 * @param {string} field
 * @param {string} ruleId
 * @param {import("./data-quality-rules.d.ts").DataQualityEntityType} entityType
 * @param {import("./data-quality-rules.d.ts").DataQualityFinding[]} findings
 */
function requireJsonObject(value, field, ruleId, entityType, findings) {
  if (!isRecord(value) || Array.isArray(value)) {
    findings.push(finding({
      ruleId,
      entityType,
      field,
      message: `${field} must be an object.`,
    }));
  }
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return Boolean(value && typeof value === "object");
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeString(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

/**
 * @param {string} issue
 * @returns {string}
 */
function fieldFromIssue(issue) {
  return issue.split(" ")[0] ?? "record";
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}

/**
 * @param {import("./data-quality-rules.d.ts").DataQualityFinding[]} findings
 * @returns {string | null}
 */
function firstFindingObjectId(findings) {
  return findings.find((item) => item.objectId)?.objectId ?? null;
}

/**
 * @param {import("./data-quality-rules.d.ts").DataQualityFinding} findingItem
 */
function summarizeFinding(findingItem) {
  return Object.freeze({
    ruleId: findingItem.ruleId,
    entityType: findingItem.entityType,
    severity: findingItem.severity,
    objectId: findingItem.objectId,
    field: findingItem.field,
    message: findingItem.message,
  });
}

/**
 * @param {import("./data-quality-rules.d.ts").DataQualityActorContext} actor
 * @param {"userId" | "roleCode" | "organizationId"} field
 * @returns {string}
 */
function requiredActorField(actor, field) {
  const value = normalizeString(actor?.[field]);

  if (!value) {
    throw new TypeError(`actor.${field} is required to log data quality failures.`);
  }

  return value;
}
