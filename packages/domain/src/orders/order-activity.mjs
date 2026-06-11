// @ts-check

import { isActiveRoleAssignment } from "../identity/role-model.mjs";
import { canViewSemenOrder } from "./semen-order.mjs";

export const ORDER_ACTIVITY_TYPES = /** @type {const} */ ([
  "SYSTEM_STATUS",
  "USER_COMMENT",
  "INTERNAL_NOTE",
  "SUPPORT_NOTE",
]);

export const ORDER_ACTIVITY_VISIBILITIES = /** @type {const} */ ([
  "SHARED",
  "STATION_INTERNAL",
  "ADMIN_INTERNAL",
]);

export const ORDER_ACTIVITY_MUTATION_POLICY = Object.freeze({
  replacesAuditLog: false,
  reason:
    "Order activity comments provide operational context. They do not replace workflow status history, proof events or immutable audit logs.",
});

export class OrderActivityValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech order activity input:\n- ${issues.join("\n- ")}`);
    this.name = "OrderActivityValidationError";
    this.issues = issues;
  }
}

export class OrderActivityAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "OrderActivityAuthorizationError";
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./order-activity.d.ts").OrderActivityType}
 */
export function isOrderActivityType(value) {
  return typeof value === "string" && ORDER_ACTIVITY_TYPES.includes(
    /** @type {import("./order-activity.d.ts").OrderActivityType} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./order-activity.d.ts").OrderActivityVisibility}
 */
export function isOrderActivityVisibility(value) {
  return typeof value === "string" && ORDER_ACTIVITY_VISIBILITIES.includes(
    /** @type {import("./order-activity.d.ts").OrderActivityVisibility} */ (value),
  );
}

/**
 * @param {import("./order-activity.d.ts").OrderActivityActorContext} actor
 * @param {import("./semen-order.d.ts").SemenOrderLike} order
 * @returns {boolean}
 */
export function canViewOrderActivity(actor, order) {
  return canViewSemenOrder(actor, order);
}

/**
 * @param {{
 *   actor: import("./order-activity.d.ts").OrderActivityActorContext;
 *   order: import("./semen-order.d.ts").SemenOrderLike;
 *   type?: string | null;
 *   visibility?: string | null;
 * }} input
 * @returns {boolean}
 */
export function canCreateOrderActivity(input) {
  if (!canViewOrderActivity(input.actor, input.order)) {
    return false;
  }

  const type = normalizeOrderActivityType(input.type) ?? "USER_COMMENT";
  const visibility = normalizeOrderActivityVisibility(input.visibility) ?? "SHARED";

  if (type === "SYSTEM_STATUS") {
    return false;
  }

  if (visibility === "ADMIN_INTERNAL" || type === "SUPPORT_NOTE") {
    return hasActiveRole(input.actor, "PLATFORM_ADMIN");
  }

  if (visibility === "STATION_INTERNAL" || type === "INTERNAL_NOTE") {
    return hasActiveRole(input.actor, "BREEDING_STATION") ||
      hasActiveRole(input.actor, "PLATFORM_ADMIN");
  }

  return visibility === "SHARED";
}

/**
 * @param {import("./order-activity.d.ts").CreateOrderActivityInput} input
 */
export async function createOrderActivity(input) {
  const activity = prepareOrderActivity(input);
  const persisted = await input.repository.createOrderActivity(activity);

  return Object.freeze(persisted ?? activity);
}

/**
 * @param {import("./order-activity.d.ts").CreateOrderActivityInput} input
 * @returns {import("./order-activity.d.ts").OrderActivity}
 */
export function prepareOrderActivity(input) {
  const issues = validateCreateOrderActivityInput(input);

  if (issues.length > 0) {
    throw new OrderActivityValidationError(issues);
  }

  const type = normalizeOrderActivityType(input.type) ?? "USER_COMMENT";
  const visibility = normalizeOrderActivityVisibility(input.visibility) ?? "SHARED";

  if (!canCreateOrderActivity({
    actor: input.actor,
    order: input.order,
    type,
    visibility,
  })) {
    throw new OrderActivityAuthorizationError(
      "actor may only comment on orders they are authorized to view, and internal notes require the permitted role.",
    );
  }

  const createdAt = toIsoTimestamp(input.createdAt ?? input.now ?? new Date());

  return Object.freeze({
    id: normalizeOptionalString(input.activityId),
    semenOrderId: normalizeOptionalString(input.order.id) ?? input.order.orderNumber,
    orderNumber: input.order.orderNumber,
    type,
    visibility,
    message: requireNonBlankString(input.message, "message"),
    createdByUserId: input.actor.userId,
    createdByOrganizationId: input.actor.organizationId,
    createdByRole: input.actor.roleCode,
    createdAt,
  });
}

/**
 * @param {import("./order-activity.d.ts").OrderActivityFeedInput} input
 * @returns {readonly import("./order-activity.d.ts").OrderActivityFeedItem[]}
 */
export function createOrderActivityFeed(input) {
  if (!canViewOrderActivity(input.actor, input.order)) {
    throw new OrderActivityAuthorizationError(
      "actor may only view activity for an authorized order.",
    );
  }

  const systemEntries = (input.statusHistory ?? [])
    .filter((history) =>
      matchesOrder(input.order, {
        semenOrderId: history.semenOrderId,
        orderNumber: history.orderNumber,
      })
    )
    .map(toSystemStatusActivity);
  const visibleActivities = filterVisibleOrderActivities({
    actor: input.actor,
    order: input.order,
    activities: input.activities ?? [],
  });

  return Object.freeze(
    [...systemEntries, ...visibleActivities]
      .sort(compareActivityAscending)
      .map(toFeedItem),
  );
}

/**
 * @param {{
 *   actor: import("./order-activity.d.ts").OrderActivityActorContext;
 *   order: import("./semen-order.d.ts").SemenOrderLike;
 *   activities: readonly import("./order-activity.d.ts").OrderActivity[];
 * }} input
 * @returns {readonly import("./order-activity.d.ts").OrderActivity[]}
 */
export function filterVisibleOrderActivities(input) {
  if (!canViewOrderActivity(input.actor, input.order)) {
    return Object.freeze([]);
  }

  return Object.freeze((input.activities ?? []).filter((activity) => {
    if (!matchesOrder(input.order, activity)) {
      return false;
    }

    if (activity.visibility === "SHARED") {
      return true;
    }

    if (activity.visibility === "STATION_INTERNAL") {
      return hasActiveRole(input.actor, "BREEDING_STATION") ||
        hasActiveRole(input.actor, "PLATFORM_ADMIN");
    }

    return hasActiveRole(input.actor, "PLATFORM_ADMIN");
  }));
}

/**
 * @param {import("./order-activity.d.ts").CreateOrderActivityInput | undefined} input
 * @returns {string[]}
 */
export function validateCreateOrderActivityInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["order activity input is required."];
  }

  if (!input.actor || typeof input.actor !== "object") {
    issues.push("actor is required.");
  } else {
    if (!normalizeRequiredString(input.actor.userId)) {
      issues.push("actor.userId is required.");
    }

    if (!normalizeRequiredString(input.actor.organizationId)) {
      issues.push("actor.organizationId is required.");
    }

    if (!normalizeRequiredString(input.actor.roleCode)) {
      issues.push("actor.roleCode is required.");
    }

    if (!Array.isArray(input.actor.roles)) {
      issues.push("actor.roles must list the active role context.");
    }
  }

  if (!input.order || typeof input.order !== "object") {
    issues.push("order is required.");
  } else {
    validateRequiredNonBlankString(input.order.orderNumber, "order.orderNumber", issues);
    validateRequiredNonBlankString(input.order.breederOrganizationId, "order.breederOrganizationId", issues);
    validateRequiredNonBlankString(input.order.breedingStationOrganizationId, "order.breedingStationOrganizationId", issues);
  }

  validateRequiredNonBlankString(input.message, "message", issues);

  if (input.type !== undefined && input.type !== null && !isOrderActivityType(input.type)) {
    issues.push(`type must be one of: ${ORDER_ACTIVITY_TYPES.join(", ")}.`);
  }

  if (
    input.visibility !== undefined &&
    input.visibility !== null &&
    !isOrderActivityVisibility(input.visibility)
  ) {
    issues.push(`visibility must be one of: ${ORDER_ACTIVITY_VISIBILITIES.join(", ")}.`);
  }

  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  return issues;
}

/**
 * @param {import("./semen-order.d.ts").OrderStatusHistory} history
 * @returns {import("./order-activity.d.ts").OrderActivity}
 */
function toSystemStatusActivity(history) {
  const from = history.fromStatus ? `${history.fromStatus} to ` : "";

  return Object.freeze({
    id: history.id ? `status:${history.id}` : null,
    semenOrderId: history.semenOrderId,
    orderNumber: history.orderNumber,
    type: "SYSTEM_STATUS",
    visibility: "SHARED",
    message: `Status changed ${from}${history.toStatus}${history.reason ? `: ${history.reason}` : ""}`,
    createdByUserId: history.actorUserId,
    createdByOrganizationId: history.actorOrganizationId,
    createdByRole: history.actorRoleCode,
    createdAt: history.changedAt,
  });
}

/**
 * @param {import("./order-activity.d.ts").OrderActivity} activity
 * @returns {import("./order-activity.d.ts").OrderActivityFeedItem}
 */
function toFeedItem(activity) {
  return Object.freeze({
    id: activity.id,
    type: activity.type,
    visibility: activity.visibility,
    label: formatActivityLabel(activity.type),
    message: activity.message,
    actorUserId: activity.createdByUserId,
    actorOrganizationId: activity.createdByOrganizationId,
    actorRoleCode: activity.createdByRole,
    createdAt: activity.createdAt,
  });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatActivityLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {import("./order-activity.d.ts").OrderActivity} left
 * @param {import("./order-activity.d.ts").OrderActivity} right
 */
function compareActivityAscending(left, right) {
  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderLike} order
 * @param {{ semenOrderId?: string | null; orderNumber?: string | null }} value
 */
function matchesOrder(order, value) {
  return (
    Boolean(order.id && value.semenOrderId && order.id === value.semenOrderId) ||
    order.orderNumber === value.orderNumber
  );
}

/**
 * @param {import("./order-activity.d.ts").OrderActivityActorContext} actor
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
 * @returns {import("./order-activity.d.ts").OrderActivityType | null}
 */
function normalizeOrderActivityType(value) {
  return isOrderActivityType(value)
    ? /** @type {import("./order-activity.d.ts").OrderActivityType} */ (value)
    : null;
}

/**
 * @param {unknown} value
 * @returns {import("./order-activity.d.ts").OrderActivityVisibility | null}
 */
function normalizeOrderActivityVisibility(value) {
  return isOrderActivityVisibility(value)
    ? /** @type {import("./order-activity.d.ts").OrderActivityVisibility} */ (value)
    : null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function requireNonBlankString(value, label) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new OrderActivityValidationError([`${label} is required.`]);
  }

  return normalized;
}

function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function validateRequiredNonBlankString(value, fieldName, issues) {
  if (!normalizeRequiredString(value)) {
    issues.push(`${fieldName} is required.`);
  }
}

function validateOptionalTimestamp(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (Number.isNaN(new Date(value).getTime())) {
    issues.push(`${fieldName} must be a valid date or ISO timestamp.`);
  }
}

function toIsoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new OrderActivityValidationError(["Timestamp must be a valid date."]);
  }

  return date.toISOString();
}
