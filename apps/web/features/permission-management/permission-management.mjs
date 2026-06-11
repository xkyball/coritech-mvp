// @ts-check

import {
  ACTIVE_ACCESS_PERMISSION_SCOPES,
  createAccessPermission,
  isActiveAccessPermissionScope,
  revokeAccessPermission,
} from "@coritech/domain/access/access-permission.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";

export const PERMISSION_MANAGEMENT_ROUTES = Object.freeze({
  index: "/app/admin/permissions",
  audit: "/app/admin/audit",
});

export const PERMISSION_OBJECT_TYPE_OPTIONS = Object.freeze([
  "SemenOrder",
  "Shipment",
  "Document",
  "ProofEvent",
]);

export const PERMISSION_SUBJECT_TYPE_OPTIONS = Object.freeze([
  "user",
  "organization",
]);

export const PERMISSION_STATUS_FILTER_OPTIONS = Object.freeze([
  "",
  "active",
  "expired",
  "revoked",
]);

const DEFAULT_PAGE_SIZE = 25;

/**
 * @param {import("./permission-management.d.ts").PermissionManagementActorContext} actor
 * @returns {boolean}
 */
export function canManageAccessPermissions(actor) {
  return Boolean(actor?.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {import("./permission-management.d.ts").PermissionManagementViewModelInput} input
 * @returns {import("./permission-management.d.ts").PermissionManagementViewModel}
 */
export function createPermissionManagementViewModel(input) {
  const filters = normalizePermissionFilters(input.filters ?? {});
  const usersById = new Map((input.users ?? []).map((user) => [user.id, user]));
  const organizationsById = new Map(
    (input.organizations ?? []).map((organization) => [organization.id, organization]),
  );
  const now = input.now ?? new Date();
  const filteredPermissions = input.permissions.filter((permission) =>
    matchesFilters(permission, filters, now)
  );
  const pagination = paginate(filteredPermissions, filters.page, filters.pageSize);

  return Object.freeze({
    state: "READY",
    routes: PERMISSION_MANAGEMENT_ROUTES,
    canEdit: canManageAccessPermissions(input.actor),
    filters,
    scopeOptions: ACTIVE_ACCESS_PERMISSION_SCOPES,
    objectTypeOptions: PERMISSION_OBJECT_TYPE_OPTIONS,
    subjectTypeOptions: PERMISSION_SUBJECT_TYPE_OPTIONS,
    statusOptions: PERMISSION_STATUS_FILTER_OPTIONS,
    users: Object.freeze(input.users ?? []),
    organizations: Object.freeze(input.organizations ?? []),
    rows: Object.freeze(
      pagination.items.map((permission) =>
        toPermissionRow(permission, usersById, organizationsById, now)
      ),
    ),
    pagination: Object.freeze({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: filteredPermissions.length,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPreviousPage: pagination.page > 1,
      previousHref: buildPermissionManagementHref(filters, {
        page: Math.max(1, pagination.page - 1),
      }),
      nextHref: buildPermissionManagementHref(filters, {
        page: pagination.page + 1,
      }),
    }),
  });
}

/**
 * @param {import("./permission-management.d.ts").GrantManagedAccessPermissionInput} input
 */
export async function grantManagedAccessPermission(input) {
  assertCanManagePermissions(input.actor);
  const normalized = normalizeGrantInput(input);

  return createAccessPermission({
    repository: input.repository,
    requestContext: input.requestContext,
    userId: normalized.subjectType === "user" ? normalized.userId : null,
    organizationId: normalized.subjectType === "organization"
      ? normalized.organizationId
      : null,
    objectType: normalized.objectType,
    objectId: normalized.objectId,
    scope: normalized.scope,
    grantReason: normalized.grantReason,
    expiresAt: normalized.expiresAt,
    grantedByUserId: input.actor.userId,
    grantorRoles: input.actor.roles,
    now: input.now,
  });
}

/**
 * @param {import("./permission-management.d.ts").RevokeManagedAccessPermissionInput} input
 */
export async function revokeManagedAccessPermission(input) {
  assertCanManagePermissions(input.actor);
  const permissionId = normalizeOptionalString(input.permissionId);

  if (!permissionId) {
    throw new Error("permissionId is required.");
  }

  const existingPermission = await input.repository.getAccessPermissionById(permissionId);

  if (!existingPermission) {
    throw new Error("Access permission was not found.");
  }

  return revokeAccessPermission({
    repository: input.repository,
    requestContext: input.requestContext,
    existingPermission,
    revokedByUserId: input.actor.userId,
    revokerRoles: input.actor.roles,
    revocationReason: normalizeOptionalString(input.revocationReason) ??
      "Revoked by Platform Admin.",
    now: input.now,
  });
}

/**
 * @param {Record<string, unknown>} input
 * @returns {import("./permission-management.d.ts").PermissionManagementFilters}
 */
export function normalizePermissionFilters(input) {
  return Object.freeze({
    objectType: normalizeAllowedOption(
      input.objectType,
      PERMISSION_OBJECT_TYPE_OPTIONS,
    ),
    objectId: normalizeOptionalString(input.objectId) ?? "",
    userId: normalizeOptionalString(input.userId) ?? "",
    organizationId: normalizeOptionalString(input.organizationId) ?? "",
    scope: normalizeAllowedOption(input.scope, ACTIVE_ACCESS_PERMISSION_SCOPES),
    status: normalizeAllowedOption(input.status, PERMISSION_STATUS_FILTER_OPTIONS),
    page: normalizePositiveInteger(input.page, 1),
    pageSize: normalizeBoundedInteger(input.pageSize, DEFAULT_PAGE_SIZE, 1, 100),
  });
}

/**
 * @param {import("./permission-management.d.ts").PermissionManagementFilters} filters
 * @param {Partial<import("./permission-management.d.ts").PermissionManagementFilters>} [override]
 * @returns {string}
 */
export function buildPermissionManagementHref(filters, override = {}) {
  const nextFilters = normalizePermissionFilters({
    ...filters,
    ...override,
  });
  const params = new URLSearchParams();

  for (const key of [
    "objectType",
    "objectId",
    "userId",
    "organizationId",
    "scope",
    "status",
  ]) {
    const value = nextFilters[key];

    if (value) {
      params.set(key, String(value));
    }
  }

  params.set("pageSize", String(nextFilters.pageSize));
  params.set("page", String(nextFilters.page));

  return `${PERMISSION_MANAGEMENT_ROUTES.index}?${params.toString()}`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatPermissionLabel(value) {
  return String(value ?? "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {import("./permission-management.d.ts").PermissionManagementActorContext} actor
 */
function assertCanManagePermissions(actor) {
  if (!canManageAccessPermissions(actor)) {
    throw new Error("Only active Platform Admin users can manage access permissions.");
  }
}

/**
 * @param {import("./permission-management.d.ts").GrantManagedAccessPermissionInput} input
 */
function normalizeGrantInput(input) {
  const subjectType = normalizeAllowedOption(
    input.subjectType,
    PERMISSION_SUBJECT_TYPE_OPTIONS,
  );
  const objectType = normalizeAllowedOption(
    input.objectType,
    PERMISSION_OBJECT_TYPE_OPTIONS,
  );
  const scope = normalizeAllowedOption(input.scope, ACTIVE_ACCESS_PERMISSION_SCOPES);
  const userId = normalizeOptionalString(input.userId);
  const organizationId = normalizeOptionalString(input.organizationId);

  if (!subjectType) {
    throw new Error("Select whether the grant is for a user or organization.");
  }

  if (subjectType === "user" && !userId) {
    throw new Error("Select a user for the permission grant.");
  }

  if (subjectType === "organization" && !organizationId) {
    throw new Error("Select an organization for the permission grant.");
  }

  if (!objectType) {
    throw new Error("Select a supported Phase 1 object type.");
  }

  if (!scope || !isActiveAccessPermissionScope(scope)) {
    throw new Error("Select an active Phase 1 permission scope.");
  }

  return Object.freeze({
    subjectType,
    userId,
    organizationId,
    objectType,
    objectId: requireNonBlankString(input.objectId, "Object ID"),
    scope,
    grantReason: normalizeOptionalString(input.grantReason),
    expiresAt: normalizeOptionalString(input.expiresAt),
  });
}

/**
 * @param {import("@coritech/domain/access/access-permission.d.ts").AccessPermission} permission
 * @param {import("./permission-management.d.ts").PermissionManagementFilters} filters
 * @param {string | Date} now
 */
function matchesFilters(permission, filters, now) {
  if (filters.objectType && permission.objectType !== filters.objectType) {
    return false;
  }

  if (filters.objectId && permission.objectId !== filters.objectId) {
    return false;
  }

  if (filters.userId && permission.userId !== filters.userId) {
    return false;
  }

  if (filters.organizationId && permission.organizationId !== filters.organizationId) {
    return false;
  }

  if (filters.scope && permission.scope !== filters.scope) {
    return false;
  }

  return !filters.status || permissionStatus(permission, now) === filters.status;
}

/**
 * @param {import("@coritech/domain/access/access-permission.d.ts").AccessPermission} permission
 * @param {Map<string, import("./permission-management.d.ts").PermissionUserOption>} usersById
 * @param {Map<string, import("./permission-management.d.ts").PermissionOrganizationOption>} organizationsById
 * @param {string | Date} now
 * @returns {import("./permission-management.d.ts").PermissionManagementRow}
 */
function toPermissionRow(permission, usersById, organizationsById, now) {
  const status = permissionStatus(permission, now);

  return Object.freeze({
    id: permission.id,
    subjectLabel: subjectLabel(permission, usersById, organizationsById),
    subjectType: permission.userId ? "User" : "Organization",
    objectLabel: `${permission.objectType} ${permission.objectId}`,
    objectType: permission.objectType,
    objectId: permission.objectId,
    scope: permission.scope,
    scopeLabel: formatPermissionLabel(permission.scope),
    status,
    statusLabel: formatPermissionLabel(status),
    effectiveAt: formatDateTime(permission.effectiveAt),
    expiresAt: permission.expiresAt ? formatDateTime(permission.expiresAt) : "No expiry",
    grantReason: permission.grantReason ?? "Not recorded",
    revocationReason: permission.revocationReason ?? "",
    auditHref: buildAuditHref(permission),
    canRevoke: Boolean(permission.id && status !== "revoked"),
  });
}

/**
 * @param {import("@coritech/domain/access/access-permission.d.ts").AccessPermission} permission
 * @param {Map<string, import("./permission-management.d.ts").PermissionUserOption>} usersById
 * @param {Map<string, import("./permission-management.d.ts").PermissionOrganizationOption>} organizationsById
 */
function subjectLabel(permission, usersById, organizationsById) {
  if (permission.userId) {
    const user = usersById.get(permission.userId);
    return user ? `${user.displayName} <${user.email}>` : permission.userId;
  }

  if (permission.organizationId) {
    return organizationsById.get(permission.organizationId)?.name ??
      permission.organizationId;
  }

  return "Unsupported subject";
}

/**
 * @param {import("@coritech/domain/access/access-permission.d.ts").AccessPermission} permission
 * @param {string | Date} now
 * @returns {import("./permission-management.d.ts").PermissionStatus}
 */
function permissionStatus(permission, now) {
  if (permission.revokedAt != null) {
    return "revoked";
  }

  if (permission.expiresAt != null && new Date(permission.expiresAt) <= new Date(now)) {
    return "expired";
  }

  return "active";
}

/**
 * @param {import("@coritech/domain/access/access-permission.d.ts").AccessPermission} permission
 */
function buildAuditHref(permission) {
  const params = new URLSearchParams({
    objectType: "AccessPermission",
    objectId: permission.id ?? "",
    action: "CHANGE_PERMISSION",
  });

  return `${PERMISSION_MANAGEMENT_ROUTES.audit}?${params.toString()}`;
}

/**
 * @template T
 * @param {readonly T[]} items
 * @param {number} requestedPage
 * @param {number} pageSize
 */
function paginate(items, requestedPage, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (page - 1) * pageSize;

  return Object.freeze({
    items: items.slice(start, start + pageSize),
    page,
    pageSize,
    totalPages,
  });
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
 * @param {number} fallback
 * @returns {number}
 */
function normalizePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function normalizeBoundedInteger(value, fallback, min, max) {
  return Math.min(max, Math.max(min, normalizePositiveInteger(value, fallback)));
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function formatDateTime(value) {
  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "Invalid date" : date.toISOString();
}
