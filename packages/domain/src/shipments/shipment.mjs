// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";
import { isSemenOrderStatus } from "../orders/semen-order.mjs";

export const SHIPMENT_STATUSES = /** @type {const} */ ([
  "PREPARED",
  "DISPATCHED",
  "IN_TRANSIT",
  "DELIVERED",
  "DELAYED",
  "FAILED",
  "CANCELLED",
]);

export const SHIPMENT_TRACKING_EVENT_SOURCES = /** @type {const} */ ([
  "MANUAL",
  "LOGISTICS_PROVIDER",
  "SYSTEM",
]);

export const SHIPMENT_TRACKING_AUDIT_ACTIONS = /** @type {const} */ ([
  "SHIPMENT_CREATED",
  "SHIPMENT_STATUS_UPDATED",
]);

export const SHIPMENT_ROUTES = Object.freeze([
  Object.freeze({
    method: "POST",
    path: "/semen-orders/:orderId/shipments",
    handler: "createShipmentEndpoint",
    access: "assigned BREEDING_STATION or PLATFORM_ADMIN for confirmed orders",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-orders/:orderId/shipments",
    handler: "listOrderShipmentsEndpoint",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/shipments/:shipmentId",
    handler: "getShipmentEndpoint",
    access: "BREEDER-owned order shipment, assigned BREEDING_STATION shipment, or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "POST",
    path: "/shipments/:shipmentId/tracking-events",
    handler: "createShipmentTrackingEventEndpoint",
    access: "assigned BREEDING_STATION or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/shipments/:shipmentId/tracking-events",
    handler: "listShipmentTrackingEventsEndpoint",
    access: "BREEDER-owned order shipment, assigned BREEDING_STATION shipment, or PLATFORM_ADMIN",
  }),
]);

export class ShipmentValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech shipment input:\n- ${issues.join("\n- ")}`);
    this.name = "ShipmentValidationError";
    this.issues = issues;
  }
}

export class ShipmentAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "ShipmentAuthorizationError";
  }
}

export class ShipmentNotFoundError extends Error {
  /**
   * @param {string} entityName
   * @param {string} entityId
   */
  constructor(entityName, entityId) {
    super(`${entityName} was not found: ${entityId}`);
    this.name = "ShipmentNotFoundError";
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./shipment.d.ts").ShipmentStatus}
 */
export function isShipmentStatus(value) {
  return typeof value === "string" && SHIPMENT_STATUSES.includes(
    /** @type {import("./shipment.d.ts").ShipmentStatus} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./shipment.d.ts").ShipmentTrackingEventSource}
 */
export function isShipmentTrackingEventSource(value) {
  return typeof value === "string" && SHIPMENT_TRACKING_EVENT_SOURCES.includes(
    /** @type {import("./shipment.d.ts").ShipmentTrackingEventSource} */ (value),
  );
}

/**
 * @param {import("./shipment.d.ts").ShipmentActorContext} actor
 * @param {import("./shipment.d.ts").ShipmentAccessTarget} target
 * @returns {boolean}
 */
export function canViewShipment(actor, target) {
  return canViewShipmentTarget(actor, target);
}

/**
 * @param {import("./shipment.d.ts").ShipmentActorContext} actor
 * @param {import("./shipment.d.ts").ShipmentAccessTarget} target
 * @returns {boolean}
 */
export function canManageShipment(actor, target) {
  return Boolean(findManageShipmentActorRole(actor, target));
}

/**
 * @param {import("./shipment.d.ts").CreateShipmentInput} input
 * @returns {string[]}
 */
export function validateCreateShipmentInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const initialStatus = input.status === undefined
    ? "PREPARED"
    : normalizeRequiredString(input.status);
  const eventSource = input.eventSource === undefined
    ? "MANUAL"
    : normalizeRequiredString(input.eventSource);

  issues.push(...actorIssues);
  validateOrderForShipment(input.existingOrder, issues);

  if (initialStatus && !isShipmentStatus(initialStatus)) {
    issues.push(`status must be one of: ${SHIPMENT_STATUSES.join(", ")}.`);
  }

  if (eventSource && !isShipmentTrackingEventSource(eventSource)) {
    issues.push(
      `eventSource must be one of: ${SHIPMENT_TRACKING_EVENT_SOURCES.join(", ")}.`,
    );
  }

  validateOptionalNonBlankString(input.shipmentId, "shipmentId", issues);
  validateOptionalNonBlankString(input.trackingEventId, "trackingEventId", issues);
  validateOptionalNonBlankString(input.providerName, "providerName", issues);
  validateOptionalNonBlankString(input.providerTrackingId, "providerTrackingId", issues);
  validateOptionalNonBlankString(input.sourceEventId, "sourceEventId", issues);
  validateOptionalNonBlankString(input.providerStatus, "providerStatus", issues);
  validateOptionalNonBlankString(input.location, "location", issues);
  validateOptionalNonBlankString(input.notes, "notes", issues);
  validateOptionalTrackingUrl(input.trackingUrl, issues);
  validateOptionalTimestamp(input.occurredAt, "occurredAt", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (
    input.existingOrder &&
    actorIssues.length === 0 &&
    !findManageShipmentActorRole(input.actor, input.existingOrder)
  ) {
    issues.push(
      "actor must be an active BREEDING_STATION user for the assigned station or PLATFORM_ADMIN.",
    );
  }

  return issues;
}

/**
 * @param {import("./shipment.d.ts").CreateShipmentInput} input
 * @returns {import("./shipment.d.ts").PreparedShipmentTrackingChange}
 */
export function prepareCreateShipment(input) {
  const issues = validateCreateShipmentInput(input);

  if (issues.length > 0) {
    throw new ShipmentValidationError(issues);
  }

  const actorRole = findManageShipmentActorRole(input.actor, input.existingOrder);

  if (!actorRole) {
    throw new ShipmentAuthorizationError(
      "actor must be authorized before creating a shipment.",
    );
  }

  const occurredAt = toIsoTimestamp(
    input.occurredAt ?? input.createdAt ?? input.now ?? new Date(),
  );
  const recordedAt = toIsoTimestamp(input.createdAt ?? input.now ?? occurredAt);
  const status = /** @type {import("./shipment.d.ts").ShipmentStatus} */ (
    normalizeRequiredString(input.status) || "PREPARED"
  );
  const eventSource = /** @type {import("./shipment.d.ts").ShipmentTrackingEventSource} */ (
    normalizeRequiredString(input.eventSource) || "MANUAL"
  );
  const shipment = Object.freeze({
    id: normalizeOptionalString(input.shipmentId),
    semenOrderId: normalizeRequiredString(input.existingOrder.id),
    orderNumber: normalizeRequiredString(input.existingOrder.orderNumber),
    breederOrganizationId: normalizeRequiredString(
      input.existingOrder.breederOrganizationId,
    ),
    breedingStationOrganizationId: normalizeRequiredString(
      input.existingOrder.breedingStationOrganizationId,
    ),
    status,
    providerName: normalizeOptionalString(input.providerName),
    providerTrackingId: normalizeOptionalString(input.providerTrackingId),
    trackingUrl: normalizeOptionalString(input.trackingUrl),
    createdByUserId: input.actor.userId.trim(),
    updatedByUserId: input.actor.userId.trim(),
    createdAt: recordedAt,
    updatedAt: recordedAt,
  });
  const trackingEvent = buildTrackingEvent({
    id: normalizeOptionalString(input.trackingEventId),
    shipment,
    fromStatus: null,
    toStatus: status,
    actorRole,
    eventSource,
    sourceEventId: normalizeOptionalString(input.sourceEventId),
    providerStatus: normalizeOptionalString(input.providerStatus),
    location: normalizeOptionalString(input.location),
    notes: normalizeOptionalString(input.notes),
    occurredAt,
    recordedAt,
  });
  const auditHook = buildShipmentTrackingAuditHook({
    action: "SHIPMENT_CREATED",
    shipment,
    previousShipment: null,
    trackingEvent,
  });

  return Object.freeze({
    shipment,
    trackingEvent,
    auditHook,
    proofHook: buildShipmentProofHook({
      shipment,
      trackingEvent,
      auditHook,
    }),
  });
}

/**
 * @param {import("./shipment.d.ts").CreateShipmentTrackingEventInput} input
 * @returns {string[]}
 */
export function validateCreateShipmentTrackingEventInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const toStatus = normalizeRequiredString(input.toStatus);
  const eventSource = input.eventSource === undefined
    ? "MANUAL"
    : normalizeRequiredString(input.eventSource);

  issues.push(...actorIssues);
  validateShipmentForTrackingEvent(input.existingShipment, issues);

  if (!toStatus) {
    issues.push("toStatus is required.");
  } else if (!isShipmentStatus(toStatus)) {
    issues.push(`toStatus must be one of: ${SHIPMENT_STATUSES.join(", ")}.`);
  }

  if (eventSource && !isShipmentTrackingEventSource(eventSource)) {
    issues.push(
      `eventSource must be one of: ${SHIPMENT_TRACKING_EVENT_SOURCES.join(", ")}.`,
    );
  }

  validateOptionalNonBlankString(input.trackingEventId, "trackingEventId", issues);
  validateOptionalNonBlankString(input.sourceEventId, "sourceEventId", issues);
  validateOptionalNonBlankString(input.providerStatus, "providerStatus", issues);
  validateOptionalNonBlankString(input.location, "location", issues);
  validateOptionalNonBlankString(input.notes, "notes", issues);
  validateOptionalTimestamp(input.occurredAt, "occurredAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (
    input.existingShipment &&
    actorIssues.length === 0 &&
    !findManageShipmentActorRole(input.actor, input.existingShipment)
  ) {
    issues.push(
      "actor must be an active BREEDING_STATION user for the assigned station or PLATFORM_ADMIN.",
    );
  }

  return issues;
}

/**
 * @param {import("./shipment.d.ts").CreateShipmentTrackingEventInput} input
 * @returns {import("./shipment.d.ts").PreparedShipmentTrackingChange}
 */
export function prepareCreateShipmentTrackingEvent(input) {
  const issues = validateCreateShipmentTrackingEventInput(input);

  if (issues.length > 0) {
    throw new ShipmentValidationError(issues);
  }

  const actorRole = findManageShipmentActorRole(input.actor, input.existingShipment);

  if (!actorRole) {
    throw new ShipmentAuthorizationError(
      "actor must be authorized before changing shipment status.",
    );
  }

  const occurredAt = toIsoTimestamp(input.occurredAt ?? input.now ?? new Date());
  const recordedAt = toIsoTimestamp(input.now ?? input.occurredAt ?? new Date());
  const toStatus = /** @type {import("./shipment.d.ts").ShipmentStatus} */ (
    input.toStatus.trim()
  );
  const eventSource = /** @type {import("./shipment.d.ts").ShipmentTrackingEventSource} */ (
    normalizeRequiredString(input.eventSource) || "MANUAL"
  );
  const shipment = Object.freeze({
    ...input.existingShipment,
    status: toStatus,
    updatedByUserId: input.actor.userId.trim(),
    updatedAt: recordedAt,
  });
  const trackingEvent = buildTrackingEvent({
    id: normalizeOptionalString(input.trackingEventId),
    shipment,
    fromStatus: input.existingShipment.status,
    toStatus,
    actorRole,
    eventSource,
    sourceEventId: normalizeOptionalString(input.sourceEventId),
    providerStatus: normalizeOptionalString(input.providerStatus),
    location: normalizeOptionalString(input.location),
    notes: normalizeOptionalString(input.notes),
    occurredAt,
    recordedAt,
  });
  const auditHook = buildShipmentTrackingAuditHook({
    action: "SHIPMENT_STATUS_UPDATED",
    shipment,
    previousShipment: input.existingShipment,
    trackingEvent,
  });

  return Object.freeze({
    shipment,
    trackingEvent,
    auditHook,
    proofHook: buildShipmentProofHook({
      shipment,
      trackingEvent,
      auditHook,
    }),
  });
}

/**
 * @param {import("./shipment.d.ts").ShipmentTrackingAuditHookInput} input
 * @returns {import("./shipment.d.ts").ShipmentTrackingAuditHook}
 */
export function buildShipmentTrackingAuditHook(input) {
  return Object.freeze({
    eventType: "SHIPMENT_TRACKING_EVENT",
    action: input.action,
    actorUserId: input.trackingEvent.actorUserId,
    actorRoleCode: input.trackingEvent.actorRoleCode,
    actorOrganizationId: input.trackingEvent.actorOrganizationId,
    targetType: "Shipment",
    targetId: input.shipment.id,
    targetRef: Object.freeze({
      semenOrderId: input.shipment.semenOrderId,
      orderNumber: input.shipment.orderNumber,
      breederOrganizationId: input.shipment.breederOrganizationId,
      breedingStationOrganizationId: input.shipment.breedingStationOrganizationId,
      providerName: input.shipment.providerName,
      providerTrackingId: input.shipment.providerTrackingId,
    }),
    trackingEventId: input.trackingEvent.id,
    previousValue: input.previousShipment
      ? shipmentAuditValue(input.previousShipment)
      : null,
    newValue: shipmentAuditValue(input.shipment),
    eventSource: input.trackingEvent.eventSource,
    sourceEventId: input.trackingEvent.sourceEventId,
    providerStatus: input.trackingEvent.providerStatus,
    reason: input.trackingEvent.notes,
    occurredAt: input.trackingEvent.occurredAt,
  });
}

/**
 * @param {import("./shipment.d.ts").ShipmentProofHookInput} input
 * @returns {import("./shipment.d.ts").ShipmentProofHook}
 */
export function buildShipmentProofHook(input) {
  return Object.freeze({
    hookType: "PROOF_EVENT_REQUEST",
    source: "SHIPMENT_TRACKING_EVENT",
    triggerType: "SHIPMENT_TRACKING_EVENT",
    triggerRef: Object.freeze({
      targetType: "Shipment",
      targetId: input.shipment.id,
      semenOrderId: input.shipment.semenOrderId,
      orderNumber: input.shipment.orderNumber,
      breederOrganizationId: input.shipment.breederOrganizationId,
      breedingStationOrganizationId: input.shipment.breedingStationOrganizationId,
      trackingEventId: input.trackingEvent.id,
      fromStatus: input.trackingEvent.fromStatus,
      toStatus: input.trackingEvent.toStatus,
      eventSource: input.trackingEvent.eventSource,
      sourceEventId: input.trackingEvent.sourceEventId,
    }),
    documentationRefs: Object.freeze([]),
    actorRef: Object.freeze({
      userId: input.trackingEvent.actorUserId,
      roleCode: input.trackingEvent.actorRoleCode,
      organizationId: input.trackingEvent.actorOrganizationId,
    }),
    signatureRef: Object.freeze({
      type: "MANAGED_AUTH_ACTOR_CONTEXT",
      actorUserId: input.trackingEvent.actorUserId,
    }),
    verificationLevelRef: null,
    auditHookRef: Object.freeze({
      eventType: input.auditHook.eventType,
      action: input.auditHook.action,
      occurredAt: input.auditHook.occurredAt,
    }),
    occurredAt: input.trackingEvent.occurredAt,
  });
}

/**
 * @param {import("./shipment.d.ts").EndpointRequest<import("./shipment.d.ts").CreateShipmentInputBody>} request
 * @returns {Promise<import("./shipment.d.ts").EndpointResponse<{ shipment: import("./shipment.d.ts").Shipment, trackingEvent: import("./shipment.d.ts").ShipmentTrackingEvent }>>}
 */
export async function createShipmentEndpoint(request) {
  const findSemenOrderById = requireRepositoryMethod(
    request.repository,
    "findSemenOrderById",
  );
  const createShipmentWithTrackingEvent = requireRepositoryMethod(
    request.repository,
    "createShipmentWithTrackingEvent",
  );
  const orderId = requireParam(request.params, "orderId");
  const existingOrder = await findRequiredEntity(
    () => findSemenOrderById(orderId),
    "SemenOrder",
    orderId,
  );
  const prepared = prepareCreateShipment({
    status: request.body.status,
    providerName: request.body.providerName,
    providerTrackingId: request.body.providerTrackingId,
    trackingUrl: request.body.trackingUrl,
    eventSource: request.body.eventSource,
    sourceEventId: request.body.sourceEventId,
    providerStatus: request.body.providerStatus,
    location: request.body.location,
    notes: request.body.notes,
    occurredAt: request.body.occurredAt,
    createdAt: request.body.createdAt,
    now: request.body.now,
    existingOrder,
    actor: request.actor,
  });
  const persisted = await createShipmentWithTrackingEvent(
    prepared.shipment,
    prepared.trackingEvent,
  );
  const refreshed = rebuildPersistedChange(
    prepared,
    persisted,
    null,
    "SHIPMENT_CREATED",
  );

  const auditLog = await createAuditLogFromHook({
    repository: request.repository,
    auditHook: refreshed.auditHook,
    requestContext: request.auditContext,
  });

  return Object.freeze({
    status: 201,
    body: Object.freeze({
      shipment: refreshed.shipment,
      trackingEvent: refreshed.trackingEvent,
    }),
    auditHook: refreshed.auditHook,
    auditLog,
    proofHook: refreshed.proofHook,
  });
}

/**
 * @param {import("./shipment.d.ts").EndpointRequest<import("./shipment.d.ts").CreateShipmentTrackingEventInputBody>} request
 * @returns {Promise<import("./shipment.d.ts").EndpointResponse<{ shipment: import("./shipment.d.ts").Shipment, trackingEvent: import("./shipment.d.ts").ShipmentTrackingEvent }>>}
 */
export async function createShipmentTrackingEventEndpoint(request) {
  const findShipmentById = requireRepositoryMethod(
    request.repository,
    "findShipmentById",
  );
  const updateShipmentWithTrackingEvent = requireRepositoryMethod(
    request.repository,
    "updateShipmentWithTrackingEvent",
  );
  const shipmentId = requireParam(request.params, "shipmentId");
  const existingShipment = await findRequiredEntity(
    () => findShipmentById(shipmentId),
    "Shipment",
    shipmentId,
  );
  const prepared = prepareCreateShipmentTrackingEvent({
    toStatus: request.body.toStatus,
    eventSource: request.body.eventSource,
    sourceEventId: request.body.sourceEventId,
    providerStatus: request.body.providerStatus,
    location: request.body.location,
    notes: request.body.notes,
    occurredAt: request.body.occurredAt,
    now: request.body.now,
    existingShipment,
    actor: request.actor,
  });
  const persisted = await updateShipmentWithTrackingEvent(
    prepared.shipment,
    prepared.trackingEvent,
  );
  const refreshed = rebuildPersistedChange(
    prepared,
    persisted,
    existingShipment,
    "SHIPMENT_STATUS_UPDATED",
  );

  const auditLog = await createAuditLogFromHook({
    repository: request.repository,
    auditHook: refreshed.auditHook,
    requestContext: request.auditContext,
  });

  return Object.freeze({
    status: 200,
    body: Object.freeze({
      shipment: refreshed.shipment,
      trackingEvent: refreshed.trackingEvent,
    }),
    auditHook: refreshed.auditHook,
    auditLog,
    proofHook: refreshed.proofHook,
  });
}

/**
 * @param {import("./shipment.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./shipment.d.ts").EndpointResponse<{ shipment: import("./shipment.d.ts").Shipment }>>}
 */
export async function getShipmentEndpoint(request) {
  const findShipmentById = requireRepositoryMethod(
    request.repository,
    "findShipmentById",
  );
  const shipmentId = requireParam(request.params, "shipmentId");
  const shipment = await findRequiredEntity(
    () => findShipmentById(shipmentId),
    "Shipment",
    shipmentId,
  );

  if (!canViewShipment(request.actor, shipment)) {
    throw new ShipmentAuthorizationError(
      "actor may only view breeder-owned, assigned-station, or platform-admin shipments.",
    );
  }

  return Object.freeze({
    status: 200,
    body: Object.freeze({ shipment }),
  });
}

/**
 * @param {import("./shipment.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./shipment.d.ts").EndpointResponse<{ shipments: import("./shipment.d.ts").Shipment[] }>>}
 */
export async function listOrderShipmentsEndpoint(request) {
  const findSemenOrderById = requireRepositoryMethod(
    request.repository,
    "findSemenOrderById",
  );
  const listShipmentsForOrder = requireRepositoryMethod(
    request.repository,
    "listShipmentsForOrder",
  );
  const orderId = requireParam(request.params, "orderId");
  const order = await findRequiredEntity(
    () => findSemenOrderById(orderId),
    "SemenOrder",
    orderId,
  );

  if (!canViewShipment(request.actor, order)) {
    throw new ShipmentAuthorizationError(
      "actor may only list shipments for visible semen orders.",
    );
  }

  const shipments = await listShipmentsForOrder(orderId);

  return Object.freeze({
    status: 200,
    body: Object.freeze({ shipments }),
  });
}

/**
 * @param {import("./shipment.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./shipment.d.ts").EndpointResponse<{ trackingEvents: import("./shipment.d.ts").ShipmentTrackingEvent[] }>>}
 */
export async function listShipmentTrackingEventsEndpoint(request) {
  const findShipmentById = requireRepositoryMethod(
    request.repository,
    "findShipmentById",
  );
  const listShipmentTrackingEvents = requireRepositoryMethod(
    request.repository,
    "listShipmentTrackingEvents",
  );
  const shipmentId = requireParam(request.params, "shipmentId");
  const shipment = await findRequiredEntity(
    () => findShipmentById(shipmentId),
    "Shipment",
    shipmentId,
  );

  if (!canViewShipment(request.actor, shipment)) {
    throw new ShipmentAuthorizationError(
      "actor may only view tracking events for visible shipments.",
    );
  }

  const trackingEvents = await listShipmentTrackingEvents(shipmentId);

  return Object.freeze({
    status: 200,
    body: Object.freeze({ trackingEvents }),
  });
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateOrderForShipment(value, issues) {
  if (!value || typeof value !== "object") {
    issues.push("existingOrder is required.");
    return;
  }

  const order = /** @type {Partial<import("../orders/semen-order.d.ts").SemenOrderLike>} */ (value);

  if (!normalizeRequiredString(order.id)) {
    issues.push("existingOrder.id is required.");
  }

  if (!normalizeRequiredString(order.orderNumber)) {
    issues.push("existingOrder.orderNumber is required.");
  }

  if (!normalizeRequiredString(order.breederOrganizationId)) {
    issues.push("existingOrder.breederOrganizationId is required.");
  }

  if (!normalizeRequiredString(order.breedingStationOrganizationId)) {
    issues.push("existingOrder.breedingStationOrganizationId is required.");
  }

  if (!isSemenOrderStatus(order.status)) {
    issues.push("existingOrder.status must be a valid semen order status.");
  } else if (order.status !== "CONFIRMED") {
    issues.push("shipment can only be created for a CONFIRMED semen order.");
  }
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateShipmentForTrackingEvent(value, issues) {
  if (!value || typeof value !== "object") {
    issues.push("existingShipment is required.");
    return;
  }

  const shipment = /** @type {Partial<import("./shipment.d.ts").ShipmentLike>} */ (value);

  if (!normalizeRequiredString(shipment.id)) {
    issues.push("existingShipment.id is required.");
  }

  if (!normalizeRequiredString(shipment.semenOrderId)) {
    issues.push("existingShipment.semenOrderId is required.");
  }

  if (!normalizeRequiredString(shipment.orderNumber)) {
    issues.push("existingShipment.orderNumber is required.");
  }

  if (!normalizeRequiredString(shipment.breederOrganizationId)) {
    issues.push("existingShipment.breederOrganizationId is required.");
  }

  if (!normalizeRequiredString(shipment.breedingStationOrganizationId)) {
    issues.push("existingShipment.breedingStationOrganizationId is required.");
  }

  if (!isShipmentStatus(shipment.status)) {
    issues.push(`existingShipment.status must be one of: ${SHIPMENT_STATUSES.join(", ")}.`);
  }
}

/**
 * @param {import("./shipment.d.ts").ShipmentActorContext} actor
 * @param {import("./shipment.d.ts").ShipmentAccessTarget} target
 * @returns {boolean}
 */
function canViewShipmentTarget(actor, target) {
  return Boolean(
    findActorRole(actor, "PLATFORM_ADMIN") ||
    findActorRole(actor, "BREEDER", target.breederOrganizationId) ||
    findActorRole(actor, "BREEDING_STATION", target.breedingStationOrganizationId),
  );
}

/**
 * @param {import("./shipment.d.ts").ShipmentActorContext} actor
 * @param {import("./shipment.d.ts").ShipmentAccessTarget} target
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findManageShipmentActorRole(actor, target) {
  return findActorRole(actor, "BREEDING_STATION", target.breedingStationOrganizationId) ??
    findActorRole(actor, "PLATFORM_ADMIN");
}

/**
 * @param {import("./shipment.d.ts").ShipmentActorContext} actor
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
 * @param {import("./shipment.d.ts").ShipmentLike} input.shipment
 * @param {import("./shipment.d.ts").ShipmentStatus | null} input.fromStatus
 * @param {import("./shipment.d.ts").ShipmentStatus} input.toStatus
 * @param {import("../identity/role-model.d.ts").UserOrganizationRoleLike} input.actorRole
 * @param {import("./shipment.d.ts").ShipmentTrackingEventSource} input.eventSource
 * @param {string | null} input.sourceEventId
 * @param {string | null} input.providerStatus
 * @param {string | null} input.location
 * @param {string | null} input.notes
 * @param {string} input.occurredAt
 * @param {string} input.recordedAt
 * @returns {Readonly<import("./shipment.d.ts").ShipmentTrackingEvent>}
 */
function buildTrackingEvent(input) {
  return Object.freeze({
    id: input.id,
    shipmentId: input.shipment.id,
    semenOrderId: input.shipment.semenOrderId,
    orderNumber: input.shipment.orderNumber,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    eventSource: input.eventSource,
    sourceEventId: input.sourceEventId,
    providerStatus: input.providerStatus,
    location: input.location,
    notes: input.notes,
    actorUserId: input.actorRole.userId,
    actorRoleCode: /** @type {import("./shipment.d.ts").ShipmentActorRoleCode} */ (
      input.actorRole.roleCode
    ),
    actorOrganizationId: input.actorRole.organizationId,
    occurredAt: input.occurredAt,
    recordedAt: input.recordedAt,
  });
}

/**
 * @param {import("./shipment.d.ts").ShipmentLike} shipment
 * @returns {Readonly<import("./shipment.d.ts").ShipmentAuditValue>}
 */
function shipmentAuditValue(shipment) {
  return Object.freeze({
    semenOrderId: shipment.semenOrderId,
    orderNumber: shipment.orderNumber,
    breederOrganizationId: shipment.breederOrganizationId,
    breedingStationOrganizationId: shipment.breedingStationOrganizationId,
    status: shipment.status,
    providerName: shipment.providerName,
    providerTrackingId: shipment.providerTrackingId,
    trackingUrl: shipment.trackingUrl,
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

  const actor = /** @type {Partial<import("./shipment.d.ts").ShipmentActorContext>} */ (value);

  if (!normalizeRequiredString(actor.userId)) {
    issues.push("actor.userId is required.");
  }

  if (!Array.isArray(actor.roles)) {
    issues.push("actor.roles must list the actor's active role context.");
  }

  return issues;
}

/**
 * @param {import("./shipment.d.ts").PreparedShipmentTrackingChange} prepared
 * @param {import("./shipment.d.ts").PreparedPersistedShipmentTrackingChange} persisted
 * @param {import("./shipment.d.ts").ShipmentLike | null} previousShipment
 * @param {import("./shipment.d.ts").ShipmentTrackingAuditAction} action
 * @returns {import("./shipment.d.ts").PreparedShipmentTrackingChange}
 */
function rebuildPersistedChange(prepared, persisted, previousShipment, action) {
  const shipment = persisted.shipment ?? prepared.shipment;
  const trackingEvent = persisted.trackingEvent ?? prepared.trackingEvent;
  const auditHook = buildShipmentTrackingAuditHook({
    action,
    shipment,
    previousShipment,
    trackingEvent,
  });

  return Object.freeze({
    shipment,
    trackingEvent,
    auditHook,
    proofHook: buildShipmentProofHook({
      shipment,
      trackingEvent,
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
    throw new ShipmentNotFoundError(entityName, entityId);
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
    throw new ShipmentValidationError([`${paramName} route parameter is required.`]);
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
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalTrackingUrl(value, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push("trackingUrl cannot be blank when provided.");
    return;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      issues.push("trackingUrl must use http or https.");
    }
  } catch {
    issues.push("trackingUrl must be a valid URL.");
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
