// @ts-check

import {
  OrderActivityAuthorizationError,
  OrderActivityValidationError,
  canCreateOrderActivity,
  createOrderActivity,
  createOrderActivityFeed,
} from "@coritech/domain/orders/order-activity.mjs";

export const ORDER_ACTIVITY_DEFAULT_TITLE = "Order activity";

/**
 * @param {import("./order-activity.d.ts").OrderActivityPanelInput} input
 * @returns {import("./order-activity.d.ts").OrderActivityPanelViewModel}
 */
export function createOrderActivityPanelViewModel(input) {
  const title = normalizeOptionalString(input.title) ?? ORDER_ACTIVITY_DEFAULT_TITLE;
  const feedItems = createOrderActivityFeed({
    actor: input.actor,
    order: input.order,
    activities: input.activities ?? [],
    statusHistory: input.statusHistory ?? [],
  });

  return Object.freeze({
    title,
    emptyMessage: normalizeOptionalString(input.emptyMessage) ??
      "No comments have been recorded for this order.",
    items: Object.freeze(feedItems.map(toPanelRow)),
    comment: Object.freeze({
      canAdd: canCreateOrderActivity({
        actor: input.actor,
        order: input.order,
        type: "USER_COMMENT",
        visibility: "SHARED",
      }),
      orderId: normalizeOptionalString(input.order.id) ?? input.order.orderNumber,
      label: "Add comment",
      fieldLabel: "Shared comment",
      placeholder: "Add order context for the breeder and station",
    }),
  });
}

/**
 * @param {import("./order-activity.d.ts").AddSharedOrderCommentInput} input
 * @returns {Promise<import("./order-activity.d.ts").OrderActivityCommentResult>}
 */
export async function addSharedOrderComment(input) {
  try {
    const activity = await createOrderActivity({
      ...input,
      type: "USER_COMMENT",
      visibility: "SHARED",
    });

    return Object.freeze({
      ok: true,
      activity,
    });
  } catch (error) {
    if (
      error instanceof OrderActivityAuthorizationError ||
      error instanceof OrderActivityValidationError
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
 * @param {import("./order-activity.d.ts").OrderActivityPanelInput | import("./order-activity.d.ts").OrderActivityPanelViewModel} input
 * @returns {string}
 */
export function renderOrderActivityPanel(input) {
  const viewModel = "items" in input ? input : createOrderActivityPanelViewModel(input);
  const rows = viewModel.items.length > 0
    ? viewModel.items.map((item) =>
      `<li><strong>${escapeHtml(item.label)}</strong> ${escapeHtml(item.message)} <span>${escapeHtml(item.actorLabel)}</span> <time>${escapeHtml(item.createdAt)}</time></li>`
    ).join("")
    : `<li>${escapeHtml(viewModel.emptyMessage)}</li>`;

  return `<section class="order-activity"><h2>${escapeHtml(viewModel.title)}</h2><ol>${rows}</ol></section>`;
}

/**
 * @param {import("@coritech/domain/orders/order-activity.d.ts").OrderActivityVisibility} value
 */
export function formatOrderActivityVisibility(value) {
  if (value === "SHARED") {
    return "Shared";
  }

  if (value === "STATION_INTERNAL") {
    return "Station internal";
  }

  return "Admin internal";
}

/**
 * @param {import("@coritech/domain/orders/order-activity.d.ts").OrderActivityFeedItem} item
 * @returns {import("./order-activity.d.ts").OrderActivityPanelRow}
 */
function toPanelRow(item) {
  return Object.freeze({
    ...item,
    actorLabel: formatRoleLabel(item.actorRoleCode),
    organizationLabel: item.actorOrganizationId ?? "Organization not recorded",
    visibilityLabel: formatOrderActivityVisibility(item.visibility),
  });
}

/**
 * @param {import("@coritech/domain/orders/order-activity.d.ts").OrderActivityValidationError | import("@coritech/domain/orders/order-activity.d.ts").OrderActivityAuthorizationError} error
 * @returns {readonly string[]}
 */
function errorToIssues(error) {
  if ("issues" in error && Array.isArray(error.issues)) {
    return error.issues;
  }

  return [error.message];
}

/**
 * @param {unknown} value
 */
function formatRoleLabel(value) {
  return String(value ?? "system")
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
 * @param {unknown} value
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
