// @ts-check

import { isActiveRoleAssignment } from "../identity/role-model.mjs";
import { canViewSemenOrder } from "../orders/semen-order.mjs";

export const SUPPORT_REQUEST_OBJECT_TYPES = /** @type {const} */ ([
  "SemenOrder",
]);

export const SUPPORT_REQUEST_CATEGORIES = /** @type {const} */ ([
  "ORDER_STATUS",
  "DOCUMENT_ACCESS",
  "SHIPMENT",
  "PAYMENT_REFERENCE",
  "ACCOUNT_ACCESS",
  "OTHER",
]);

export const SUPPORT_REQUEST_STATUSES = /** @type {const} */ ([
  "OPEN",
  "IN_REVIEW",
  "RESOLVED",
  "CLOSED",
]);

export const SUPPORT_REQUEST_NOTIFICATION_STATUSES = /** @type {const} */ ([
  "QUEUED",
  "SENT",
  "FAILED",
]);

export class SupportRequestValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech support request input:\n- ${issues.join("\n- ")}`);
    this.name = "SupportRequestValidationError";
    this.issues = issues;
  }
}

export class SupportRequestAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "SupportRequestAuthorizationError";
  }
}

/**
 * @param {import("./support-request.d.ts").SupportRequestActorContext} actor
 * @param {import("../orders/semen-order.d.ts").SemenOrderLike} order
 * @returns {boolean}
 */
export function canCreateSupportRequest(actor, order) {
  return (
    (hasActiveRole(actor, "BREEDER") || hasActiveRole(actor, "BREEDING_STATION")) &&
    canViewSemenOrder(actor, order)
  );
}

/**
 * @param {import("./support-request.d.ts").SupportRequestActorContext} actor
 * @returns {boolean}
 */
export function canListAdminSupportRequests(actor) {
  return hasActiveRole(actor, "PLATFORM_ADMIN");
}

/**
 * @param {import("./support-request.d.ts").CreateSupportRequestInput} input
 * @returns {Promise<import("./support-request.d.ts").CreateSupportRequestResult>}
 */
export async function createSupportRequest(input) {
  const supportRequest = prepareSupportRequest(input);
  const persisted = await input.repository.createSupportRequest(supportRequest);

  return Object.freeze({
    supportRequest: Object.freeze(persisted),
    notificationHook: buildSupportRequestNotificationHook(persisted),
  });
}

/**
 * @param {import("./support-request.d.ts").CreateSupportRequestInput} input
 * @returns {import("./support-request.d.ts").SupportRequest}
 */
export function prepareSupportRequest(input) {
  const issues = validateCreateSupportRequestInput(input);

  if (issues.length > 0) {
    throw new SupportRequestValidationError(issues);
  }

  if (!canCreateSupportRequest(input.actor, input.order)) {
    throw new SupportRequestAuthorizationError(
      "actor may only create support requests for orders they are authorized to view.",
    );
  }

  const timestamp = toIsoTimestamp(input.now ?? new Date());
  const category = normalizeSupportRequestCategory(input.category) ?? "OTHER";

  return Object.freeze({
    id: normalizeOptionalString(input.requestId),
    objectType: "SemenOrder",
    objectId: requireNonBlankString(input.order.id, "order.id"),
    objectRef: Object.freeze({
      orderNumber: input.order.orderNumber,
      breederOrganizationId: input.order.breederOrganizationId,
      breedingStationOrganizationId: input.order.breedingStationOrganizationId,
      status: input.order.status,
    }),
    category,
    message: requireNonBlankString(input.message, "message"),
    status: "OPEN",
    createdByUserId: input.actor.userId,
    createdByOrganizationId: input.actor.organizationId,
    createdByRole: input.actor.roleCode,
    adminNotificationStatus: "QUEUED",
    adminNotificationQueuedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

/**
 * @param {import("./support-request.d.ts").ListAdminSupportRequestsInput} input
 * @returns {Promise<readonly import("./support-request.d.ts").SupportRequest[]>}
 */
export async function listAdminSupportRequests(input) {
  if (!canListAdminSupportRequests(input.actor)) {
    throw new SupportRequestAuthorizationError(
      "only Platform Admin users can view support requests.",
    );
  }

  return Object.freeze(await input.repository.listSupportRequests(input.filters ?? {}));
}

/**
 * @param {import("./support-request.d.ts").SupportRequest} supportRequest
 * @returns {import("./support-request.d.ts").SupportRequestNotificationHook}
 */
export function buildSupportRequestNotificationHook(supportRequest) {
  return Object.freeze({
    eventType: "SUPPORT_REQUEST_CREATED",
    channel: "ADMIN_QUEUE",
    queued: true,
    supportRequestId: supportRequest.id,
    objectType: supportRequest.objectType,
    objectId: supportRequest.objectId,
    createdByUserId: supportRequest.createdByUserId,
    createdByOrganizationId: supportRequest.createdByOrganizationId,
    category: supportRequest.category,
    occurredAt: supportRequest.adminNotificationQueuedAt ?? supportRequest.createdAt,
  });
}

/**
 * @param {import("./support-request.d.ts").CreateSupportRequestInput | undefined} input
 * @returns {string[]}
 */
export function validateCreateSupportRequestInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["support request input is required."];
  }

  if (!input.actor || typeof input.actor !== "object") {
    issues.push("actor is required.");
  } else {
    validateRequiredNonBlankString(input.actor.userId, "actor.userId", issues);
    validateRequiredNonBlankString(input.actor.organizationId, "actor.organizationId", issues);
    validateRequiredNonBlankString(input.actor.roleCode, "actor.roleCode", issues);

    if (!Array.isArray(input.actor.roles)) {
      issues.push("actor.roles must list the active role context.");
    }
  }

  if (!input.order || typeof input.order !== "object") {
    issues.push("order is required.");
  } else {
    validateRequiredNonBlankString(input.order.id, "order.id", issues);
    validateRequiredNonBlankString(input.order.orderNumber, "order.orderNumber", issues);
    validateRequiredNonBlankString(input.order.breederOrganizationId, "order.breederOrganizationId", issues);
    validateRequiredNonBlankString(input.order.breedingStationOrganizationId, "order.breedingStationOrganizationId", issues);
  }

  validateRequiredNonBlankString(input.message, "message", issues);

  if (
    input.category !== undefined &&
    input.category !== null &&
    !isSupportRequestCategory(input.category)
  ) {
    issues.push(`category must be one of: ${SUPPORT_REQUEST_CATEGORIES.join(", ")}.`);
  }

  if (input.now !== undefined && input.now !== null && Number.isNaN(new Date(input.now).getTime())) {
    issues.push("now must be a valid date or ISO timestamp.");
  }

  return issues;
}

/**
 * @param {unknown} value
 * @returns {value is import("./support-request.d.ts").SupportRequestCategory}
 */
function isSupportRequestCategory(value) {
  return typeof value === "string" && SUPPORT_REQUEST_CATEGORIES.includes(
    /** @type {import("./support-request.d.ts").SupportRequestCategory} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {import("./support-request.d.ts").SupportRequestCategory | null}
 */
function normalizeSupportRequestCategory(value) {
  return isSupportRequestCategory(value)
    ? /** @type {import("./support-request.d.ts").SupportRequestCategory} */ (value)
    : null;
}

/**
 * @param {import("./support-request.d.ts").SupportRequestActorContext} actor
 * @param {string} roleCode
 */
function hasActiveRole(actor, roleCode) {
  return Boolean(actor.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === roleCode &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function requireNonBlankString(value, fieldName) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new SupportRequestValidationError([`${fieldName} is required.`]);
  }

  return normalized;
}

function validateRequiredNonBlankString(value, fieldName, issues) {
  if (!normalizeOptionalString(value)) {
    issues.push(`${fieldName} is required.`);
  }
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function toIsoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new SupportRequestValidationError(["Timestamp must be a valid date."]);
  }

  return date.toISOString();
}
