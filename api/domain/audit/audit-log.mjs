// @ts-check

import { isIP } from "node:net";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";

export const AUDIT_LOG_ACTIONS = /** @type {const} */ ([
  "CREATE",
  "UPDATE",
  "STATUS_CHANGE",
  "UPLOAD_DOCUMENT",
  "VIEW_DOCUMENT",
  "CREATE_PROOF_EVENT",
  "CHANGE_PERMISSION",
  "ADMIN_EDIT",
  "CREATE_AMENDMENT",
  "LOGIN",
  "LOGOUT",
]);

export const AUDIT_LOG_ROUTES = Object.freeze([
  Object.freeze({
    method: "GET",
    path: "/audit-logs",
    handler: "listAuditLogsForObject",
    access:
      "PLATFORM_ADMIN, or an authenticated Phase 1 participant when the caller supplies authorized object context",
  }),
]);

export const AUDIT_LOG_MUTATION_POLICY = Object.freeze({
  appendOnly: true,
  updateSupported: false,
  deleteSupported: false,
  reason:
    "Audit logs are append-only in Phase 1. Corrections must create later audit/proof/amendment evidence instead of editing prior audit entries.",
});

const PHASE_1_AUDIT_ROLE_CODES = /** @type {const} */ ([
  "BREEDER",
  "BREEDING_STATION",
  "PLATFORM_ADMIN",
]);

const AUDIT_HOOK_CORE_KEYS = Object.freeze([
  "action",
  "actorUserId",
  "actorRoleCode",
  "actorOrganizationId",
  "eventType",
  "newValue",
  "occurredAt",
  "previousValue",
  "reason",
  "targetId",
  "targetRef",
  "targetType",
]);

export class AuditLogValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech audit log input:\n- ${issues.join("\n- ")}`);
    this.name = "AuditLogValidationError";
    this.issues = issues;
  }
}

export class AuditLogAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "AuditLogAuthorizationError";
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./audit-log.d.ts").AuditLogAction}
 */
export function isAuditLogAction(value) {
  return typeof value === "string" && AUDIT_LOG_ACTIONS.includes(
    /** @type {import("./audit-log.d.ts").AuditLogAction} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./audit-log.d.ts").AuditLogActorRoleCode}
 */
export function isAuditLogActorRoleCode(value) {
  return typeof value === "string" && PHASE_1_AUDIT_ROLE_CODES.includes(
    /** @type {import("./audit-log.d.ts").AuditLogActorRoleCode} */ (value),
  );
}

/**
 * @param {import("./audit-log.d.ts").AuditLogInput} input
 * @returns {string[]}
 */
export function validateAuditLogInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["audit log input is required."];
  }

  const action = normalizeRequiredString(input.action);
  const actorRoleCode = normalizeRequiredString(input.actorRoleCode);

  validateOptionalNonBlankString(input.auditLogId, "auditLogId", issues);
  validateRequiredNonBlankString(input.actorUserId, "actorUserId", issues);
  validateRequiredNonBlankString(input.actorRoleCode, "actorRoleCode", issues);
  validateRequiredNonBlankString(
    input.actorOrganizationId,
    "actorOrganizationId",
    issues,
  );
  validateRequiredNonBlankString(input.objectType, "objectType", issues);
  validateRequiredNonBlankString(input.objectId, "objectId", issues);
  validateOptionalNonBlankString(input.sourceAction, "sourceAction", issues);
  validateOptionalNonBlankString(input.reason, "reason", issues);
  validateOptionalIpAddress(input.ipAddress, issues);
  validateOptionalNonBlankString(input.userAgent, "userAgent", issues);
  validateOptionalTimestamp(input.occurredAt, "occurredAt", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);
  validateOptionalJsonObject(input.objectRef, "objectRef", issues);
  validateOptionalJsonObject(input.previousValues, "previousValues", issues);
  validateOptionalJsonObject(input.newValues, "newValues", issues);
  validateOptionalJsonObject(input.metadata, "metadata", issues);

  if (!action) {
    issues.push("action is required.");
  } else if (!isAuditLogAction(action)) {
    issues.push(`action must be one of: ${AUDIT_LOG_ACTIONS.join(", ")}.`);
  }

  if (actorRoleCode && !isAuditLogActorRoleCode(actorRoleCode)) {
    issues.push(
      `actorRoleCode must be one of: ${PHASE_1_AUDIT_ROLE_CODES.join(", ")}.`,
    );
  }

  if (
    action === "ADMIN_EDIT" &&
    actorRoleCode &&
    actorRoleCode !== "PLATFORM_ADMIN"
  ) {
    issues.push("ADMIN_EDIT audit logs must be created by PLATFORM_ADMIN actors.");
  }

  if (
    action === "CHANGE_PERMISSION" &&
    actorRoleCode &&
    actorRoleCode !== "PLATFORM_ADMIN"
  ) {
    issues.push("CHANGE_PERMISSION audit logs must be created by PLATFORM_ADMIN actors.");
  }

  return issues;
}

/**
 * @param {import("./audit-log.d.ts").AuditLogInput} input
 * @returns {import("./audit-log.d.ts").AuditLog}
 */
export function prepareAuditLogEntry(input) {
  const issues = validateAuditLogInput(input);

  if (issues.length > 0) {
    throw new AuditLogValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.occurredAt ?? input.now ?? new Date());
  const createdAt = toIsoTimestamp(input.createdAt ?? input.now ?? occurredAt);

  return Object.freeze({
    id: normalizeOptionalString(input.auditLogId),
    actorUserId: normalizeRequiredString(input.actorUserId),
    actorRoleCode:
      /** @type {import("./audit-log.d.ts").AuditLogActorRoleCode} */ (
        normalizeRequiredString(input.actorRoleCode)
      ),
    actorOrganizationId: normalizeRequiredString(input.actorOrganizationId),
    action: /** @type {import("./audit-log.d.ts").AuditLogAction} */ (
      normalizeRequiredString(input.action)
    ),
    sourceAction: normalizeOptionalString(input.sourceAction),
    objectType: normalizeRequiredString(input.objectType),
    objectId: normalizeRequiredString(input.objectId),
    objectRef: freezeJsonObject(input.objectRef ?? {}),
    previousValues: input.previousValues == null
      ? null
      : freezeJsonObject(input.previousValues),
    newValues: input.newValues == null ? null : freezeJsonObject(input.newValues),
    reason: normalizeOptionalString(input.reason),
    ipAddress: normalizeOptionalString(input.ipAddress),
    userAgent: normalizeOptionalString(input.userAgent),
    metadata: freezeJsonObject(input.metadata ?? {}),
    occurredAt,
    createdAt,
  });
}

/**
 * @param {import("./audit-log.d.ts").AuditLogFromHookInput} input
 * @returns {import("./audit-log.d.ts").AuditLog}
 */
export function prepareAuditLogEntryFromHook(input) {
  const hook = normalizeAuditHook(input?.auditHook);
  const action = mapHookToAuditAction(hook.action, hook.actorRoleCode);
  const values = extractHookValues(hook);

  return prepareAuditLogEntry({
    auditLogId: input.auditLogId,
    actorUserId: hook.actorUserId,
    actorRoleCode: hook.actorRoleCode,
    actorOrganizationId: hook.actorOrganizationId,
    action,
    sourceAction: hook.action,
    objectType: hook.targetType,
    objectId: hook.targetId,
    objectRef: normalizeJsonObject(hook.targetRef) ?? {},
    previousValues: values.previousValues,
    newValues: values.newValues,
    reason: hook.reason,
    ipAddress: input.requestContext?.ipAddress,
    userAgent: input.requestContext?.userAgent,
    metadata: buildHookMetadata(input.auditHook),
    occurredAt: hook.occurredAt,
    createdAt: input.createdAt,
    now: input.now,
  });
}

/**
 * @param {import("./audit-log.d.ts").CreateAuditLogFromHookInput} input
 * @returns {Promise<import("./audit-log.d.ts").AuditLog>}
 */
export async function createAuditLogFromHook(input) {
  const createAuditLog = requireRepositoryMethod(input.repository, "createAuditLog");
  const auditLog = prepareAuditLogEntryFromHook(input);
  const persisted = await createAuditLog(auditLog);

  return Object.freeze(persisted ?? auditLog);
}

/**
 * @param {import("./audit-log.d.ts").AuditLogObjectQueryInput} input
 * @returns {string[]}
 */
export function validateAuditLogObjectQuery(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["audit log object query is required."];
  }

  validateRequiredNonBlankString(input.objectType, "objectType", issues);
  validateRequiredNonBlankString(input.objectId, "objectId", issues);

  return issues;
}

/**
 * @param {import("./audit-log.d.ts").AuditLogActorContext} actor
 * @param {import("./audit-log.d.ts").AuditLogObjectContext | null | undefined} objectContext
 * @returns {boolean}
 */
export function canViewAuditLogsForObject(actor, objectContext) {
  if (findActorRole(actor, "PLATFORM_ADMIN")) {
    return true;
  }

  if (!objectContext) {
    return false;
  }

  if (
    normalizeOptionalString(objectContext.actorUserId) &&
    actor?.userId === objectContext.actorUserId
  ) {
    return true;
  }

  const organizationId = normalizeOptionalString(objectContext.organizationId);
  const breederOrganizationId = normalizeOptionalString(
    objectContext.breederOrganizationId,
  );
  const breedingStationOrganizationId = normalizeOptionalString(
    objectContext.breedingStationOrganizationId,
  );

  return Boolean(
    findActorRole(actor, "BREEDER", breederOrganizationId ?? organizationId) ||
      findActorRole(
        actor,
        "BREEDING_STATION",
        breedingStationOrganizationId ?? organizationId,
      ),
  );
}

/**
 * @param {import("./audit-log.d.ts").ListAuditLogsForObjectInput} input
 * @returns {Promise<import("./audit-log.d.ts").AuditLog[]>}
 */
export async function listAuditLogsForObject(input) {
  const issues = validateAuditLogObjectQuery(input);

  if (issues.length > 0) {
    throw new AuditLogValidationError(issues);
  }

  const objectType = input.objectType.trim();
  const objectId = input.objectId.trim();

  if (
    input.objectContext &&
    (
      normalizeRequiredString(input.objectContext.objectType) !== objectType ||
      normalizeRequiredString(input.objectContext.objectId) !== objectId
    )
  ) {
    throw new AuditLogAuthorizationError(
      "audit log object context must match the requested objectType and objectId.",
    );
  }

  if (!canViewAuditLogsForObject(input.actor, input.objectContext)) {
    throw new AuditLogAuthorizationError(
      "actor may only view audit logs for platform-admin scope or visible Phase 1 objects.",
    );
  }

  const listByObject = requireRepositoryMethod(
    input.repository,
    "listAuditLogsForObject",
  );

  return listByObject(objectType, objectId);
}

/**
 * Phase 1 exposes no normal update path for audit logs.
 *
 * @returns {false}
 */
export function canUpdateAuditLog() {
  return false;
}

/**
 * Phase 1 exposes no normal delete path for audit logs.
 *
 * @returns {false}
 */
export function canDeleteAuditLog() {
  return false;
}

/**
 * @param {unknown} value
 * @returns {{
 *   action: string,
 *   actorUserId: string,
 *   actorRoleCode: string,
 *   actorOrganizationId: string,
 *   targetType: string,
 *   targetId: string,
 *   targetRef: unknown,
 *   previousValue: unknown,
 *   newValue: unknown,
 *   documentRef: unknown,
 *   reason: string | null,
 *   occurredAt: string | Date,
 * }}
 */
function normalizeAuditHook(value) {
  if (!value || typeof value !== "object") {
    throw new AuditLogValidationError(["auditHook is required."]);
  }

  const hook = /** @type {Record<string, unknown>} */ (value);
  const normalized = {
    action: normalizeRequiredString(hook.action),
    actorUserId: normalizeRequiredString(hook.actorUserId),
    actorRoleCode: normalizeRequiredString(hook.actorRoleCode),
    actorOrganizationId: normalizeRequiredString(hook.actorOrganizationId),
    targetType: normalizeRequiredString(hook.targetType),
    targetId: normalizeRequiredString(hook.targetId),
    targetRef: hook.targetRef,
    previousValue: hook.previousValue,
    newValue: hook.newValue,
    documentRef: hook.documentRef,
    reason: normalizeOptionalString(hook.reason),
    occurredAt: /** @type {string | Date} */ (hook.occurredAt),
  };
  const issues = [];

  validateRequiredNonBlankString(normalized.action, "auditHook.action", issues);
  validateRequiredNonBlankString(
    normalized.actorUserId,
    "auditHook.actorUserId",
    issues,
  );
  validateRequiredNonBlankString(
    normalized.actorRoleCode,
    "auditHook.actorRoleCode",
    issues,
  );
  validateRequiredNonBlankString(
    normalized.actorOrganizationId,
    "auditHook.actorOrganizationId",
    issues,
  );
  validateRequiredNonBlankString(normalized.targetType, "auditHook.targetType", issues);
  validateRequiredNonBlankString(normalized.targetId, "auditHook.targetId", issues);

  if (normalized.occurredAt === undefined || normalized.occurredAt === null) {
    issues.push("auditHook.occurredAt is required.");
  } else {
    validateOptionalTimestamp(normalized.occurredAt, "auditHook.occurredAt", issues);
  }

  if (issues.length > 0) {
    throw new AuditLogValidationError(issues);
  }

  return normalized;
}

/**
 * @param {string} sourceAction
 * @param {string} actorRoleCode
 * @returns {import("./audit-log.d.ts").AuditLogAction}
 */
function mapHookToAuditAction(sourceAction, actorRoleCode) {
  if (sourceAction === "LOGIN" || sourceAction === "LOGOUT") {
    return sourceAction;
  }

  if (sourceAction === "ROLE_ASSIGNED") {
    return "CHANGE_PERMISSION";
  }

  if (sourceAction === "PROOF_EVENT_CREATED") {
    return "CREATE_PROOF_EVENT";
  }

  if (sourceAction === "DOCUMENT_UPLOADED") {
    return "UPLOAD_DOCUMENT";
  }

  if (sourceAction === "DOCUMENT_VIEWED") {
    return "VIEW_DOCUMENT";
  }

  if (sourceAction === "SEMEN_ORDER_DRAFT_CREATED") {
    return "CREATE";
  }

  if (
    sourceAction.startsWith("SEMEN_ORDER_") ||
    sourceAction.includes("STATUS_UPDATED") ||
    sourceAction.includes("STATUS_CHANGE")
  ) {
    return "STATUS_CHANGE";
  }

  if (sourceAction.includes("AMENDMENT")) {
    return "CREATE_AMENDMENT";
  }

  if (sourceAction.includes("ADMIN")) {
    return "ADMIN_EDIT";
  }

  if (sourceAction.endsWith("_CREATED")) {
    return "CREATE";
  }

  if (actorRoleCode === "PLATFORM_ADMIN" && sourceAction.endsWith("_UPDATED")) {
    return "ADMIN_EDIT";
  }

  return "UPDATE";
}

/**
 * @param {{
 *   previousValue: unknown,
 *   newValue: unknown,
 *   documentRef: unknown,
 *   targetRef: unknown,
 * }} hook
 * @returns {{
 *   previousValues: Readonly<Record<string, unknown>> | null,
 *   newValues: Readonly<Record<string, unknown>> | null,
 * }}
 */
function extractHookValues(hook) {
  return {
    previousValues: normalizeJsonObject(hook.previousValue),
    newValues:
      normalizeJsonObject(hook.newValue) ??
      normalizeJsonObject(hook.documentRef) ??
      normalizeJsonObject(hook.targetRef),
  };
}

/**
 * @param {unknown} hook
 * @returns {Readonly<Record<string, unknown>>}
 */
function buildHookMetadata(hook) {
  if (!hook || typeof hook !== "object") {
    return Object.freeze({});
  }

  const hookRecord = /** @type {Record<string, unknown>} */ (hook);
  /** @type {Record<string, unknown>} */
  const metadata = {
    sourceEventType: hookRecord.eventType,
    sourceAction: hookRecord.action,
  };

  for (const [key, value] of Object.entries(hookRecord)) {
    if (AUDIT_HOOK_CORE_KEYS.includes(key)) {
      continue;
    }

    if (isJsonValue(value)) {
      metadata[key] = value;
    }
  }

  return freezeJsonObject(metadata);
}

/**
 * @param {import("./audit-log.d.ts").AuditLogActorContext} actor
 * @param {import("./audit-log.d.ts").AuditLogActorRoleCode} roleCode
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
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalIpAddress(value, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (
    typeof value !== "string" ||
    value.trim().length === 0 ||
    isIP(value.trim()) === 0
  ) {
    issues.push("ipAddress must be a valid IPv4 or IPv6 address.");
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
 * @returns {Readonly<Record<string, unknown>> | null}
 */
function normalizeJsonObject(value) {
  return isPlainObject(value) && isJsonValue(value)
    ? freezeJsonObject(value)
    : null;
}

/**
 * @param {Record<string, unknown>} value
 * @returns {Readonly<Record<string, unknown>>}
 */
function freezeJsonObject(value) {
  return Object.freeze(
    Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, freezeJsonValue(item)]),
    ),
  );
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
    return freezeJsonObject(/** @type {Record<string, unknown>} */ (value));
  }

  return value;
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
