// @ts-check

import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import { createOrderActivityPanelViewModel } from "../order-activity/order-activity.mjs";
import { createProofTimelineViewModel } from "../proof-timeline/proof-timeline.mjs";
import {
  buildTableListHref,
  normalizeTableListQuery,
  paginateTableItems,
} from "../table-list/table-list.mjs";

export const ADMIN_ORDER_SUPPORT_ROUTES = Object.freeze({
  search: "/app/admin/orders",
  audit: "/app/admin/audit",
  amendmentStart: "/app/admin/amendments/new",
});

const DEFAULT_PAGE_SIZE = 25;
const ADMIN_ORDER_ALLOWED_SORTS = Object.freeze([
  "updatedAt",
  "orderNumber",
  "status",
]);

/**
 * @param {import("./admin-order-support.d.ts").AdminOrderSupportActorContext} actor
 * @returns {boolean}
 */
export function canAccessAdminOrderSupport(actor) {
  return Boolean(actor?.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {import("./admin-order-support.d.ts").AdminOrderSupportSearchInput} input
 * @returns {import("./admin-order-support.d.ts").AdminOrderSupportSearchViewModel}
 */
export function createAdminOrderSupportSearchViewModel(input) {
  const filters = normalizeSearchFilters(input.filters ?? {});
  const organizationById = buildOrganizationById(input.organizations ?? []);
  const filteredOrders = input.orders.filter((order) =>
    matchesSearchFilters(order, filters, organizationById)
  );
  const sortedOrders = sortOrders(filteredOrders, filters, organizationById);
  const pagination = paginateTableItems(sortedOrders, filters.page, filters.pageSize);

  return Object.freeze({
    state: "READY",
    routes: ADMIN_ORDER_SUPPORT_ROUTES,
    organizationContext: Object.freeze({
      organizationId: input.actor.organizationId,
      organizationName: input.actor.organizationName,
      roleLabel: "Platform Admin",
    }),
    filters,
    rows: Object.freeze(
      pagination.items.map((order) =>
        toSearchRow(order, organizationById)
      ),
    ),
    pagination: Object.freeze({
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalItems: filteredOrders.length,
      totalPages: pagination.totalPages,
      hasNextPage: pagination.page < pagination.totalPages,
      hasPreviousPage: pagination.page > 1,
      previousHref: buildAdminOrderSupportHref(filters, {
        page: Math.max(1, pagination.page - 1),
      }),
      nextHref: buildAdminOrderSupportHref(filters, {
        page: pagination.page + 1,
      }),
      firstHref: buildAdminOrderSupportHref(filters, {
        page: 1,
      }),
    }),
  });
}

/**
 * @param {import("./admin-order-support.d.ts").AdminOrderSupportDetailInput} input
 * @returns {import("./admin-order-support.d.ts").AdminOrderSupportDetailViewModel}
 */
export function createAdminOrderSupportDetailViewModel(input) {
  const organizationById = buildOrganizationById(input.organizations ?? []);
  const order = input.order;
  const orderId = order.id ?? "";
  const proofTimeline = createProofTimelineViewModel({
    title: "Proof timeline",
    emptyMessage: "No proof events have been recorded for this order.",
    orderId,
    orderNumber: order.orderNumber,
    proofEvents: input.proofEvents,
    documents: input.documents,
  });
  const activity = createOrderActivityPanelViewModel({
    actor: input.actor,
    order,
    activities: input.orderActivities ?? [],
    statusHistory: input.statusHistory,
    emptyMessage: "No comments have been recorded for this order.",
  });

  return Object.freeze({
    state: "READY",
    routes: ADMIN_ORDER_SUPPORT_ROUTES,
    organizationContext: Object.freeze({
      organizationId: input.actor.organizationId,
      organizationName: input.actor.organizationName,
      roleLabel: "Platform Admin",
    }),
    order: Object.freeze({
      ...toSearchRow(order, organizationById),
      requestedDeliveryDate: order.requestedDeliveryDate,
      mareName: order.mareName,
      mareRegistrationReference: order.mareRegistrationReference,
      mareBreed: order.mareBreed,
      mareOwnerName: order.mareOwnerName,
      intendedInseminationContext: order.intendedInseminationContext,
      vetOrRecipientContact: order.vetOrRecipientContact,
      shippingContactName: order.shippingContactName,
      shippingContactPhone: order.shippingContactPhone,
      shippingDestination: formatShippingDestination(order),
      specialInstructions: order.specialInstructions,
    }),
    statusHistory: Object.freeze(input.statusHistory),
    proofTimeline,
    shipments: Object.freeze(input.shipments),
    shipmentTrackingEvents: Object.freeze(input.shipmentTrackingEvents),
    documents: Object.freeze(input.documents),
    activity,
    auditLogs: Object.freeze(input.auditLogs),
    auditHref: buildAuditHref(orderId),
    amendmentHref: buildAmendmentHref(order),
    canSilentlyOverwriteProofCriticalFields: false,
    notImplementedContext: Object.freeze({
      paymentAvailable: true,
      commentsAvailable: true,
      supportNotesAvailable: false,
    }),
  });
}

/**
 * @param {{
 *   actor: import("./admin-order-support.d.ts").AdminOrderSupportActorContext,
 *   order: import("@coritech/domain/orders/semen-order.d.ts").SemenOrder,
 *   handlerName?: string,
 *   now?: string | Date,
 * }} input
 * @returns {import("@coritech/domain/auth/rbac-middleware.d.ts").RbacAccessDecision}
 */
export function createAdminOrderSupportAccessDecision(input) {
  return Object.freeze({
    outcome: "ALLOW",
    allowed: true,
    status: null,
    action: "VIEW_SEMEN_ORDER",
    actorUserId: input.actor.userId,
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: input.actor.organizationId,
    targetType: "SemenOrder",
    targetId: input.order.id,
    targetRef: Object.freeze({
      orderNumber: input.order.orderNumber,
      breederOrganizationId: input.order.breederOrganizationId,
      breedingStationOrganizationId: input.order.breedingStationOrganizationId,
    }),
    handlerName: input.handlerName ?? "adminOrderSupportDetail",
    reason: "Platform admin opened the order support view.",
    deferred: false,
    occurredAt: toIsoTimestamp(input.now ?? new Date()),
  });
}

/**
 * @param {Record<string, unknown>} input
 * @returns {import("./admin-order-support.d.ts").AdminOrderSupportFilters}
 */
export function normalizeSearchFilters(input) {
  const query = normalizeTableListQuery(input, {
    allowedFilters: ["status"],
    allowedSorts: ADMIN_ORDER_ALLOWED_SORTS,
    defaultDirection: "desc",
    defaultPageSize: DEFAULT_PAGE_SIZE,
    defaultSort: "updatedAt",
    maxPageSize: 100,
  });

  return Object.freeze({
    query: query.query,
    status: query.filters.status ?? "",
    page: query.page,
    pageSize: query.pageSize,
    sort: query.sort ?? "updatedAt",
    direction: query.direction,
  });
}

/**
 * @param {import("./admin-order-support.d.ts").AdminOrderSupportFilters} filters
 * @param {Partial<import("./admin-order-support.d.ts").AdminOrderSupportFilters>} [override]
 * @returns {string}
 */
export function buildAdminOrderSupportHref(filters, override = {}) {
  const nextFilters = normalizeSearchFilters({
    ...filters,
    ...override,
  });

  return buildTableListHref({
    basePath: ADMIN_ORDER_SUPPORT_ROUTES.search,
    query: {
      query: nextFilters.query,
      page: nextFilters.page,
      pageSize: nextFilters.pageSize,
      sort: nextFilters.sort,
      direction: nextFilters.direction,
      filters: {
        status: nextFilters.status,
      },
    },
  });
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrder} order
 * @returns {string}
 */
function buildAmendmentHref(order) {
  const params = new URLSearchParams({
    targetType: "SemenOrder",
    targetId: order.id ?? "",
    orderNumber: order.orderNumber,
    returnTo: `${ADMIN_ORDER_SUPPORT_ROUTES.search}/${order.id ?? ""}`,
  });

  return `${ADMIN_ORDER_SUPPORT_ROUTES.amendmentStart}?${params.toString()}`;
}

/**
 * @param {string} orderId
 * @returns {string}
 */
function buildAuditHref(orderId) {
  const params = new URLSearchParams({
    objectType: "SemenOrder",
    objectId: orderId,
  });

  return `${ADMIN_ORDER_SUPPORT_ROUTES.audit}?${params.toString()}`;
}

/**
 * @param {readonly import("./admin-order-support.d.ts").AdminOrderSupportOrganization[]} organizations
 */
function buildOrganizationById(organizations) {
  return new Map(organizations.map((organization) => [
    organization.organizationId,
    organization.name,
  ]));
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrder} order
 * @param {import("./admin-order-support.d.ts").AdminOrderSupportFilters} filters
 * @param {Map<string, string>} organizationById
 * @returns {boolean}
 */
function matchesSearchFilters(order, filters, organizationById) {
  if (filters.status && order.status !== filters.status) {
    return false;
  }

  if (!filters.query) {
    return true;
  }

  const query = filters.query.toLowerCase();
  const searchable = [
    order.orderNumber,
    order.id,
    order.breederOrganizationId,
    order.breedingStationOrganizationId,
    organizationById.get(order.breederOrganizationId),
    organizationById.get(order.breedingStationOrganizationId),
    order.status,
  ].filter(Boolean).join(" ").toLowerCase();

  return searchable.includes(query);
}

/**
 * @param {readonly import("@coritech/domain/orders/semen-order.d.ts").SemenOrder[]} orders
 * @param {import("./admin-order-support.d.ts").AdminOrderSupportFilters} filters
 * @param {Map<string, string>} organizationById
 * @returns {import("@coritech/domain/orders/semen-order.d.ts").SemenOrder[]}
 */
function sortOrders(orders, filters, organizationById) {
  const direction = filters.direction === "asc" ? 1 : -1;

  return [...orders].sort((left, right) => {
    const compared = compareSortValue(
      sortValue(left, filters.sort, organizationById),
      sortValue(right, filters.sort, organizationById),
    );

    if (compared !== 0) {
      return compared * direction;
    }

    return left.orderNumber.localeCompare(right.orderNumber);
  });
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrder} order
 * @param {string} sort
 * @param {Map<string, string>} organizationById
 * @returns {string}
 */
function sortValue(order, sort, organizationById) {
  switch (sort) {
    case "orderNumber":
      return order.orderNumber;
    case "status":
      return order.status;
    case "updatedAt":
      return order.updatedAt;
    default:
      return organizationById.get(order.breederOrganizationId) ?? order.orderNumber;
  }
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
function compareSortValue(left, right) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);

  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) {
    return leftTime - rightTime;
  }

  return left.localeCompare(right);
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrder} order
 * @param {Map<string, string>} organizationById
 * @returns {import("./admin-order-support.d.ts").AdminOrderSupportSearchRow}
 */
function toSearchRow(order, organizationById) {
  return Object.freeze({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    breederOrganizationId: order.breederOrganizationId,
    breederOrganizationName:
      organizationById.get(order.breederOrganizationId) ??
      order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    breedingStationOrganizationName:
      organizationById.get(order.breedingStationOrganizationId) ??
      order.breedingStationOrganizationId,
    updatedAt: order.updatedAt,
    detailHref: `${ADMIN_ORDER_SUPPORT_ROUTES.search}/${order.id ?? ""}`,
  });
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrder} order
 * @returns {string}
 */
function formatShippingDestination(order) {
  return [
    order.shippingAddressLine1,
    order.shippingAddressLine2,
    order.shippingCity,
    order.shippingRegion,
    order.shippingPostalCode,
    order.shippingCountry,
  ].filter(Boolean).join(", ") || "Not recorded";
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}
