// @ts-check

import {
  SUPPORT_REQUEST_CATEGORIES,
  SUPPORT_REQUEST_STATUSES,
  SupportRequestAuthorizationError,
  SupportRequestValidationError,
  canCreateSupportRequest,
  canListAdminSupportRequests,
  createSupportRequest,
} from "@coritech/domain/support/support-request.mjs";

export const SUPPORT_REQUEST_ROUTES = Object.freeze({
  adminQueue: "/app/admin/support",
});

/**
 * @param {import("./support-requests.d.ts").SupportRequestFormInput} input
 * @returns {import("./support-requests.d.ts").SupportRequestFormViewModel}
 */
export function createSupportRequestFormViewModel(input) {
  return Object.freeze({
    title: "Request support",
    orderId: normalizeOptionalString(input.order.id) ?? input.order.orderNumber,
    orderNumber: input.order.orderNumber,
    canSubmit: canCreateSupportRequest(input.actor, input.order),
    confirmation: normalizeOptionalString(input.confirmation),
    categories: Object.freeze(SUPPORT_REQUEST_CATEGORIES.map(toCategoryOption)),
  });
}

/**
 * @param {import("./support-requests.d.ts").SubmitSupportRequestInput} input
 * @returns {Promise<import("./support-requests.d.ts").SubmitSupportRequestResult>}
 */
export async function submitSupportRequest(input) {
  try {
    const result = await createSupportRequest(input);

    return Object.freeze({
      ok: true,
      result,
    });
  } catch (error) {
    if (
      error instanceof SupportRequestAuthorizationError ||
      error instanceof SupportRequestValidationError
    ) {
      return Object.freeze({
        ok: false,
        issues: Object.freeze(errorToIssues(error)),
      });
    }

    throw error;
  }
}

/**
 * @param {import("./support-requests.d.ts").AdminSupportQueueInput} input
 * @returns {import("./support-requests.d.ts").AdminSupportQueueViewModel}
 */
export function createAdminSupportQueueViewModel(input) {
  const status = normalizeOptionalString(input.filters?.status) ?? "";
  const category = normalizeOptionalString(input.filters?.category) ?? "";
  const rows = input.supportRequests
    .filter((request) => !status || request.status === status)
    .filter((request) => !category || request.category === category)
    .sort(compareUpdatedDescending)
    .map(toQueueRow);

  return Object.freeze({
    title: "Support requests",
    canAccess: canListAdminSupportRequests(input.actor),
    filters: Object.freeze({
      status,
      category,
    }),
    categories: Object.freeze(SUPPORT_REQUEST_CATEGORIES.map(toCategoryOption)),
    statuses: Object.freeze(SUPPORT_REQUEST_STATUSES.map(toStatusOption)),
    rows: Object.freeze(rows),
    emptyMessage: "No support requests match the current filters.",
  });
}

/**
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequestCategory | string} value
 */
export function formatSupportRequestCategory(value) {
  return formatLabel(value);
}

/**
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequestStatus | string} value
 */
export function formatSupportRequestStatus(value) {
  return formatLabel(value);
}

/**
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequestCategory} category
 * @returns {import("./support-requests.d.ts").SupportRequestCategoryOption}
 */
function toCategoryOption(category) {
  return Object.freeze({
    value: category,
    label: formatSupportRequestCategory(category),
  });
}

/**
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequestStatus} status
 * @returns {import("./support-requests.d.ts").SupportRequestStatusOption}
 */
function toStatusOption(status) {
  return Object.freeze({
    value: status,
    label: formatSupportRequestStatus(status),
  });
}

/**
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequest} request
 * @returns {import("./support-requests.d.ts").AdminSupportQueueRow}
 */
function toQueueRow(request) {
  const orderNumber = typeof request.objectRef.orderNumber === "string"
    ? request.objectRef.orderNumber
    : request.objectId;

  return Object.freeze({
    id: request.id,
    objectType: request.objectType,
    objectId: request.objectId,
    orderNumber,
    category: request.category,
    categoryLabel: formatSupportRequestCategory(request.category),
    status: request.status,
    statusLabel: formatSupportRequestStatus(request.status),
    message: request.message,
    createdByUserId: request.createdByUserId,
    createdByOrganizationId: request.createdByOrganizationId,
    createdByRole: request.createdByRole,
    adminNotificationStatus: request.adminNotificationStatus,
    createdAt: request.createdAt,
    detailHref: `/app/admin/orders/${encodeURIComponent(request.objectId)}`,
  });
}

/**
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequest} left
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequest} right
 */
function compareUpdatedDescending(left, right) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

/**
 * @param {import("@coritech/domain/support/support-request.d.ts").SupportRequestValidationError | import("@coritech/domain/support/support-request.d.ts").SupportRequestAuthorizationError} error
 */
function errorToIssues(error) {
  if ("issues" in error && Array.isArray(error.issues)) {
    return error.issues;
  }

  return [error.message];
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

function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}
