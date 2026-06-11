// @ts-check

import { canViewDocument } from "@coritech/domain/documents/document-evidence.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import {
  canTransitionSemenOrderStatus,
  canViewSemenOrder,
} from "@coritech/domain/orders/semen-order.mjs";
import {
  canConfirmShipmentReceived,
  canViewShipment,
} from "@coritech/domain/shipments/shipment.mjs";
import {
  createOrderActivityPanelViewModel,
  renderOrderActivityPanel,
} from "../order-activity/order-activity.mjs";
import { createPaymentReferencePanelViewModel } from "../payment-references/payment-reference-ui.mjs";
import { createProofTimelineViewModel } from "../proof-timeline/proof-timeline.mjs";
import { createSupportRequestFormViewModel } from "../support-requests/support-requests.mjs";

export const BREEDER_ORDER_DETAIL_VIEW_STATES = /** @type {const} */ ([
  "LOADING",
  "READY",
  "ERROR",
]);

export const BREEDER_ORDER_DETAIL_ROUTES = Object.freeze({
  dashboard: "/breeder-dashboard",
  orders: "/app/orders",
  documentDetail: "/app/documents",
});

const DEFAULT_SUPPORT_EMAIL = "support@coritech.example";

export class BreederOrderDetailValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech breeder order detail input:\n- ${issues.join("\n- ")}`);
    this.name = "BreederOrderDetailValidationError";
    this.issues = issues;
  }
}

export class BreederOrderDetailAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "BreederOrderDetailAuthorizationError";
  }
}

export class BreederOrderDetailNotFoundError extends Error {
  /**
   * @param {string} entityName
   * @param {string} entityId
   */
  constructor(entityName, entityId) {
    super(`${entityName} was not found: ${entityId}`);
    this.name = "BreederOrderDetailNotFoundError";
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailInput} input
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderDetailViewModel}
 */
export function createBreederOrderDetailViewModel(input) {
  const issues = validateBreederOrderDetailInput(input);

  if (issues.length > 0) {
    throw new BreederOrderDetailValidationError(issues);
  }

  const actor = input.actor;
  const orderLookupId = input.orderId.trim();
  const order = findOrderByIdOrNumber(input.orders ?? [], orderLookupId);

  if (!order) {
    throw new BreederOrderDetailNotFoundError("SemenOrder", orderLookupId);
  }

  const organizationContext = resolveBreederOrganizationContext({
    actor,
    order,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });
  const orderSummary = toOrderSummary(order);
  const statusHistory = (input.statusHistory ?? [])
    .filter((history) => matchesOrderContext(order, {
      semenOrderId: history.semenOrderId,
      orderNumber: history.orderNumber,
    }))
    .sort(compareStatusChangedAscending)
    .map(toStatusHistoryRow);
  const shipments = (input.shipments ?? [])
    .filter((shipment) =>
      matchesOrderContext(order, shipment) &&
      canViewShipment(actor, shipment)
    )
    .sort(compareUpdatedDescending);
  const shipmentIds = buildIdSet(shipments);
  const shipmentTrackingEvents = (input.shipmentTrackingEvents ?? [])
    .filter((event) =>
      matchesOrderContext(order, event) &&
      (event.shipmentId === null || shipmentIds.has(event.shipmentId))
    )
    .sort(compareShipmentEventAscending);
  const proofEvents = (input.proofEvents ?? [])
    .filter((proofEvent) =>
      matchesProofEventContext(order, proofEvent, shipmentIds)
    )
    .sort(compareProofEventAscending);
  const proofEventIds = buildIdSet(proofEvents);
  const visibleDocuments = (input.documents ?? [])
    .filter((document) =>
      matchesDocumentContext(order, document, shipmentIds, proofEventIds) &&
      canViewDocument(actor, document)
    )
    .sort(compareDocumentCreatedDescending);
  const documents = visibleDocuments.map(toDocumentRow);
  const proofTimeline = createProofTimelineViewModel({
    title: "Proof timeline",
    emptyMessage: "No proof events have been recorded for this order.",
    orderId: normalizeOptionalString(order.id),
    orderNumber: order.orderNumber,
    shipmentIds: shipments.map((shipment) => shipment.id),
    proofEvents,
    documents: visibleDocuments,
  });
  const latestStatusChange = statusHistory.length > 0
    ? statusHistory[statusHistory.length - 1]
    : null;
  const activity = createOrderActivityPanelViewModel({
    actor: buildOrderActivityActor({
      actor,
      organizationContext,
    }),
    order,
    activities: input.orderActivities ?? [],
    statusHistory,
  });
  const supportRequest = createSupportRequestFormViewModel({
    actor: buildOrderActivityActor({
      actor,
      organizationContext,
    }),
    order,
    confirmation: input.supportConfirmation,
  });

  return Object.freeze({
    state: "READY",
    actorUserId: actor.userId.trim(),
    title: `Order ${order.orderNumber}`,
    summary: `Current status: ${formatStatus(order.status)}.`,
    organizationContext,
    navigation: Object.freeze({
      dashboardHref: BREEDER_ORDER_DETAIL_ROUTES.dashboard,
      ordersHref: BREEDER_ORDER_DETAIL_ROUTES.orders,
    }),
    supportAction: buildSupportAction({
      orderNumber: order.orderNumber,
      supportEmail: input.supportEmail,
    }),
    supportRequest,
    cancellationAction: buildCancellationAction({
      actor,
      order,
    }),
    order: orderSummary,
    currentStatus: Object.freeze({
      status: order.status,
      latestChange: latestStatusChange,
    }),
    paymentReference: createPaymentReferencePanelViewModel({
      actor,
      order,
      paymentReference: input.paymentReference ?? null,
      returnTo: `${BREEDER_ORDER_DETAIL_ROUTES.orders}/${order.id ?? order.orderNumber}`,
    }),
    sections: Object.freeze({
      orderSummary: Object.freeze({
        title: "Order summary",
        emptyMessage: "No order summary is available.",
        items: Object.freeze(buildOrderSummaryItems(orderSummary)),
      }),
      statusHistory: Object.freeze({
        title: "Status history",
        emptyMessage: "No status history has been recorded for this order.",
        items: Object.freeze(statusHistory),
      }),
      shipments: Object.freeze({
        title: "Shipment information",
        emptyMessage: "No shipment has been recorded for this order.",
        items: Object.freeze(
          shipments.map((shipment) =>
            toShipmentRow({
              actor,
              shipment,
              shipmentTrackingEvents,
            })
          ),
        ),
      }),
      documents: Object.freeze({
        title: "Linked documents",
        emptyMessage: "No permissioned documents are visible for this order.",
        items: Object.freeze(documents),
      }),
      proofEvents: Object.freeze({
        title: proofTimeline.title,
        emptyMessage: proofTimeline.emptyMessage,
        items: proofTimeline.items,
      }),
      activity,
    }),
  });
}

/**
 * @param {{ orderLabel?: string | null }} [input]
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderDetailLoadingViewModel}
 */
export function createBreederOrderDetailLoadingState(input = {}) {
  const label = normalizeOptionalString(input.orderLabel) ?? "order detail";

  return Object.freeze({
    state: "LOADING",
    title: "Breeder order detail",
    message: `Loading ${label}.`,
  });
}

/**
 * @param {unknown} error
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderDetailErrorViewModel}
 */
export function createBreederOrderDetailErrorState(error) {
  const isAccessError = error instanceof BreederOrderDetailAuthorizationError;

  return Object.freeze({
    state: "ERROR",
    title: isAccessError ? "Order unavailable" : "Order detail could not load",
    message: error instanceof Error ? error.message : "An unknown order detail error occurred.",
  });
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailRenderableViewModel} viewModel
 * @returns {string}
 */
export function renderBreederOrderDetail(viewModel) {
  if (viewModel.state === "LOADING") {
    return renderLoadingState(viewModel);
  }

  if (viewModel.state === "ERROR") {
    return renderErrorState(viewModel);
  }

  return renderReadyOrderDetail(viewModel);
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailInput} input
 * @returns {string}
 */
export function renderBreederOrderDetailFromInput(input) {
  return renderBreederOrderDetail(createBreederOrderDetailViewModel(input));
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailInput | undefined} input
 * @returns {string[]}
 */
export function validateBreederOrderDetailInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["order detail input is required."];
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

  if (!normalizeRequiredString(input.orderId)) {
    issues.push("orderId is required.");
  }

  validateOptionalNonBlankString(input.organizationId, "organizationId", issues);
  validateOptionalNonBlankString(input.organizationName, "organizationName", issues);
  validateOptionalNonBlankString(input.supportEmail, "supportEmail", issues);
  validateOptionalNonBlankString(input.supportConfirmation, "supportConfirmation", issues);
  validateOptionalArray(input.orders, "orders", issues);
  validateOptionalArray(input.statusHistory, "statusHistory", issues);
  validateOptionalArray(input.shipments, "shipments", issues);
  validateOptionalArray(input.shipmentTrackingEvents, "shipmentTrackingEvents", issues);
  validateOptionalArray(input.documents, "documents", issues);
  validateOptionalArray(input.proofEvents, "proofEvents", issues);
  validateOptionalArray(input.orderActivities, "orderActivities", issues);

  return issues;
}

/**
 * @param {{
 *   actor: import("./breeder-order-detail.d.ts").BreederOrderDetailActorContext;
 *   order: import("./breeder-order-detail.d.ts").SemenOrderLike;
 *   organizationId?: string | null;
 *   organizationName?: string | null;
 * }} input
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderDetailOrganizationContext}
 */
function resolveBreederOrganizationContext(input) {
  const requestedOrganizationId = normalizeOptionalString(input.organizationId);

  if (requestedOrganizationId && requestedOrganizationId !== input.order.breederOrganizationId) {
    throw new BreederOrderDetailAuthorizationError(
      "actor may only view breeder order details for their own breeder organization.",
    );
  }

  if (!canViewSemenOrder(input.actor, input.order)) {
    throw new BreederOrderDetailAuthorizationError(
      "actor is not authorized to view this semen order.",
    );
  }

  const breederRole = input.actor.roles.find((assignment) =>
    assignment.userId === input.actor.userId &&
    assignment.roleCode === "BREEDER" &&
    assignment.organizationId === input.order.breederOrganizationId &&
    isActiveRoleAssignment(assignment)
  );

  if (!breederRole) {
    throw new BreederOrderDetailAuthorizationError(
      "actor must have an active BREEDER role for this order's breeder organization.",
    );
  }

  return Object.freeze({
    organizationId: input.order.breederOrganizationId,
    organizationName: normalizeOptionalString(input.organizationName) ??
      input.order.breederOrganizationId,
    roleCode: "BREEDER",
  });
}

/**
 * @param {{
 *   actor: import("./breeder-order-detail.d.ts").BreederOrderDetailActorContext;
 *   organizationContext: import("./breeder-order-detail.d.ts").BreederOrderDetailOrganizationContext;
 * }} input
 * @returns {import("@coritech/domain/orders/order-activity.d.ts").OrderActivityActorContext}
 */
function buildOrderActivityActor(input) {
  return Object.freeze({
    userId: input.actor.userId,
    organizationId: input.organizationContext.organizationId,
    organizationName: input.organizationContext.organizationName,
    roleCode: input.organizationContext.roleCode,
    roles: input.actor.roles,
  });
}

/**
 * @param {import("./breeder-order-detail.d.ts").SemenOrderLike[]} orders
 * @param {string} orderId
 * @returns {import("./breeder-order-detail.d.ts").SemenOrderLike | null}
 */
function findOrderByIdOrNumber(orders, orderId) {
  return orders.find((order) =>
    normalizeOptionalString(order?.id) === orderId ||
    order?.orderNumber === orderId
  ) ?? null;
}

/**
 * @param {import("./breeder-order-detail.d.ts").SemenOrderLike} order
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderSummary}
 */
function toOrderSummary(order) {
  return Object.freeze({
    id: normalizeOptionalString(order.id),
    orderNumber: order.orderNumber,
    semenListingId: order.semenListingId,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    status: order.status,
    requestedDeliveryDate: normalizeOptionalString(order.requestedDeliveryDate),
    mareName: normalizeOptionalString(order.mareName),
    mareRegistrationReference: normalizeOptionalString(order.mareRegistrationReference),
    mareBreed: normalizeOptionalString(order.mareBreed),
    mareOwnerName: normalizeOptionalString(order.mareOwnerName),
    intendedInseminationContext: normalizeOptionalString(order.intendedInseminationContext),
    vetOrRecipientContact: normalizeOptionalString(order.vetOrRecipientContact),
    shippingContactName: normalizeOptionalString(order.shippingContactName),
    shippingContactPhone: normalizeOptionalString(order.shippingContactPhone),
    shippingAddressLines: Object.freeze(buildShippingAddressLines(order)),
    specialInstructions: normalizeOptionalString(order.specialInstructions),
    createdAt: normalizeOptionalString(order.createdAt),
    updatedAt: normalizeOptionalString(order.updatedAt),
  });
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderSummary} order
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderSummaryItem[]}
 */
function buildOrderSummaryItems(order) {
  return [
    summaryItem("Order number", order.orderNumber),
    summaryItem("Current status", formatStatus(order.status)),
    summaryItem("Breeding station", order.breedingStationOrganizationId),
    summaryItem("Requested delivery", order.requestedDeliveryDate ?? "Not set"),
    summaryItem("Mare", order.mareName ?? "Not set"),
    summaryItem("Mare registration", order.mareRegistrationReference ?? "Not set"),
    summaryItem("Mare breed", order.mareBreed ?? "Not set"),
    summaryItem("Mare owner", order.mareOwnerName ?? "Not set"),
    summaryItem(
      "Insemination context",
      order.intendedInseminationContext ?? "Not set",
    ),
    summaryItem("Vet or recipient contact", order.vetOrRecipientContact ?? "Not set"),
    summaryItem("Shipping contact", order.shippingContactName ?? "Not set"),
    summaryItem("Contact phone", order.shippingContactPhone ?? "Not set"),
    summaryItem(
      "Shipping address",
      order.shippingAddressLines.length > 0
        ? order.shippingAddressLines.join(", ")
        : "Not set",
    ),
    summaryItem("Special instructions", order.specialInstructions ?? "None"),
    summaryItem("Created", order.createdAt ?? "Not recorded"),
    summaryItem("Last updated", order.updatedAt ?? "Not recorded"),
  ];
}

/**
 * @param {string} term
 * @param {string} value
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderSummaryItem}
 */
function summaryItem(term, value) {
  return Object.freeze({ term, value });
}

/**
 * @param {import("./breeder-order-detail.d.ts").OrderStatusHistoryLike} history
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderStatusHistoryRow}
 */
function toStatusHistoryRow(history) {
  return Object.freeze({
    id: normalizeOptionalString(history.id),
    semenOrderId: normalizeOptionalString(history.semenOrderId),
    orderNumber: history.orderNumber,
    fromStatus: history.fromStatus,
    toStatus: history.toStatus,
    actorRoleCode: history.actorRoleCode,
    actorOrganizationId: history.actorOrganizationId,
    reason: normalizeOptionalString(history.reason),
    changedAt: history.changedAt,
  });
}

/**
 * @param {{
 *   actor: import("./breeder-order-detail.d.ts").BreederOrderDetailActorContext;
 *   shipment: import("./breeder-order-detail.d.ts").ShipmentLike;
 *   shipmentTrackingEvents: readonly import("./breeder-order-detail.d.ts").ShipmentTrackingEventLike[];
 * }} input
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderShipmentRow}
 */
function toShipmentRow(input) {
  const shipment = input.shipment;
  const shipmentId = normalizeOptionalString(shipment.id);
  const trackingEvents = input.shipmentTrackingEvents
    .filter((event) =>
      (shipmentId && event.shipmentId === shipmentId) ||
      (
        !shipmentId &&
        event.orderNumber === shipment.orderNumber &&
        event.semenOrderId === shipment.semenOrderId
      )
    )
    .map(toShipmentTrackingEventRow);
  const confirmedReceivedAt = normalizeOptionalString(shipment.confirmedReceivedAt);
  const canConfirmReceived = !confirmedReceivedAt &&
    ["IN_TRANSIT", "DELIVERED"].includes(shipment.status) &&
    canConfirmShipmentReceived(input.actor, shipment);

  return Object.freeze({
    id: shipmentId,
    semenOrderId: shipment.semenOrderId,
    orderNumber: shipment.orderNumber,
    status: shipment.status,
    providerName: normalizeOptionalString(shipment.providerName),
    providerTrackingId: normalizeOptionalString(shipment.providerTrackingId),
    trackingUrl: normalizeOptionalString(shipment.trackingUrl),
    deliveredAt: normalizeOptionalString(shipment.deliveredAt),
    confirmedReceivedAt,
    confirmedByUserId: normalizeOptionalString(shipment.confirmedByUserId),
    confirmationSource: normalizeOptionalString(shipment.confirmationSource),
    canConfirmReceived,
    confirmationSummary: confirmedReceivedAt
      ? `Receipt confirmed at ${confirmedReceivedAt}`
      : canConfirmReceived
        ? "Receipt confirmation available"
        : "Receipt not confirmed",
    createdAt: normalizeOptionalString(shipment.createdAt),
    updatedAt: normalizeOptionalString(shipment.updatedAt),
    trackingEvents: Object.freeze(trackingEvents),
  });
}

/**
 * @param {import("./breeder-order-detail.d.ts").ShipmentTrackingEventLike} event
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderShipmentTrackingEventRow}
 */
function toShipmentTrackingEventRow(event) {
  return Object.freeze({
    id: normalizeOptionalString(event.id),
    shipmentId: normalizeOptionalString(event.shipmentId),
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    eventSource: event.eventSource,
    providerStatus: normalizeOptionalString(event.providerStatus),
    location: normalizeOptionalString(event.location),
    notes: normalizeOptionalString(event.notes),
    actorRoleCode: event.actorRoleCode,
    actorOrganizationId: event.actorOrganizationId,
    occurredAt: event.occurredAt,
  });
}

/**
 * @param {import("./breeder-order-detail.d.ts").DocumentLike} document
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderDocumentRow}
 */
function toDocumentRow(document) {
  const documentId = normalizeOptionalString(document.id);

  return Object.freeze({
    id: documentId,
    documentType: document.documentType,
    originalFileName: document.originalFileName,
    targetType: document.targetType,
    targetId: document.targetId,
    orderNumber: document.orderNumber,
    accessClassification: document.accessClassification,
    status: document.status ?? "ACTIVE",
    createdAt: document.createdAt,
    detailHref: documentId
      ? `${BREEDER_ORDER_DETAIL_ROUTES.documentDetail}/${encodeURIComponent(documentId)}`
      : null,
  });
}

/**
 * @param {import("./breeder-order-detail.d.ts").SemenOrderLike} order
 * @param {{ semenOrderId?: string | null, orderNumber?: string | null }} target
 * @returns {boolean}
 */
function matchesOrderContext(order, target) {
  const orderId = normalizeOptionalString(order.id);
  const targetOrderId = normalizeOptionalString(target.semenOrderId);

  return Boolean(
    (orderId && targetOrderId === orderId) ||
    target.orderNumber === order.orderNumber,
  );
}

/**
 * @param {import("./breeder-order-detail.d.ts").SemenOrderLike} order
 * @param {import("./breeder-order-detail.d.ts").ProofEventLike} proofEvent
 * @param {ReadonlySet<string>} shipmentIds
 * @returns {boolean}
 */
function matchesProofEventContext(order, proofEvent, shipmentIds) {
  if (
    proofEvent.breederOrganizationId &&
    proofEvent.breederOrganizationId !== order.breederOrganizationId
  ) {
    return false;
  }

  if (
    proofEvent.breedingStationOrganizationId &&
    proofEvent.breedingStationOrganizationId !== order.breedingStationOrganizationId
  ) {
    return false;
  }

  return matchesOrderContext(order, proofEvent) ||
    Boolean(proofEvent.shipmentId && shipmentIds.has(proofEvent.shipmentId));
}

/**
 * @param {import("./breeder-order-detail.d.ts").SemenOrderLike} order
 * @param {import("./breeder-order-detail.d.ts").DocumentLike} document
 * @param {ReadonlySet<string>} shipmentIds
 * @param {ReadonlySet<string>} proofEventIds
 * @returns {boolean}
 */
function matchesDocumentContext(order, document, shipmentIds, proofEventIds) {
  const orderId = normalizeOptionalString(order.id);

  if (matchesOrderContext(order, document)) {
    return true;
  }

  if (document.targetType === "SemenOrder") {
    return Boolean(
      (orderId && document.targetId === orderId) ||
      document.targetId === order.orderNumber,
    );
  }

  if (document.targetType === "Shipment") {
    return Boolean(
      document.shipmentId && shipmentIds.has(document.shipmentId) ||
      shipmentIds.has(document.targetId),
    );
  }

  if (document.targetType === "ProofEvent") {
    return Boolean(
      document.proofEventId && proofEventIds.has(document.proofEventId) ||
      proofEventIds.has(document.targetId),
    );
  }

  return false;
}

/**
 * @param {readonly { id?: string | null }[]} records
 * @returns {ReadonlySet<string>}
 */
function buildIdSet(records) {
  const ids = new Set();

  for (const record of records) {
    const id = normalizeOptionalString(record.id);

    if (id) {
      ids.add(id);
    }
  }

  return ids;
}

/**
 * @param {import("./breeder-order-detail.d.ts").SemenOrderLike} order
 * @returns {string[]}
 */
function buildShippingAddressLines(order) {
  const cityLine = [
    normalizeOptionalString(order.shippingCity),
    normalizeOptionalString(order.shippingRegion),
    normalizeOptionalString(order.shippingPostalCode),
  ].filter(Boolean).join(", ");

  return [
    normalizeOptionalString(order.shippingAddressLine1),
    normalizeOptionalString(order.shippingAddressLine2),
    cityLine || null,
    normalizeOptionalString(order.shippingCountry),
  ].filter(isNonNullString);
}

/**
 * @param {{ orderNumber: string, supportEmail?: string | null }} input
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderDetailSupportAction}
 */
function buildSupportAction(input) {
  const email = normalizeOptionalString(input.supportEmail) ?? DEFAULT_SUPPORT_EMAIL;
  const subject = encodeURIComponent(`CoriTech order support ${input.orderNumber}`);

  return Object.freeze({
    label: "Contact support",
    href: `mailto:${email}?subject=${subject}`,
    orderNumber: input.orderNumber,
  });
}

/**
 * @param {{
 *   actor: import("./breeder-order-detail.d.ts").BreederOrderDetailActorContext;
 *   order: import("./breeder-order-detail.d.ts").SemenOrderLike;
 * }} input
 * @returns {import("./breeder-order-detail.d.ts").BreederOrderCancellationAction | null}
 */
function buildCancellationAction(input) {
  const orderId = normalizeOptionalString(input.order.id);

  if (!orderId || !canTransitionSemenOrderStatus(input.actor, input.order, "CANCELLED")) {
    return null;
  }

  return Object.freeze({
    orderId,
    title: "Cancel order",
    description: "Cancel this order with a required reason before station fulfilment continues.",
    reasonLabel: "Cancellation reason",
    buttonLabel: "Cancel order",
  });
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailViewModel} viewModel
 * @returns {string}
 */
function renderReadyOrderDetail(viewModel) {
  return [
    `<main class="breeder-order-detail" data-organization-id="${escapeAttribute(viewModel.organizationContext.organizationId)}">`,
    renderHeader(viewModel),
    renderCurrentStatus(viewModel.currentStatus),
    renderCancellationSection(viewModel.cancellationAction),
    renderSummarySection(viewModel.sections.orderSummary),
    renderStatusHistorySection(viewModel.sections.statusHistory),
    renderShipmentSection(viewModel.sections.shipments),
    renderDocumentsSection(viewModel.sections.documents),
    renderProofEventsSection(viewModel.sections.proofEvents),
    renderOrderActivityPanel(viewModel.sections.activity),
    renderSupportSection(viewModel.supportAction),
    "</main>",
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderCancellationAction | null} action
 * @returns {string}
 */
function renderCancellationSection(action) {
  if (!action) {
    return "";
  }

  return [
    "  <section class=\"breeder-order-detail__section breeder-order-detail__cancellation\" aria-labelledby=\"order-cancellation-heading\">",
    `    <h2 id="order-cancellation-heading">${escapeHtml(action.title)}</h2>`,
    `    <p>${escapeHtml(action.description)}</p>`,
    "    <form>",
    `      <input name="orderId" type="hidden" value="${escapeAttribute(action.orderId)}">`,
    `      <label>${escapeHtml(action.reasonLabel)}<textarea name="reason" required></textarea></label>`,
    `      <button type="submit">${escapeHtml(action.buttonLabel)}</button>`,
    "    </form>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailViewModel} viewModel
 * @returns {string}
 */
function renderHeader(viewModel) {
  return [
    "  <header class=\"breeder-order-detail__header\">",
    "    <div>",
    "      <p class=\"breeder-order-detail__eyebrow\">Breeder order detail</p>",
    `      <h1>${escapeHtml(viewModel.title)}</h1>`,
    `      <p>${escapeHtml(viewModel.summary)}</p>`,
    "    </div>",
    "    <nav aria-label=\"Order detail actions\">",
    `      <a href="${escapeAttribute(viewModel.navigation.dashboardHref)}">Dashboard</a>`,
    `      <a href="${escapeAttribute(viewModel.supportAction.href)}">${escapeHtml(viewModel.supportAction.label)}</a>`,
    "    </nav>",
    "  </header>",
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderCurrentStatus} status
 * @returns {string}
 */
function renderCurrentStatus(status) {
  const latest = status.latestChange;

  return [
    "  <section class=\"breeder-order-detail__section breeder-order-detail__current\" aria-labelledby=\"current-status-heading\">",
    "    <h2 id=\"current-status-heading\">Current status</h2>",
    "    <div>",
    `      <strong>${escapeHtml(formatStatus(status.status))}</strong>`,
    latest
      ? `      <p>Latest movement: ${escapeHtml(formatStatus(latest.toStatus))} at ${escapeHtml(latest.changedAt)}${latest.reason ? ` - ${escapeHtml(latest.reason)}` : ""}</p>`
      : "      <p>No status movement has been recorded yet.</p>",
    "    </div>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailSection<import("./breeder-order-detail.d.ts").BreederOrderSummaryItem>} section
 * @returns {string}
 */
function renderSummarySection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <dl class=\"breeder-order-detail__summary-list\">",
      section.items.map((item) => renderDetailTerm(item.term, item.value, 6)).join("\n"),
      "    </dl>",
    ].join("\n");

  return renderSection(section.title, "order-summary-heading", body);
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailSection<import("./breeder-order-detail.d.ts").BreederOrderStatusHistoryRow>} section
 * @returns {string}
 */
function renderStatusHistorySection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <table>",
      "      <thead><tr><th>Changed at</th><th>From</th><th>To</th><th>Actor</th><th>Reason</th></tr></thead>",
      "      <tbody>",
      section.items.map((history) => [
        "        <tr>",
        `          <td>${escapeHtml(history.changedAt)}</td>`,
        `          <td>${escapeHtml(history.fromStatus ? formatStatus(history.fromStatus) : "Start")}</td>`,
        `          <td>${escapeHtml(formatStatus(history.toStatus))}</td>`,
        `          <td>${escapeHtml(formatStatus(history.actorRoleCode))}</td>`,
        `          <td>${escapeHtml(history.reason ?? "Not recorded")}</td>`,
        "        </tr>",
      ].join("\n")).join("\n"),
      "      </tbody>",
      "    </table>",
    ].join("\n");

  return renderSection(section.title, "status-history", body);
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailSection<import("./breeder-order-detail.d.ts").BreederOrderShipmentRow>} section
 * @returns {string}
 */
function renderShipmentSection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <table>",
      "      <thead><tr><th>Status</th><th>Provider</th><th>Tracking</th><th>Receipt</th><th>Updated</th><th>Events</th></tr></thead>",
      "      <tbody>",
      section.items.map((shipment) => [
        "        <tr>",
        `          <td>${escapeHtml(formatStatus(shipment.status))}</td>`,
        `          <td>${escapeHtml(shipment.providerName ?? "Not recorded")}</td>`,
        `          <td>${renderTrackingLink(shipment)}</td>`,
        `          <td>${escapeHtml(shipment.confirmationSummary)}</td>`,
        `          <td>${escapeHtml(shipment.updatedAt ?? "Not recorded")}</td>`,
        `          <td>${renderShipmentTrackingEvents(shipment.trackingEvents)}</td>`,
        "        </tr>",
      ].join("\n")).join("\n"),
      "      </tbody>",
      "    </table>",
    ].join("\n");

  return renderSection(section.title, "shipment-information-heading", body);
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderShipmentRow} shipment
 * @returns {string}
 */
function renderTrackingLink(shipment) {
  const label = shipment.providerTrackingId ?? "Tracking not recorded";

  if (!shipment.trackingUrl) {
    return escapeHtml(label);
  }

  return `<a href="${escapeAttribute(shipment.trackingUrl)}">${escapeHtml(label)}</a>`;
}

/**
 * @param {readonly import("./breeder-order-detail.d.ts").BreederOrderShipmentTrackingEventRow[]} events
 * @returns {string}
 */
function renderShipmentTrackingEvents(events) {
  if (events.length === 0) {
    return "No tracking events";
  }

  return [
    "<ol class=\"breeder-order-detail__compact-list\">",
    events.map((event) => [
      "  <li>",
      `    ${escapeHtml(formatStatus(event.toStatus))} at ${escapeHtml(event.occurredAt)}`,
      event.location ? `    <span>${escapeHtml(event.location)}</span>` : "",
      "  </li>",
    ].filter(Boolean).join("\n")).join("\n"),
    "</ol>",
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailSection<import("./breeder-order-detail.d.ts").BreederOrderDocumentRow>} section
 * @returns {string}
 */
function renderDocumentsSection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <table>",
      "      <thead><tr><th>Document</th><th>Type</th><th>Access</th><th>Status</th><th>Created</th><th>Open</th></tr></thead>",
      "      <tbody>",
      section.items.map((document) => [
        "        <tr>",
        `          <td>${escapeHtml(document.originalFileName)}</td>`,
        `          <td>${escapeHtml(document.documentType)}</td>`,
        `          <td>${escapeHtml(formatStatus(document.accessClassification))}</td>`,
        `          <td>${escapeHtml(formatStatus(document.status))}</td>`,
        `          <td>${escapeHtml(document.createdAt)}</td>`,
        `          <td>${document.detailHref ? `<a href="${escapeAttribute(document.detailHref)}">View</a>` : "Unavailable"}</td>`,
        "        </tr>",
      ].join("\n")).join("\n"),
      "      </tbody>",
      "    </table>",
    ].join("\n");

  return renderSection(section.title, "linked-documents-heading", body);
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailSection<import("./breeder-order-detail.d.ts").BreederOrderProofEventRow>} section
 * @returns {string}
 */
function renderProofEventsSection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <table>",
      "      <thead><tr><th>Occurred</th><th>Event</th><th>Actor</th><th>Organization</th><th>Verification</th><th>Linked documents</th><th>Status</th></tr></thead>",
      "      <tbody>",
      section.items.map((event) => [
        "        <tr>",
        `          <td>${escapeHtml(event.occurredAt)}</td>`,
        `          <td>${escapeHtml(formatStatus(event.eventType))}</td>`,
        `          <td>${escapeHtml(formatStatus(event.actorRoleCode))}</td>`,
        `          <td>${escapeHtml(event.actorOrganizationId ?? "Organization not recorded")}</td>`,
        `          <td>${escapeHtml(formatStatus(event.verificationLevel))}</td>`,
        `          <td>${escapeHtml(event.linkedDocumentLabel)}</td>`,
        `          <td>${escapeHtml(formatStatus(event.status))}</td>`,
        "        </tr>",
      ].join("\n")).join("\n"),
      "      </tbody>",
      "    </table>",
    ].join("\n");

  return renderSection(section.title, "proof-events-heading", body);
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailSupportAction} supportAction
 * @returns {string}
 */
function renderSupportSection(supportAction) {
  return [
    "  <section class=\"breeder-order-detail__section breeder-order-detail__support\" aria-labelledby=\"support-action-heading\">",
    "    <h2 id=\"support-action-heading\">Support</h2>",
    "    <div>",
    `      <p>Order ${escapeHtml(supportAction.orderNumber)}</p>`,
    `      <a href="${escapeAttribute(supportAction.href)}">${escapeHtml(supportAction.label)}</a>`,
    "    </div>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailLoadingViewModel} viewModel
 * @returns {string}
 */
function renderLoadingState(viewModel) {
  return [
    "<section class=\"breeder-order-detail breeder-order-detail--loading\" aria-busy=\"true\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").BreederOrderDetailErrorViewModel} viewModel
 * @returns {string}
 */
function renderErrorState(viewModel) {
  return [
    "<section class=\"breeder-order-detail breeder-order-detail--error\" role=\"alert\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {string} title
 * @param {string} headingId
 * @param {string} body
 * @returns {string}
 */
function renderSection(title, headingId, body) {
  return [
    `  <section class="breeder-order-detail__section" aria-labelledby="${escapeAttribute(headingId)}">`,
    `    <h2 id="${escapeAttribute(headingId)}">${escapeHtml(title)}</h2>`,
    body,
    "  </section>",
  ].join("\n");
}

/**
 * @param {string} message
 * @returns {string}
 */
function renderEmptyMessage(message) {
  return `    <p class="breeder-order-detail__empty">${escapeHtml(message)}</p>`;
}

/**
 * @param {string} term
 * @param {string} value
 * @param {number} [indent]
 * @returns {string}
 */
function renderDetailTerm(term, value, indent = 6) {
  const space = " ".repeat(indent);

  return [
    `${space}<div>`,
    `${space}  <dt>${escapeHtml(term)}</dt>`,
    `${space}  <dd>${escapeHtml(value)}</dd>`,
    `${space}</div>`,
  ].join("\n");
}

/**
 * @param {import("./breeder-order-detail.d.ts").OrderStatusHistoryLike} left
 * @param {import("./breeder-order-detail.d.ts").OrderStatusHistoryLike} right
 * @returns {number}
 */
function compareStatusChangedAscending(left, right) {
  return compareTimestamp(left.changedAt) - compareTimestamp(right.changedAt);
}

/**
 * @param {import("./breeder-order-detail.d.ts").ShipmentTrackingEventLike} left
 * @param {import("./breeder-order-detail.d.ts").ShipmentTrackingEventLike} right
 * @returns {number}
 */
function compareShipmentEventAscending(left, right) {
  return compareTimestamp(left.occurredAt) - compareTimestamp(right.occurredAt);
}

/**
 * @param {import("./breeder-order-detail.d.ts").ProofEventLike} left
 * @param {import("./breeder-order-detail.d.ts").ProofEventLike} right
 * @returns {number}
 */
function compareProofEventAscending(left, right) {
  return compareTimestamp(left.occurredAt) - compareTimestamp(right.occurredAt);
}

/**
 * @param {import("./breeder-order-detail.d.ts").DocumentLike} left
 * @param {import("./breeder-order-detail.d.ts").DocumentLike} right
 * @returns {number}
 */
function compareDocumentCreatedDescending(left, right) {
  return compareTimestamp(right.createdAt) - compareTimestamp(left.createdAt);
}

/**
 * @param {{ updatedAt?: string | null, createdAt?: string | null }} left
 * @param {{ updatedAt?: string | null, createdAt?: string | null }} right
 * @returns {number}
 */
function compareUpdatedDescending(left, right) {
  return compareTimestamp(right.updatedAt ?? right.createdAt) -
    compareTimestamp(left.updatedAt ?? left.createdAt);
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function compareTimestamp(value) {
  const timestamp = Date.parse(typeof value === "string" ? value : "");

  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function isNonNullString(value) {
  return typeof value === "string" && value.length > 0;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value === undefined || value === null || value === "") {
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
function validateOptionalArray(value, fieldName, issues) {
  if (value !== undefined && !Array.isArray(value)) {
    issues.push(`${fieldName} must be an array when provided.`);
  }
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
  const normalized = normalizeRequiredString(value);

  return normalized || null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatStatus(value) {
  return String(value).toLowerCase().replace(/_/g, " ");
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeAttribute(value) {
  return escapeHtml(value);
}
