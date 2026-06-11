// @ts-check

import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import {
  SHIPMENT_STATUSES,
  SHIPMENT_TRACKING_EVENT_SOURCES,
  ShipmentAuthorizationError,
  ShipmentValidationError,
  canManageShipment,
  createShipmentService,
} from "@coritech/domain/shipments/shipment.mjs";

export const SHIPMENT_MANAGEMENT_ROUTES = Object.freeze({
  dashboard: "/station-dashboard",
  orderManagement: "/app/station/orders",
  shipmentManagement: "/app/station/shipments",
});

export class ShipmentManagementValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech shipment management input:\n- ${issues.join("\n- ")}`);
    this.name = "ShipmentManagementValidationError";
    this.issues = issues;
  }
}

export class ShipmentManagementAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "ShipmentManagementAuthorizationError";
  }
}

/**
 * @param {import("./shipment-management.d.ts").ShipmentManagementInput} input
 * @returns {import("./shipment-management.d.ts").ShipmentManagementViewModel}
 */
export function createShipmentManagementViewModel(input) {
  const issues = validateShipmentManagementInput(input);

  if (issues.length > 0) {
    throw new ShipmentManagementValidationError(issues);
  }

  const organizationContext = resolveStationOrganizationContext({
    actor: input.actor,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });
  const shipment = input.shipment ?? null;
  const target = shipment ?? input.order;

  if (!canManageShipment(input.actor, target)) {
    throw new ShipmentManagementAuthorizationError(
      "actor may only manage shipments for their assigned breeding station.",
    );
  }

  const operation = shipment ? "UPDATE" : "CREATE";
  const form = normalizeForm(input.form, shipment);

  return Object.freeze({
    state: "FORM",
    actorUserId: input.actor.userId.trim(),
    organizationContext,
    title: operation === "CREATE"
      ? `Create shipment for ${input.order.orderNumber}`
      : `Update shipment for ${input.order.orderNumber}`,
    summary: operation === "CREATE"
      ? "Record provider and tracking details for a confirmed station order."
      : "Append a tracking event and update the current shipment status.",
    operation,
    order: Object.freeze({
      id: normalizeOptionalString(input.order.id),
      orderNumber: input.order.orderNumber,
      status: input.order.status,
      requestedDeliveryDate: normalizeOptionalString(input.order.requestedDeliveryDate),
    }),
    shipment,
    trackingEvents: Object.freeze([...(input.trackingEvents ?? [])]),
    form,
    validationIssues: Object.freeze(input.validationIssues ?? []),
    actionFeedback: input.actionFeedback
      ? Object.freeze({
        tone: input.actionFeedback.tone === "success" ? "success" : "danger",
        title: input.actionFeedback.title,
        message: input.actionFeedback.message,
      })
      : null,
    navigation: Object.freeze({
      dashboardHref: SHIPMENT_MANAGEMENT_ROUTES.dashboard,
      orderManagementHref: buildOrderManagementHref(input.order),
      shipmentManagementHref: SHIPMENT_MANAGEMENT_ROUTES.shipmentManagement,
    }),
    statuses: SHIPMENT_STATUSES,
    eventSources: SHIPMENT_TRACKING_EVENT_SOURCES,
  });
}

/**
 * @param {unknown} error
 * @returns {import("./shipment-management.d.ts").ShipmentManagementErrorViewModel}
 */
export function createShipmentManagementErrorState(error) {
  return Object.freeze({
    state: "ERROR",
    title: error instanceof ShipmentManagementAuthorizationError
      ? "Shipment unavailable"
      : "Shipment workflow could not load",
    message: error instanceof Error ? error.message : "An unknown shipment workflow error occurred.",
  });
}

/**
 * @param {import("./shipment-management.d.ts").ExecuteShipmentManagementActionInput} input
 * @returns {Promise<import("./shipment-management.d.ts").ExecuteShipmentManagementActionResult>}
 */
export async function executeShipmentManagementAction(input) {
  const action = normalizeAction(input.action);
  const orderId = normalizeOptionalString(input.orderId);
  const shipmentId = normalizeOptionalString(input.shipmentId);
  const form = normalizeForm(input.form, null);
  const issues = [];

  if (!action) {
    issues.push("action must be create or update.");
  }

  if (action === "create" && !orderId) {
    issues.push("orderId is required when creating a shipment.");
  }

  if (action === "update" && !shipmentId) {
    issues.push("shipmentId is required when updating a shipment.");
  }

  if (issues.length > 0) {
    return Object.freeze({
      ok: false,
      action: action ?? "unknown",
      orderId: orderId ?? "",
      shipmentId: shipmentId ?? "",
      issues: Object.freeze(issues),
    });
  }

  try {
    const service = createShipmentService({
      repository: input.repository,
      auditContext: input.auditContext,
      notificationService: input.notificationService,
      transaction: input.transaction,
    });
    const body = {
      status: form.status,
      toStatus: form.status,
      providerName: emptyStringToNull(form.providerName),
      providerTrackingId: emptyStringToNull(form.providerTrackingId),
      trackingUrl: emptyStringToNull(form.trackingUrl),
      eventSource: form.eventSource,
      providerStatus: emptyStringToNull(form.providerStatus),
      location: emptyStringToNull(form.location),
      notes: emptyStringToNull(form.notes),
    };
    const result = action === "create"
      ? await service.createShipment({
        actor: input.actor,
        orderId: /** @type {string} */ (orderId),
        body,
      })
      : await service.updateShipmentStatus({
        actor: input.actor,
        shipmentId: /** @type {string} */ (shipmentId),
        toStatus: form.status,
        body,
      });

    return Object.freeze({
      ok: true,
      action,
      shipment: result.shipment,
      trackingEvent: result.trackingEvent,
      auditHook: result.auditHook,
      auditLog: result.auditLog,
      proofHook: result.proofHook,
      proofResult: result.proofResult,
      notificationHook: result.notificationHook,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      action: action ?? "unknown",
      orderId: orderId ?? "",
      shipmentId: shipmentId ?? "",
      issues: Object.freeze(errorToIssues(error)),
    });
  }
}

/**
 * @param {import("./shipment-management.d.ts").ConfirmShipmentReceivedActionInput} input
 * @returns {Promise<import("./shipment-management.d.ts").ExecuteShipmentManagementActionResult>}
 */
export async function confirmShipmentReceivedAction(input) {
  const shipmentId = normalizeOptionalString(input.shipmentId);

  if (!shipmentId) {
    return Object.freeze({
      ok: false,
      action: "confirm_received",
      orderId: "",
      shipmentId: "",
      issues: Object.freeze(["shipmentId is required when confirming receipt."]),
    });
  }

  try {
    const service = createShipmentService({
      repository: input.repository,
      auditContext: input.auditContext,
      notificationService: input.notificationService,
      transaction: input.transaction,
    });
    const result = await service.confirmReceived({
      actor: input.actor,
      shipmentId,
      body: {
        notes: normalizeOptionalString(input.notes) ?? "Breeder confirmed shipment receipt.",
      },
    });

    return Object.freeze({
      ok: true,
      action: "update",
      shipment: result.shipment,
      trackingEvent: result.trackingEvent,
      auditHook: result.auditHook,
      auditLog: result.auditLog,
      proofHook: result.proofHook,
      proofResult: result.proofResult,
      notificationHook: result.notificationHook,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      action: "confirm_received",
      orderId: "",
      shipmentId,
      issues: Object.freeze(errorToIssues(error)),
    });
  }
}

/**
 * @param {import("./shipment-management.d.ts").ShipmentManagementInput | undefined} input
 * @returns {string[]}
 */
function validateShipmentManagementInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["shipment management input is required."];
  }

  if (!input.actor || typeof input.actor !== "object") {
    issues.push("actor is required.");
  } else {
    if (!normalizeRequiredString(input.actor.userId)) {
      issues.push("actor.userId is required.");
    }

    if (!Array.isArray(input.actor.roles)) {
      issues.push("actor.roles must list the signed-in user's active role context.");
    }
  }

  if (!input.order || typeof input.order !== "object") {
    issues.push("order is required.");
  } else {
    if (!normalizeRequiredString(input.order.id)) {
      issues.push("order.id is required.");
    }

    if (!normalizeRequiredString(input.order.orderNumber)) {
      issues.push("order.orderNumber is required.");
    }
  }

  validateOptionalNonBlankString(input.organizationId, "organizationId", issues);
  validateOptionalNonBlankString(input.organizationName, "organizationName", issues);

  return issues;
}

/**
 * @param {{
 *   actor: import("./shipment-management.d.ts").ShipmentManagementActorContext;
 *   organizationId?: string | null;
 *   organizationName?: string | null;
 * }} input
 * @returns {import("./shipment-management.d.ts").ShipmentManagementViewModel["organizationContext"]}
 */
function resolveStationOrganizationContext(input) {
  const activeStationRoles = input.actor.roles.filter((assignment) =>
    assignment.roleCode === "BREEDING_STATION" &&
    assignment.userId === input.actor.userId &&
    isActiveRoleAssignment(assignment)
  );

  if (activeStationRoles.length === 0) {
    throw new ShipmentManagementAuthorizationError(
      "actor must have an active BREEDING_STATION role before managing shipments.",
    );
  }

  const selectedRole = input.organizationId
    ? activeStationRoles.find((assignment) => assignment.organizationId === input.organizationId)
    : activeStationRoles[0];

  if (!selectedRole) {
    throw new ShipmentManagementAuthorizationError(
      "actor may only manage shipments for their active breeding station context.",
    );
  }

  return Object.freeze({
    organizationId: selectedRole.organizationId,
    organizationName: normalizeOptionalString(input.organizationName) ?? selectedRole.organizationId,
    roleCode: "BREEDING_STATION",
  });
}

/**
 * @param {import("./shipment-management.d.ts").ShipmentManagementFormInput | undefined} form
 * @param {import("@coritech/domain/shipments/shipment.d.ts").Shipment | null} shipment
 * @returns {import("./shipment-management.d.ts").ShipmentManagementFormState}
 */
function normalizeForm(form = {}, shipment = null) {
  const status = normalizeShipmentStatus(form.status) ?? shipment?.status ?? "PREPARED";
  const eventSource = normalizeEventSource(form.eventSource) ?? "MANUAL";

  return Object.freeze({
    action: normalizeAction(form.action) ?? (shipment ? "update" : "create"),
    providerName: normalizeOptionalString(form.providerName) ?? shipment?.providerName ?? "",
    providerTrackingId: normalizeOptionalString(form.providerTrackingId) ??
      shipment?.providerTrackingId ??
      "",
    trackingUrl: normalizeOptionalString(form.trackingUrl) ?? shipment?.trackingUrl ?? "",
    status,
    eventSource,
    providerStatus: normalizeOptionalString(form.providerStatus) ?? "",
    location: normalizeOptionalString(form.location) ?? "",
    notes: normalizeOptionalString(form.notes) ?? "",
  });
}

/**
 * @param {unknown} value
 * @returns {"create" | "update" | null}
 */
function normalizeAction(value) {
  return value === "create" || value === "update"
    ? value
    : null;
}

/**
 * @param {unknown} value
 * @returns {import("@coritech/domain/shipments/shipment.d.ts").ShipmentStatus | null}
 */
function normalizeShipmentStatus(value) {
  return typeof value === "string" && SHIPMENT_STATUSES.includes(
    /** @type {import("@coritech/domain/shipments/shipment.d.ts").ShipmentStatus} */ (value),
  )
    ? /** @type {import("@coritech/domain/shipments/shipment.d.ts").ShipmentStatus} */ (value)
    : null;
}

/**
 * @param {unknown} value
 * @returns {"MANUAL" | "LOGISTICS_PROVIDER" | "SYSTEM" | null}
 */
function normalizeEventSource(value) {
  return value === "MANUAL" || value === "LOGISTICS_PROVIDER" || value === "SYSTEM"
    ? value
    : null;
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderLike} order
 * @returns {string}
 */
function buildOrderManagementHref(order) {
  const orderLookupId = normalizeOptionalString(order.id) ?? order.orderNumber;

  return `${SHIPMENT_MANAGEMENT_ROUTES.orderManagement}?orderId=${encodeURIComponent(orderLookupId)}`;
}

/**
 * @param {unknown} error
 * @returns {string[]}
 */
function errorToIssues(error) {
  if (
    error instanceof ShipmentValidationError ||
    (error && typeof error === "object" && Array.isArray(error.issues))
  ) {
    return /** @type {{ issues: string[] }} */ (error).issues;
  }

  if (error instanceof ShipmentAuthorizationError || error instanceof Error) {
    return [error.message];
  }

  return ["Shipment action failed."];
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
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

/**
 * @param {string} value
 * @returns {string | null}
 */
function emptyStringToNull(value) {
  return value.trim() === "" ? null : value;
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
