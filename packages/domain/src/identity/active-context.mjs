// @ts-check

import {
  ROLE_METADATA,
  isActiveRoleAssignment,
  isPhase1RoleCode,
} from "./role-model.mjs";

export const ACTIVE_CONTEXT_RESOLUTION_STATUSES = /** @type {const} */ ([
  "RESOLVED",
  "SELECTION_REQUIRED",
  "NO_ACTIVE_CONTEXT",
]);

export class ActiveContextValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech active context input:\n- ${issues.join("\n- ")}`);
    this.name = "ActiveContextValidationError";
    this.issues = issues;
  }
}

/**
 * @param {import("./active-context.d.ts").ResolveActiveContextInput} input
 * @returns {import("./active-context.d.ts").ActiveContextResolution}
 */
export function resolveActiveOrganizationRoleContext(input) {
  const normalized = normalizeResolutionInput(input);
  const availableContexts = buildAvailableContexts(normalized);

  if (availableContexts.length === 0) {
    return Object.freeze({
      status: "NO_ACTIVE_CONTEXT",
      activeContext: null,
      availableContexts,
      reason: "No active Phase 1 organization role exists for this user.",
    });
  }

  if (normalized.selectedContext) {
    const selectedContext = findAvailableContext(availableContexts, normalized.selectedContext);

    if (!selectedContext) {
      throw new ActiveContextValidationError([
        "selectedContext must match an active Phase 1 organization role for this user.",
      ]);
    }

    return Object.freeze({
      status: "RESOLVED",
      activeContext: selectedContext,
      availableContexts,
      reason: "Selected active context was validated against user organization roles.",
    });
  }

  if (availableContexts.length === 1) {
    return Object.freeze({
      status: "RESOLVED",
      activeContext: availableContexts[0],
      availableContexts,
      reason: "Single active organization role was selected automatically.",
    });
  }

  return Object.freeze({
    status: "SELECTION_REQUIRED",
    activeContext: null,
    availableContexts,
    reason: "Multiple active organization roles require an explicit selected context.",
  });
}

/**
 * @param {import("./active-context.d.ts").SwitchActiveContextInput} input
 * @returns {import("./active-context.d.ts").ActiveContextSwitchResult}
 */
export function switchActiveOrganizationRoleContext(input) {
  const selectedContext = normalizeSelectedContext(input?.selectedContext);

  if (!selectedContext) {
    throw new ActiveContextValidationError([
      "selectedContext.organizationId and selectedContext.roleCode are required.",
    ]);
  }

  const resolution = resolveActiveOrganizationRoleContext({
    ...input,
    selectedContext,
  });

  if (resolution.status !== "RESOLVED" || !resolution.activeContext) {
    throw new ActiveContextValidationError([
      "selectedContext could not be resolved for this user.",
    ]);
  }

  return deepFreeze({
    status: "SWITCHED",
    activeContext: resolution.activeContext,
    availableContexts: resolution.availableContexts,
    sessionState: buildActiveContextSessionState(
      resolution.activeContext,
      input?.now,
    ),
  });
}

/**
 * @param {import("./active-context.d.ts").ActiveOrganizationRoleContext} context
 * @param {string | Date} [now]
 * @returns {import("./active-context.d.ts").ActiveContextSessionState}
 */
export function buildActiveContextSessionState(context, now = new Date()) {
  return Object.freeze({
    userId: context.userId,
    activeOrganizationId: context.organizationId,
    activeRoleCode: context.roleCode,
    activeContextKey: buildActiveContextKey(context),
    persistedAt: toIsoTimestamp(now),
  });
}

/**
 * @param {import("./active-context.d.ts").ActiveOrganizationRoleContext} context
 * @returns {string}
 */
export function buildActiveContextKey(context) {
  return `${context.userId}:${context.organizationId}:${context.roleCode}`;
}

/**
 * @param {import("./active-context.d.ts").ActiveOrganizationRoleContext} context
 * @returns {import("./active-context.d.ts").ActiveContextActor}
 */
export function createActorFromActiveContext(context) {
  return Object.freeze({
    userId: context.userId,
    roles: Object.freeze([
      Object.freeze({
        userId: context.userId,
        organizationId: context.organizationId,
        roleCode: context.roleCode,
        revokedAt: null,
      }),
    ]),
  });
}

/**
 * @param {import("./active-context.d.ts").ActiveOrganizationRoleContext} context
 * @returns {import("./active-context.d.ts").ActiveContextAttribution}
 */
export function buildActiveContextAttribution(context) {
  return deepFreeze({
    actorUserId: context.userId,
    actorRoleCode: context.roleCode,
    actorOrganizationId: context.organizationId,
    actorContext: {
      type: "MANAGED_AUTH_ACTOR_CONTEXT",
      userId: context.userId,
      roleCode: context.roleCode,
      organizationId: context.organizationId,
    },
  });
}

/**
 * @param {import("./active-context.d.ts").ActiveOrganizationRoleContext | null | undefined} context
 * @param {import("./role-model.d.ts").Phase1RoleCode} roleCode
 * @param {string} [organizationId]
 * @returns {boolean}
 */
export function activeContextMatches(context, roleCode, organizationId) {
  return Boolean(
    context &&
      context.roleCode === roleCode &&
      (organizationId === undefined || context.organizationId === organizationId),
  );
}

/**
 * @param {import("./active-context.d.ts").ResolveActiveContextInput} input
 * @returns {import("./active-context.d.ts").NormalizedResolveActiveContextInput}
 */
function normalizeResolutionInput(input) {
  const issues = [];
  const userId = normalizeRequiredString(input?.userId);

  if (!userId) {
    issues.push("userId is required.");
  }

  if (!Array.isArray(input?.roleAssignments)) {
    issues.push("roleAssignments must list the user's organization role assignments.");
  }

  if (input?.organizations !== undefined && !Array.isArray(input.organizations)) {
    issues.push("organizations must be an array when provided.");
  }

  const selectedContext = normalizeSelectedContext(input?.selectedContext);

  if (input?.selectedContext != null && !selectedContext) {
    issues.push("selectedContext must include organizationId and active Phase 1 roleCode.");
  }

  if (issues.length > 0) {
    throw new ActiveContextValidationError(issues);
  }

  return {
    userId: /** @type {string} */ (userId),
    roleAssignments: /** @type {import("./role-model.d.ts").UserOrganizationRoleLike[]} */ (
      input.roleAssignments
    ),
    organizations: input.organizations ?? [],
    selectedContext,
  };
}

/**
 * @param {import("./active-context.d.ts").NormalizedResolveActiveContextInput} input
 * @returns {import("./active-context.d.ts").ActiveOrganizationRoleContext[]}
 */
function buildAvailableContexts(input) {
  const organizationsById = new Map(
    input.organizations.map((organization) => [organization.id, organization]),
  );
  const seenKeys = new Set();
  const contexts = [];

  for (const assignment of input.roleAssignments) {
    if (
      assignment.userId !== input.userId ||
      !isActiveRoleAssignment(assignment) ||
      !isPhase1RoleCode(assignment.roleCode)
    ) {
      continue;
    }

    const organization = organizationsById.get(assignment.organizationId);

    if (organization && organization.status !== "ACTIVE") {
      continue;
    }

    const context = {
      userId: input.userId,
      organizationId: assignment.organizationId,
      organizationName: organization?.name ?? assignment.organizationId,
      organizationType: organization?.organizationType ?? null,
      roleCode: assignment.roleCode,
      roleLabel: ROLE_METADATA[assignment.roleCode].displayName,
      assignmentId: "id" in assignment && typeof assignment.id === "string"
        ? assignment.id
        : null,
    };
    const key = buildActiveContextKey(context);

    if (!seenKeys.has(key)) {
      contexts.push(Object.freeze(context));
      seenKeys.add(key);
    }
  }

  return Object.freeze(contexts);
}

/**
 * @param {readonly import("./active-context.d.ts").ActiveOrganizationRoleContext[]} availableContexts
 * @param {import("./active-context.d.ts").ActiveContextSelection} selectedContext
 * @returns {import("./active-context.d.ts").ActiveOrganizationRoleContext | undefined}
 */
function findAvailableContext(availableContexts, selectedContext) {
  return availableContexts.find((context) =>
    context.organizationId === selectedContext.organizationId &&
    context.roleCode === selectedContext.roleCode,
  );
}

/**
 * @param {unknown} value
 * @returns {import("./active-context.d.ts").ActiveContextSelection | null}
 */
function normalizeSelectedContext(value) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = /** @type {{ organizationId?: unknown; roleCode?: unknown }} */ (value);
  const organizationId = normalizeRequiredString(candidate.organizationId);
  const roleCode = normalizeRequiredString(candidate.roleCode);

  if (!organizationId || !isPhase1RoleCode(roleCode)) {
    return null;
  }

  return {
    organizationId,
    roleCode,
  };
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeRequiredString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized === "" ? null : normalized;
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new ActiveContextValidationError(["timestamp must be a valid date."]);
  }

  return date.toISOString();
}

/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);

    for (const nestedValue of Object.values(value)) {
      deepFreeze(nestedValue);
    }
  }

  return value;
}
