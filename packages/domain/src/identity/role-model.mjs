// @ts-check

export const PHASE_1_ROLE_CODES = /** @type {const} */ ([
  "BREEDER",
  "BREEDING_STATION",
  "PLATFORM_ADMIN",
]);

export const PREPARED_FUTURE_ROLE_CODES = /** @type {const} */ ([
  "VET",
  "FEDERATION",
  "SALES_VENUE",
  "BUYER",
  "TECH_SUPPORT",
]);

export const ROLE_CODES = /** @type {const} */ ([
  ...PHASE_1_ROLE_CODES,
  ...PREPARED_FUTURE_ROLE_CODES,
]);

export const ORGANIZATION_TYPES = /** @type {const} */ ([
  "BREEDER",
  "BREEDING_STATION",
  "PLATFORM",
]);

export const USER_STATUSES = /** @type {const} */ ([
  "ACTIVE",
  "DISABLED",
]);

export const ORGANIZATION_STATUSES = /** @type {const} */ ([
  "ACTIVE",
  "DISABLED",
]);

export const ROLE_METADATA = Object.freeze({
  BREEDER: Object.freeze({
    code: "BREEDER",
    phase: "PHASE_1",
    displayName: "Breeder",
    assignableInPhase1: true,
  }),
  BREEDING_STATION: Object.freeze({
    code: "BREEDING_STATION",
    phase: "PHASE_1",
    displayName: "Breeding Station",
    assignableInPhase1: true,
  }),
  PLATFORM_ADMIN: Object.freeze({
    code: "PLATFORM_ADMIN",
    phase: "PHASE_1",
    displayName: "Platform Admin",
    assignableInPhase1: true,
  }),
  VET: Object.freeze({
    code: "VET",
    phase: "FUTURE_PREPARED",
    displayName: "Vet",
    assignableInPhase1: false,
  }),
  FEDERATION: Object.freeze({
    code: "FEDERATION",
    phase: "FUTURE_PREPARED",
    displayName: "Federation",
    assignableInPhase1: false,
  }),
  SALES_VENUE: Object.freeze({
    code: "SALES_VENUE",
    phase: "FUTURE_PREPARED",
    displayName: "Sales Venue",
    assignableInPhase1: false,
  }),
  BUYER: Object.freeze({
    code: "BUYER",
    phase: "FUTURE_PREPARED",
    displayName: "Buyer",
    assignableInPhase1: false,
  }),
  TECH_SUPPORT: Object.freeze({
    code: "TECH_SUPPORT",
    phase: "FUTURE_PREPARED",
    displayName: "Technical Support",
    assignableInPhase1: false,
  }),
});

export class RoleModelValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech role model input:\n- ${issues.join("\n- ")}`);
    this.name = "RoleModelValidationError";
    this.issues = issues;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./role-model.d.ts").RoleCode}
 */
export function isSupportedRoleCode(value) {
  return typeof value === "string" && ROLE_CODES.includes(
    /** @type {import("./role-model.d.ts").RoleCode} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./role-model.d.ts").Phase1RoleCode}
 */
export function isPhase1RoleCode(value) {
  return typeof value === "string" && PHASE_1_ROLE_CODES.includes(
    /** @type {import("./role-model.d.ts").Phase1RoleCode} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./role-model.d.ts").PreparedFutureRoleCode}
 */
export function isPreparedFutureRoleCode(value) {
  return typeof value === "string" && PREPARED_FUTURE_ROLE_CODES.includes(
    /** @type {import("./role-model.d.ts").PreparedFutureRoleCode} */ (value),
  );
}

/**
 * @param {import("./role-model.d.ts").UserOrganizationRoleLike} assignment
 * @returns {boolean}
 */
export function isActiveRoleAssignment(assignment) {
  return assignment.revokedAt == null;
}

/**
 * @param {import("./role-model.d.ts").UserOrganizationRoleLike[]} assignments
 * @param {import("./role-model.d.ts").RoleCode} roleCode
 * @param {string} [organizationId]
 * @returns {boolean}
 */
export function hasActiveRole(assignments, roleCode, organizationId) {
  return assignments.some((assignment) =>
    assignment.roleCode === roleCode &&
    isActiveRoleAssignment(assignment) &&
    (organizationId === undefined || assignment.organizationId === organizationId),
  );
}

/**
 * @param {import("./role-model.d.ts").UserOrganizationRoleLike[]} assignments
 * @returns {import("./role-model.d.ts").OrganizationRoleMembership[]}
 */
export function groupActiveRolesByOrganization(assignments) {
  /** @type {Map<string, Set<import("./role-model.d.ts").RoleCode>>} */
  const memberships = new Map();
  /** @type {Map<string, string>} */
  const organizationNames = new Map();

  for (const assignment of assignments) {
    if (!isActiveRoleAssignment(assignment)) {
      continue;
    }

    const roles = memberships.get(assignment.organizationId) ?? new Set();
    roles.add(assignment.roleCode);
    memberships.set(assignment.organizationId, roles);

    if (typeof assignment.organizationName === "string" && assignment.organizationName.trim()) {
      organizationNames.set(assignment.organizationId, assignment.organizationName.trim());
    }
  }

  return Array.from(memberships.entries()).map(([organizationId, roles]) => {
    const membership = {
      organizationId,
      roles: Array.from(roles),
    };
    const organizationName = organizationNames.get(organizationId);

    return organizationName
      ? {
        ...membership,
        organizationName,
      }
      : membership;
  });
}

/**
 * @param {import("./role-model.d.ts").RoleAssignmentInput} input
 * @returns {string[]}
 */
export function validateRoleAssignmentInput(input) {
  const issues = [];

  const userId = normalizeRequiredString(input.userId);
  const organizationId = normalizeRequiredString(input.organizationId);
  const roleCode = normalizeRequiredString(input.roleCode);
  const assignedByUserId = normalizeRequiredString(input.assignedByUserId);

  if (!userId) {
    issues.push("userId is required.");
  }

  if (!organizationId) {
    issues.push("organizationId is required.");
  }

  if (!assignedByUserId) {
    issues.push("assignedByUserId is required.");
  }

  if (!roleCode) {
    issues.push("roleCode is required.");
  } else if (!isSupportedRoleCode(roleCode)) {
    issues.push(`roleCode must be one of: ${ROLE_CODES.join(", ")}.`);
  } else if (!isPhase1RoleCode(roleCode)) {
    issues.push(`${roleCode} is prepared for later phases and is not assignable in Phase 1.`);
  }

  if (!Array.isArray(input.assignerRoles)) {
    issues.push("assignerRoles must list the assigning user's active role context.");
  } else if (
    assignedByUserId &&
    !findActivePlatformAdminAssignment(input.assignerRoles, assignedByUserId)
  ) {
    issues.push("assignedByUserId must have an active PLATFORM_ADMIN role assignment.");
  }

  if (input.assignmentReason !== undefined && normalizeOptionalString(input.assignmentReason) === null) {
    issues.push("assignmentReason cannot be blank when provided.");
  }

  validateOptionalTimestamp(input.assignedAt, "assignedAt", issues);
  validateOptionalTimestamp(input.effectiveAt, "effectiveAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  return issues;
}

/**
 * @param {import("./role-model.d.ts").RoleAssignmentInput} input
 * @returns {import("./role-model.d.ts").PreparedRoleAssignment}
 */
export function assignUserOrganizationRole(input) {
  const issues = validateRoleAssignmentInput(input);

  if (issues.length > 0) {
    throw new RoleModelValidationError(issues);
  }

  const assignedAt = toIsoTimestamp(input.assignedAt ?? input.now ?? new Date());
  const effectiveAt = toIsoTimestamp(input.effectiveAt ?? assignedAt);
  const assignmentReason = normalizeOptionalString(input.assignmentReason);
  const roleCode = /** @type {import("./role-model.d.ts").Phase1RoleCode} */ (
    input.roleCode.trim()
  );
  const adminAssignment = findActivePlatformAdminAssignment(
    input.assignerRoles,
    input.assignedByUserId.trim(),
  );

  const assignment = Object.freeze({
    id: normalizeOptionalString(input.assignmentId),
    userId: input.userId.trim(),
    organizationId: input.organizationId.trim(),
    roleCode,
    assignedByUserId: input.assignedByUserId.trim(),
    assignmentReason,
    effectiveAt,
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    createdAt: assignedAt,
    updatedAt: assignedAt,
  });

  return Object.freeze({
    assignment,
    auditHook: buildRoleAssignmentAuditHook({
      assignment,
      actorOrganizationId: adminAssignment?.organizationId ?? null,
    }),
  });
}

/**
 * @param {object} options
 * @param {import("./role-model.d.ts").UserOrganizationRole} options.assignment
 * @param {string | null} options.actorOrganizationId
 * @returns {import("./role-model.d.ts").RoleAssignmentAuditHook}
 */
export function buildRoleAssignmentAuditHook({ assignment, actorOrganizationId }) {
  return Object.freeze({
    eventType: "ROLE_ASSIGNMENT",
    action: "ROLE_ASSIGNED",
    actorUserId: assignment.assignedByUserId,
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId,
    targetType: "UserOrganizationRole",
    targetId: assignment.id,
    targetRef: Object.freeze({
      userId: assignment.userId,
      organizationId: assignment.organizationId,
      roleCode: assignment.roleCode,
    }),
    previousValue: null,
    newValue: Object.freeze({
      userId: assignment.userId,
      organizationId: assignment.organizationId,
      roleCode: assignment.roleCode,
      effectiveAt: assignment.effectiveAt,
    }),
    reason: assignment.assignmentReason,
    occurredAt: assignment.createdAt,
  });
}

/**
 * @param {import("./role-model.d.ts").UserOrganizationRoleLike[]} assignments
 * @param {string} userId
 * @returns {import("./role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findActivePlatformAdminAssignment(assignments, userId) {
  return assignments.find((assignment) =>
    assignment.userId === userId &&
    assignment.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(assignment),
  );
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
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}
