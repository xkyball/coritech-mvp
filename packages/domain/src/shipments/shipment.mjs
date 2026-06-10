// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import {
  isActiveRoleAssignment,
  isPhase1RoleCode,
} from "../identity/role-model.mjs";
import { isSemenOrderStatus } from "../orders/semen-order.mjs";
import { createProofEventFromHook } from "../proof/proof-event.mjs";

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
  "SHIPMENT_RECEIPT_CONFIRMED",
]);

export const SHIPMENT_SERVICE_COMMANDS = /** @type {const} */ ([
  "CREATE_SHIPMENT",
  "UPDATE_SHIPMENT_STATUS",
  "ATTACH_TRACKING_REFERENCE",
  "MARK_DELIVERED",
  "MARK_DELAYED",
  "CONFIRM_RECEIVED",
]);

const SHIPMENT_NOTIFICATION_EVENT_BY_COMMAND = Object.freeze({
  CREATE_SHIPMENT: "SHIPMENT_CREATED",
  UPDATE_SHIPMENT_STATUS: "SHIPMENT_STATUS_UPDATED",
  ATTACH_TRACKING_REFERENCE: "SHIPMENT_TRACKING_REFERENCE_ATTACHED",
  MARK_DELIVERED: "SHIPMENT_DELIVERED",
  MARK_DELAYED: "SHIPMENT_DELAYED",
  CONFIRM_RECEIVED: "SHIPMENT_RECEIPT_CONFIRMED",
});

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

export class ShipmentService {
  /**
   * @param {import("./shipment.d.ts").ShipmentServiceOptions} options
   */
  constructor(options) {
    if (!options?.repository) {
      throw new TypeError("ShipmentService requires a repository.");
    }

    this.repository = options.repository;
    this.auditContext = options.auditContext ?? null;
    this.proofService = options.proofService ?? null;
    this.notificationService = options.notificationService ?? null;
    this.transaction = options.transaction ?? null;
  }

  /**
   * @param {import("./shipment.d.ts").ShipmentServiceCreateCommand} command
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async createShipment(command) {
    const actor = resolveSingleActiveContextActor(command.actor);

    return this.runInTransaction(async (repository) => {
      const findSemenOrderById = requireRepositoryMethod(
        repository,
        "findSemenOrderById",
      );
      const createShipmentWithTrackingEvent = requireRepositoryMethod(
        repository,
        "createShipmentWithTrackingEvent",
      );
      const existingOrder = await findRequiredEntity(
        () => findSemenOrderById(command.orderId),
        "SemenOrder",
        command.orderId,
      );
      const prepared = prepareCreateShipment({
        status: command.body.status,
        providerName: command.body.providerName,
        providerTrackingId: command.body.providerTrackingId,
        trackingUrl: command.body.trackingUrl,
        eventSource: command.body.eventSource,
        sourceEventId: command.body.sourceEventId,
        providerStatus: command.body.providerStatus,
        location: command.body.location,
        notes: command.body.notes,
        occurredAt: command.body.occurredAt,
        createdAt: command.body.createdAt,
        now: command.body.now,
        existingOrder,
        actor,
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

      return this.finalizeShipmentChange({
        commandName: "CREATE_SHIPMENT",
        change: refreshed,
        previousShipment: null,
        repository,
        status: 201,
      });
    });
  }

  /**
   * @param {import("./shipment.d.ts").ShipmentServiceUpdateStatusCommand} command
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async updateShipmentStatus(command) {
    return this.applyTrackingEventCommand({
      ...command,
      commandName: "UPDATE_SHIPMENT_STATUS",
      toStatus: command.toStatus,
    });
  }

  /**
   * @param {import("./shipment.d.ts").ShipmentServiceAttachTrackingReferenceCommand} command
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async attachTrackingReference(command) {
    const providerName = normalizeOptionalString(command.body.providerName);
    const providerTrackingId = normalizeOptionalString(command.body.providerTrackingId);
    const trackingUrl = normalizeOptionalString(command.body.trackingUrl);

    if (!providerName && !providerTrackingId && !trackingUrl) {
      throw new ShipmentValidationError([
        "providerName, providerTrackingId or trackingUrl is required to attach a tracking reference.",
      ]);
    }

    return this.applyTrackingEventCommand({
      actor: command.actor,
      shipmentId: command.shipmentId,
      commandName: "ATTACH_TRACKING_REFERENCE",
      body: {
        ...command.body,
        toStatus: command.body.toStatus,
      },
    });
  }

  /**
   * @param {import("./shipment.d.ts").ShipmentServiceNamedStatusCommand} command
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async markDelivered(command) {
    return this.applyTrackingEventCommand({
      ...command,
      commandName: "MARK_DELIVERED",
      toStatus: "DELIVERED",
    });
  }

  /**
   * @param {import("./shipment.d.ts").ShipmentServiceNamedStatusCommand} command
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async markDelayed(command) {
    return this.applyTrackingEventCommand({
      ...command,
      commandName: "MARK_DELAYED",
      toStatus: "DELAYED",
    });
  }

  /**
   * @param {import("./shipment.d.ts").ShipmentServiceConfirmReceivedCommand} command
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async confirmReceived(command) {
    const actor = resolveSingleActiveContextActor(command.actor);

    return this.runInTransaction(async (repository) => {
      const findShipmentById = requireRepositoryMethod(
        repository,
        "findShipmentById",
      );
      const updateShipmentWithTrackingEvent = requireRepositoryMethod(
        repository,
        "updateShipmentWithTrackingEvent",
      );
      const existingShipment = await findRequiredEntity(
        () => findShipmentById(command.shipmentId),
        "Shipment",
        command.shipmentId,
      );
      const prepared = prepareConfirmShipmentReceived({
        toStatus: "DELIVERED",
        eventSource: command.body.eventSource,
        sourceEventId: command.body.sourceEventId,
        providerStatus: command.body.providerStatus,
        location: command.body.location,
        notes: command.body.notes,
        occurredAt: command.body.occurredAt,
        now: command.body.now,
        existingShipment,
        actor,
      });
      const persisted = await updateShipmentWithTrackingEvent(
        prepared.shipment,
        prepared.trackingEvent,
      );
      const refreshed = rebuildPersistedChange(
        prepared,
        persisted,
        existingShipment,
        "SHIPMENT_RECEIPT_CONFIRMED",
      );

      return this.finalizeShipmentChange({
        commandName: "CONFIRM_RECEIVED",
        change: refreshed,
        previousShipment: existingShipment,
        repository,
        status: 200,
      });
    });
  }

  /**
   * @param {object} command
   * @param {import("./shipment.d.ts").ShipmentActorContext} command.actor
   * @param {string} command.shipmentId
   * @param {import("./shipment.d.ts").ShipmentServiceCommandName} command.commandName
   * @param {import("./shipment.d.ts").ShipmentStatus | string} [command.toStatus]
   * @param {Partial<import("./shipment.d.ts").CreateShipmentTrackingEventInputBody>} command.body
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async applyTrackingEventCommand(command) {
    const actor = resolveSingleActiveContextActor(command.actor);

    return this.runInTransaction(async (repository) => {
      const findShipmentById = requireRepositoryMethod(
        repository,
        "findShipmentById",
      );
      const updateShipmentWithTrackingEvent = requireRepositoryMethod(
        repository,
        "updateShipmentWithTrackingEvent",
      );
      const existingShipment = await findRequiredEntity(
        () => findShipmentById(command.shipmentId),
        "Shipment",
        command.shipmentId,
      );
      const prepared = prepareCreateShipmentTrackingEvent({
        toStatus: command.toStatus ?? command.body.toStatus ?? existingShipment.status,
        providerName: command.body.providerName,
        providerTrackingId: command.body.providerTrackingId,
        trackingUrl: command.body.trackingUrl,
        eventSource: command.body.eventSource,
        sourceEventId: command.body.sourceEventId,
        providerStatus: command.body.providerStatus,
        location: command.body.location,
        notes: command.body.notes,
        occurredAt: command.body.occurredAt,
        now: command.body.now,
        existingShipment,
        actor,
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

      return this.finalizeShipmentChange({
        commandName: command.commandName,
        change: refreshed,
        previousShipment: existingShipment,
        repository,
        status: 200,
      });
    });
  }

  /**
   * @param {object} input
   * @param {import("./shipment.d.ts").ShipmentServiceCommandName} input.commandName
   * @param {import("./shipment.d.ts").PreparedShipmentTrackingChange} input.change
   * @param {import("./shipment.d.ts").ShipmentLike | null} input.previousShipment
   * @param {import("./shipment.d.ts").ShipmentRepository} input.repository
   * @param {number} input.status
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async finalizeShipmentChange(input) {
    const auditLog = await createAuditLogFromHook({
      repository: input.repository,
      auditHook: input.change.auditHook,
      requestContext: this.auditContext,
    });
    const proofResult = await this.dispatchProofHook({
      proofHook: input.change.proofHook,
      repository: input.repository,
      auditLog,
    });
    const notificationHook = buildShipmentNotificationHook({
      commandName: input.commandName,
      change: input.change,
      previousShipment: input.previousShipment,
    });
    const notificationResult = await this.dispatchNotificationHook(notificationHook);

    return deepFreeze({
      status: input.status,
      body: {
        shipment: input.change.shipment,
        trackingEvent: input.change.trackingEvent,
      },
      shipment: input.change.shipment,
      trackingEvent: input.change.trackingEvent,
      auditHook: input.change.auditHook,
      auditLog,
      proofHook: input.change.proofHook,
      proofResult,
      notificationHook,
      notificationResult,
      idempotent: false,
    });
  }

  /**
   * @param {(repository: import("./shipment.d.ts").ShipmentRepository) => Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>} operation
   * @returns {Promise<import("./shipment.d.ts").ShipmentServiceCommandResult>}
   */
  async runInTransaction(operation) {
    if (typeof this.transaction === "function") {
      return this.transaction((repository) => operation(repository ?? this.repository));
    }

    return operation(this.repository);
  }

  /**
   * @param {object} input
   * @param {import("./shipment.d.ts").ShipmentProofHook | null} input.proofHook
   * @param {import("./shipment.d.ts").ShipmentRepository} input.repository
   * @param {import("../audit/audit-log.d.ts").AuditLog | null} input.auditLog
   * @returns {Promise<unknown>}
   */
  async dispatchProofHook(input) {
    const proofHook = input.proofHook;

    if (!proofHook || !this.proofService) {
      if (input.repository && typeof input.repository.createProofEvent === "function") {
        return createProofEventFromHook({
          repository: /** @type {import("../proof/proof-event.d.ts").ProofEventRepository} */ (
            input.repository
          ),
          proofHook,
          auditContext: this.auditContext,
          auditLogId: input.auditLog?.id ?? null,
        });
      }

      return null;
    }

    if (typeof this.proofService.recordProofHook === "function") {
      return this.proofService.recordProofHook(proofHook);
    }

    if (typeof this.proofService.createProofEventFromHook === "function") {
      return this.proofService.createProofEventFromHook(proofHook);
    }

    return null;
  }

  /**
   * @param {import("./shipment.d.ts").ShipmentNotificationHook | null} notificationHook
   * @returns {Promise<unknown>}
   */
  async dispatchNotificationHook(notificationHook) {
    if (!notificationHook || !this.notificationService) {
      return null;
    }

    if (typeof this.notificationService.recordShipmentNotificationHook === "function") {
      return this.notificationService.recordShipmentNotificationHook(notificationHook);
    }

    if (typeof this.notificationService.enqueueShipmentNotification === "function") {
      return this.notificationService.enqueueShipmentNotification(notificationHook);
    }

    return null;
  }
}

/**
 * @param {import("./shipment.d.ts").ShipmentServiceOptions} options
 * @returns {ShipmentService}
 */
export function createShipmentService(options) {
  return new ShipmentService(options);
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
 * @param {import("./shipment.d.ts").ShipmentActorContext} actor
 * @param {import("./shipment.d.ts").ShipmentAccessTarget} target
 * @returns {boolean}
 */
export function canConfirmShipmentReceived(actor, target) {
  return Boolean(findConfirmShipmentActorRole(actor, target));
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
    deliveredAt: status === "DELIVERED" ? occurredAt : null,
    confirmedReceivedAt: null,
    confirmedByUserId: null,
    confirmationSource: status === "DELIVERED" ? "STATION_MARKED_DELIVERED" : null,
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
  validateOptionalNonBlankString(input.providerName, "providerName", issues);
  validateOptionalNonBlankString(input.providerTrackingId, "providerTrackingId", issues);
  validateOptionalNonBlankString(input.sourceEventId, "sourceEventId", issues);
  validateOptionalNonBlankString(input.providerStatus, "providerStatus", issues);
  validateOptionalNonBlankString(input.location, "location", issues);
  validateOptionalNonBlankString(input.notes, "notes", issues);
  validateOptionalTrackingUrl(input.trackingUrl, issues);
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
    providerName: normalizeOptionalString(input.providerName) ?? input.existingShipment.providerName,
    providerTrackingId: normalizeOptionalString(input.providerTrackingId) ??
      input.existingShipment.providerTrackingId,
    trackingUrl: normalizeOptionalString(input.trackingUrl) ?? input.existingShipment.trackingUrl,
    deliveredAt: toStatus === "DELIVERED"
      ? input.existingShipment.deliveredAt ?? occurredAt
      : input.existingShipment.deliveredAt ?? null,
    confirmedReceivedAt: input.existingShipment.confirmedReceivedAt ?? null,
    confirmedByUserId: input.existingShipment.confirmedByUserId ?? null,
    confirmationSource: toStatus === "DELIVERED"
      ? input.existingShipment.confirmationSource ?? "STATION_MARKED_DELIVERED"
      : input.existingShipment.confirmationSource ?? null,
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
 * @param {import("./shipment.d.ts").CreateShipmentTrackingEventInput} input
 * @returns {string[]}
 */
export function validateConfirmShipmentReceivedInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const eventSource = input.eventSource === undefined
    ? "MANUAL"
    : normalizeRequiredString(input.eventSource);

  issues.push(...actorIssues);
  validateShipmentForTrackingEvent(input.existingShipment, issues);

  if (input.existingShipment && !["IN_TRANSIT", "DELIVERED"].includes(input.existingShipment.status)) {
    issues.push("breeder receipt confirmation is allowed only for IN_TRANSIT or DELIVERED shipments.");
  }

  if (input.existingShipment?.confirmedReceivedAt) {
    issues.push("shipment receipt has already been confirmed.");
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
    !findConfirmShipmentActorRole(input.actor, input.existingShipment)
  ) {
    issues.push("actor must be the active BREEDER user for the shipment order.");
  }

  return issues;
}

/**
 * @param {import("./shipment.d.ts").CreateShipmentTrackingEventInput} input
 * @returns {import("./shipment.d.ts").PreparedShipmentTrackingChange}
 */
export function prepareConfirmShipmentReceived(input) {
  const issues = validateConfirmShipmentReceivedInput(input);

  if (issues.length > 0) {
    throw new ShipmentValidationError(issues);
  }

  const actorRole = findConfirmShipmentActorRole(input.actor, input.existingShipment);

  if (!actorRole) {
    throw new ShipmentAuthorizationError(
      "actor must be authorized before confirming shipment receipt.",
    );
  }

  const occurredAt = toIsoTimestamp(input.occurredAt ?? input.now ?? new Date());
  const recordedAt = toIsoTimestamp(input.now ?? input.occurredAt ?? new Date());
  const eventSource = /** @type {import("./shipment.d.ts").ShipmentTrackingEventSource} */ (
    normalizeRequiredString(input.eventSource) || "MANUAL"
  );
  const shipment = Object.freeze({
    ...input.existingShipment,
    status: "DELIVERED",
    deliveredAt: input.existingShipment.deliveredAt ?? occurredAt,
    confirmedReceivedAt: occurredAt,
    confirmedByUserId: input.actor.userId.trim(),
    confirmationSource: "BREEDER_CONFIRMED_RECEIVED",
    updatedByUserId: input.actor.userId.trim(),
    updatedAt: recordedAt,
  });
  const trackingEvent = buildTrackingEvent({
    id: normalizeOptionalString(input.trackingEventId),
    shipment,
    fromStatus: input.existingShipment.status,
    toStatus: "DELIVERED",
    actorRole,
    eventSource,
    sourceEventId: normalizeOptionalString(input.sourceEventId),
    providerStatus: normalizeOptionalString(input.providerStatus),
    location: normalizeOptionalString(input.location),
    notes: normalizeOptionalString(input.notes) ?? "Breeder confirmed shipment receipt.",
    occurredAt,
    recordedAt,
  });
  const auditHook = buildShipmentTrackingAuditHook({
    action: "SHIPMENT_RECEIPT_CONFIRMED",
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
 * @param {import("./shipment.d.ts").ShipmentNotificationHookInput} input
 * @returns {import("./shipment.d.ts").ShipmentNotificationHook | null}
 */
export function buildShipmentNotificationHook(input) {
  const eventType = SHIPMENT_NOTIFICATION_EVENT_BY_COMMAND[input.commandName];

  if (!eventType) {
    return null;
  }

  return Object.freeze({
    hookType: "SHIPMENT_NOTIFICATION_REQUEST",
    eventType,
    commandName: input.commandName,
    shipmentId: input.change.shipment.id,
    semenOrderId: input.change.shipment.semenOrderId,
    orderNumber: input.change.shipment.orderNumber,
    breederOrganizationId: input.change.shipment.breederOrganizationId,
    breedingStationOrganizationId: input.change.shipment.breedingStationOrganizationId,
    fromStatus: input.previousShipment?.status ?? input.change.trackingEvent.fromStatus,
    toStatus: input.change.shipment.status,
    trackingEventId: input.change.trackingEvent.id,
    actorUserId: input.change.trackingEvent.actorUserId,
    actorRoleCode: input.change.trackingEvent.actorRoleCode,
    actorOrganizationId: input.change.trackingEvent.actorOrganizationId,
    occurredAt: input.change.trackingEvent.occurredAt,
  });
}

/**
 * @param {import("./shipment.d.ts").EndpointRequest<import("./shipment.d.ts").CreateShipmentInputBody>} request
 * @returns {Promise<import("./shipment.d.ts").EndpointResponse<{ shipment: import("./shipment.d.ts").Shipment, trackingEvent: import("./shipment.d.ts").ShipmentTrackingEvent }>>}
 */
export async function createShipmentEndpoint(request) {
  const orderId = requireParam(request.params, "orderId");
  const service = createShipmentService({
    repository: request.repository,
    auditContext: request.auditContext,
  });
  const result = await service.createShipment({
    actor: request.actor,
    orderId,
    body: request.body,
  });

  return Object.freeze({
    status: result.status,
    body: result.body,
    auditHook: result.auditHook,
    auditLog: result.auditLog,
    proofHook: result.proofHook,
    proofResult: result.proofResult,
  });
}

/**
 * @param {import("./shipment.d.ts").EndpointRequest<import("./shipment.d.ts").CreateShipmentTrackingEventInputBody>} request
 * @returns {Promise<import("./shipment.d.ts").EndpointResponse<{ shipment: import("./shipment.d.ts").Shipment, trackingEvent: import("./shipment.d.ts").ShipmentTrackingEvent }>>}
 */
export async function createShipmentTrackingEventEndpoint(request) {
  const shipmentId = requireParam(request.params, "shipmentId");
  const service = createShipmentService({
    repository: request.repository,
    auditContext: request.auditContext,
  });
  const result = await service.updateShipmentStatus({
    actor: request.actor,
    shipmentId,
    toStatus: request.body.toStatus,
    body: request.body,
  });

  return Object.freeze({
    status: result.status,
    body: result.body,
    auditHook: result.auditHook,
    auditLog: result.auditLog,
    proofHook: result.proofHook,
    proofResult: result.proofResult,
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
 * @param {import("./shipment.d.ts").ShipmentAccessTarget} target
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findConfirmShipmentActorRole(actor, target) {
  return findActorRole(actor, "BREEDER", target.breederOrganizationId);
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
 * @param {import("./shipment.d.ts").ShipmentActorContext} actor
 * @returns {import("./shipment.d.ts").ShipmentActorContext}
 */
function resolveSingleActiveContextActor(actor) {
  const actorIssues = validateActor(actor);

  if (actorIssues.length > 0) {
    throw new ShipmentValidationError(actorIssues);
  }

  const activeRoles = actor.roles.filter((assignment) =>
    assignment.userId === actor.userId &&
    isActiveRoleAssignment(assignment) &&
    isPhase1RoleCode(assignment.roleCode),
  );

  if (activeRoles.length !== 1) {
    throw new ShipmentValidationError([
      "actor.roles must contain exactly one validated active organization role context.",
    ]);
  }

  return Object.freeze({
    userId: actor.userId.trim(),
    roles: Object.freeze([Object.freeze(activeRoles[0])]),
  });
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
    deliveredAt: shipment.deliveredAt ?? null,
    confirmedReceivedAt: shipment.confirmedReceivedAt ?? null,
    confirmedByUserId: shipment.confirmedByUserId ?? null,
    confirmationSource: shipment.confirmationSource ?? null,
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
