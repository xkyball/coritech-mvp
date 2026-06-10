// @ts-check

import { canViewSemenListing } from "@coritech/domain/catalog/semen-catalog.mjs";
import {
  canUploadDocument,
  canViewDocument,
} from "@coritech/domain/documents/document-evidence.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import {
  SEMEN_ORDER_STATUSES,
  canTransitionSemenOrderStatus,
  canViewSemenOrder,
} from "@coritech/domain/orders/semen-order.mjs";
import {
  canManageShipment,
  canViewShipment,
} from "@coritech/domain/shipments/shipment.mjs";

export const STATION_DASHBOARD_VIEW_STATES = /** @type {const} */ ([
  "LOADING",
  "READY",
  "ERROR",
]);

export const STATION_DASHBOARD_ROUTES = Object.freeze({
  dashboard: "/station-dashboard",
  listingManagement: "/app/station/listings",
  orderManagement: "/app/station/orders",
  shipmentManagement: "/app/station/shipments",
  documentDetail: "/app/documents",
  documentUpload: "/app/documents/upload",
});

const SHIPMENT_TERMINAL_STATUSES = Object.freeze([
  "DELIVERED",
  "FAILED",
  "CANCELLED",
]);

export class StationDashboardValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech station dashboard input:\n- ${issues.join("\n- ")}`);
    this.name = "StationDashboardValidationError";
    this.issues = issues;
  }
}

export class StationDashboardAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "StationDashboardAuthorizationError";
  }
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardInput} input
 * @returns {import("./station-dashboard.d.ts").StationDashboardViewModel}
 */
export function createStationDashboardViewModel(input) {
  const issues = validateStationDashboardInput(input);

  if (issues.length > 0) {
    throw new StationDashboardValidationError(issues);
  }

  const actor = input.actor;
  const organizationContext = resolveStationOrganizationContext({
    actor,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });
  const stationOrganizationId = organizationContext.organizationId;
  const listingRecords = input.listingRecords ?? [];
  const orders = input.orders ?? [];
  const statusHistory = input.statusHistory ?? [];
  const shipments = input.shipments ?? [];
  const shipmentTrackingEvents = input.shipmentTrackingEvents ?? [];
  const documents = input.documents ?? [];

  const ownListings = listingRecords
    .filter((record) =>
      record?.listing?.breedingStationOrganizationId === stationOrganizationId &&
      record?.listing?.listingStatus === "ACTIVE" &&
      canViewSemenListing(actor, record.listing)
    )
    .map(toListingCard)
    .sort((left, right) => left.stallionName.localeCompare(right.stallionName));
  const ownOrders = orders
    .filter((order) =>
      order?.breedingStationOrganizationId === stationOrganizationId &&
      canViewSemenOrder(actor, order)
    )
    .sort(compareUpdatedDescending);
  const ownOrderKeys = buildOrderKeySet(ownOrders);
  const visibleShipments = shipments
    .filter((shipment) =>
      shipment?.breedingStationOrganizationId === stationOrganizationId &&
      canViewShipment(actor, shipment) &&
      ownOrderKeys.has(orderKey(shipment.semenOrderId, shipment.orderNumber))
    )
    .sort(compareUpdatedDescending);
  const visibleShipmentKeys = buildShipmentKeySet(visibleShipments);
  const recentDocuments = documents
    .filter((document) =>
      document?.breedingStationOrganizationId === stationOrganizationId &&
      canViewDocument(actor, document) &&
      matchesKnownStationContext(document, ownOrderKeys, visibleShipmentKeys)
    )
    .sort(compareCreatedDescending)
    .slice(0, limitOrDefault(input.recentDocumentsLimit, 5))
    .map(toDocumentRow);
  const orderRows = ownOrders.map((order) =>
    toOrderRow(order, actor, statusHistory, ownOrderKeys)
  );
  const shipmentsToUpdate = buildShipmentActions({
    actor,
    orders: ownOrders,
    shipments: visibleShipments,
    limit: limitOrDefault(input.shipmentsToUpdateLimit, 6),
  });
  const orderActions = buildOrderActionItems({
    actor,
    orders: ownOrders,
    shipments: visibleShipments,
    limit: limitOrDefault(input.actionItemsLimit, 8),
  });
  const selectedOrder = resolveSelectedOrder({
    actor,
    documents,
    orders: ownOrders,
    selectedOrderId: input.selectedOrderId,
    shipments: visibleShipments,
    shipmentTrackingEvents,
    statusHistory,
  });
  const statusSummary = SEMEN_ORDER_STATUSES.map((status) =>
    Object.freeze({
      status,
      count: ownOrders.filter((order) => order.status === status).length,
    })
  );
  const notifications = buildNotifications({
    actions: orderActions,
    orders: ownOrders,
    shipments: visibleShipments,
    limit: limitOrDefault(input.notificationsLimit, 5),
  });

  return Object.freeze({
    state: "READY",
    actorUserId: actor.userId.trim(),
    organizationContext,
    navigation: Object.freeze({
      dashboardHref: STATION_DASHBOARD_ROUTES.dashboard,
      listingManagementHref: STATION_DASHBOARD_ROUTES.listingManagement,
      orderManagementHref: STATION_DASHBOARD_ROUTES.orderManagement,
    }),
    selectedOrder,
    sections: Object.freeze({
      activeListings: Object.freeze({
        title: "Active listings",
        emptyMessage: "No active semen listings are owned by this station.",
        items: Object.freeze(ownListings),
      }),
      incomingOrders: Object.freeze({
        title: "Incoming orders",
        emptyMessage: "No semen orders are assigned to this station.",
        items: Object.freeze(orderRows),
      }),
      orderStatusSummary: Object.freeze({
        title: "Order status summary",
        emptyMessage: "No station order activity is available.",
        items: Object.freeze(statusSummary),
      }),
      ordersNeedingAction: Object.freeze({
        title: "Orders needing action",
        emptyMessage: "No station order action is currently available.",
        items: Object.freeze(orderActions),
      }),
      shipmentsToUpdate: Object.freeze({
        title: "Shipments to update",
        emptyMessage: "No shipment update is currently required.",
        items: Object.freeze(shipmentsToUpdate),
      }),
      recentDocuments: Object.freeze({
        title: "Recent documents",
        emptyMessage: "No station-visible documents are available.",
        items: Object.freeze(recentDocuments),
      }),
      notifications: Object.freeze({
        title: "Notifications",
        emptyMessage: "No station notifications are available.",
        items: Object.freeze(notifications),
      }),
    }),
    isEmpty: ownListings.length === 0 &&
      orderRows.length === 0 &&
      orderActions.length === 0 &&
      shipmentsToUpdate.length === 0 &&
      recentDocuments.length === 0 &&
      notifications.length === 0,
  });
}

/**
 * @param {{ organizationName?: string | null }} [input]
 * @returns {import("./station-dashboard.d.ts").StationDashboardLoadingViewModel}
 */
export function createStationDashboardLoadingState(input = {}) {
  return Object.freeze({
    state: "LOADING",
    title: "Station dashboard",
    message: input.organizationName
      ? `Loading ${input.organizationName} dashboard.`
      : "Loading station dashboard.",
  });
}

/**
 * @param {unknown} error
 * @returns {import("./station-dashboard.d.ts").StationDashboardErrorViewModel}
 */
export function createStationDashboardErrorState(error) {
  return Object.freeze({
    state: "ERROR",
    title: error instanceof StationDashboardAuthorizationError
      ? "Dashboard unavailable"
      : "Dashboard could not load",
    message: error instanceof Error ? error.message : "An unknown dashboard error occurred.",
  });
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardRenderableViewModel} viewModel
 * @returns {string}
 */
export function renderStationDashboard(viewModel) {
  if (viewModel.state === "LOADING") {
    return renderLoadingState(viewModel);
  }

  if (viewModel.state === "ERROR") {
    return renderErrorState(viewModel);
  }

  return renderReadyDashboard(viewModel);
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardInput} input
 * @returns {string}
 */
export function renderStationDashboardFromInput(input) {
  return renderStationDashboard(createStationDashboardViewModel(input));
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardInput | undefined} input
 * @returns {string[]}
 */
export function validateStationDashboardInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["dashboard input is required."];
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

  validateOptionalNonBlankString(input.organizationId, "organizationId", issues);
  validateOptionalNonBlankString(input.organizationName, "organizationName", issues);
  validateOptionalNonBlankString(input.selectedOrderId, "selectedOrderId", issues);
  validateOptionalArray(input.listingRecords, "listingRecords", issues);
  validateOptionalArray(input.orders, "orders", issues);
  validateOptionalArray(input.statusHistory, "statusHistory", issues);
  validateOptionalArray(input.shipments, "shipments", issues);
  validateOptionalArray(input.shipmentTrackingEvents, "shipmentTrackingEvents", issues);
  validateOptionalArray(input.documents, "documents", issues);
  validateOptionalPositiveInteger(input.recentDocumentsLimit, "recentDocumentsLimit", issues);
  validateOptionalPositiveInteger(input.actionItemsLimit, "actionItemsLimit", issues);
  validateOptionalPositiveInteger(input.shipmentsToUpdateLimit, "shipmentsToUpdateLimit", issues);
  validateOptionalPositiveInteger(input.notificationsLimit, "notificationsLimit", issues);

  return issues;
}

/**
 * @param {{
 *   actor: import("./station-dashboard.d.ts").StationDashboardActorContext;
 *   organizationId?: string | null;
 *   organizationName?: string | null;
 * }} input
 * @returns {import("./station-dashboard.d.ts").StationOrganizationContext}
 */
function resolveStationOrganizationContext(input) {
  const activeStationRoles = input.actor.roles.filter((assignment) =>
    assignment.roleCode === "BREEDING_STATION" &&
    assignment.userId === input.actor.userId &&
    isActiveRoleAssignment(assignment)
  );

  if (activeStationRoles.length === 0) {
    throw new StationDashboardAuthorizationError(
      "actor must have an active BREEDING_STATION role before viewing the station dashboard.",
    );
  }

  const requestedOrganizationId = normalizeOptionalString(input.organizationId);

  if (!requestedOrganizationId && activeStationRoles.length > 1) {
    throw new StationDashboardValidationError([
      "organizationId is required when actor has multiple active BREEDING_STATION roles.",
    ]);
  }

  const role = requestedOrganizationId
    ? activeStationRoles.find((assignment) =>
      assignment.organizationId === requestedOrganizationId
    )
    : activeStationRoles[0];

  if (!role) {
    throw new StationDashboardAuthorizationError(
      "actor may only view a station dashboard for their own breeding station organization.",
    );
  }

  return Object.freeze({
    organizationId: role.organizationId,
    organizationName: normalizeOptionalString(input.organizationName) ?? role.organizationId,
    roleCode: "BREEDING_STATION",
  });
}

/**
 * @param {import("./station-dashboard.d.ts").SemenListingRecordLike} record
 * @returns {import("./station-dashboard.d.ts").StationDashboardListingCard}
 */
function toListingCard(record) {
  const listing = record.listing;
  const listingId = normalizeOptionalString(listing.id);

  return Object.freeze({
    id: listingId,
    stallionId: record.stallion.id,
    stallionName: record.stallion.name,
    breed: record.stallion.breed,
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    termsSummary: listing.termsSummary,
    managementHref: listingId
      ? `${STATION_DASHBOARD_ROUTES.listingManagement}/${encodeURIComponent(listingId)}`
      : STATION_DASHBOARD_ROUTES.listingManagement,
  });
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @param {import("./station-dashboard.d.ts").StationDashboardActorContext} actor
 * @param {import("./station-dashboard.d.ts").OrderStatusHistoryLike[]} statusHistory
 * @param {ReadonlySet<string>} ownOrderKeys
 * @returns {import("./station-dashboard.d.ts").StationDashboardOrderRow}
 */
function toOrderRow(order, actor, statusHistory, ownOrderKeys) {
  const relatedHistory = orderStatusHistoryForOrder(order, statusHistory, ownOrderKeys);
  const orderId = normalizeOptionalString(order.id);

  return Object.freeze({
    id: orderId,
    orderNumber: order.orderNumber,
    semenListingId: order.semenListingId,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    status: order.status,
    requestedDeliveryDate: normalizeOptionalString(order.requestedDeliveryDate),
    updatedAt: normalizeOptionalString(order.updatedAt),
    detailHref: buildOrderHref(order),
    latestStatusChange: relatedHistory[0] ?? null,
    actions: Object.freeze(buildActionsForOrder(order, actor)),
  });
}

/**
 * @param {{
 *   actor: import("./station-dashboard.d.ts").StationDashboardActorContext;
 *   selectedOrderId?: string | null;
 *   orders: import("./station-dashboard.d.ts").SemenOrderLike[];
 *   statusHistory: import("./station-dashboard.d.ts").OrderStatusHistoryLike[];
 *   shipments: import("./station-dashboard.d.ts").ShipmentLike[];
 *   shipmentTrackingEvents: import("./station-dashboard.d.ts").ShipmentTrackingEventLike[];
 *   documents: import("./station-dashboard.d.ts").DocumentLike[];
 * }} input
 * @returns {import("./station-dashboard.d.ts").StationDashboardSelectedOrder | null}
 */
function resolveSelectedOrder(input) {
  const selectedOrderId = normalizeOptionalString(input.selectedOrderId);

  if (!selectedOrderId) {
    return null;
  }

  const order = input.orders.find((candidate) =>
    candidate.id === selectedOrderId || candidate.orderNumber === selectedOrderId
  );

  if (!order) {
    throw new StationDashboardAuthorizationError(
      "actor may only open order detail for orders assigned to their breeding station.",
    );
  }

  const ownOrderKeys = buildOrderKeySet([order]);
  const orderShipments = input.shipments
    .filter((shipment) => matchesOrderContext(order, shipment))
    .sort(compareUpdatedDescending);
  const shipmentKeys = buildShipmentKeySet(orderShipments);
  const orderDocuments = input.documents
    .filter((document) =>
      canViewDocument(input.actor, document) &&
      matchesKnownStationContext(document, ownOrderKeys, shipmentKeys)
    )
    .sort(compareCreatedDescending)
    .map(toDocumentRow);
  const statusHistory = orderStatusHistoryForOrder(order, input.statusHistory, ownOrderKeys);
  const row = toOrderRow(order, input.actor, input.statusHistory, ownOrderKeys);

  return Object.freeze({
    ...row,
    mareName: normalizeOptionalString(order.mareName),
    mareRegistrationReference: normalizeOptionalString(order.mareRegistrationReference),
    mareBreed: normalizeOptionalString(order.mareBreed),
    mareOwnerName: normalizeOptionalString(order.mareOwnerName),
    intendedInseminationContext: normalizeOptionalString(order.intendedInseminationContext),
    vetOrRecipientContact: normalizeOptionalString(order.vetOrRecipientContact),
    shippingContactName: normalizeOptionalString(order.shippingContactName),
    shippingContactPhone: normalizeOptionalString(order.shippingContactPhone),
    shippingDestination: buildShippingDestination(order),
    specialInstructions: normalizeOptionalString(order.specialInstructions),
    statusHistory: Object.freeze(statusHistory),
    shipments: Object.freeze(
      orderShipments.map((shipment) =>
        toShipmentRow({
          actor: input.actor,
          shipment,
          shipmentTrackingEvents: input.shipmentTrackingEvents,
        })
      ),
    ),
    documents: Object.freeze(orderDocuments),
  });
}

/**
 * @param {import("./station-dashboard.d.ts").OrderStatusHistoryLike} history
 * @returns {import("./station-dashboard.d.ts").StationDashboardStatusHistoryRow}
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
 *   actor: import("./station-dashboard.d.ts").StationDashboardActorContext;
 *   shipment: import("./station-dashboard.d.ts").ShipmentLike;
 *   shipmentTrackingEvents: import("./station-dashboard.d.ts").ShipmentTrackingEventLike[];
 * }} input
 * @returns {import("./station-dashboard.d.ts").StationDashboardShipmentRow}
 */
function toShipmentRow(input) {
  const shipmentId = normalizeOptionalString(input.shipment.id);
  const latestTrackingEvent = input.shipmentTrackingEvents
    .filter((event) =>
      (shipmentId && event.shipmentId === shipmentId) ||
      (
        !shipmentId &&
        event.semenOrderId === input.shipment.semenOrderId &&
        event.orderNumber === input.shipment.orderNumber
      )
    )
    .sort(compareShipmentEventDescending)
    .map(toShipmentTrackingEventRow)[0] ?? null;
  const canManage = canManageShipment(input.actor, input.shipment);

  return Object.freeze({
    id: shipmentId,
    semenOrderId: input.shipment.semenOrderId,
    orderNumber: input.shipment.orderNumber,
    status: input.shipment.status,
    providerName: normalizeOptionalString(input.shipment.providerName),
    providerTrackingId: normalizeOptionalString(input.shipment.providerTrackingId),
    trackingUrl: normalizeOptionalString(input.shipment.trackingUrl),
    updatedAt: normalizeOptionalString(input.shipment.updatedAt),
    latestTrackingEvent,
    updateHref: canManage ? buildShipmentHref(input.shipment, "update-shipment") : null,
    uploadDocumentHref: canUploadDocument(
      input.actor,
      toShipmentDocumentTarget(input.shipment),
      "ORDER_PARTICIPANTS",
    )
      ? buildShipmentHref(input.shipment, "upload-document")
      : null,
    auditProofReady: canManage,
  });
}

/**
 * @param {import("./station-dashboard.d.ts").ShipmentTrackingEventLike} event
 * @returns {import("./station-dashboard.d.ts").StationDashboardShipmentTrackingEventRow}
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
    occurredAt: event.occurredAt,
  });
}

/**
 * @param {import("./station-dashboard.d.ts").DocumentLike} document
 * @returns {import("./station-dashboard.d.ts").StationDashboardDocumentRow}
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
      ? `${STATION_DASHBOARD_ROUTES.documentDetail}/${encodeURIComponent(documentId)}`
      : null,
  });
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @param {import("./station-dashboard.d.ts").StationDashboardActorContext} actor
 * @returns {import("./station-dashboard.d.ts").StationDashboardActionItem[]}
 */
function buildActionsForOrder(order, actor) {
  const actions = [
    Object.freeze({
      id: `${order.orderNumber}-open-order`,
      orderNumber: order.orderNumber,
      status: order.status,
      title: "Open order detail",
      description: "Review submitted details, status history, shipment records and linked documents.",
      actionLabel: "Open detail",
      actionHref: buildOrderHref(order),
      actionKind: "OPEN_ORDER",
      auditAction: null,
      proofSource: null,
      auditProofReady: false,
    }),
  ];

  if (canTransitionSemenOrderStatus(actor, order, "CONFIRMED")) {
    actions.push(Object.freeze({
      id: `${order.orderNumber}-confirm`,
      orderNumber: order.orderNumber,
      status: order.status,
      title: "Confirm order",
      description: "Station confirmation is available for this received order.",
      actionLabel: "Confirm",
      actionHref: buildOrderActionHref(order, "confirm"),
      actionKind: "CONFIRM_ORDER",
      auditAction: "SEMEN_ORDER_CONFIRMED",
      proofSource: "ORDER_STATUS_CHANGE",
      auditProofReady: true,
    }));
  }

  if (canTransitionSemenOrderStatus(actor, order, "RECEIVED")) {
    actions.push(Object.freeze({
      id: `${order.orderNumber}-receive`,
      orderNumber: order.orderNumber,
      status: order.status,
      title: "Mark as received",
      description: "Acknowledge that this submitted order has entered station review.",
      actionLabel: "Mark as received",
      actionHref: buildOrderActionHref(order, "receive"),
      actionKind: "RECEIVE_ORDER",
      auditAction: "SEMEN_ORDER_RECEIVED",
      proofSource: "ORDER_STATUS_CHANGE",
      auditProofReady: true,
    }));
  }

  if (canTransitionSemenOrderStatus(actor, order, "REJECTED")) {
    actions.push(Object.freeze({
      id: `${order.orderNumber}-reject`,
      orderNumber: order.orderNumber,
      status: order.status,
      title: "Reject order",
      description: "Station rejection is available for this received order.",
      actionLabel: "Reject",
      actionHref: buildOrderActionHref(order, "reject"),
      actionKind: "REJECT_ORDER",
      auditAction: "SEMEN_ORDER_REJECTED",
      proofSource: "ORDER_STATUS_CHANGE",
      auditProofReady: true,
    }));
  }

  if (canManageShipment(actor, order)) {
    actions.push(Object.freeze({
      id: `${order.orderNumber}-create-shipment`,
      orderNumber: order.orderNumber,
      status: order.status,
      title: "Create shipment",
      description: "A confirmed order can be prepared for manual shipment tracking.",
      actionLabel: "Create shipment",
      actionHref: buildOrderActionHref(order, "create-shipment"),
      actionKind: "CREATE_SHIPMENT",
      auditAction: "SHIPMENT_CREATED",
      proofSource: "SHIPMENT_TRACKING_EVENT",
      auditProofReady: true,
    }));
  }

  if (canUploadDocument(actor, toOrderDocumentTarget(order), "ORDER_PARTICIPANTS")) {
    actions.push(Object.freeze({
      id: `${order.orderNumber}-upload-document`,
      orderNumber: order.orderNumber,
      status: order.status,
      title: "Upload document",
      description: "Controlled station documents can be linked to this assigned order.",
      actionLabel: "Upload document",
      actionHref: buildOrderActionHref(order, "upload-document"),
      actionKind: "UPLOAD_DOCUMENT",
      auditAction: "DOCUMENT_UPLOADED",
      proofSource: "DOCUMENT_ACCESS",
      auditProofReady: true,
    }));
  }

  return actions;
}

/**
 * @param {{
 *   actor: import("./station-dashboard.d.ts").StationDashboardActorContext;
 *   orders: import("./station-dashboard.d.ts").SemenOrderLike[];
 *   shipments: import("./station-dashboard.d.ts").ShipmentLike[];
 *   limit: number;
 * }} input
 * @returns {import("./station-dashboard.d.ts").StationDashboardActionItem[]}
 */
function buildOrderActionItems(input) {
  return input.orders
    .flatMap((order) => buildActionsForOrder(order, input.actor))
    .filter((action) =>
      action.actionKind === "RECEIVE_ORDER" ||
      action.actionKind === "CONFIRM_ORDER" ||
      action.actionKind === "REJECT_ORDER" ||
      action.actionKind === "UPLOAD_DOCUMENT" ||
      (
        action.actionKind === "CREATE_SHIPMENT" &&
        !input.shipments.some((shipment) => shipment.orderNumber === action.orderNumber)
      )
    )
    .slice(0, input.limit);
}

/**
 * @param {{
 *   actor: import("./station-dashboard.d.ts").StationDashboardActorContext;
 *   orders: import("./station-dashboard.d.ts").SemenOrderLike[];
 *   shipments: import("./station-dashboard.d.ts").ShipmentLike[];
 *   limit: number;
 * }} input
 * @returns {import("./station-dashboard.d.ts").StationDashboardShipmentAction[]}
 */
function buildShipmentActions(input) {
  const shipmentOrderKeys = buildOrderKeySet(input.shipments.map((shipment) => ({
    id: shipment.semenOrderId,
    orderNumber: shipment.orderNumber,
  })));
  const createActions = input.orders
    .filter((order) =>
      canManageShipment(input.actor, order) &&
      !shipmentOrderKeys.has(orderKey(order.id, order.orderNumber)) &&
      !shipmentOrderKeys.has(orderKey(null, order.orderNumber))
    )
    .map((order) => Object.freeze({
      id: `${order.orderNumber}-shipment-create`,
      orderNumber: order.orderNumber,
      shipmentId: null,
      status: "NOT_CREATED",
      title: "Create shipment",
      description: "Confirmed order is ready for a station-managed shipment record.",
      actionLabel: "Create shipment",
      actionHref: buildOrderActionHref(order, "create-shipment"),
      actionKind: "CREATE_SHIPMENT",
      auditAction: "SHIPMENT_CREATED",
      proofSource: "SHIPMENT_TRACKING_EVENT",
      auditProofReady: true,
    }));
  const updateActions = input.shipments
    .filter((shipment) =>
      !SHIPMENT_TERMINAL_STATUSES.includes(shipment.status) &&
      canManageShipment(input.actor, shipment)
    )
    .map((shipment) => {
      const shipmentId = normalizeOptionalString(shipment.id);

      return Object.freeze({
        id: `${shipment.orderNumber}-${shipmentId ?? "shipment"}-update`,
        orderNumber: shipment.orderNumber,
        shipmentId,
        status: shipment.status,
        title: "Update shipment",
        description: "Shipment has a non-terminal status and can receive a manual tracking update.",
        actionLabel: "Update shipment",
        actionHref: buildShipmentHref(shipment, "update-shipment"),
        actionKind: "UPDATE_SHIPMENT",
        auditAction: "SHIPMENT_STATUS_UPDATED",
        proofSource: "SHIPMENT_TRACKING_EVENT",
        auditProofReady: true,
      });
    });

  return [...createActions, ...updateActions]
    .sort((left, right) => left.orderNumber.localeCompare(right.orderNumber))
    .slice(0, input.limit);
}

/**
 * @param {{
 *   actions: import("./station-dashboard.d.ts").StationDashboardActionItem[];
 *   orders: import("./station-dashboard.d.ts").SemenOrderLike[];
 *   shipments: import("./station-dashboard.d.ts").ShipmentLike[];
 *   limit: number;
 * }} input
 * @returns {import("./station-dashboard.d.ts").StationDashboardNotification[]}
 */
function buildNotifications(input) {
  const notifications = [];
  const submittedCount = input.orders.filter((order) => order.status === "SUBMITTED").length;
  const receivedCount = input.orders.filter((order) => order.status === "RECEIVED").length;
  const delayedCount = input.shipments.filter((shipment) => shipment.status === "DELAYED").length;
  const auditReadyCount = input.actions.filter((action) => action.auditProofReady).length;

  if (submittedCount > 0) {
    notifications.push(Object.freeze({
      id: "submitted-orders",
      title: "Submitted orders received",
      description: `${submittedCount} submitted order${submittedCount === 1 ? "" : "s"} assigned to this station.`,
      severity: "info",
      href: STATION_DASHBOARD_ROUTES.dashboard,
    }));
  }

  if (receivedCount > 0) {
    notifications.push(Object.freeze({
      id: "received-orders",
      title: "Station decision available",
      description: `${receivedCount} received order${receivedCount === 1 ? "" : "s"} can be confirmed or rejected.`,
      severity: "warning",
      href: STATION_DASHBOARD_ROUTES.dashboard,
    }));
  }

  if (delayedCount > 0) {
    notifications.push(Object.freeze({
      id: "delayed-shipments",
      title: "Shipment update needed",
      description: `${delayedCount} delayed shipment${delayedCount === 1 ? "" : "s"} need a station update.`,
      severity: "warning",
      href: STATION_DASHBOARD_ROUTES.dashboard,
    }));
  }

  if (auditReadyCount > 0) {
    notifications.push(Object.freeze({
      id: "audit-proof-ready-actions",
      title: "Audit-ready actions available",
      description: `${auditReadyCount} station action${auditReadyCount === 1 ? "" : "s"} have existing audit/proof hooks.`,
      severity: "info",
      href: STATION_DASHBOARD_ROUTES.dashboard,
    }));
  }

  return notifications.slice(0, input.limit);
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @param {import("./station-dashboard.d.ts").OrderStatusHistoryLike[]} statusHistory
 * @param {ReadonlySet<string>} ownOrderKeys
 * @returns {import("./station-dashboard.d.ts").StationDashboardStatusHistoryRow[]}
 */
function orderStatusHistoryForOrder(order, statusHistory, ownOrderKeys) {
  const orderId = normalizeOptionalString(order.id);

  return statusHistory
    .filter((history) =>
      ownOrderKeys.has(orderKey(history.semenOrderId, history.orderNumber)) &&
      (
        (orderId && history.semenOrderId === orderId) ||
        history.orderNumber === order.orderNumber
      )
    )
    .sort(compareStatusChangedDescending)
    .map(toStatusHistoryRow);
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike[]} orders
 * @returns {ReadonlySet<string>}
 */
function buildOrderKeySet(orders) {
  const keys = new Set();

  for (const order of orders) {
    keys.add(orderKey(order.id, order.orderNumber));
    keys.add(orderKey(null, order.orderNumber));
  }

  return keys;
}

/**
 * @param {import("./station-dashboard.d.ts").ShipmentLike[]} shipments
 * @returns {ReadonlySet<string>}
 */
function buildShipmentKeySet(shipments) {
  const keys = new Set();

  for (const shipment of shipments) {
    keys.add(shipmentKey(shipment.id, shipment.orderNumber));
    keys.add(shipmentKey(null, shipment.orderNumber));
  }

  return keys;
}

/**
 * @param {string | null | undefined} orderId
 * @param {string} orderNumber
 * @returns {string}
 */
function orderKey(orderId, orderNumber) {
  return normalizeOptionalString(orderId) ?? `order-number:${orderNumber}`;
}

/**
 * @param {string | null | undefined} shipmentId
 * @param {string} orderNumber
 * @returns {string}
 */
function shipmentKey(shipmentId, orderNumber) {
  return normalizeOptionalString(shipmentId) ?? `shipment-order-number:${orderNumber}`;
}

/**
 * @param {import("./station-dashboard.d.ts").DocumentLike} document
 * @param {ReadonlySet<string>} orderKeys
 * @param {ReadonlySet<string>} shipmentKeys
 * @returns {boolean}
 */
function matchesKnownStationContext(document, orderKeys, shipmentKeys) {
  if (
    document.semenOrderId &&
    document.orderNumber &&
    orderKeys.has(orderKey(document.semenOrderId, document.orderNumber))
  ) {
    return true;
  }

  if (
    document.orderNumber &&
    orderKeys.has(orderKey(null, document.orderNumber))
  ) {
    return true;
  }

  if (
    document.shipmentId &&
    document.orderNumber &&
    shipmentKeys.has(shipmentKey(document.shipmentId, document.orderNumber))
  ) {
    return true;
  }

  return false;
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @param {{
 *   semenOrderId?: string | null;
 *   orderNumber: string;
 * }} target
 * @returns {boolean}
 */
function matchesOrderContext(order, target) {
  const orderId = normalizeOptionalString(order.id);

  return Boolean(
    (orderId && target.semenOrderId === orderId) ||
    target.orderNumber === order.orderNumber
  );
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @returns {string | null}
 */
function buildOrderHref(order) {
  const orderLookupId = normalizeOptionalString(order.id) ?? order.orderNumber;

  return `${STATION_DASHBOARD_ROUTES.dashboard}?orderId=${encodeURIComponent(orderLookupId)}`;
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @param {string} action
 * @returns {string}
 */
function buildOrderActionHref(order, action) {
  const orderLookupId = normalizeOptionalString(order.id) ?? order.orderNumber;

  if (action === "create-shipment") {
    const params = new URLSearchParams({
      action: "create",
      orderId: orderLookupId,
    });

    return `${STATION_DASHBOARD_ROUTES.shipmentManagement}?${params.toString()}`;
  }

  if (action === "upload-document") {
    return buildDocumentUploadHref({
      returnTo: STATION_DASHBOARD_ROUTES.dashboard,
      targetId: orderLookupId,
      targetType: "SemenOrder",
    });
  }

  const params = new URLSearchParams({
    orderId: orderLookupId,
    action,
  });

  return `${STATION_DASHBOARD_ROUTES.dashboard}?${params.toString()}`;
}

/**
 * @param {import("./station-dashboard.d.ts").ShipmentLike} shipment
 * @param {string} action
 * @returns {string}
 */
function buildShipmentHref(shipment, action) {
  const shipmentId = normalizeOptionalString(shipment.id);

  if (action === "update-shipment") {
    const params = new URLSearchParams({
      action: "update",
      orderId: shipment.semenOrderId,
    });

    if (shipmentId) {
      params.set("shipmentId", shipmentId);
    }

    return `${STATION_DASHBOARD_ROUTES.shipmentManagement}?${params.toString()}`;
  }

  if (action === "upload-document") {
    return buildDocumentUploadHref({
      returnTo: STATION_DASHBOARD_ROUTES.dashboard,
      targetId: shipmentId ?? shipment.semenOrderId,
      targetType: "Shipment",
    });
  }

  const params = new URLSearchParams({
    orderId: shipment.semenOrderId,
    action,
  });

  if (shipmentId) {
    params.set("shipmentId", shipmentId);
  }

  return `${STATION_DASHBOARD_ROUTES.dashboard}?${params.toString()}`;
}

/**
 * @param {{ returnTo: string, targetId: string, targetType: string }} input
 * @returns {string}
 */
function buildDocumentUploadHref(input) {
  const params = new URLSearchParams({
    returnTo: input.returnTo,
    targetId: input.targetId,
    targetType: input.targetType,
  });

  return `${STATION_DASHBOARD_ROUTES.documentUpload}?${params.toString()}`;
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @returns {string | null}
 */
function buildShippingDestination(order) {
  const parts = [
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    order.shippingCity,
    order.shippingRegion,
    order.shippingPostalCode,
    order.shippingCountry,
  ]
    .map(normalizeOptionalString)
    .filter(Boolean);

  return parts.length > 0 ? parts.join(", ") : null;
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} order
 * @returns {import("@coritech/domain/documents/document-evidence.d.ts").SemenOrderLinkTargetLike}
 */
function toOrderDocumentTarget(order) {
  return {
    id: normalizeOptionalString(order.id),
    targetType: "SemenOrder",
    targetId: normalizeOptionalString(order.id),
    orderNumber: order.orderNumber,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
  };
}

/**
 * @param {import("./station-dashboard.d.ts").ShipmentLike} shipment
 * @returns {import("@coritech/domain/documents/document-evidence.d.ts").ShipmentLinkTargetLike}
 */
function toShipmentDocumentTarget(shipment) {
  return {
    id: normalizeOptionalString(shipment.id),
    targetType: "Shipment",
    targetId: normalizeOptionalString(shipment.id),
    semenOrderId: shipment.semenOrderId,
    orderNumber: shipment.orderNumber,
    breederOrganizationId: shipment.breederOrganizationId,
    breedingStationOrganizationId: shipment.breedingStationOrganizationId,
  };
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardViewModel} viewModel
 * @returns {string}
 */
function renderReadyDashboard(viewModel) {
  const sections = viewModel.sections;

  return [
    `<main class="station-dashboard${viewModel.isEmpty ? " is-empty" : ""}" data-organization-id="${escapeAttribute(viewModel.organizationContext.organizationId)}">`,
    "  <header class=\"station-dashboard__header\">",
    "    <div>",
    "      <p class=\"station-dashboard__eyebrow\">Station workspace</p>",
    `      <h1>${escapeHtml(viewModel.organizationContext.organizationName)}</h1>`,
    "    </div>",
    `    <a href="${escapeAttribute(viewModel.navigation.listingManagementHref)}">Listing management</a>`,
    "  </header>",
    renderStatusSummary(sections.orderStatusSummary.items),
    renderSelectedOrder(viewModel.selectedOrder),
    renderListingsSection(sections.activeListings),
    renderOrdersSection(sections.incomingOrders),
    renderActionSection(sections.ordersNeedingAction),
    renderShipmentActionSection(sections.shipmentsToUpdate),
    renderDocumentSection(sections.recentDocuments),
    renderNotificationSection(sections.notifications),
    "</main>",
  ].join("\n");
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardLoadingViewModel} viewModel
 * @returns {string}
 */
function renderLoadingState(viewModel) {
  return [
    "<section class=\"station-dashboard station-dashboard--loading\" aria-busy=\"true\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardErrorViewModel} viewModel
 * @returns {string}
 */
function renderErrorState(viewModel) {
  return [
    "<section class=\"station-dashboard station-dashboard--error\" role=\"alert\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {readonly import("./station-dashboard.d.ts").StationDashboardStatusSummaryItem[]} items
 * @returns {string}
 */
function renderStatusSummary(items) {
  const visibleItems = items.filter((item) => item.count > 0);
  const body = visibleItems.length > 0
    ? visibleItems.map((item) =>
      `    <li><span>${escapeHtml(formatStatus(item.status))}</span><strong>${item.count}</strong></li>`
    ).join("\n")
    : "    <li><span>No assigned orders</span><strong>0</strong></li>";

  return [
    "  <section aria-label=\"Order status summary\">",
    "    <ul>",
    body,
    "    </ul>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardSelectedOrder | null} selectedOrder
 * @returns {string}
 */
function renderSelectedOrder(selectedOrder) {
  if (!selectedOrder) {
    return "";
  }

  return [
    "  <section aria-labelledby=\"selected-order-heading\">",
    `    <h2 id="selected-order-heading">Order ${escapeHtml(selectedOrder.orderNumber)}</h2>`,
    `    <p>Status: ${escapeHtml(formatStatus(selectedOrder.status))}</p>`,
    `    <p>Destination: ${escapeHtml(selectedOrder.shippingDestination ?? "Not recorded")}</p>`,
    renderActions(selectedOrder.actions),
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardSection<import("./station-dashboard.d.ts").StationDashboardListingCard>} section
 * @returns {string}
 */
function renderListingsSection(section) {
  const body = section.items.length === 0
    ? `    <p>${escapeHtml(section.emptyMessage)}</p>`
    : section.items.map((listing) =>
      `    <li>${escapeHtml(listing.stallionName)} - ${escapeHtml(formatStatus(listing.availabilityStatus))}</li>`
    ).join("\n");

  return renderListSection(section.title, "active-listings-heading", body);
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardSection<import("./station-dashboard.d.ts").StationDashboardOrderRow>} section
 * @returns {string}
 */
function renderOrdersSection(section) {
  const body = section.items.length === 0
    ? `    <p>${escapeHtml(section.emptyMessage)}</p>`
    : section.items.map((order) => [
      "    <li>",
      `      <a href="${escapeAttribute(order.detailHref ?? "#")}">${escapeHtml(order.orderNumber)}</a>`,
      `      <span>${escapeHtml(formatStatus(order.status))}</span>`,
      "    </li>",
    ].join("\n")).join("\n");

  return renderListSection(section.title, "incoming-orders-heading", body);
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardSection<import("./station-dashboard.d.ts").StationDashboardActionItem>} section
 * @returns {string}
 */
function renderActionSection(section) {
  const body = section.items.length === 0
    ? `    <p>${escapeHtml(section.emptyMessage)}</p>`
    : renderActions(section.items);

  return renderListSection(section.title, "orders-needing-action-heading", body);
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardSection<import("./station-dashboard.d.ts").StationDashboardShipmentAction>} section
 * @returns {string}
 */
function renderShipmentActionSection(section) {
  const body = section.items.length === 0
    ? `    <p>${escapeHtml(section.emptyMessage)}</p>`
    : section.items.map((item) => [
      `    <li data-audit-action="${escapeAttribute(item.auditAction)}" data-proof-source="${escapeAttribute(item.proofSource)}">`,
      `      <a href="${escapeAttribute(item.actionHref ?? "#")}">${escapeHtml(item.actionLabel)}</a>`,
      `      <span>${escapeHtml(item.orderNumber)} - ${escapeHtml(formatStatus(item.status))}</span>`,
      "    </li>",
    ].join("\n")).join("\n");

  return renderListSection(section.title, "shipments-to-update-heading", body);
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardSection<import("./station-dashboard.d.ts").StationDashboardDocumentRow>} section
 * @returns {string}
 */
function renderDocumentSection(section) {
  const body = section.items.length === 0
    ? `    <p>${escapeHtml(section.emptyMessage)}</p>`
    : section.items.map((document) =>
      `    <li><a href="${escapeAttribute(document.detailHref ?? "#")}">${escapeHtml(document.originalFileName)}</a></li>`
    ).join("\n");

  return renderListSection(section.title, "recent-documents-heading", body);
}

/**
 * @param {import("./station-dashboard.d.ts").StationDashboardSection<import("./station-dashboard.d.ts").StationDashboardNotification>} section
 * @returns {string}
 */
function renderNotificationSection(section) {
  const body = section.items.length === 0
    ? `    <p>${escapeHtml(section.emptyMessage)}</p>`
    : section.items.map((item) =>
      `    <li data-severity="${escapeAttribute(item.severity)}">${escapeHtml(item.title)}</li>`
    ).join("\n");

  return renderListSection(section.title, "notifications-heading", body);
}

/**
 * @param {readonly import("./station-dashboard.d.ts").StationDashboardActionItem[]} actions
 * @returns {string}
 */
function renderActions(actions) {
  return actions.map((action) => [
    `    <li data-action-kind="${escapeAttribute(action.actionKind)}" data-audit-action="${escapeAttribute(action.auditAction ?? "")}" data-proof-source="${escapeAttribute(action.proofSource ?? "")}" data-audit-proof-ready="${action.auditProofReady ? "true" : "false"}">`,
    `      <a href="${escapeAttribute(action.actionHref ?? "#")}">${escapeHtml(action.actionLabel)}</a>`,
    `      <span>${escapeHtml(action.orderNumber)} - ${escapeHtml(action.title)}</span>`,
    "    </li>",
  ].join("\n")).join("\n");
}

/**
 * @param {string} title
 * @param {string} headingId
 * @param {string} body
 * @returns {string}
 */
function renderListSection(title, headingId, body) {
  return [
    `  <section aria-labelledby="${escapeAttribute(headingId)}">`,
    `    <h2 id="${escapeAttribute(headingId)}">${escapeHtml(title)}</h2>`,
    "    <ul>",
    body,
    "    </ul>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {string | Date} left
 * @param {string | Date} right
 * @returns {number}
 */
function compareIsoDescending(left, right) {
  return new Date(right).getTime() - new Date(left).getTime();
}

/**
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} left
 * @param {import("./station-dashboard.d.ts").SemenOrderLike} right
 * @returns {number}
 */
function compareUpdatedDescending(left, right) {
  return compareIsoDescending(
    left.updatedAt ?? left.createdAt ?? "",
    right.updatedAt ?? right.createdAt ?? "",
  );
}

/**
 * @param {import("./station-dashboard.d.ts").OrderStatusHistoryLike} left
 * @param {import("./station-dashboard.d.ts").OrderStatusHistoryLike} right
 * @returns {number}
 */
function compareStatusChangedDescending(left, right) {
  return compareIsoDescending(left.changedAt, right.changedAt);
}

/**
 * @param {import("./station-dashboard.d.ts").ShipmentTrackingEventLike} left
 * @param {import("./station-dashboard.d.ts").ShipmentTrackingEventLike} right
 * @returns {number}
 */
function compareShipmentEventDescending(left, right) {
  return compareIsoDescending(left.occurredAt, right.occurredAt);
}

/**
 * @param {import("./station-dashboard.d.ts").DocumentLike} left
 * @param {import("./station-dashboard.d.ts").DocumentLike} right
 * @returns {number}
 */
function compareCreatedDescending(left, right) {
  return compareIsoDescending(left.createdAt, right.createdAt);
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {unknown[] | undefined} value
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateOptionalArray(value, fieldName, issues) {
  if (value !== undefined && !Array.isArray(value)) {
    issues.push(`${fieldName} must be an array when provided.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value !== undefined && value !== null && normalizeOptionalString(value) === null) {
    issues.push(`${fieldName} must be a non-empty string when provided.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateOptionalPositiveInteger(value, fieldName, issues) {
  if (value !== undefined && value !== null && (!Number.isInteger(value) || Number(value) <= 0)) {
    issues.push(`${fieldName} must be a positive integer when provided.`);
  }
}

/**
 * @param {number | null | undefined} value
 * @param {number} fallback
 * @returns {number}
 */
function limitOrDefault(value, fallback) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}

/**
 * @param {string} value
 * @returns {string}
 */
function formatStatus(value) {
  return value
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function escapeAttribute(value) {
  return escapeHtml(value);
}
