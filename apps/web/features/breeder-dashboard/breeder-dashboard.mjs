// @ts-check

import {
  canViewSemenListing,
  isSemenListingOrderable,
} from "@coritech/domain/catalog/semen-catalog.mjs";
import { canViewDocument } from "@coritech/domain/documents/document-evidence.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import { SEMEN_ORDER_STATUSES } from "@coritech/domain/orders/semen-order.mjs";

export const BREEDER_DASHBOARD_VIEW_STATES = /** @type {const} */ ([
  "LOADING",
  "READY",
  "ERROR",
]);

export const BREEDER_DASHBOARD_ROUTES = Object.freeze({
  catalog: "/app/catalog",
  newOrder: "/app/orders/new",
  orderDetail: "/app/orders",
  documentDetail: "/app/documents",
});

const ACTION_STATUS_COPY = Object.freeze({
  DRAFT: Object.freeze({
    title: "Draft order awaiting submission",
    description: "Review and submit the order when it is ready for station review.",
    actionLabel: "Edit draft",
  }),
  REJECTED: Object.freeze({
    title: "Station response needs review",
    description: "Review the station response and decide the next operational step.",
    actionLabel: "Review order",
  }),
  DELIVERED: Object.freeze({
    title: "Delivered order awaiting completion",
    description: "Check received material and complete the order when records are ready.",
    actionLabel: "Complete order",
  }),
});

export class BreederDashboardValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech breeder dashboard input:\n- ${issues.join("\n- ")}`);
    this.name = "BreederDashboardValidationError";
    this.issues = issues;
  }
}

export class BreederDashboardAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "BreederDashboardAuthorizationError";
  }
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardInput} input
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardViewModel}
 */
export function createBreederDashboardViewModel(input) {
  const issues = validateDashboardInput(input);

  if (issues.length > 0) {
    throw new BreederDashboardValidationError(issues);
  }

  const actor = input.actor;
  const organizationContext = resolveBreederOrganizationContext({
    actor,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
  });

  const listingRecords = input.listingRecords ?? [];
  const orders = input.orders ?? [];
  const statusHistory = input.statusHistory ?? [];
  const documents = input.documents ?? [];
  const ownOrders = orders
    .filter((order) => order?.breederOrganizationId === organizationContext.organizationId)
    .sort(compareUpdatedDescending);
  const ownOrderKeys = buildOrderKeySet(ownOrders);
  const listingCards = listingRecords
    .filter((record) =>
      record?.listing?.listingStatus === "ACTIVE" &&
      canViewSemenListing(actor, record.listing)
    )
    .map(toListingCard)
    .sort((left, right) => left.stallionName.localeCompare(right.stallionName));
  const orderRows = ownOrders.map((order) =>
    toOrderRow(order, statusHistory, ownOrderKeys)
  );
  const recentDocuments = documents
    .filter((document) =>
      document?.breederOrganizationId === organizationContext.organizationId &&
      canViewDocument(actor, document)
    )
    .sort(compareCreatedDescending)
    .slice(0, limitOrDefault(input.recentDocumentsLimit, 5))
    .map(toDocumentRow);
  const actionRequired = buildActionItems(
    ownOrders,
    limitOrDefault(input.actionItemsLimit, 6),
  );
  const statusSummary = SEMEN_ORDER_STATUSES.map((status) =>
    Object.freeze({
      status,
      count: ownOrders.filter((order) => order.status === status).length,
    })
  );

  return Object.freeze({
    state: "READY",
    actorUserId: actor.userId.trim(),
    organizationContext,
    navigation: Object.freeze({
      catalogHref: BREEDER_DASHBOARD_ROUTES.catalog,
    }),
    sections: Object.freeze({
      activeListings: Object.freeze({
        title: "Active listings",
        emptyMessage: "No active semen listings are available.",
        items: Object.freeze(listingCards),
      }),
      myOrders: Object.freeze({
        title: "My orders",
        emptyMessage: "No semen orders have been created for this breeder organization.",
        items: Object.freeze(orderRows),
      }),
      orderStatusSummary: Object.freeze({
        title: "Order status summary",
        items: Object.freeze(statusSummary),
      }),
      recentDocuments: Object.freeze({
        title: "Recent documents",
        emptyMessage: "No controlled order documents are available.",
        items: Object.freeze(recentDocuments),
      }),
      actionRequired: Object.freeze({
        title: "Notifications and action required",
        emptyMessage: "No breeder action is required.",
        items: Object.freeze(actionRequired),
      }),
    }),
    isEmpty: listingCards.length === 0 &&
      orderRows.length === 0 &&
      recentDocuments.length === 0 &&
      actionRequired.length === 0,
  });
}

/**
 * @param {{ organizationName?: string | null }} [input]
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardLoadingViewModel}
 */
export function createBreederDashboardLoadingState(input = {}) {
  return Object.freeze({
    state: "LOADING",
    title: "Breeder dashboard",
    message: input.organizationName
      ? `Loading ${input.organizationName} dashboard.`
      : "Loading breeder dashboard.",
  });
}

/**
 * @param {unknown} error
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardErrorViewModel}
 */
export function createBreederDashboardErrorState(error) {
  return Object.freeze({
    state: "ERROR",
    title: error instanceof BreederDashboardAuthorizationError
      ? "Dashboard unavailable"
      : "Dashboard could not load",
    message: error instanceof Error ? error.message : "An unknown dashboard error occurred.",
  });
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardRenderableViewModel} viewModel
 * @returns {string}
 */
export function renderBreederDashboard(viewModel) {
  if (viewModel.state === "LOADING") {
    return renderLoadingState(viewModel);
  }

  if (viewModel.state === "ERROR") {
    return renderErrorState(viewModel);
  }

  return renderReadyDashboard(viewModel);
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardInput} input
 * @returns {string}
 */
export function renderBreederDashboardFromInput(input) {
  return renderBreederDashboard(createBreederDashboardViewModel(input));
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardInput | undefined} input
 * @returns {string[]}
 */
export function validateDashboardInput(input) {
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
  validateOptionalArray(input.listingRecords, "listingRecords", issues);
  validateOptionalArray(input.orders, "orders", issues);
  validateOptionalArray(input.statusHistory, "statusHistory", issues);
  validateOptionalArray(input.documents, "documents", issues);
  validateOptionalPositiveInteger(input.recentDocumentsLimit, "recentDocumentsLimit", issues);
  validateOptionalPositiveInteger(input.actionItemsLimit, "actionItemsLimit", issues);

  return issues;
}

/**
 * @param {{
 *   actor: import("./breeder-dashboard.d.ts").BreederDashboardActorContext;
 *   organizationId?: string | null;
 *   organizationName?: string | null;
 * }} input
 * @returns {import("./breeder-dashboard.d.ts").BreederOrganizationContext}
 */
function resolveBreederOrganizationContext(input) {
  const activeBreederRoles = input.actor.roles.filter((assignment) =>
    assignment.roleCode === "BREEDER" &&
    assignment.userId === input.actor.userId &&
    isActiveRoleAssignment(assignment)
  );

  if (activeBreederRoles.length === 0) {
    throw new BreederDashboardAuthorizationError(
      "actor must have an active BREEDER role before viewing the breeder dashboard.",
    );
  }

  const requestedOrganizationId = normalizeOptionalString(input.organizationId);

  if (!requestedOrganizationId && activeBreederRoles.length > 1) {
    throw new BreederDashboardValidationError([
      "organizationId is required when actor has multiple active BREEDER roles.",
    ]);
  }

  const role = requestedOrganizationId
    ? activeBreederRoles.find((assignment) =>
      assignment.organizationId === requestedOrganizationId
    )
    : activeBreederRoles[0];

  if (!role) {
    throw new BreederDashboardAuthorizationError(
      "actor may only view a breeder dashboard for their own breeder organization.",
    );
  }

  return Object.freeze({
    organizationId: role.organizationId,
    organizationName: normalizeOptionalString(input.organizationName) ?? role.organizationId,
    roleCode: "BREEDER",
  });
}

/**
 * @param {import("./breeder-dashboard.d.ts").SemenListingRecordLike} record
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardListingCard}
 */
function toListingCard(record) {
  const listing = record.listing;
  const listingId = normalizeOptionalString(listing.id);
  const canCreateOrder = Boolean(listingId) && isSemenListingOrderable(listing);

  return Object.freeze({
    id: listingId,
    stallionId: record.stallion.id,
    stallionName: record.stallion.name,
    breed: record.stallion.breed,
    breedingStationOrganizationId: listing.breedingStationOrganizationId,
    availabilityStatus: listing.availabilityStatus,
    termsSummary: listing.termsSummary,
    canCreateOrder,
    createOrderHref: canCreateOrder
      ? `${BREEDER_DASHBOARD_ROUTES.newOrder}?semenListingId=${encodeURIComponent(
        /** @type {string} */ (listingId),
      )}`
      : null,
  });
}

/**
 * @param {import("./breeder-dashboard.d.ts").SemenOrderLike} order
 * @param {import("./breeder-dashboard.d.ts").OrderStatusHistoryLike[]} statusHistory
 * @param {ReadonlySet<string>} ownOrderKeys
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardOrderRow}
 */
function toOrderRow(order, statusHistory, ownOrderKeys) {
  const orderId = normalizeOptionalString(order.id);
  const relatedHistory = statusHistory
    .filter((history) =>
      ownOrderKeys.has(orderKey(history.semenOrderId, history.orderNumber)) &&
      (
        (orderId && history.semenOrderId === orderId) ||
        history.orderNumber === order.orderNumber
      )
    )
    .sort(compareStatusChangedDescending)
    .map(toStatusHistoryRow);

  return Object.freeze({
    id: orderId,
    orderNumber: order.orderNumber,
    semenListingId: order.semenListingId,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    status: order.status,
    createdAt: order.createdAt ?? null,
    updatedAt: order.updatedAt ?? null,
    detailHref: orderId
      ? `${BREEDER_DASHBOARD_ROUTES.orderDetail}/${encodeURIComponent(orderId)}`
      : null,
    draftEditHref: order.status === "DRAFT" && orderId
      ? `${BREEDER_DASHBOARD_ROUTES.newOrder}?draftOrderId=${encodeURIComponent(orderId)}`
      : null,
    statusHistoryHref: orderId
      ? `${BREEDER_DASHBOARD_ROUTES.orderDetail}/${encodeURIComponent(orderId)}#status-history`
      : null,
    statusHistory: Object.freeze(relatedHistory),
  });
}

/**
 * @param {import("./breeder-dashboard.d.ts").OrderStatusHistoryLike} history
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardStatusHistoryRow}
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
 * @param {import("./breeder-dashboard.d.ts").DocumentLike} document
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardDocumentRow}
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
      ? `${BREEDER_DASHBOARD_ROUTES.documentDetail}/${encodeURIComponent(documentId)}`
      : null,
  });
}

/**
 * @param {import("./breeder-dashboard.d.ts").SemenOrderLike[]} orders
 * @param {number} limit
 * @returns {import("./breeder-dashboard.d.ts").BreederDashboardActionItem[]}
 */
function buildActionItems(orders, limit) {
  return orders
    .filter((order) => hasOwn(ACTION_STATUS_COPY, order.status))
    .slice(0, limit)
    .map((order) => {
      const copy =
        /** @type {Record<string, { title: string, description: string, actionLabel: string }>} */ (
          ACTION_STATUS_COPY
        )[order.status];
      const orderId = normalizeOptionalString(order.id);

      return Object.freeze({
        id: `${order.orderNumber}-${order.status}`,
        orderNumber: order.orderNumber,
        status: order.status,
        title: copy.title,
        description: copy.description,
        actionLabel: copy.actionLabel,
        actionHref: order.status === "DRAFT" && orderId
          ? `${BREEDER_DASHBOARD_ROUTES.newOrder}?draftOrderId=${encodeURIComponent(orderId)}`
          : orderId
          ? `${BREEDER_DASHBOARD_ROUTES.orderDetail}/${encodeURIComponent(orderId)}`
          : null,
      });
    });
}

/**
 * @param {import("./breeder-dashboard.d.ts").SemenOrderLike[]} orders
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
 * @param {string | null | undefined} orderId
 * @param {string} orderNumber
 * @returns {string}
 */
function orderKey(orderId, orderNumber) {
  return normalizeOptionalString(orderId) ?? `order-number:${orderNumber}`;
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardViewModel} viewModel
 * @returns {string}
 */
function renderReadyDashboard(viewModel) {
  const sections = viewModel.sections;

  return [
    `<main class="breeder-dashboard${viewModel.isEmpty ? " is-empty" : ""}" data-organization-id="${escapeAttribute(viewModel.organizationContext.organizationId)}">`,
    "  <header class=\"breeder-dashboard__header\">",
    "    <div>",
    "      <p class=\"breeder-dashboard__eyebrow\">Breeder workspace</p>",
    `      <h1>${escapeHtml(viewModel.organizationContext.organizationName)}</h1>`,
    "    </div>",
    `    <a class="breeder-dashboard__primary-link" href="${escapeAttribute(viewModel.navigation.catalogHref)}">Catalog</a>`,
    "  </header>",
    renderStatusSummary(sections.orderStatusSummary.items),
    renderListingsSection(sections.activeListings),
    renderOrdersSection(sections.myOrders),
    renderDocumentsSection(sections.recentDocuments),
    renderActionRequiredSection(sections.actionRequired),
    "</main>",
  ].join("\n");
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardLoadingViewModel} viewModel
 * @returns {string}
 */
function renderLoadingState(viewModel) {
  return [
    "<section class=\"breeder-dashboard breeder-dashboard--loading\" aria-busy=\"true\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "  <div class=\"breeder-dashboard__skeleton-grid\" aria-hidden=\"true\">",
    "    <span></span><span></span><span></span>",
    "  </div>",
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardErrorViewModel} viewModel
 * @returns {string}
 */
function renderErrorState(viewModel) {
  return [
    "<section class=\"breeder-dashboard breeder-dashboard--error\" role=\"alert\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {readonly import("./breeder-dashboard.d.ts").BreederDashboardStatusSummaryItem[]} items
 * @returns {string}
 */
function renderStatusSummary(items) {
  const visibleItems = items.filter((item) => item.count > 0);
  const body = visibleItems.length > 0
    ? visibleItems.map((item) => [
      "    <li>",
      `      <span>${escapeHtml(formatStatus(item.status))}</span>`,
      `      <strong>${item.count}</strong>`,
      "    </li>",
    ].join("\n")).join("\n")
    : "    <li><span>No orders</span><strong>0</strong></li>";

  return [
    "  <section class=\"breeder-dashboard__section breeder-dashboard__summary\" aria-labelledby=\"order-status-summary-heading\">",
    "    <h2 id=\"order-status-summary-heading\">Order status summary</h2>",
    "    <ul>",
    body,
    "    </ul>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardSection<import("./breeder-dashboard.d.ts").BreederDashboardListingCard>} section
 * @returns {string}
 */
function renderListingsSection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <table>",
      "      <thead><tr><th>Stallion</th><th>Breed</th><th>Availability</th><th>Terms</th><th>Order</th></tr></thead>",
      "      <tbody>",
      section.items.map((listing) => [
        "        <tr>",
        `          <td>${escapeHtml(listing.stallionName)}</td>`,
        `          <td>${escapeHtml(listing.breed)}</td>`,
        `          <td>${escapeHtml(formatStatus(listing.availabilityStatus))}</td>`,
        `          <td>${escapeHtml(listing.termsSummary ?? "Not specified")}</td>`,
        `          <td>${listing.createOrderHref ? `<a href="${escapeAttribute(listing.createOrderHref)}">Order</a>` : "Unavailable"}</td>`,
        "        </tr>",
      ].join("\n")).join("\n"),
      "      </tbody>",
      "    </table>",
    ].join("\n");

  return renderSection(section.title, "active-listings-heading", body);
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardSection<import("./breeder-dashboard.d.ts").BreederDashboardOrderRow>} section
 * @returns {string}
 */
function renderOrdersSection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <table>",
      "      <thead><tr><th>Order</th><th>Status</th><th>Station</th><th>Latest movement</th><th>Open</th></tr></thead>",
      "      <tbody>",
      section.items.map((order) => {
        const latest = order.statusHistory[0];

        return [
          "        <tr>",
          `          <td>${escapeHtml(order.orderNumber)}</td>`,
          `          <td>${escapeHtml(formatStatus(order.status))}</td>`,
          `          <td>${escapeHtml(order.breedingStationOrganizationId)}</td>`,
          `          <td>${latest ? `${escapeHtml(formatStatus(latest.toStatus))} at ${escapeHtml(latest.changedAt)}` : "No status history"}</td>`,
          `          <td>${renderOrderLinks(order)}</td>`,
          "        </tr>",
        ].join("\n");
      }).join("\n"),
      "      </tbody>",
      "    </table>",
    ].join("\n");

  return renderSection(section.title, "my-orders-heading", body);
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardSection<import("./breeder-dashboard.d.ts").BreederDashboardDocumentRow>} section
 * @returns {string}
 */
function renderDocumentsSection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <table>",
      "      <thead><tr><th>Document</th><th>Type</th><th>Order</th><th>Access</th><th>Status</th><th>Open</th></tr></thead>",
      "      <tbody>",
      section.items.map((document) => [
        "        <tr>",
        `          <td>${escapeHtml(document.originalFileName)}</td>`,
        `          <td>${escapeHtml(document.documentType)}</td>`,
        `          <td>${escapeHtml(document.orderNumber ?? document.targetId)}</td>`,
        `          <td>${escapeHtml(formatStatus(document.accessClassification))}</td>`,
        `          <td>${escapeHtml(formatStatus(document.status))}</td>`,
        `          <td>${document.detailHref ? `<a href="${escapeAttribute(document.detailHref)}">View</a>` : "Unavailable"}</td>`,
        "        </tr>",
      ].join("\n")).join("\n"),
      "      </tbody>",
      "    </table>",
    ].join("\n");

  return renderSection(section.title, "recent-documents-heading", body);
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardSection<import("./breeder-dashboard.d.ts").BreederDashboardActionItem>} section
 * @returns {string}
 */
function renderActionRequiredSection(section) {
  const body = section.items.length === 0
    ? renderEmptyMessage(section.emptyMessage)
    : [
      "    <ul class=\"breeder-dashboard__actions\">",
      section.items.map((item) => [
        "      <li>",
        `        <strong>${escapeHtml(item.title)}</strong>`,
        `        <span>${escapeHtml(item.orderNumber)} - ${escapeHtml(formatStatus(item.status))}</span>`,
        `        <p>${escapeHtml(item.description)}</p>`,
        `        ${item.actionHref ? `<a href="${escapeAttribute(item.actionHref)}">${escapeHtml(item.actionLabel)}</a>` : ""}`,
        "      </li>",
      ].join("\n")).join("\n"),
      "    </ul>",
    ].join("\n");

  return renderSection(section.title, "action-required-heading", body);
}

/**
 * @param {string} title
 * @param {string} headingId
 * @param {string} body
 * @returns {string}
 */
function renderSection(title, headingId, body) {
  return [
    `  <section class="breeder-dashboard__section" aria-labelledby="${escapeAttribute(headingId)}">`,
    `    <h2 id="${escapeAttribute(headingId)}">${escapeHtml(title)}</h2>`,
    body,
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./breeder-dashboard.d.ts").BreederDashboardOrderRow} order
 * @returns {string}
 */
function renderOrderLinks(order) {
  const links = [];

  if (order.detailHref) {
    links.push(`<a href="${escapeAttribute(order.detailHref)}">Details</a>`);
  }

  if (order.draftEditHref) {
    links.push(`<a href="${escapeAttribute(order.draftEditHref)}">Edit draft</a>`);
  }

  if (order.statusHistoryHref) {
    links.push(`<a href="${escapeAttribute(order.statusHistoryHref)}">History</a>`);
  }

  return links.length > 0 ? links.join(" ") : "Unavailable";
}

/**
 * @param {string} message
 * @returns {string}
 */
function renderEmptyMessage(message) {
  return `    <p class="breeder-dashboard__empty">${escapeHtml(message)}</p>`;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatStatus(value) {
  return String(value).toLowerCase().replace(/_/g, " ");
}

/**
 * @param {import("./breeder-dashboard.d.ts").SemenOrderLike} left
 * @param {import("./breeder-dashboard.d.ts").SemenOrderLike} right
 * @returns {number}
 */
function compareUpdatedDescending(left, right) {
  return compareIsoDescending(left.updatedAt ?? left.createdAt, right.updatedAt ?? right.createdAt);
}

/**
 * @param {import("./breeder-dashboard.d.ts").DocumentLike} left
 * @param {import("./breeder-dashboard.d.ts").DocumentLike} right
 * @returns {number}
 */
function compareCreatedDescending(left, right) {
  return compareIsoDescending(left.createdAt, right.createdAt);
}

/**
 * @param {import("./breeder-dashboard.d.ts").OrderStatusHistoryLike} left
 * @param {import("./breeder-dashboard.d.ts").OrderStatusHistoryLike} right
 * @returns {number}
 */
function compareStatusChangedDescending(left, right) {
  return compareIsoDescending(left.changedAt, right.changedAt);
}

/**
 * @param {string | null | undefined} left
 * @param {string | null | undefined} right
 * @returns {number}
 */
function compareIsoDescending(left, right) {
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

  return rightTime - leftTime;
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function limitOrDefault(value, fallback) {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
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
  if (value == null) {
    return null;
  }

  const normalized = normalizeRequiredString(value);

  return normalized || null;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value !== undefined && value !== null && !normalizeOptionalString(value)) {
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
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalPositiveInteger(value, fieldName, issues) {
  if (value !== undefined && (!Number.isInteger(value) || Number(value) <= 0)) {
    issues.push(`${fieldName} must be a positive integer when provided.`);
  }
}

/**
 * @param {object} object
 * @param {string} key
 * @returns {boolean}
 */
function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
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
