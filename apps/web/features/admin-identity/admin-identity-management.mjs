// @ts-check

import {
  ORGANIZATION_STATUSES,
  ORGANIZATION_TYPES,
  PHASE_1_ROLE_CODES,
  USER_STATUSES,
  assignUserOrganizationRole,
  buildRoleAssignmentAuditHook,
  isActiveRoleAssignment,
} from "@coritech/domain/identity/role-model.mjs";
import {
  createAuditLogFromHook,
  prepareAuditLogEntry,
} from "@coritech/domain/audit/audit-log.mjs";

export const ADMIN_IDENTITY_ROUTES = Object.freeze({
  users: "/app/admin/users",
  organizations: "/app/admin/organizations",
  roles: "/app/admin/roles",
  invitations: "/app/admin/invitations",
  audit: "/app/admin/audit",
});

/**
 * @param {import("./admin-identity-management.d.ts").AdminIdentityActorContext} actor
 * @returns {boolean}
 */
export function canManageAdminIdentity(actor) {
  return Boolean(actor?.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {import("./admin-identity-management.d.ts").AdminIdentityViewModelInput} input
 * @returns {import("./admin-identity-management.d.ts").AdminIdentityViewModel}
 */
export function createAdminIdentityViewModel(input) {
  const assignments = input.assignments ?? [];
  const organizationsById = new Map(
    (input.organizations ?? []).map((organization) => [organization.id, organization]),
  );

  return Object.freeze({
    state: "READY",
    routes: ADMIN_IDENTITY_ROUTES,
    canEdit: canManageAdminIdentity(input.actor),
    users: Object.freeze((input.users ?? []).map((user) =>
      Object.freeze({
        ...user,
        activeRoles: Object.freeze(assignments
          .filter((assignment) =>
            assignment.userId === user.id &&
            assignment.revokedAt == null
          )
          .map((assignment) =>
            Object.freeze({
              id: assignment.id,
              organizationId: assignment.organizationId,
              organizationName:
                organizationsById.get(assignment.organizationId)?.name ??
                assignment.organizationId,
              roleCode: assignment.roleCode,
              roleLabel: formatLabel(assignment.roleCode),
            })
          )),
        canDisable: user.status === "ACTIVE",
      })
    )),
    organizations: Object.freeze((input.organizations ?? []).map((organization) =>
      Object.freeze({
        ...organization,
        activeRoleCount: assignments.filter((assignment) =>
          assignment.organizationId === organization.id &&
          assignment.revokedAt == null
        ).length,
        canDisable: organization.status === "ACTIVE",
      })
    )),
    roles: Object.freeze((input.roles ?? []).map((role) =>
      Object.freeze({
        ...role,
        displayLabel: role.displayName || formatLabel(role.code),
        assignmentCount: assignments.filter((assignment) =>
          assignment.roleCode === role.code &&
          assignment.revokedAt == null
        ).length,
      })
    )),
    assignableRoles: PHASE_1_ROLE_CODES,
    organizationTypes: ORGANIZATION_TYPES,
    organizationStatuses: ORGANIZATION_STATUSES,
    userStatuses: USER_STATUSES,
    mutationPolicy: Object.freeze({
      deleteSupported: false,
      reason:
        "Identity administration disables users and organizations or revokes roles; it does not delete critical history.",
    }),
    invitationBoundary: Object.freeze({
      implementedHere: true,
      route: ADMIN_IDENTITY_ROUTES.invitations,
      reason:
        "Invite tokens, queued invitation links and first-time acceptance are managed in the invitation workspace.",
    }),
  });
}

/**
 * @param {import("./admin-identity-management.d.ts").CreateOrganizationForAdminInput} input
 */
export async function createOrganizationForAdmin(input) {
  assertCanManageIdentity(input.actor);
  const organization = await input.repository.createOrganization({
    name: requireNonBlankString(input.name, "Organization name"),
    organizationType: normalizeAllowedOption(input.organizationType, ORGANIZATION_TYPES) ||
      "BREEDER",
    status: "ACTIVE",
  });

  const auditLog = await input.repository.createAuditLog(
    prepareAdminIdentityAuditLog({
      actor: input.actor,
      action: "ORGANIZATION_CREATED",
      objectType: "Organization",
      objectId: organization.id,
      objectRef: {
        name: organization.name,
        organizationType: organization.organizationType,
      },
      previousValues: null,
      newValues: organization,
      reason: normalizeOptionalString(input.reason),
      requestContext: input.requestContext,
      now: input.now,
    }),
  );

  return Object.freeze({ organization, auditLog });
}

/**
 * @param {import("./admin-identity-management.d.ts").UpdateOrganizationForAdminInput} input
 */
export async function updateOrganizationForAdmin(input) {
  assertCanManageIdentity(input.actor);
  const existing = await input.repository.getOrganizationById(
    requireNonBlankString(input.organizationId, "Organization ID"),
  );

  if (!existing) {
    throw new Error("Organization was not found.");
  }

  const organization = await input.repository.updateOrganization({
    ...existing,
    name: requireNonBlankString(input.name, "Organization name"),
    organizationType: normalizeAllowedOption(input.organizationType, ORGANIZATION_TYPES) ||
      existing.organizationType,
  });
  const auditLog = await input.repository.createAuditLog(
    prepareAdminIdentityAuditLog({
      actor: input.actor,
      action: "ORGANIZATION_UPDATED",
      objectType: "Organization",
      objectId: organization.id,
      objectRef: {
        name: organization.name,
        organizationType: organization.organizationType,
      },
      previousValues: existing,
      newValues: organization,
      reason: normalizeOptionalString(input.reason),
      requestContext: input.requestContext,
      now: input.now,
    }),
  );

  return Object.freeze({ organization, auditLog });
}

/**
 * @param {import("./admin-identity-management.d.ts").DisableOrganizationForAdminInput} input
 */
export async function disableOrganizationForAdmin(input) {
  assertCanManageIdentity(input.actor);
  const existing = await input.repository.getOrganizationById(
    requireNonBlankString(input.organizationId, "Organization ID"),
  );

  if (!existing) {
    throw new Error("Organization was not found.");
  }

  const organization = await input.repository.updateOrganization({
    ...existing,
    status: "DISABLED",
  });
  const auditLog = await input.repository.createAuditLog(
    prepareAdminIdentityAuditLog({
      actor: input.actor,
      action: "ORGANIZATION_DISABLED",
      objectType: "Organization",
      objectId: organization.id,
      objectRef: {
        name: organization.name,
        organizationType: organization.organizationType,
      },
      previousValues: existing,
      newValues: organization,
      reason: requireNonBlankString(input.reason, "Disable reason"),
      requestContext: input.requestContext,
      now: input.now,
    }),
  );

  return Object.freeze({ organization, auditLog });
}

/**
 * @param {import("./admin-identity-management.d.ts").DisableUserForAdminInput} input
 */
export async function disableUserForAdmin(input) {
  assertCanManageIdentity(input.actor);
  const existing = await input.repository.getUserById(
    requireNonBlankString(input.userId, "User ID"),
  );

  if (!existing) {
    throw new Error("User was not found.");
  }

  const user = await input.repository.updateUser({
    ...existing,
    status: "DISABLED",
  });
  const auditLog = await input.repository.createAuditLog(
    prepareAdminIdentityAuditLog({
      actor: input.actor,
      action: "USER_DISABLED",
      objectType: "User",
      objectId: user.id,
      objectRef: {
        email: user.email,
        displayName: user.displayName,
      },
      previousValues: existing,
      newValues: user,
      reason: requireNonBlankString(input.reason, "Disable reason"),
      requestContext: input.requestContext,
      now: input.now,
    }),
  );

  return Object.freeze({ user, auditLog });
}

/**
 * @param {import("./admin-identity-management.d.ts").AssignRoleForAdminInput} input
 */
export async function assignRoleForAdmin(input) {
  assertCanManageIdentity(input.actor);
  const userId = requireNonBlankString(input.userId, "User");
  const organizationId = requireNonBlankString(input.organizationId, "Organization");
  const roleCode = normalizeAllowedOption(input.roleCode, PHASE_1_ROLE_CODES);

  if (!roleCode) {
    throw new Error("Select an assignable Phase 1 role.");
  }

  const [user, organization, existingAssignments] = await Promise.all([
    input.repository.getUserById(userId),
    input.repository.getOrganizationById(organizationId),
    input.repository.listUserOrganizationRoles(),
  ]);

  if (!user || user.status !== "ACTIVE") {
    throw new Error("Select an active user.");
  }

  if (!organization || organization.status !== "ACTIVE") {
    throw new Error("Select an active organization.");
  }

  if (existingAssignments.some((assignment) =>
    assignment.userId === userId &&
    assignment.organizationId === organizationId &&
    assignment.roleCode === roleCode &&
    assignment.revokedAt == null
  )) {
    throw new Error("That user already has this active role in the organization.");
  }

  const prepared = assignUserOrganizationRole({
    userId,
    organizationId,
    roleCode,
    assignedByUserId: input.actor.userId,
    assignerRoles: input.actor.roles,
    assignmentReason: normalizeOptionalString(input.reason),
    now: input.now,
  });
  const assignment = await input.repository.createUserOrganizationRole(
    prepared.assignment,
  );
  const auditHook = buildRoleAssignmentAuditHook({
    assignment,
    actorOrganizationId: input.actor.organizationId,
  });
  const auditLog = await createAuditLogFromHook({
    repository: input.repository,
    auditHook,
    requestContext: input.requestContext,
  });

  return Object.freeze({
    assignment,
    auditHook,
    auditLog,
  });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {import("./admin-identity-management.d.ts").AdminIdentityActorContext} actor
 */
function assertCanManageIdentity(actor) {
  if (!canManageAdminIdentity(actor)) {
    throw new Error("Only active Platform Admin users can manage users and organizations.");
  }
}

/**
 * @param {{
 *   actor: import("./admin-identity-management.d.ts").AdminIdentityActorContext,
 *   action: string,
 *   objectType: string,
 *   objectId: string,
 *   objectRef: Record<string, unknown>,
 *   previousValues: Record<string, unknown> | null,
 *   newValues: Record<string, unknown> | null,
 *   reason?: string | null,
 *   requestContext?: import("@coritech/domain/audit/audit-log.d.ts").AuditRequestContext | null,
 *   now?: string | Date,
 * }} input
 */
function prepareAdminIdentityAuditLog(input) {
  return prepareAuditLogEntry({
    actorUserId: input.actor.userId,
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: input.actor.organizationId,
    action: "ADMIN_EDIT",
    sourceAction: input.action,
    objectType: input.objectType,
    objectId: input.objectId,
    objectRef: input.objectRef,
    previousValues: input.previousValues,
    newValues: input.newValues,
    reason: input.reason,
    ipAddress: input.requestContext?.ipAddress,
    userAgent: input.requestContext?.userAgent,
    metadata: {
      source: "ADMIN_IDENTITY_MANAGEMENT",
    },
    occurredAt: input.now,
  });
}

/**
 * @template {string} T
 * @param {unknown} value
 * @param {readonly T[]} options
 * @returns {T | ""}
 */
function normalizeAllowedOption(value, options) {
  const normalized = normalizeOptionalString(value);

  return normalized && options.includes(/** @type {T} */ (normalized))
    ? /** @type {T} */ (normalized)
    : "";
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string}
 */
function requireNonBlankString(value, label) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
