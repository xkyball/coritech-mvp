// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import {
  isActiveRoleAssignment,
  isPhase1RoleCode,
  isPreparedFutureRoleCode,
  isSupportedRoleCode,
} from "../identity/role-model.mjs";

export const ACTIVE_ACCESS_PERMISSION_SCOPES = /** @type {const} */ ([
  "VIEW",
  "CREATE",
  "UPDATE",
  "CONFIRM",
  "UPLOAD_DOCUMENT",
  "VIEW_DOCUMENT",
  "ADMIN_SUPPORT",
]);

export const PREPARED_FUTURE_ACCESS_PERMISSION_SCOPES = /** @type {const} */ ([
  "BUYER_VIEW",
]);

export const ACCESS_PERMISSION_SCOPES = /** @type {const} */ ([
  ...ACTIVE_ACCESS_PERMISSION_SCOPES,
  ...PREPARED_FUTURE_ACCESS_PERMISSION_SCOPES,
]);

export const ACCESS_PERMISSION_AUDIT_ACTIONS = /** @type {const} */ ([
  "ACCESS_PERMISSION_GRANTED",
  "ACCESS_PERMISSION_REVOKED",
]);

export class AccessPermissionValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech access permission input:\n- ${issues.join("\n- ")}`);
    this.name = "AccessPermissionValidationError";
    this.issues = issues;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./access-permission.d.ts").AccessPermissionScope}
 */
export function isAccessPermissionScope(value) {
  return typeof value === "string" && ACCESS_PERMISSION_SCOPES.includes(
    /** @type {import("./access-permission.d.ts").AccessPermissionScope} */ (
      value
    ),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./access-permission.d.ts").ActiveAccessPermissionScope}
 */
export function isActiveAccessPermissionScope(value) {
  return typeof value === "string" && ACTIVE_ACCESS_PERMISSION_SCOPES.includes(
    /** @type {import("./access-permission.d.ts").ActiveAccessPermissionScope} */ (
      value
    ),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./access-permission.d.ts").PreparedFutureAccessPermissionScope}
 */
export function isPreparedFutureAccessPermissionScope(value) {
  return typeof value === "string" &&
    PREPARED_FUTURE_ACCESS_PERMISSION_SCOPES.includes(
      /** @type {import("./access-permission.d.ts").PreparedFutureAccessPermissionScope} */ (
        value
      ),
    );
}

/**
 * @param {import("./access-permission.d.ts").CreateAccessPermissionInput} input
 * @returns {string[]}
 */
export function validateCreateAccessPermissionInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["access permission input is required."];
  }

  const userId = normalizeOptionalString(input.userId);
  const organizationId = normalizeOptionalString(input.organizationId);
  const roleCode = normalizeOptionalString(input.roleCode);
  const scope = normalizeRequiredString(input.scope);
  const grantedByUserId = normalizeRequiredString(input.grantedByUserId);

  validateOptionalNonBlankString(input.permissionId, "permissionId", issues);
  validateRequiredNonBlankString(input.objectType, "objectType", issues);
  validateRequiredNonBlankString(input.objectId, "objectId", issues);
  validateRequiredNonBlankString(input.scope, "scope", issues);
  validateRequiredNonBlankString(input.grantedByUserId, "grantedByUserId", issues);
  validateOptionalNonBlankString(input.userId, "userId", issues);
  validateOptionalNonBlankString(input.organizationId, "organizationId", issues);
  validateOptionalNonBlankString(input.roleCode, "roleCode", issues);
  validateOptionalNonBlankString(input.grantReason, "grantReason", issues);
  validateOptionalTimestamp(input.effectiveAt, "effectiveAt", issues);
  validateOptionalTimestamp(input.expiresAt, "expiresAt", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (!userId && !organizationId && !roleCode) {
    issues.push(
      "at least one permission subject is required: userId, organizationId or roleCode.",
    );
  }

  if (scope && !isAccessPermissionScope(scope)) {
    issues.push(`scope must be one of: ${ACCESS_PERMISSION_SCOPES.join(", ")}.`);
  } else if (isPreparedFutureAccessPermissionScope(scope)) {
    issues.push(
      `${scope} is prepared for later buyer-view workflows and is not grantable in Phase 1.`,
    );
  }

  if (roleCode && !isSupportedRoleCode(roleCode)) {
    issues.push("roleCode must be a supported CoriTech role code.");
  } else if (roleCode && isPreparedFutureRoleCode(roleCode)) {
    issues.push(
      `${roleCode} is prepared for later phases and cannot receive active AccessPermission grants in Phase 1.`,
    );
  }

  if (!Array.isArray(input.grantorRoles)) {
    issues.push("grantorRoles must list the granting user's active role context.");
  } else if (
    grantedByUserId &&
    !findActivePlatformAdminAssignment(input.grantorRoles, grantedByUserId)
  ) {
    issues.push("grantedByUserId must have an active PLATFORM_ADMIN role assignment.");
  }

  validateTimestampOrder(
    input.effectiveAt,
    input.expiresAt,
    "expiresAt",
    "effectiveAt",
    issues,
  );

  return issues;
}

/**
 * @param {import("./access-permission.d.ts").CreateAccessPermissionInput} input
 * @returns {import("./access-permission.d.ts").PreparedAccessPermissionChange}
 */
export function prepareCreateAccessPermission(input) {
  const issues = validateCreateAccessPermissionInput(input);

  if (issues.length > 0) {
    throw new AccessPermissionValidationError(issues);
  }

  const createdAt = toIsoTimestamp(input.createdAt ?? input.now ?? new Date());
  const effectiveAt = toIsoTimestamp(input.effectiveAt ?? createdAt);
  const grantorRole = findActivePlatformAdminAssignment(
    input.grantorRoles,
    input.grantedByUserId.trim(),
  );
  const permission = Object.freeze({
    id: normalizeOptionalString(input.permissionId),
    userId: normalizeOptionalString(input.userId),
    organizationId: normalizeOptionalString(input.organizationId),
    roleCode: /** @type {import("./access-permission.d.ts").AccessPermission["roleCode"]} */ (
      normalizeOptionalString(input.roleCode)
    ),
    objectType: input.objectType.trim(),
    objectId: input.objectId.trim(),
    scope: /** @type {import("./access-permission.d.ts").ActiveAccessPermissionScope} */ (
      input.scope.trim()
    ),
    grantedByUserId: input.grantedByUserId.trim(),
    grantorRoleCode: "PLATFORM_ADMIN",
    grantorOrganizationId: /** @type {import("../identity/role-model.d.ts").UserOrganizationRoleLike} */ (
      grantorRole
    ).organizationId,
    grantReason: normalizeOptionalString(input.grantReason),
    effectiveAt,
    expiresAt: input.expiresAt == null ? null : toIsoTimestamp(input.expiresAt),
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    createdAt,
    updatedAt: createdAt,
  });

  return Object.freeze({
    permission,
    auditHook: buildAccessPermissionAuditHook({
      action: "ACCESS_PERMISSION_GRANTED",
      permission,
      previousPermission: null,
      reason: permission.grantReason,
      occurredAt: permission.createdAt,
    }),
  });
}

/**
 * @param {import("./access-permission.d.ts").RevokeAccessPermissionInput} input
 * @returns {string[]}
 */
export function validateRevokeAccessPermissionInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["access permission revocation input is required."];
  }

  const permission = input.existingPermission;
  const revokedByUserId = normalizeRequiredString(input.revokedByUserId);

  if (!permission || typeof permission !== "object") {
    issues.push("existingPermission is required.");
  } else {
    validateRequiredNonBlankString(permission.objectType, "existingPermission.objectType", issues);
    validateRequiredNonBlankString(permission.objectId, "existingPermission.objectId", issues);
    validateRequiredNonBlankString(permission.scope, "existingPermission.scope", issues);

    if (permission.revokedAt != null) {
      issues.push("existingPermission is already revoked.");
    }

    validateTimestampOrder(
      permission.effectiveAt,
      input.revokedAt ?? input.now ?? new Date(),
      "revokedAt",
      "existingPermission.effectiveAt",
      issues,
    );
  }

  validateRequiredNonBlankString(input.revokedByUserId, "revokedByUserId", issues);
  validateRequiredNonBlankString(input.revocationReason, "revocationReason", issues);
  validateOptionalTimestamp(input.revokedAt, "revokedAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (!Array.isArray(input.revokerRoles)) {
    issues.push("revokerRoles must list the revoking user's active role context.");
  } else if (
    revokedByUserId &&
    !findActivePlatformAdminAssignment(input.revokerRoles, revokedByUserId)
  ) {
    issues.push("revokedByUserId must have an active PLATFORM_ADMIN role assignment.");
  }

  return issues;
}

/**
 * @param {import("./access-permission.d.ts").RevokeAccessPermissionInput} input
 * @returns {import("./access-permission.d.ts").PreparedAccessPermissionChange}
 */
export function prepareRevokeAccessPermission(input) {
  const issues = validateRevokeAccessPermissionInput(input);

  if (issues.length > 0) {
    throw new AccessPermissionValidationError(issues);
  }

  const revokedAt = toIsoTimestamp(input.revokedAt ?? input.now ?? new Date());
  const revokerRole = findActivePlatformAdminAssignment(
    input.revokerRoles,
    input.revokedByUserId.trim(),
  );
  const permission = Object.freeze({
    ...input.existingPermission,
    revokedAt,
    revokedByUserId: input.revokedByUserId.trim(),
    revocationReason: input.revocationReason.trim(),
    updatedAt: revokedAt,
  });

  return Object.freeze({
    permission,
    auditHook: buildAccessPermissionAuditHook({
      action: "ACCESS_PERMISSION_REVOKED",
      permission,
      previousPermission: input.existingPermission,
      actorOrganizationId: revokerRole?.organizationId,
      reason: permission.revocationReason,
      occurredAt: revokedAt,
    }),
  });
}

/**
 * @param {{
 *   action: import("./access-permission.d.ts").AccessPermissionAuditAction,
 *   permission: import("./access-permission.d.ts").AccessPermission,
 *   previousPermission?: import("./access-permission.d.ts").AccessPermission | null,
 *   actorOrganizationId?: string | null,
 *   reason?: string | null,
 *   occurredAt?: string | Date,
 * }} options
 * @returns {import("./access-permission.d.ts").AccessPermissionAuditHook}
 */
export function buildAccessPermissionAuditHook(options) {
  return Object.freeze({
    eventType: "ACCESS_PERMISSION_CHANGE",
    action: options.action,
    actorUserId: options.permission.revokedByUserId ??
      options.permission.grantedByUserId,
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: normalizeOptionalString(options.actorOrganizationId) ??
      options.permission.grantorOrganizationId,
    targetType: "AccessPermission",
    targetId: options.permission.id,
    targetRef: Object.freeze({
      userId: options.permission.userId,
      organizationId: options.permission.organizationId,
      roleCode: options.permission.roleCode,
      objectType: options.permission.objectType,
      objectId: options.permission.objectId,
      scope: options.permission.scope,
      expiresAt: options.permission.expiresAt,
    }),
    previousValue: options.previousPermission
      ? permissionAuditValue(options.previousPermission)
      : null,
    newValue: permissionAuditValue(options.permission),
    reason: normalizeOptionalString(options.reason),
    occurredAt: toIsoTimestamp(options.occurredAt ?? options.permission.updatedAt),
  });
}

/**
 * @param {import("./access-permission.d.ts").AccessPermission} permission
 * @param {string | Date} [now]
 * @returns {boolean}
 */
export function isAccessPermissionCurrentlyUsable(permission, now = new Date()) {
  if (!permission || typeof permission !== "object") {
    return false;
  }

  if (!isActiveAccessPermissionScope(permission.scope)) {
    return false;
  }

  const nowTime = new Date(now).getTime();
  const effectiveAt = new Date(permission.effectiveAt).getTime();
  const expiresAt = permission.expiresAt == null
    ? null
    : new Date(permission.expiresAt).getTime();

  if (
    Number.isNaN(nowTime) ||
    Number.isNaN(effectiveAt) ||
    (expiresAt !== null && Number.isNaN(expiresAt))
  ) {
    return false;
  }

  return permission.revokedAt == null &&
    effectiveAt <= nowTime &&
    (expiresAt === null || nowTime < expiresAt);
}

/**
 * @param {import("./access-permission.d.ts").AccessPermissionActorContext} actor
 * @param {import("./access-permission.d.ts").AccessPermission} permission
 * @param {import("./access-permission.d.ts").AccessPermissionQuery} query
 * @returns {boolean}
 */
export function canUseAccessPermission(actor, permission, query) {
  if (
    !actor ||
    typeof actor !== "object" ||
    !Array.isArray(actor.roles) ||
    !permission ||
    typeof permission !== "object"
  ) {
    return false;
  }

  const scope = normalizeRequiredString(query.scope);

  if (
    permission.objectType !== normalizeRequiredString(query.objectType) ||
    permission.objectId !== normalizeRequiredString(query.objectId) ||
    permission.scope !== scope
  ) {
    return false;
  }

  return isAccessPermissionCurrentlyUsable(permission, query.now) &&
    permissionMatchesActor(actor, permission);
}

/**
 * @param {import("./access-permission.d.ts").CheckAccessPermissionInput} input
 * @returns {Promise<import("./access-permission.d.ts").AccessPermissionDecision>}
 */
export async function checkAccessPermission(input) {
  const issues = validateCheckAccessPermissionInput(input);

  if (issues.length > 0) {
    throw new AccessPermissionValidationError(issues);
  }

  const objectType = input.objectType.trim();
  const objectId = input.objectId.trim();
  const scope = /** @type {import("./access-permission.d.ts").AccessPermissionScope} */ (
    input.scope.trim()
  );
  const occurredAt = toIsoTimestamp(input.now ?? new Date());

  if (!isActiveAccessPermissionScope(scope)) {
    return Object.freeze({
      allowed: false,
      permission: null,
      reason:
        "BUYER_VIEW is prepared for later buyer-view workflows and is not active by default in Phase 1.",
      occurredAt,
    });
  }

  const listAccessPermissionsForObject = requireRepositoryMethod(
    input.repository,
    "listAccessPermissionsForObject",
  );
  const permissions = await listAccessPermissionsForObject(
    objectType,
    objectId,
    scope,
  );
  const permission = permissions.find((candidate) =>
    canUseAccessPermission(input.actor, candidate, {
      objectType,
      objectId,
      scope,
      now: input.now ?? occurredAt,
    })
  ) ?? null;

  return Object.freeze({
    allowed: Boolean(permission),
    permission,
    reason: permission
      ? "AccessPermission grant matched actor, object, scope and active time window."
      : "No active AccessPermission grant matched actor, object, scope and active time window.",
    occurredAt,
  });
}

/**
 * @param {import("./access-permission.d.ts").CreateAccessPermissionServiceInput} input
 * @returns {Promise<import("./access-permission.d.ts").PersistedAccessPermissionChange>}
 */
export async function createAccessPermission(input) {
  const createPermission = requireRepositoryMethod(
    input.repository,
    "createAccessPermission",
  );
  const prepared = prepareCreateAccessPermission(input);
  const permission = await createPermission(prepared.permission);
  const auditHook = buildAccessPermissionAuditHook({
    action: "ACCESS_PERMISSION_GRANTED",
    permission,
    previousPermission: null,
    reason: permission.grantReason,
    occurredAt: permission.createdAt,
  });
  const auditLog = await createAuditLogFromHook({
    repository: input.repository,
    auditHook,
    requestContext: input.requestContext,
  });

  return Object.freeze({
    permission,
    auditHook,
    auditLog,
  });
}

/**
 * @param {import("./access-permission.d.ts").RevokeAccessPermissionServiceInput} input
 * @returns {Promise<import("./access-permission.d.ts").PersistedAccessPermissionChange>}
 */
export async function revokeAccessPermission(input) {
  const revokePermission = requireRepositoryMethod(
    input.repository,
    "revokeAccessPermission",
  );
  const prepared = prepareRevokeAccessPermission(input);
  const permission = await revokePermission(prepared.permission);
  const auditHook = buildAccessPermissionAuditHook({
    action: "ACCESS_PERMISSION_REVOKED",
    permission,
    previousPermission: input.existingPermission,
    actorOrganizationId: findActivePlatformAdminAssignment(
      input.revokerRoles,
      input.revokedByUserId.trim(),
    )?.organizationId,
    reason: permission.revocationReason,
    occurredAt: permission.revokedAt ?? permission.updatedAt,
  });
  const auditLog = await createAuditLogFromHook({
    repository: input.repository,
    auditHook,
    requestContext: input.requestContext,
  });

  return Object.freeze({
    permission,
    auditHook,
    auditLog,
  });
}

/**
 * @param {import("./access-permission.d.ts").CheckAccessPermissionInput} input
 * @returns {string[]}
 */
function validateCheckAccessPermissionInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["access permission check input is required."];
  }

  validateRequiredNonBlankString(input.objectType, "objectType", issues);
  validateRequiredNonBlankString(input.objectId, "objectId", issues);
  validateRequiredNonBlankString(input.scope, "scope", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  const scope = normalizeRequiredString(input.scope);

  if (scope && !isAccessPermissionScope(scope)) {
    issues.push(`scope must be one of: ${ACCESS_PERMISSION_SCOPES.join(", ")}.`);
  }

  if (!input.actor || typeof input.actor !== "object") {
    issues.push("actor is required.");
  } else {
    validateRequiredNonBlankString(input.actor.userId, "actor.userId", issues);

    if (!Array.isArray(input.actor.roles)) {
      issues.push("actor.roles must list active role context.");
    }
  }

  if (!input.repository || typeof input.repository !== "object") {
    issues.push("repository is required.");
  }

  return issues;
}

/**
 * @param {import("./access-permission.d.ts").AccessPermissionActorContext} actor
 * @param {import("./access-permission.d.ts").AccessPermission} permission
 * @returns {boolean}
 */
function permissionMatchesActor(actor, permission) {
  if (normalizeOptionalString(permission.userId) && actor.userId !== permission.userId) {
    return false;
  }

  const organizationId = normalizeOptionalString(permission.organizationId);
  const roleCode = normalizeOptionalString(permission.roleCode);

  if (!organizationId && !roleCode) {
    return actor.userId === permission.userId;
  }

  return actor.roles.some((assignment) =>
    assignment.userId === actor.userId &&
    isActiveRoleAssignment(assignment) &&
    isPhase1RoleCode(assignment.roleCode) &&
    (organizationId === null || assignment.organizationId === organizationId) &&
    (roleCode === null || assignment.roleCode === roleCode),
  );
}

/**
 * @param {import("./access-permission.d.ts").AccessPermission} permission
 * @returns {Readonly<Record<string, unknown>>}
 */
function permissionAuditValue(permission) {
  return Object.freeze({
    userId: permission.userId,
    organizationId: permission.organizationId,
    roleCode: permission.roleCode,
    objectType: permission.objectType,
    objectId: permission.objectId,
    scope: permission.scope,
    effectiveAt: permission.effectiveAt,
    expiresAt: permission.expiresAt,
    revokedAt: permission.revokedAt,
    revokedByUserId: permission.revokedByUserId,
  });
}

/**
 * @param {import("../identity/role-model.d.ts").UserOrganizationRoleLike[]} roles
 * @param {string} userId
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findActivePlatformAdminAssignment(roles, userId) {
  return roles.find((assignment) =>
    assignment.userId === userId &&
    assignment.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(assignment),
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
 * @param {unknown} start
 * @param {unknown} end
 * @param {string} endFieldName
 * @param {string} startFieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateTimestampOrder(start, end, endFieldName, startFieldName, issues) {
  if (start == null || end == null) {
    return;
  }

  if (!isValidTimestamp(start) || !isValidTimestamp(end)) {
    return;
  }

  if (new Date(end).getTime() < new Date(start).getTime()) {
    issues.push(`${endFieldName} must be greater than or equal to ${startFieldName}.`);
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
