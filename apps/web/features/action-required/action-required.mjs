// @ts-check

import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import {
  canTransitionSemenOrderStatus,
  canViewSemenOrder,
} from "@coritech/domain/orders/semen-order.mjs";
import {
  canManageShipment,
  canViewShipment,
} from "@coritech/domain/shipments/shipment.mjs";

export const ACTION_REQUIRED_ROUTES = Object.freeze({
  breederOrderDetail: "/app/orders",
  breederOrderDraft: "/app/orders/new",
  stationDashboard: "/station-dashboard",
  stationShipments: "/app/station/shipments",
  adminAudit: "/app/admin/audit",
  adminAmendments: "/app/admin/amendments",
  adminSupport: "/app/admin/support",
});

const BREEDER_ACTION_STATUS_COPY = Object.freeze({
  DRAFT: Object.freeze({
    actionType: "SUBMIT_DRAFT_ORDER",
    title: "Draft order awaiting submission",
    description: "Review and submit the order when it is ready for station review.",
    actionLabel: "Edit draft",
    priority: "HIGH",
  }),
  CONFIRMED: Object.freeze({
    actionType: "REVIEW_CONFIRMED_ORDER",
    title: "Order confirmed for review",
    description: "Review the confirmed station response and next operational steps.",
    actionLabel: "Review order",
    priority: "MEDIUM",
  }),
  REJECTED: Object.freeze({
    actionType: "REVIEW_REJECTED_ORDER",
    title: "Station response needs review",
    description: "Review the station response and decide the next operational step.",
    actionLabel: "Review order",
    priority: "MEDIUM",
  }),
});

const SHIPMENT_TERMINAL_STATUSES = Object.freeze([
  "DELIVERED",
  "FAILED",
  "CANCELLED",
]);

/**
 * @param {import("./action-required.d.ts").BreederActionRequiredInput} input
 * @returns {import("./action-required.d.ts").ActionRequiredItem[]}
 */
export function createBreederActionRequiredItems(input) {
  const actor = input.actor;
  const organizationId = resolveActorOrganizationId(
    actor,
    "BREEDER",
    input.organizationId,
  );

  if (!organizationId) {
    return [];
  }

  const orders = (input.orders ?? [])
    .filter((order) =>
      order?.breederOrganizationId === organizationId &&
      canViewSemenOrder(actor, order)
    );
  const orderItems = orders.flatMap((order) => {
    if (!hasOwn(BREEDER_ACTION_STATUS_COPY, order.status)) {
      return [];
    }

    const copy =
      /** @type {Record<string, import("./action-required.d.ts").BreederOrderActionCopy>} */ (
        BREEDER_ACTION_STATUS_COPY
      )[order.status];
    const orderId = normalizeOptionalString(order.id);

    return [
      freezeActionItem({
        id: `${order.orderNumber}-${copy.actionType}`,
        actorRoleCode: "BREEDER",
        actionType: copy.actionType,
        objectType: "SemenOrder",
        objectId: orderId ?? order.orderNumber,
        objectLabel: order.orderNumber,
        title: copy.title,
        description: copy.description,
        actionLabel: copy.actionLabel,
        href: order.status === "DRAFT" && orderId
          ? `${ACTION_REQUIRED_ROUTES.breederOrderDraft}?draftOrderId=${encodeURIComponent(orderId)}`
          : buildBreederOrderHref(order),
        priority: copy.priority,
        dueAt: normalizeOptionalString(order.requestedDeliveryDate),
        createdAt: normalizeOptionalString(order.createdAt),
        updatedAt: normalizeOptionalString(order.updatedAt),
      }),
    ];
  });
  const shipmentItems = (input.shipments ?? [])
    .filter((shipment) =>
      shipment?.breederOrganizationId === organizationId &&
      canViewShipment(actor, shipment) &&
      (shipment.status === "DELIVERED" || shipment.status === "IN_TRANSIT") &&
      !normalizeOptionalString(shipment.confirmedReceivedAt)
    )
    .map((shipment) =>
      freezeActionItem({
        id: `${shipment.orderNumber}-${normalizeOptionalString(shipment.id) ?? "shipment"}-confirm-receipt`,
        actorRoleCode: "BREEDER",
        actionType: "CONFIRM_SHIPMENT_RECEIPT",
        objectType: "Shipment",
        objectId: normalizeOptionalString(shipment.id) ?? shipment.semenOrderId,
        objectLabel: shipment.orderNumber,
        title: "Confirm shipment receipt",
        description: "Confirm receipt once the delivered or in-transit shipment has been checked.",
        actionLabel: "Open order",
        href: `${ACTION_REQUIRED_ROUTES.breederOrderDetail}/${encodeURIComponent(shipment.semenOrderId)}`,
        priority: shipment.status === "DELIVERED" ? "HIGH" : "MEDIUM",
        dueAt: normalizeOptionalString(shipment.deliveredAt),
        createdAt: normalizeOptionalString(shipment.createdAt),
        updatedAt: normalizeOptionalString(shipment.updatedAt),
      })
    );

  return sortAndLimitActionItems(
    [...orderItems, ...shipmentItems],
    input.limit,
  );
}

/**
 * @param {import("./action-required.d.ts").StationActionRequiredInput} input
 * @returns {import("./action-required.d.ts").ActionRequiredItem[]}
 */
export function createStationActionRequiredItems(input) {
  const actor = input.actor;
  const organizationId = resolveActorOrganizationId(
    actor,
    "BREEDING_STATION",
    input.organizationId,
  );

  if (!organizationId) {
    return [];
  }

  const visibleOrders = (input.orders ?? [])
    .filter((order) =>
      order?.breedingStationOrganizationId === organizationId &&
      canViewSemenOrder(actor, order)
    );
  const shipments = (input.shipments ?? [])
    .filter((shipment) =>
      shipment?.breedingStationOrganizationId === organizationId &&
      canViewShipment(actor, shipment)
    );
  const shipmentOrderKeys = new Set(shipments.flatMap((shipment) => [
    normalizeOptionalString(shipment.semenOrderId),
    `order-number:${shipment.orderNumber}`,
  ]).filter(Boolean));
  const orderItems = visibleOrders.flatMap((order) =>
    buildStationOrderItems({
      actor,
      order,
      shipmentOrderKeys,
    })
  );
  const shipmentItems = shipments
    .filter((shipment) =>
      !SHIPMENT_TERMINAL_STATUSES.includes(shipment.status) &&
      canManageShipment(actor, shipment)
    )
    .map((shipment) =>
      freezeActionItem({
        id: `${shipment.orderNumber}-${normalizeOptionalString(shipment.id) ?? "shipment"}-update-shipment`,
        actorRoleCode: "BREEDING_STATION",
        actionType: "UPDATE_SHIPMENT",
        objectType: "Shipment",
        objectId: normalizeOptionalString(shipment.id) ?? shipment.semenOrderId,
        objectLabel: shipment.orderNumber,
        title: "Update shipment",
        description: "Shipment has a non-terminal status and can receive a manual tracking update.",
        actionLabel: "Update shipment",
        href: buildStationShipmentHref(shipment),
        priority: shipment.status === "DELAYED" ? "HIGH" : "MEDIUM",
        dueAt: null,
        createdAt: normalizeOptionalString(shipment.createdAt),
        updatedAt: normalizeOptionalString(shipment.updatedAt),
      })
    );

  return sortAndLimitActionItems(
    [...orderItems, ...shipmentItems],
    input.limit,
  );
}

/**
 * @param {import("./action-required.d.ts").AdminActionRequiredInput} input
 * @returns {import("./action-required.d.ts").ActionRequiredItem[]}
 */
export function createAdminActionRequiredItems(input) {
  if (!hasActiveRole(input.actor, "PLATFORM_ADMIN")) {
    return [];
  }

  const supportItems = (input.supportRequests ?? [])
    .filter((request) => request.status === "OPEN" || request.status === "IN_REVIEW")
    .map((request) =>
      freezeActionItem({
        id: `${request.id ?? request.objectId}-support-request`,
        actorRoleCode: "PLATFORM_ADMIN",
        actionType: "REVIEW_SUPPORT_REQUEST",
        objectType: "SupportRequest",
        objectId: request.id ?? request.objectId,
        objectLabel: String(request.objectRef.orderNumber ?? request.objectId),
        title: request.status === "OPEN"
          ? "Open support request"
          : "Support request in review",
        description: `Review ${formatLabel(request.category)} support request for ${String(
          request.objectRef.orderNumber ?? request.objectId,
        )}.`,
        actionLabel: "Open support",
        href: `${ACTION_REQUIRED_ROUTES.adminSupport}?status=${encodeURIComponent(request.status)}`,
        priority: request.status === "OPEN" ? "HIGH" : "MEDIUM",
        dueAt: null,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      })
    );
  const amendmentItems = (input.amendments ?? [])
    .filter((amendment) => amendment.status === "SUBMITTED")
    .map((amendment) =>
      freezeActionItem({
        id: `${amendment.id ?? amendment.targetId}-amendment`,
        actorRoleCode: "PLATFORM_ADMIN",
        actionType: "REVIEW_AMENDMENT",
        objectType: "Amendment",
        objectId: amendment.id ?? amendment.targetId,
        objectLabel: amendment.orderNumber ?? amendment.targetId,
        title: "Submitted amendment needs review",
        description: `Review submitted amendment evidence for ${amendment.orderNumber ?? amendment.targetId}.`,
        actionLabel: "Open amendments",
        href: buildAdminAmendmentHref(amendment),
        priority: "HIGH",
        dueAt: null,
        createdAt: amendment.createdAt,
        updatedAt: amendment.updatedAt,
      })
    );
  const failedNotificationItems = (input.notificationLogs ?? [])
    .filter((log) => log.status === "FAILED")
    .map((log) =>
      freezeActionItem({
        id: `${log.id ?? log.eventType}-failed-notification`,
        actorRoleCode: "PLATFORM_ADMIN",
        actionType: "REVIEW_FAILED_NOTIFICATION",
        objectType: "NotificationLog",
        objectId: log.id ?? log.eventType,
        objectLabel: String(log.eventType),
        title: "Failed notification delivery",
        description: `Review failed ${formatLabel(log.eventType)} email delivery evidence.`,
        actionLabel: "Open audit",
        href: buildAuditHref("NotificationLog", log.id ?? String(log.eventType)),
        priority: "MEDIUM",
        dueAt: log.nextRetryAt,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
      })
    );

  return sortAndLimitActionItems(
    [...supportItems, ...amendmentItems, ...failedNotificationItems],
    input.limit,
  );
}

/**
 * @param {{
 *   actor: import("./action-required.d.ts").ActionRequiredActorContext;
 *   order: import("./action-required.d.ts").SemenOrderLike;
 *   shipmentOrderKeys: ReadonlySet<string>;
 * }} input
 * @returns {import("./action-required.d.ts").ActionRequiredItem[]}
 */
function buildStationOrderItems(input) {
  const items = [];
  const order = input.order;
  const orderId = normalizeOptionalString(order.id);
  const objectId = orderId ?? order.orderNumber;

  if (canTransitionSemenOrderStatus(input.actor, order, "RECEIVED")) {
    items.push(freezeActionItem({
      id: `${order.orderNumber}-receive-order`,
      actorRoleCode: "BREEDING_STATION",
      actionType: "RECEIVE_ORDER",
      objectType: "SemenOrder",
      objectId,
      objectLabel: order.orderNumber,
      title: "Receive submitted order",
      description: "Acknowledge that this submitted order has entered station review.",
      actionLabel: "Mark as received",
      href: buildStationOrderHref(order, "receive"),
      priority: "HIGH",
      dueAt: normalizeOptionalString(order.requestedDeliveryDate),
      createdAt: normalizeOptionalString(order.createdAt),
      updatedAt: normalizeOptionalString(order.updatedAt),
    }));
  }

  if (canTransitionSemenOrderStatus(input.actor, order, "CONFIRMED")) {
    items.push(freezeActionItem({
      id: `${order.orderNumber}-confirm-order`,
      actorRoleCode: "BREEDING_STATION",
      actionType: "CONFIRM_ORDER",
      objectType: "SemenOrder",
      objectId,
      objectLabel: order.orderNumber,
      title: "Confirm received order",
      description: "Confirm this received order or reject it from station review.",
      actionLabel: "Confirm",
      href: buildStationOrderHref(order, "confirm"),
      priority: "HIGH",
      dueAt: normalizeOptionalString(order.requestedDeliveryDate),
      createdAt: normalizeOptionalString(order.createdAt),
      updatedAt: normalizeOptionalString(order.updatedAt),
    }));
  }

  if (canTransitionSemenOrderStatus(input.actor, order, "REJECTED")) {
    items.push(freezeActionItem({
      id: `${order.orderNumber}-reject-order`,
      actorRoleCode: "BREEDING_STATION",
      actionType: "REJECT_ORDER",
      objectType: "SemenOrder",
      objectId,
      objectLabel: order.orderNumber,
      title: "Reject received order",
      description: "Reject this received order with an auditable station reason.",
      actionLabel: "Reject",
      href: buildStationOrderHref(order, "reject"),
      priority: "MEDIUM",
      dueAt: normalizeOptionalString(order.requestedDeliveryDate),
      createdAt: normalizeOptionalString(order.createdAt),
      updatedAt: normalizeOptionalString(order.updatedAt),
    }));
  }

  if (
    order.status === "CONFIRMED" &&
    canManageShipment(input.actor, order) &&
    !input.shipmentOrderKeys.has(objectId) &&
    !input.shipmentOrderKeys.has(`order-number:${order.orderNumber}`)
  ) {
    items.push(freezeActionItem({
      id: `${order.orderNumber}-create-shipment`,
      actorRoleCode: "BREEDING_STATION",
      actionType: "CREATE_SHIPMENT",
      objectType: "SemenOrder",
      objectId,
      objectLabel: order.orderNumber,
      title: "Create shipment",
      description: "Confirmed order is ready for a station-managed shipment record.",
      actionLabel: "Create shipment",
      href: buildStationOrderHref(order, "create-shipment"),
      priority: "MEDIUM",
      dueAt: normalizeOptionalString(order.requestedDeliveryDate),
      createdAt: normalizeOptionalString(order.createdAt),
      updatedAt: normalizeOptionalString(order.updatedAt),
    }));
  }

  return items;
}

/**
 * @param {import("./action-required.d.ts").SemenOrderLike} order
 * @returns {string | null}
 */
function buildBreederOrderHref(order) {
  const orderId = normalizeOptionalString(order.id);

  return orderId
    ? `${ACTION_REQUIRED_ROUTES.breederOrderDetail}/${encodeURIComponent(orderId)}`
    : null;
}

/**
 * @param {import("./action-required.d.ts").SemenOrderLike} order
 * @param {string} action
 * @returns {string}
 */
function buildStationOrderHref(order, action) {
  const orderLookupId = normalizeOptionalString(order.id) ?? order.orderNumber;

  if (action === "create-shipment") {
    const params = new URLSearchParams({
      action: "create",
      orderId: orderLookupId,
    });

    return `${ACTION_REQUIRED_ROUTES.stationShipments}?${params.toString()}`;
  }

  const params = new URLSearchParams({
    orderId: orderLookupId,
    action,
  });

  return `${ACTION_REQUIRED_ROUTES.stationDashboard}?${params.toString()}`;
}

/**
 * @param {import("./action-required.d.ts").ShipmentLike} shipment
 * @returns {string}
 */
function buildStationShipmentHref(shipment) {
  const shipmentId = normalizeOptionalString(shipment.id);
  const params = new URLSearchParams({
    action: "update",
    orderId: shipment.semenOrderId,
  });

  if (shipmentId) {
    params.set("shipmentId", shipmentId);
  }

  return `${ACTION_REQUIRED_ROUTES.stationShipments}?${params.toString()}`;
}

/**
 * @param {import("./action-required.d.ts").AmendmentLike} amendment
 * @returns {string}
 */
function buildAdminAmendmentHref(amendment) {
  const params = new URLSearchParams();

  if (amendment.targetType) {
    params.set("targetType", amendment.targetType);
  }

  if (amendment.targetId) {
    params.set("targetId", amendment.targetId);
  }

  const query = params.toString();

  return query
    ? `${ACTION_REQUIRED_ROUTES.adminAmendments}?${query}`
    : ACTION_REQUIRED_ROUTES.adminAmendments;
}

/**
 * @param {string} objectType
 * @param {string} objectId
 * @returns {string}
 */
function buildAuditHref(objectType, objectId) {
  const params = new URLSearchParams({
    objectType,
    objectId,
  });

  return `${ACTION_REQUIRED_ROUTES.adminAudit}?${params.toString()}`;
}

/**
 * @param {import("./action-required.d.ts").ActionRequiredItemInput} input
 * @returns {import("./action-required.d.ts").ActionRequiredItem}
 */
function freezeActionItem(input) {
  return Object.freeze({
    id: input.id,
    actorRoleCode: input.actorRoleCode,
    actionType: input.actionType,
    objectType: input.objectType,
    objectId: input.objectId,
    objectLabel: input.objectLabel,
    title: input.title,
    description: input.description,
    actionLabel: input.actionLabel,
    href: input.href,
    priority: input.priority,
    dueAt: input.dueAt ?? null,
    createdAt: input.createdAt ?? null,
    updatedAt: input.updatedAt ?? null,
  });
}

/**
 * @param {import("./action-required.d.ts").ActionRequiredItem[]} items
 * @param {number | null | undefined} limit
 * @returns {import("./action-required.d.ts").ActionRequiredItem[]}
 */
function sortAndLimitActionItems(items, limit) {
  const sorted = [...items].sort(compareActionItems);
  const normalizedLimit = Number.isInteger(limit) && Number(limit) > 0
    ? Number(limit)
    : sorted.length;

  return sorted.slice(0, normalizedLimit);
}

/**
 * @param {import("./action-required.d.ts").ActionRequiredItem} left
 * @param {import("./action-required.d.ts").ActionRequiredItem} right
 * @returns {number}
 */
function compareActionItems(left, right) {
  const priorityDelta = priorityRank(left.priority) - priorityRank(right.priority);

  if (priorityDelta !== 0) {
    return priorityDelta;
  }

  const leftDate = left.dueAt ?? left.updatedAt ?? left.createdAt;
  const rightDate = right.dueAt ?? right.updatedAt ?? right.createdAt;
  const dateDelta = compareIsoAscending(leftDate, rightDate);

  if (dateDelta !== 0) {
    return dateDelta;
  }

  return left.title.localeCompare(right.title);
}

/**
 * @param {import("./action-required.d.ts").ActionRequiredPriority} priority
 * @returns {number}
 */
function priorityRank(priority) {
  switch (priority) {
    case "HIGH":
      return 0;
    case "MEDIUM":
      return 1;
    case "LOW":
      return 2;
    default:
      return 3;
  }
}

/**
 * @param {string | null | undefined} left
 * @param {string | null | undefined} right
 * @returns {number}
 */
function compareIsoAscending(left, right) {
  const leftTime = Date.parse(left ?? "");
  const rightTime = Date.parse(right ?? "");

  if (!Number.isFinite(leftTime) && !Number.isFinite(rightTime)) {
    return 0;
  }

  if (!Number.isFinite(leftTime)) {
    return 1;
  }

  if (!Number.isFinite(rightTime)) {
    return -1;
  }

  return leftTime - rightTime;
}

/**
 * @param {import("./action-required.d.ts").ActionRequiredActorContext} actor
 * @param {import("./action-required.d.ts").ActionRequiredRoleCode} roleCode
 * @param {string | null | undefined} organizationId
 * @returns {string | null}
 */
function resolveActorOrganizationId(actor, roleCode, organizationId) {
  const requestedOrganizationId = normalizeOptionalString(organizationId);
  const role = actor?.roles?.find((assignment) =>
    assignment.userId === actor.userId &&
    assignment.roleCode === roleCode &&
    isActiveRoleAssignment(assignment) &&
    (!requestedOrganizationId || assignment.organizationId === requestedOrganizationId)
  );

  return role?.organizationId ?? null;
}

/**
 * @param {import("./action-required.d.ts").ActionRequiredActorContext} actor
 * @param {import("./action-required.d.ts").ActionRequiredRoleCode} roleCode
 * @returns {boolean}
 */
function hasActiveRole(actor, roleCode) {
  return Boolean(actor?.roles?.some((assignment) =>
    assignment.userId === actor.userId &&
    assignment.roleCode === roleCode &&
    isActiveRoleAssignment(assignment)
  ));
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
 * @template {object} T
 * @param {T} value
 * @param {PropertyKey} key
 * @returns {key is keyof T}
 */
function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
