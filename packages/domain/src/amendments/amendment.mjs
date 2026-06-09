// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";

export const AMENDMENT_STATUSES = /** @type {const} */ ([
  "DRAFT",
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
]);

export const AMENDMENT_TARGET_TYPES = /** @type {const} */ ([
  "SemenOrder",
  "OrderStatusHistory",
  "Shipment",
  "ShipmentTrackingEvent",
  "Document",
  "EvidenceAttachment",
  "ProofEvent",
]);

export const AMENDMENT_ROUTES = Object.freeze([
  Object.freeze({
    method: "POST",
    path: "/amendments",
    handler: "createAmendmentEndpoint",
    access: "PLATFORM_ADMIN only; selected proof-relevant target records",
  }),
]);

export const AMENDMENT_TARGET_MUTATION_POLICY = Object.freeze({
  silentlyOverwriteTarget: false,
  createTargetUpdate: false,
  requiresReason: true,
  requiresAuditLog: true,
  reason:
    "Ticket 1.9 amendments preserve original and amended values as separate evidence. Target records are not overwritten by this model helper.",
});

const PHASE_1_AMENDMENT_ROLE_CODES = /** @type {const} */ ([
  "PLATFORM_ADMIN",
]);

export class AmendmentValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech amendment input:\n- ${issues.join("\n- ")}`);
    this.name = "AmendmentValidationError";
    this.issues = issues;
  }
}

export class AmendmentAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "AmendmentAuthorizationError";
  }
}

export class AmendmentNotFoundError extends Error {
  /**
   * @param {string} entityName
   * @param {string} entityId
   */
  constructor(entityName, entityId) {
    super(`${entityName} was not found: ${entityId}`);
    this.name = "AmendmentNotFoundError";
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./amendment.d.ts").AmendmentStatus}
 */
export function isAmendmentStatus(value) {
  return typeof value === "string" && AMENDMENT_STATUSES.includes(
    /** @type {import("./amendment.d.ts").AmendmentStatus} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./amendment.d.ts").AmendmentTargetType}
 */
export function isAmendmentTargetType(value) {
  return typeof value === "string" && AMENDMENT_TARGET_TYPES.includes(
    /** @type {import("./amendment.d.ts").AmendmentTargetType} */ (value),
  );
}

/**
 * @param {import("./amendment.d.ts").AmendmentActorContext} actor
 * @returns {boolean}
 */
export function canCreateAmendment(actor) {
  return Boolean(findPlatformAdminRole(actor));
}

/**
 * Ticket 1.9 never silently updates the amended target.
 *
 * @returns {false}
 */
export function canSilentlyOverwriteAmendmentTarget() {
  return false;
}

/**
 * @param {import("./amendment.d.ts").CreateAmendmentInput} input
 * @returns {string[]}
 */
export function validateCreateAmendmentInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["amendment input is required."];
  }

  const actorIssues = validateActor(input.actor, "actor");
  const status = normalizeRequiredString(input.status) || "SUBMITTED";
  const targetType = normalizeRequiredString(input.targetType);
  const approverProvided = input.approver !== undefined && input.approver !== null;

  issues.push(...actorIssues);

  if (!targetType) {
    issues.push("targetType is required.");
  } else if (!isAmendmentTargetType(targetType)) {
    issues.push(
      `targetType must be one of: ${AMENDMENT_TARGET_TYPES.join(", ")}.`,
    );
  }

  if (!status) {
    issues.push("status is required.");
  } else if (!isAmendmentStatus(status)) {
    issues.push(`status must be one of: ${AMENDMENT_STATUSES.join(", ")}.`);
  }

  validateRequiredNonBlankString(input.targetId, "targetId", issues);
  validateOptionalNonBlankString(input.targetField, "targetField", issues);
  validateOptionalJsonObject(input.targetRef, "targetRef", issues);
  validateRequiredJsonValue(input, "originalValue", issues);
  validateRequiredJsonValue(input, "amendedValue", issues);
  validateRequiredNonBlankString(input.reason, "reason", issues);
  validateOptionalNonBlankString(input.amendmentId, "amendmentId", issues);
  validateOptionalNonBlankString(input.auditLogId, "auditLogId", issues);
  validateOptionalNonBlankString(input.proofEventId, "proofEventId", issues);
  validateOptionalNonBlankString(input.semenOrderId, "semenOrderId", issues);
  validateOptionalNonBlankString(input.shipmentId, "shipmentId", issues);
  validateOptionalNonBlankString(input.horseId, "horseId", issues);
  validateOptionalNonBlankString(input.orderNumber, "orderNumber", issues);
  validateOptionalNonBlankString(
    input.breederOrganizationId,
    "breederOrganizationId",
    issues,
  );
  validateOptionalNonBlankString(
    input.breedingStationOrganizationId,
    "breedingStationOrganizationId",
    issues,
  );
  validateOptionalTimestamp(input.occurredAt, "occurredAt", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.decidedAt, "decidedAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);
  validateProofContextShape(input, issues);

  if (actorIssues.length === 0 && !findPlatformAdminRole(input.actor)) {
    issues.push("actor must be an active PLATFORM_ADMIN user to create amendments.");
  }

  if (status === "APPROVED" || status === "REJECTED") {
    if (!approverProvided) {
      issues.push("approver is required for APPROVED or REJECTED amendments.");
    }
  } else if (approverProvided) {
    issues.push("approver may only be provided for APPROVED or REJECTED amendments.");
  }

  if (approverProvided) {
    const approverIssues = validateActor(input.approver, "approver");
    issues.push(...approverIssues);

    if (approverIssues.length === 0 && !findPlatformAdminRole(input.approver)) {
      issues.push("approver must be an active PLATFORM_ADMIN user.");
    }
  }

  return issues;
}

/**
 * @param {import("./amendment.d.ts").CreateAmendmentInput} input
 * @returns {import("./amendment.d.ts").PreparedAmendmentChange}
 */
export function prepareCreateAmendment(input) {
  const issues = validateCreateAmendmentInput(input);

  if (issues.length > 0) {
    throw new AmendmentValidationError(issues);
  }

  const actorRole = findPlatformAdminRole(input.actor);

  if (!actorRole) {
    throw new AmendmentAuthorizationError(
      "actor must be authorized before creating an amendment.",
    );
  }

  const status = /** @type {import("./amendment.d.ts").AmendmentStatus} */ (
    normalizeRequiredString(input.status) || "SUBMITTED"
  );
  const approverRole = input.approver ? findPlatformAdminRole(input.approver) : null;

  if ((status === "APPROVED" || status === "REJECTED") && !approverRole) {
    throw new AmendmentAuthorizationError(
      "approver must be authorized before deciding an amendment.",
    );
  }

  const occurredAt = toIsoTimestamp(
    input.occurredAt ?? input.createdAt ?? input.now ?? new Date(),
  );
  const createdAt = toIsoTimestamp(input.createdAt ?? input.now ?? occurredAt);
  const decidedAt = approverRole
    ? toIsoTimestamp(input.decidedAt ?? input.now ?? occurredAt)
    : null;
  const amendment = Object.freeze({
    id: normalizeOptionalString(input.amendmentId),
    targetType: /** @type {import("./amendment.d.ts").AmendmentTargetType} */ (
      normalizeRequiredString(input.targetType)
    ),
    targetId: normalizeRequiredString(input.targetId),
    targetField: normalizeOptionalString(input.targetField),
    targetRef: /** @type {Readonly<Record<string, unknown>>} */ (
      freezeJsonValue(input.targetRef ?? {})
    ),
    originalValue: freezeJsonValue(input.originalValue),
    amendedValue: freezeJsonValue(input.amendedValue),
    reason: normalizeRequiredString(input.reason),
    status,
    actorUserId: actorRole.userId,
    actorRoleCode: /** @type {import("./amendment.d.ts").AmendmentActorRoleCode} */ (
      actorRole.roleCode
    ),
    actorOrganizationId: actorRole.organizationId,
    approverUserId: approverRole?.userId ?? null,
    approverRoleCode:
      /** @type {import("./amendment.d.ts").AmendmentActorRoleCode | null} */ (
        approverRole?.roleCode ?? null
      ),
    approverOrganizationId: approverRole?.organizationId ?? null,
    decidedAt,
    auditLogId: normalizeOptionalString(input.auditLogId),
    proofEventId: normalizeOptionalString(input.proofEventId),
    semenOrderId: normalizeOptionalString(input.semenOrderId),
    shipmentId: normalizeOptionalString(input.shipmentId),
    horseId: normalizeOptionalString(input.horseId),
    orderNumber: normalizeOptionalString(input.orderNumber),
    breederOrganizationId: normalizeOptionalString(input.breederOrganizationId),
    breedingStationOrganizationId: normalizeOptionalString(
      input.breedingStationOrganizationId,
    ),
    occurredAt,
    createdAt,
    updatedAt: createdAt,
  });
  const auditHook = buildAmendmentAuditHook({ amendment });

  return Object.freeze({
    amendment,
    auditHook,
    proofHook: hasProofLinkContext(amendment)
      ? buildAmendmentProofHook({ amendment, auditHook })
      : null,
  });
}

/**
 * @param {{ amendment: import("./amendment.d.ts").Amendment }} input
 * @returns {import("./amendment.d.ts").AmendmentAuditHook}
 */
export function buildAmendmentAuditHook(input) {
  return Object.freeze({
    eventType: "AMENDMENT",
    action: "AMENDMENT_CREATED",
    actorUserId: input.amendment.actorUserId,
    actorRoleCode: input.amendment.actorRoleCode,
    actorOrganizationId: input.amendment.actorOrganizationId,
    targetType: input.amendment.targetType,
    targetId: input.amendment.targetId,
    targetRef: Object.freeze({
      amendmentId: input.amendment.id,
      targetField: input.amendment.targetField,
      targetRef: input.amendment.targetRef,
      amendmentStatus: input.amendment.status,
      proofEventId: input.amendment.proofEventId,
      semenOrderId: input.amendment.semenOrderId,
      shipmentId: input.amendment.shipmentId,
      horseId: input.amendment.horseId,
      orderNumber: input.amendment.orderNumber,
      breederOrganizationId: input.amendment.breederOrganizationId,
      breedingStationOrganizationId:
        input.amendment.breedingStationOrganizationId,
    }),
    amendmentId: input.amendment.id,
    previousValue: Object.freeze({
      originalValue: input.amendment.originalValue,
    }),
    newValue: Object.freeze({
      amendedValue: input.amendment.amendedValue,
      amendmentStatus: input.amendment.status,
    }),
    reason: input.amendment.reason,
    occurredAt: input.amendment.occurredAt,
  });
}

/**
 * @param {{
 *   amendment: import("./amendment.d.ts").Amendment,
 *   auditHook: import("./amendment.d.ts").AmendmentAuditHook,
 * }} input
 * @returns {import("./amendment.d.ts").AmendmentProofHook}
 */
export function buildAmendmentProofHook(input) {
  return Object.freeze({
    hookType: "PROOF_EVENT_REQUEST",
    source: "ADMIN_CORRECTION",
    triggerType: "AMENDMENT_CREATED",
    triggerRef: Object.freeze({
      targetType: "Amendment",
      targetId: input.amendment.id,
      amendmentTargetType: input.amendment.targetType,
      amendmentTargetId: input.amendment.targetId,
      targetField: input.amendment.targetField,
      amendmentStatus: input.amendment.status,
      proofEventId: input.amendment.proofEventId,
      semenOrderId: input.amendment.semenOrderId,
      shipmentId: input.amendment.shipmentId,
      horseId: input.amendment.horseId,
      orderNumber: input.amendment.orderNumber,
      breederOrganizationId: input.amendment.breederOrganizationId,
      breedingStationOrganizationId:
        input.amendment.breedingStationOrganizationId,
    }),
    documentationRefs: Object.freeze([]),
    actorRef: Object.freeze({
      userId: input.amendment.actorUserId,
      roleCode: input.amendment.actorRoleCode,
      organizationId: input.amendment.actorOrganizationId,
    }),
    signatureRef: Object.freeze({
      type: "MANAGED_AUTH_ACTOR_CONTEXT",
      actorUserId: input.amendment.actorUserId,
    }),
    verificationLevelRef: null,
    auditHookRef: Object.freeze({
      eventType: input.auditHook.eventType,
      action: input.auditHook.action,
      occurredAt: input.auditHook.occurredAt,
    }),
    occurredAt: input.amendment.occurredAt,
  });
}

/**
 * @param {import("./amendment.d.ts").CreateAmendmentServiceInput} input
 * @returns {Promise<import("./amendment.d.ts").PersistedAmendmentChange>}
 */
export async function createAmendment(input) {
  const createAmendmentRecord = requireRepositoryMethod(
    input.repository,
    "createAmendment",
  );
  const prepared = prepareCreateAmendment(input);
  const amendment = await createAmendmentRecord(prepared.amendment);
  const refreshed = rebuildPersistedChange(prepared, amendment);
  const auditLog = await createAuditLogFromHook({
    repository: input.repository,
    auditHook: refreshed.auditHook,
    requestContext: input.auditContext,
  });

  return Object.freeze({
    amendment: refreshed.amendment,
    auditHook: refreshed.auditHook,
    auditLog,
    proofHook: refreshed.proofHook,
  });
}

/**
 * @param {import("./amendment.d.ts").EndpointRequest<import("./amendment.d.ts").CreateAmendmentInputBody>} request
 * @returns {Promise<import("./amendment.d.ts").EndpointResponse<{ amendment: import("./amendment.d.ts").Amendment }>>}
 */
export async function createAmendmentEndpoint(request) {
  const findAmendmentTargetSnapshot = requireRepositoryMethod(
    request.repository,
    "findAmendmentTargetSnapshot",
  );
  const targetType = requireBodyField(request.body, "targetType");
  const targetId = requireBodyField(request.body, "targetId");
  const targetField = normalizeOptionalString(request.body?.targetField);
  const targetSnapshot = await findRequiredEntity(
    () => findAmendmentTargetSnapshot(targetType, targetId, targetField),
    targetType,
    targetId,
  );
  const persisted = await createAmendment({
    ...request.body,
    targetType,
    targetId,
    targetField,
    targetRef: targetSnapshot.targetRef ?? request.body?.targetRef,
    originalValue: targetSnapshot.originalValue,
    amendedValue: request.body?.amendedValue,
    semenOrderId: targetSnapshot.semenOrderId ?? request.body?.semenOrderId,
    shipmentId: targetSnapshot.shipmentId ?? request.body?.shipmentId,
    horseId: targetSnapshot.horseId ?? request.body?.horseId,
    orderNumber: targetSnapshot.orderNumber ?? request.body?.orderNumber,
    breederOrganizationId:
      targetSnapshot.breederOrganizationId ?? request.body?.breederOrganizationId,
    breedingStationOrganizationId:
      targetSnapshot.breedingStationOrganizationId ??
      request.body?.breedingStationOrganizationId,
    actor: request.actor,
    approver: request.approver,
    repository: request.repository,
    auditContext: request.auditContext,
  });

  return Object.freeze({
    status: 201,
    body: Object.freeze({
      amendment: persisted.amendment,
    }),
    auditHook: persisted.auditHook,
    auditLog: persisted.auditLog,
    proofHook: persisted.proofHook,
  });
}

/**
 * @param {import("./amendment.d.ts").PreparedAmendmentChange} prepared
 * @param {import("./amendment.d.ts").Amendment | null | undefined} persisted
 * @returns {import("./amendment.d.ts").PreparedAmendmentChange}
 */
function rebuildPersistedChange(prepared, persisted) {
  const amendment = persisted ?? prepared.amendment;
  const auditHook = buildAmendmentAuditHook({ amendment });

  return Object.freeze({
    amendment,
    auditHook,
    proofHook: hasProofLinkContext(amendment)
      ? buildAmendmentProofHook({ amendment, auditHook })
      : null,
  });
}

/**
 * @param {import("./amendment.d.ts").Amendment} amendment
 * @returns {boolean}
 */
function hasProofLinkContext(amendment) {
  return Boolean(amendment.semenOrderId || amendment.shipmentId || amendment.horseId);
}

/**
 * @param {import("./amendment.d.ts").CreateAmendmentInput} input
 * @param {string[]} issues
 * @returns {void}
 */
function validateProofContextShape(input, issues) {
  const orderFields = [
    input.semenOrderId,
    input.orderNumber,
    input.breederOrganizationId,
    input.breedingStationOrganizationId,
  ];
  const hasAnyOrderField = orderFields.some((value) => normalizeOptionalString(value));
  const hasEveryOrderField = orderFields.every((value) =>
    normalizeOptionalString(value)
  );

  if (hasAnyOrderField && !hasEveryOrderField) {
    issues.push(
      "order-linked amendments must include semenOrderId, orderNumber, breederOrganizationId and breedingStationOrganizationId.",
    );
  }

  if (
    normalizeOptionalString(input.shipmentId) &&
    !(
      normalizeOptionalString(input.semenOrderId) &&
      normalizeOptionalString(input.orderNumber)
    )
  ) {
    issues.push(
      "shipment-linked amendments must include shipmentId, semenOrderId and orderNumber.",
    );
  }
}

/**
 * @param {import("./amendment.d.ts").AmendmentActorContext | null | undefined} actor
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findPlatformAdminRole(actor) {
  if (!actor || !Array.isArray(actor.roles)) {
    return undefined;
  }

  return actor.roles.find((assignment) =>
    assignment.userId === actor.userId &&
    PHASE_1_AMENDMENT_ROLE_CODES.includes(
      /** @type {import("./amendment.d.ts").AmendmentActorRoleCode} */ (
        assignment.roleCode
      ),
    ) &&
    isActiveRoleAssignment(assignment),
  );
}

/**
 * @param {unknown} value
 * @param {string} fieldPrefix
 * @returns {string[]}
 */
function validateActor(value, fieldPrefix) {
  const issues = [];

  if (!value || typeof value !== "object") {
    return [`${fieldPrefix} is required.`];
  }

  const actor = /** @type {Partial<import("./amendment.d.ts").AmendmentActorContext>} */ (
    value
  );

  if (!normalizeRequiredString(actor.userId)) {
    issues.push(`${fieldPrefix}.userId is required.`);
  }

  if (!Array.isArray(actor.roles)) {
    issues.push(`${fieldPrefix}.roles must list the active role context.`);
  }

  return issues;
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
    throw new AmendmentNotFoundError(entityName, entityId);
  }

  return entity;
}

/**
 * @param {Record<string, unknown> | undefined} body
 * @param {string} fieldName
 * @returns {string}
 */
function requireBodyField(body, fieldName) {
  const value = normalizeRequiredString(body?.[fieldName]);

  if (!value) {
    throw new AmendmentValidationError([`${fieldName} is required.`]);
  }

  return value;
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
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${fieldName} cannot be blank when provided.`);
  }
}

/**
 * @param {Record<string, unknown>} input
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredJsonValue(input, fieldName, issues) {
  if (!hasOwn(input, fieldName)) {
    issues.push(`${fieldName} is required.`);
    return;
  }

  if (!isJsonValue(input[fieldName])) {
    issues.push(`${fieldName} must contain only JSON-safe values.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalJsonObject(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (!isPlainObject(value)) {
    issues.push(`${fieldName} must be a JSON object.`);
    return;
  }

  if (!isJsonValue(value)) {
    issues.push(`${fieldName} must contain only JSON-safe values.`);
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
 * @param {object} object
 * @param {string} key
 * @returns {boolean}
 */
function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
  );
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isJsonValue(value) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return Number.isFinite(value) || typeof value !== "number";
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).every((item) => isJsonValue(item));
  }

  return false;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function freezeJsonValue(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => freezeJsonValue(item)));
  }

  if (isPlainObject(value)) {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, freezeJsonValue(item)]),
      ),
    );
  }

  return value;
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
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
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
