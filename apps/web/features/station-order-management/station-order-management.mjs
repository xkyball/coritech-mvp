// @ts-check

import {
  canTransitionSemenOrderStatus,
  createOrderService,
  SemenOrderAuthorizationError,
  SemenOrderValidationError,
} from "@coritech/domain/orders/semen-order.mjs";
import { createStationDashboardViewModel } from "../station-dashboard/station-dashboard.mjs";

export const STATION_ORDER_MANAGEMENT_ACTIONS = /** @type {const} */ ([
  "receive",
  "confirm",
  "reject",
  "move_to_fulfilment",
]);

export const STATION_ORDER_MANAGEMENT_ROUTES = Object.freeze({
  dashboard: "/station-dashboard",
  listingManagement: "/app/station/listings",
  orderManagement: "/app/station/orders",
});

/**
 * @param {import("./station-order-management.d.ts").StationOrderManagementInput} input
 * @returns {import("./station-order-management.d.ts").StationOrderManagementViewModel}
 */
export function createStationOrderManagementViewModel(input) {
  const dashboard = createStationDashboardViewModel({
    ...input,
    selectedOrderId: input.selectedOrderId,
  });
  const selectedOrder = dashboard.selectedOrder ?? dashboard.sections.incomingOrders.items[0] ?? null;

  return Object.freeze({
    state: "READY",
    actorUserId: dashboard.actorUserId,
    organizationContext: dashboard.organizationContext,
    navigation: Object.freeze({
      dashboardHref: STATION_ORDER_MANAGEMENT_ROUTES.dashboard,
      listingManagementHref: STATION_ORDER_MANAGEMENT_ROUTES.listingManagement,
      orderManagementHref: STATION_ORDER_MANAGEMENT_ROUTES.orderManagement,
    }),
    orders: dashboard.sections.incomingOrders.items,
    selectedOrder: selectedOrder
      ? buildManagedOrder(selectedOrder, input.actor)
      : null,
    actionFeedback: normalizeActionFeedback(input.actionFeedback),
    isEmpty: dashboard.sections.incomingOrders.items.length === 0,
  });
}

/**
 * @param {import("./station-order-management.d.ts").StationOrderActionInput} input
 * @returns {Promise<import("./station-order-management.d.ts").StationOrderActionResult>}
 */
export async function executeStationOrderAction(input) {
  const action = normalizeAction(input.action);
  const orderId = normalizeOptionalString(input.orderId);
  const reason = normalizeOptionalString(input.reason);
  const issues = [];

  if (!orderId) {
    issues.push("orderId is required.");
  }

  if (!action) {
    issues.push("action must be receive, confirm, reject or move_to_fulfilment.");
  }

  if (action === "reject" && !reason) {
    issues.push("reason is required when rejecting an order.");
  }

  if (issues.length > 0) {
    return Object.freeze({
      ok: false,
      action: action ?? "unknown",
      orderId: orderId ?? "",
      issues: Object.freeze(issues),
    });
  }

  try {
    const service = createOrderService({
      repository: input.repository,
      auditContext: input.auditContext,
      proofService: input.proofService,
      notificationService: input.notificationService,
    });
    const command = {
      actor: input.actor,
      orderId: /** @type {string} */ (orderId),
      body: {
        reason,
        now: input.now,
      },
    };
    const result = action === "receive"
      ? await service.receiveOrder(command)
      : action === "confirm"
        ? await service.confirmOrder(command)
        : action === "reject"
          ? await service.rejectOrder(command)
          : await service.moveToFulfilment(command);

    return Object.freeze({
      ok: true,
      action,
      order: result.order,
      statusHistory: result.statusHistory,
      auditHook: result.auditHook,
      auditLog: result.auditLog,
      proofHook: result.proofHook,
      notificationHook: result.notificationHook,
      idempotent: result.idempotent,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      action,
      orderId: /** @type {string} */ (orderId),
      issues: Object.freeze(errorToIssues(error)),
    });
  }
}

/**
 * @param {import("./station-order-management.d.ts").StationOrderManagementSelectedOrder | import("../station-dashboard/station-dashboard.d.ts").StationDashboardOrderRow} order
 * @param {import("../station-dashboard/station-dashboard.d.ts").StationDashboardActorContext} actor
 * @returns {import("./station-order-management.d.ts").StationOrderManagementSelectedOrder}
 */
function buildManagedOrder(order, actor) {
  const baseActions = "actions" in order ? [...order.actions] : [];
  const commandActions = [];

  if (canTransitionSemenOrderStatus(actor, order, "CONFIRMED")) {
    commandActions.push(buildCommandAction(order, "confirm", "Confirm order", "Confirm station acceptance and availability."));
  }

  if (canTransitionSemenOrderStatus(actor, order, "RECEIVED")) {
    commandActions.push(buildCommandAction(order, "receive", "Mark as received", "Acknowledge station intake and begin review."));
  }

  if (canTransitionSemenOrderStatus(actor, order, "REJECTED")) {
    commandActions.push(buildCommandAction(order, "reject", "Reject order", "Reject this order with a station reason."));
  }

  if (canTransitionSemenOrderStatus(actor, order, "IN_FULFILMENT")) {
    commandActions.push(buildCommandAction(order, "move_to_fulfilment", "Move to fulfilment", "Move this confirmed order into fulfilment."));
  }

  return Object.freeze({
    ...order,
    commandActions: Object.freeze(commandActions),
    workflowActions: Object.freeze(baseActions.filter((action) =>
      action.actionKind === "CREATE_SHIPMENT" ||
      action.actionKind === "UPLOAD_DOCUMENT" ||
      action.actionKind === "OPEN_ORDER"
    )),
  });
}

/**
 * @param {import("../station-dashboard/station-dashboard.d.ts").StationDashboardOrderRow} order
 * @param {import("./station-order-management.d.ts").StationOrderManagementAction} action
 * @param {string} title
 * @param {string} description
 * @returns {import("./station-order-management.d.ts").StationOrderCommandAction}
 */
function buildCommandAction(order, action, title, description) {
  return Object.freeze({
    id: `${order.orderNumber}-${action}`,
    action,
    title,
    description,
    buttonLabel: title,
    tone: action === "reject" ? "danger" : "primary",
  });
}

/**
 * @param {unknown} action
 * @returns {import("./station-order-management.d.ts").StationOrderManagementAction | null}
 */
function normalizeAction(action) {
  if (
    action === "receive" ||
    action === "confirm" ||
    action === "reject" ||
    action === "move_to_fulfilment"
  ) {
    return action;
  }

  return null;
}

/**
 * @param {import("./station-order-management.d.ts").StationOrderActionFeedback | undefined} feedback
 * @returns {import("./station-order-management.d.ts").StationOrderActionFeedback | null}
 */
function normalizeActionFeedback(feedback) {
  if (!feedback) {
    return null;
  }

  return Object.freeze({
    tone: feedback.tone === "success" ? "success" : "danger",
    title: normalizeOptionalString(feedback.title) ?? "Station order action",
    message: normalizeOptionalString(feedback.message) ?? "",
  });
}

/**
 * @param {unknown} error
 * @returns {string[]}
 */
function errorToIssues(error) {
  if (
    error instanceof SemenOrderValidationError ||
    (error && typeof error === "object" && Array.isArray(error.issues))
  ) {
    return /** @type {{ issues: string[] }} */ (error).issues;
  }

  if (error instanceof SemenOrderAuthorizationError || error instanceof Error) {
    return [error.message];
  }

  return ["Station order action failed."];
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
