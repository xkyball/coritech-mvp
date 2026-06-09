// @ts-check

import { isSemenListingOrderable } from "../catalog/semen-catalog.mjs";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";

export const SEMEN_ORDER_STATUSES = /** @type {const} */ ([
  "DRAFT",
  "SUBMITTED",
  "RECEIVED",
  "CONFIRMED",
  "REJECTED",
  "IN_FULFILMENT",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);

export const SEMEN_ORDER_STATUS_AUDIT_ACTIONS = /** @type {const} */ ([
  "SEMEN_ORDER_DRAFT_CREATED",
  "SEMEN_ORDER_SUBMITTED",
  "SEMEN_ORDER_RECEIVED",
  "SEMEN_ORDER_CONFIRMED",
  "SEMEN_ORDER_REJECTED",
  "SEMEN_ORDER_IN_FULFILMENT",
  "SEMEN_ORDER_SHIPPED",
  "SEMEN_ORDER_DELIVERED",
  "SEMEN_ORDER_COMPLETED",
  "SEMEN_ORDER_CANCELLED",
]);

export const SEMEN_ORDER_STATUS_TRANSITIONS = Object.freeze({
  DRAFT: Object.freeze(["SUBMITTED", "CANCELLED"]),
  SUBMITTED: Object.freeze(["RECEIVED", "CANCELLED"]),
  RECEIVED: Object.freeze(["CONFIRMED", "REJECTED", "CANCELLED"]),
  CONFIRMED: Object.freeze(["IN_FULFILMENT", "CANCELLED"]),
  REJECTED: Object.freeze([]),
  IN_FULFILMENT: Object.freeze(["SHIPPED", "CANCELLED"]),
  SHIPPED: Object.freeze(["DELIVERED"]),
  DELIVERED: Object.freeze(["COMPLETED"]),
  COMPLETED: Object.freeze([]),
  CANCELLED: Object.freeze([]),
});

export const SEMEN_ORDER_ROUTES = Object.freeze([
  Object.freeze({
    method: "POST",
    path: "/semen-orders",
    handler: "createDraftSemenOrderEndpoint",
    access: "BREEDER-owned organization or PLATFORM_ADMIN support override",
  }),
  Object.freeze({
    method: "POST",
    path: "/semen-orders/:orderId/status-transitions",
    handler: "transitionSemenOrderStatusEndpoint",
    access: "BREEDER, assigned BREEDING_STATION, or PLATFORM_ADMIN by transition",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-orders/:orderId",
    handler: "getSemenOrderEndpoint",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-orders/:orderId/status-history",
    handler: "listOrderStatusHistoryEndpoint",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or PLATFORM_ADMIN",
  }),
]);

const STATUS_AUDIT_ACTION_BY_STATUS = Object.freeze({
  DRAFT: "SEMEN_ORDER_DRAFT_CREATED",
  SUBMITTED: "SEMEN_ORDER_SUBMITTED",
  RECEIVED: "SEMEN_ORDER_RECEIVED",
  CONFIRMED: "SEMEN_ORDER_CONFIRMED",
  REJECTED: "SEMEN_ORDER_REJECTED",
  IN_FULFILMENT: "SEMEN_ORDER_IN_FULFILMENT",
  SHIPPED: "SEMEN_ORDER_SHIPPED",
  DELIVERED: "SEMEN_ORDER_DELIVERED",
  COMPLETED: "SEMEN_ORDER_COMPLETED",
  CANCELLED: "SEMEN_ORDER_CANCELLED",
});

export class SemenOrderValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech semen order input:\n- ${issues.join("\n- ")}`);
    this.name = "SemenOrderValidationError";
    this.issues = issues;
  }
}

export class SemenOrderAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "SemenOrderAuthorizationError";
  }
}

export class SemenOrderNotFoundError extends Error {
  /**
   * @param {string} entityName
   * @param {string} entityId
   */
  constructor(entityName, entityId) {
    super(`${entityName} was not found: ${entityId}`);
    this.name = "SemenOrderNotFoundError";
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./semen-order.d.ts").SemenOrderStatus}
 */
export function isSemenOrderStatus(value) {
  return typeof value === "string" && SEMEN_ORDER_STATUSES.includes(
    /** @type {import("./semen-order.d.ts").SemenOrderStatus} */ (value),
  );
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderActorContext} actor
 * @param {import("./semen-order.d.ts").SemenOrderLike} order
 * @returns {boolean}
 */
export function canViewSemenOrder(actor, order) {
  return Boolean(
    findActorRole(actor, "PLATFORM_ADMIN") ||
    findActorRole(actor, "BREEDER", order.breederOrganizationId) ||
    findActorRole(actor, "BREEDING_STATION", order.breedingStationOrganizationId),
  );
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderActorContext} actor
 * @param {import("./semen-order.d.ts").SemenOrderLike} order
 * @param {import("./semen-order.d.ts").SemenOrderStatus} toStatus
 * @returns {boolean}
 */
export function canTransitionSemenOrderStatus(actor, order, toStatus) {
  if (!order || !isSemenOrderStatus(order.status) || !isSemenOrderStatus(toStatus)) {
    return false;
  }

  if (!isAllowedStatusTransition(order.status, toStatus)) {
    return false;
  }

  return Boolean(findTransitionActorRole(actor, order, toStatus));
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderNumberInput} input
 * @returns {string}
 */
export function generateSemenOrderNumber(input) {
  const issues = [];

  if (!Number.isInteger(input.sequence) || input.sequence <= 0) {
    issues.push("orderNumberSequence must be a positive integer.");
  }

  validateOptionalTimestamp(input.occurredAt, "occurredAt", issues);

  if (issues.length > 0) {
    throw new SemenOrderValidationError(issues);
  }

  const datePart = toIsoTimestamp(input.occurredAt ?? new Date())
    .slice(0, 10)
    .replace(/-/g, "");
  const sequencePart = String(input.sequence).padStart(6, "0");

  return `SO-${datePart}-${sequencePart}`;
}

/**
 * @param {import("./semen-order.d.ts").CreateDraftSemenOrderInput} input
 * @returns {string[]}
 */
export function validateCreateDraftSemenOrderInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);

  issues.push(...actorIssues);

  if (!input.listing) {
    issues.push("listing is required.");
  } else {
    if (!normalizeRequiredString(input.listing.id)) {
      issues.push("listing.id is required.");
    }

    if (!normalizeRequiredString(input.listing.breedingStationOrganizationId)) {
      issues.push("listing.breedingStationOrganizationId is required.");
    }

    if (!isSemenListingOrderable(input.listing)) {
      issues.push(
        "semen listing must be ACTIVE and not UNAVAILABLE before an order can be created.",
      );
    }
  }

  const breederOrganizationId = normalizeRequiredString(input.breederOrganizationId);

  if (!breederOrganizationId) {
    issues.push("breederOrganizationId is required.");
  } else if (
    actorIssues.length === 0 &&
    !findCreateDraftActorRole(input.actor, breederOrganizationId)
  ) {
    issues.push(
      "actor must be an active BREEDER user for the breeder organization or PLATFORM_ADMIN.",
    );
  }

  validateOptionalNonBlankString(input.orderId, "orderId", issues);
  validateOptionalNonBlankString(input.orderNumber, "orderNumber", issues);
  validateOptionalNonBlankString(input.statusHistoryId, "statusHistoryId", issues);
  validateOptionalNonBlankString(input.reason, "reason", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (!normalizeOptionalString(input.orderNumber)) {
    if (
      !Number.isInteger(input.orderNumberSequence) ||
      Number(input.orderNumberSequence) <= 0
    ) {
      issues.push("orderNumberSequence is required to generate an order number.");
    }
  }

  return issues;
}

/**
 * @param {import("./semen-order.d.ts").CreateDraftSemenOrderInput} input
 * @returns {import("./semen-order.d.ts").PreparedSemenOrderStatusChange}
 */
export function prepareCreateDraftSemenOrder(input) {
  const issues = validateCreateDraftSemenOrderInput(input);

  if (issues.length > 0) {
    throw new SemenOrderValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.createdAt ?? input.now ?? new Date());
  const breederOrganizationId = input.breederOrganizationId.trim();
  const actorRole = findCreateDraftActorRole(input.actor, breederOrganizationId);

  if (!actorRole) {
    throw new SemenOrderAuthorizationError(
      "actor must be authorized before creating a draft semen order.",
    );
  }

  const orderNumber = normalizeOptionalString(input.orderNumber) ??
    generateSemenOrderNumber({
      sequence: Number(input.orderNumberSequence),
      occurredAt,
    });
  const order = Object.freeze({
    id: normalizeOptionalString(input.orderId),
    orderNumber,
    semenListingId: normalizeRequiredString(input.listing.id),
    breederOrganizationId,
    breedingStationOrganizationId: input.listing.breedingStationOrganizationId.trim(),
    status: /** @type {import("./semen-order.d.ts").SemenOrderStatus} */ ("DRAFT"),
    createdByUserId: input.actor.userId.trim(),
    updatedByUserId: input.actor.userId.trim(),
    createdAt: occurredAt,
    updatedAt: occurredAt,
  });
  const statusHistory = buildStatusHistory({
    id: normalizeOptionalString(input.statusHistoryId),
    order,
    fromStatus: null,
    toStatus: "DRAFT",
    actorRole,
    reason: normalizeOptionalString(input.reason),
    changedAt: occurredAt,
  });
  const auditHook = buildSemenOrderStatusAuditHook({
    action: statusAuditActionForStatus("DRAFT"),
    order,
    previousOrder: null,
    statusHistory,
  });

  return Object.freeze({
    order,
    statusHistory,
    auditHook,
    proofHook: buildSemenOrderProofHook({
      order,
      statusHistory,
      auditHook,
    }),
  });
}

/**
 * @param {import("./semen-order.d.ts").TransitionSemenOrderStatusInput} input
 * @returns {string[]}
 */
export function validateTransitionSemenOrderStatusInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const toStatus = normalizeRequiredString(input.toStatus);

  issues.push(...actorIssues);

  if (!input.existingOrder) {
    issues.push("existingOrder is required.");
  } else {
    if (!normalizeRequiredString(input.existingOrder.id)) {
      issues.push("existingOrder.id is required.");
    }

    if (!normalizeRequiredString(input.existingOrder.orderNumber)) {
      issues.push("existingOrder.orderNumber is required.");
    }

    if (!normalizeRequiredString(input.existingOrder.semenListingId)) {
      issues.push("existingOrder.semenListingId is required.");
    }

    if (!normalizeRequiredString(input.existingOrder.breederOrganizationId)) {
      issues.push("existingOrder.breederOrganizationId is required.");
    }

    if (!normalizeRequiredString(input.existingOrder.breedingStationOrganizationId)) {
      issues.push("existingOrder.breedingStationOrganizationId is required.");
    }

    if (!isSemenOrderStatus(input.existingOrder.status)) {
      issues.push(`existingOrder.status must be one of: ${SEMEN_ORDER_STATUSES.join(", ")}.`);
    }
  }

  if (!toStatus) {
    issues.push("toStatus is required.");
  } else if (!isSemenOrderStatus(toStatus)) {
    issues.push(`toStatus must be one of: ${SEMEN_ORDER_STATUSES.join(", ")}.`);
  }

  validateOptionalNonBlankString(input.statusHistoryId, "statusHistoryId", issues);
  validateOptionalNonBlankString(input.reason, "reason", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (
    input.existingOrder &&
    isSemenOrderStatus(input.existingOrder.status) &&
    isSemenOrderStatus(toStatus)
  ) {
    if (!isAllowedStatusTransition(input.existingOrder.status, toStatus)) {
      issues.push(
        `cannot transition semen order from ${input.existingOrder.status} to ${toStatus}.`,
      );
    } else if (
      actorIssues.length === 0 &&
      !findTransitionActorRole(input.actor, input.existingOrder, toStatus)
    ) {
      issues.push(
        "actor is not authorized for this semen order status transition.",
      );
    }
  }

  return issues;
}

/**
 * @param {import("./semen-order.d.ts").TransitionSemenOrderStatusInput} input
 * @returns {import("./semen-order.d.ts").PreparedSemenOrderStatusChange}
 */
export function prepareTransitionSemenOrderStatus(input) {
  const issues = validateTransitionSemenOrderStatusInput(input);

  if (issues.length > 0) {
    throw new SemenOrderValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.now ?? new Date());
  const toStatus = /** @type {import("./semen-order.d.ts").SemenOrderStatus} */ (
    input.toStatus.trim()
  );
  const actorRole = findTransitionActorRole(
    input.actor,
    input.existingOrder,
    toStatus,
  );

  if (!actorRole) {
    throw new SemenOrderAuthorizationError(
      "actor must be authorized before changing semen order status.",
    );
  }

  const order = Object.freeze({
    ...input.existingOrder,
    status: toStatus,
    updatedByUserId: input.actor.userId.trim(),
    updatedAt: occurredAt,
  });
  const statusHistory = buildStatusHistory({
    id: normalizeOptionalString(input.statusHistoryId),
    order,
    fromStatus: input.existingOrder.status,
    toStatus,
    actorRole,
    reason: normalizeOptionalString(input.reason),
    changedAt: occurredAt,
  });
  const auditHook = buildSemenOrderStatusAuditHook({
    action: statusAuditActionForStatus(toStatus),
    order,
    previousOrder: input.existingOrder,
    statusHistory,
  });

  return Object.freeze({
    order,
    statusHistory,
    auditHook,
    proofHook: buildSemenOrderProofHook({
      order,
      statusHistory,
      auditHook,
    }),
  });
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderStatusAuditHookInput} input
 * @returns {import("./semen-order.d.ts").SemenOrderStatusAuditHook}
 */
export function buildSemenOrderStatusAuditHook(input) {
  return Object.freeze({
    eventType: "SEMEN_ORDER_STATUS_CHANGE",
    action: input.action,
    actorUserId: input.statusHistory.actorUserId,
    actorRoleCode: input.statusHistory.actorRoleCode,
    actorOrganizationId: input.statusHistory.actorOrganizationId,
    targetType: "SemenOrder",
    targetId: input.order.id,
    targetRef: Object.freeze({
      orderNumber: input.order.orderNumber,
      semenListingId: input.order.semenListingId,
      breederOrganizationId: input.order.breederOrganizationId,
      breedingStationOrganizationId: input.order.breedingStationOrganizationId,
    }),
    statusHistoryId: input.statusHistory.id,
    previousValue: input.previousOrder
      ? orderAuditValue(input.previousOrder)
      : null,
    newValue: orderAuditValue(input.order),
    reason: input.statusHistory.reason,
    occurredAt: input.statusHistory.changedAt,
  });
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderProofHookInput} input
 * @returns {import("./semen-order.d.ts").SemenOrderProofHook}
 */
export function buildSemenOrderProofHook(input) {
  return Object.freeze({
    hookType: "PROOF_EVENT_REQUEST",
    source: "ORDER_STATUS_CHANGE",
    triggerType: "SEMEN_ORDER_STATUS_CHANGE",
    triggerRef: Object.freeze({
      targetType: "SemenOrder",
      targetId: input.order.id,
      semenOrderId: input.order.id,
      orderNumber: input.order.orderNumber,
      breederOrganizationId: input.order.breederOrganizationId,
      breedingStationOrganizationId: input.order.breedingStationOrganizationId,
      statusHistoryId: input.statusHistory.id,
      fromStatus: input.statusHistory.fromStatus,
      toStatus: input.statusHistory.toStatus,
    }),
    documentationRefs: Object.freeze([]),
    actorRef: Object.freeze({
      userId: input.statusHistory.actorUserId,
      roleCode: input.statusHistory.actorRoleCode,
      organizationId: input.statusHistory.actorOrganizationId,
    }),
    signatureRef: Object.freeze({
      type: "MANAGED_AUTH_ACTOR_CONTEXT",
      actorUserId: input.statusHistory.actorUserId,
    }),
    verificationLevelRef: null,
    auditHookRef: Object.freeze({
      eventType: input.auditHook.eventType,
      action: input.auditHook.action,
      occurredAt: input.auditHook.occurredAt,
    }),
    occurredAt: input.statusHistory.changedAt,
  });
}

/**
 * @param {import("./semen-order.d.ts").EndpointRequest<import("./semen-order.d.ts").CreateDraftSemenOrderInputBody>} request
 * @returns {Promise<import("./semen-order.d.ts").EndpointResponse<{ order: import("./semen-order.d.ts").SemenOrder, statusHistory: import("./semen-order.d.ts").OrderStatusHistory }>>}
 */
export async function createDraftSemenOrderEndpoint(request) {
  const findSemenListingById = requireRepositoryMethod(
    request.repository,
    "findSemenListingById",
  );
  const nextSemenOrderNumberSequence = requireRepositoryMethod(
    request.repository,
    "nextSemenOrderNumberSequence",
  );
  const createSemenOrderWithStatusHistory = requireRepositoryMethod(
    request.repository,
    "createSemenOrderWithStatusHistory",
  );
  const semenListingId = requireBodyField(request.body, "semenListingId");
  const listing = await findRequiredEntity(
    () => findSemenListingById(semenListingId),
    "SemenListing",
    semenListingId,
  );
  const orderNumberSequence = await nextSemenOrderNumberSequence();
  const prepared = prepareCreateDraftSemenOrder({
    breederOrganizationId: request.body.breederOrganizationId,
    reason: request.body.reason,
    createdAt: request.body.createdAt,
    now: request.body.now,
    listing,
    orderNumberSequence,
    actor: request.actor,
  });
  const persisted = await createSemenOrderWithStatusHistory(
    prepared.order,
    prepared.statusHistory,
  );
  const refreshed = rebuildPersistedChange(prepared, persisted, null);

  return Object.freeze({
    status: 201,
    body: Object.freeze({
      order: refreshed.order,
      statusHistory: refreshed.statusHistory,
    }),
    auditHook: refreshed.auditHook,
    proofHook: refreshed.proofHook,
  });
}

/**
 * @param {import("./semen-order.d.ts").EndpointRequest<import("./semen-order.d.ts").TransitionSemenOrderStatusInputBody>} request
 * @returns {Promise<import("./semen-order.d.ts").EndpointResponse<{ order: import("./semen-order.d.ts").SemenOrder, statusHistory: import("./semen-order.d.ts").OrderStatusHistory }>>}
 */
export async function transitionSemenOrderStatusEndpoint(request) {
  const findSemenOrderById = requireRepositoryMethod(
    request.repository,
    "findSemenOrderById",
  );
  const updateSemenOrderWithStatusHistory = requireRepositoryMethod(
    request.repository,
    "updateSemenOrderWithStatusHistory",
  );
  const orderId = requireParam(request.params, "orderId");
  const existingOrder = await findRequiredEntity(
    () => findSemenOrderById(orderId),
    "SemenOrder",
    orderId,
  );
  const prepared = prepareTransitionSemenOrderStatus({
    toStatus: request.body.toStatus,
    reason: request.body.reason,
    now: request.body.now,
    existingOrder,
    actor: request.actor,
  });
  const persisted = await updateSemenOrderWithStatusHistory(
    prepared.order,
    prepared.statusHistory,
  );
  const refreshed = rebuildPersistedChange(prepared, persisted, existingOrder);

  return Object.freeze({
    status: 200,
    body: Object.freeze({
      order: refreshed.order,
      statusHistory: refreshed.statusHistory,
    }),
    auditHook: refreshed.auditHook,
    proofHook: refreshed.proofHook,
  });
}

/**
 * @param {import("./semen-order.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./semen-order.d.ts").EndpointResponse<{ order: import("./semen-order.d.ts").SemenOrder }>>}
 */
export async function getSemenOrderEndpoint(request) {
  const findSemenOrderById = requireRepositoryMethod(
    request.repository,
    "findSemenOrderById",
  );
  const orderId = requireParam(request.params, "orderId");
  const order = await findRequiredEntity(
    () => findSemenOrderById(orderId),
    "SemenOrder",
    orderId,
  );

  if (!canViewSemenOrder(request.actor, order)) {
    throw new SemenOrderAuthorizationError(
      "actor may only view breeder-owned, assigned-station, or platform-admin semen orders.",
    );
  }

  return Object.freeze({
    status: 200,
    body: Object.freeze({ order }),
  });
}

/**
 * @param {import("./semen-order.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./semen-order.d.ts").EndpointResponse<{ statusHistory: import("./semen-order.d.ts").OrderStatusHistory[] }>>}
 */
export async function listOrderStatusHistoryEndpoint(request) {
  const findSemenOrderById = requireRepositoryMethod(
    request.repository,
    "findSemenOrderById",
  );
  const listOrderStatusHistory = requireRepositoryMethod(
    request.repository,
    "listOrderStatusHistory",
  );
  const orderId = requireParam(request.params, "orderId");
  const order = await findRequiredEntity(
    () => findSemenOrderById(orderId),
    "SemenOrder",
    orderId,
  );

  if (!canViewSemenOrder(request.actor, order)) {
    throw new SemenOrderAuthorizationError(
      "actor may only view status history for visible semen orders.",
    );
  }

  const statusHistory = await listOrderStatusHistory(orderId);

  return Object.freeze({
    status: 200,
    body: Object.freeze({ statusHistory }),
  });
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderStatus} fromStatus
 * @param {import("./semen-order.d.ts").SemenOrderStatus} toStatus
 * @returns {boolean}
 */
function isAllowedStatusTransition(fromStatus, toStatus) {
  return SEMEN_ORDER_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderStatus} toStatus
 * @returns {import("./semen-order.d.ts").SemenOrderStatusAuditAction}
 */
function statusAuditActionForStatus(toStatus) {
  return /** @type {import("./semen-order.d.ts").SemenOrderStatusAuditAction} */ (
    STATUS_AUDIT_ACTION_BY_STATUS[toStatus]
  );
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderActorContext} actor
 * @param {string} breederOrganizationId
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findCreateDraftActorRole(actor, breederOrganizationId) {
  return findActorRole(actor, "BREEDER", breederOrganizationId) ??
    findActorRole(actor, "PLATFORM_ADMIN");
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderActorContext} actor
 * @param {import("./semen-order.d.ts").SemenOrderLike} order
 * @param {import("./semen-order.d.ts").SemenOrderStatus} toStatus
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findTransitionActorRole(actor, order, toStatus) {
  const adminRole = findActorRole(actor, "PLATFORM_ADMIN");

  if (adminRole) {
    return adminRole;
  }

  if (toStatus === "SUBMITTED") {
    return findActorRole(actor, "BREEDER", order.breederOrganizationId);
  }

  if (toStatus === "CANCELLED") {
    const breederRole = findActorRole(actor, "BREEDER", order.breederOrganizationId);
    const stationRole = findActorRole(
      actor,
      "BREEDING_STATION",
      order.breedingStationOrganizationId,
    );

    return order.status === "DRAFT" || order.status === "SUBMITTED"
      ? breederRole
      : stationRole ?? breederRole;
  }

  if (toStatus === "COMPLETED") {
    return findActorRole(actor, "BREEDING_STATION", order.breedingStationOrganizationId) ??
      findActorRole(actor, "BREEDER", order.breederOrganizationId);
  }

  return findActorRole(actor, "BREEDING_STATION", order.breedingStationOrganizationId);
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderActorContext} actor
 * @param {import("../identity/role-model.d.ts").RoleCode} roleCode
 * @param {string} [organizationId]
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
    (organizationId === undefined || assignment.organizationId === organizationId),
  );
}

/**
 * @param {object} input
 * @param {string | null} input.id
 * @param {import("./semen-order.d.ts").SemenOrderLike} input.order
 * @param {import("./semen-order.d.ts").SemenOrderStatus | null} input.fromStatus
 * @param {import("./semen-order.d.ts").SemenOrderStatus} input.toStatus
 * @param {import("../identity/role-model.d.ts").UserOrganizationRoleLike} input.actorRole
 * @param {string | null} input.reason
 * @param {string} input.changedAt
 * @returns {Readonly<import("./semen-order.d.ts").OrderStatusHistory>}
 */
function buildStatusHistory(input) {
  return Object.freeze({
    id: input.id,
    semenOrderId: input.order.id,
    orderNumber: input.order.orderNumber,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    actorUserId: input.actorRole.userId,
    actorRoleCode: /** @type {import("./semen-order.d.ts").SemenOrderStatusActorRoleCode} */ (
      input.actorRole.roleCode
    ),
    actorOrganizationId: input.actorRole.organizationId,
    reason: input.reason,
    changedAt: input.changedAt,
  });
}

/**
 * @param {import("./semen-order.d.ts").SemenOrderLike} order
 * @returns {Readonly<import("./semen-order.d.ts").SemenOrderAuditValue>}
 */
function orderAuditValue(order) {
  return Object.freeze({
    orderNumber: order.orderNumber,
    semenListingId: order.semenListingId,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    status: order.status,
  });
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function validateActor(value) {
  const issues = [];

  if (!value || typeof value !== "object") {
    return ["actor is required."];
  }

  const actor = /** @type {Partial<import("./semen-order.d.ts").SemenOrderActorContext>} */ (value);

  if (!normalizeRequiredString(actor.userId)) {
    issues.push("actor.userId is required.");
  }

  if (!Array.isArray(actor.roles)) {
    issues.push("actor.roles must list the actor's active role context.");
  }

  return issues;
}

/**
 * @param {import("./semen-order.d.ts").PreparedSemenOrderStatusChange} prepared
 * @param {import("./semen-order.d.ts").PreparedPersistedSemenOrderStatusChange} persisted
 * @param {import("./semen-order.d.ts").SemenOrderLike | null} previousOrder
 * @returns {import("./semen-order.d.ts").PreparedSemenOrderStatusChange}
 */
function rebuildPersistedChange(prepared, persisted, previousOrder) {
  const order = persisted.order ?? prepared.order;
  const statusHistory = persisted.statusHistory ?? prepared.statusHistory;
  const auditHook = buildSemenOrderStatusAuditHook({
    action: statusAuditActionForStatus(statusHistory.toStatus),
    order,
    previousOrder,
    statusHistory,
  });

  return Object.freeze({
    order,
    statusHistory,
    auditHook,
    proofHook: buildSemenOrderProofHook({
      order,
      statusHistory,
      auditHook,
    }),
  });
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
    throw new SemenOrderNotFoundError(entityName, entityId);
  }

  return entity;
}

/**
 * @param {Record<string, string | undefined> | undefined} params
 * @param {string} paramName
 * @returns {string}
 */
function requireParam(params, paramName) {
  const value = normalizeRequiredString(params?.[paramName]);

  if (!value) {
    throw new SemenOrderValidationError([`${paramName} route parameter is required.`]);
  }

  return value;
}

/**
 * @param {Record<string, unknown> | undefined} body
 * @param {string} fieldName
 * @returns {string}
 */
function requireBodyField(body, fieldName) {
  const value = normalizeRequiredString(body?.[fieldName]);

  if (!value) {
    throw new SemenOrderValidationError([`${fieldName} is required.`]);
  }

  return value;
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
