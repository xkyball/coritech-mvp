// @ts-check

export const OPERATIONAL_REPORTING_ORDER_STATUSES = /** @type {const} */ ([
  "SUBMITTED",
  "CONFIRMED",
  "REJECTED",
  "COMPLETED",
]);

export const DOCUMENTATION_ELIGIBLE_ORDER_STATUSES = /** @type {const} */ ([
  "SUBMITTED",
  "RECEIVED",
  "CONFIRMED",
  "REJECTED",
  "IN_FULFILMENT",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
]);

/**
 * @param {import("./operational-reporting.d.ts").OperationalReportingInput} input
 * @returns {import("./operational-reporting.d.ts").OperationalReportingViewModel}
 */
export function createOperationalReportingViewModel(input) {
  const orders = input.orders ?? [];
  const statusHistory = input.orderStatusHistory ?? [];
  const documents = input.documents ?? [];
  const proofEvents = input.proofEvents ?? [];
  const shipments = input.shipments ?? [];
  const orderStatusCounts = countRequiredOrderStatuses(orders);
  const confirmationTiming = calculateAverageTimeToConfirmation({
    orders,
    statusHistory,
  });
  const documentationCompletion = calculateDocumentationCompletion({
    documents,
    orders,
  });

  return Object.freeze({
    generatedAt: toIsoTimestamp(input.generatedAt ?? new Date()),
    metrics: Object.freeze([
      metric(
        "activeListings",
        "Active listings",
        input.activeListingCount ?? 0,
        "Orderable active or limited listings.",
      ),
      metric(
        "submittedOrders",
        "Submitted orders",
        orderStatusCounts.SUBMITTED,
        "Orders waiting on station intake or review.",
      ),
      metric(
        "confirmedOrders",
        "Confirmed orders",
        orderStatusCounts.CONFIRMED,
        "Orders accepted by the assigned breeding station.",
      ),
      metric(
        "rejectedOrders",
        "Rejected orders",
        orderStatusCounts.REJECTED,
        "Orders rejected through the controlled workflow.",
      ),
      metric(
        "completedOrders",
        "Completed orders",
        orderStatusCounts.COMPLETED,
        "Orders completed in the operational workflow.",
      ),
      metric(
        "shipments",
        "Shipments",
        shipments.length,
        "Shipment records linked to semen orders.",
      ),
      metric(
        "uploadedDocuments",
        "Uploaded documents",
        documents.length,
        "Controlled document evidence records.",
      ),
      metric(
        "proofEvents",
        "Proof events",
        proofEvents.length,
        "Workflow proof events recorded in the proof layer.",
      ),
      metric(
        "documentationCompletionRate",
        "Documentation completion",
        documentationCompletion.rate,
        `${documentationCompletion.documentedOrderCount} of ${documentationCompletion.eligibleOrderCount} eligible orders have at least one document.`,
        {
          displayValue: documentationCompletion.displayValue,
        },
      ),
      metric(
        "averageTimeToConfirmation",
        "Avg. time to confirmation",
        confirmationTiming.averageHours,
        `${confirmationTiming.sampleSize} confirmed order${confirmationTiming.sampleSize === 1 ? "" : "s"} with submitted and confirmed history.`,
        {
          displayValue: confirmationTiming.displayValue,
        },
      ),
    ]),
    orderStatusCounts,
    averageTimeToConfirmation: confirmationTiming,
    documentationCompletion,
  });
}

/**
 * @param {{
 *   orders: readonly import("@coritech/domain/orders/semen-order.d.ts").SemenOrder[],
 *   statusHistory: readonly import("@coritech/domain/orders/semen-order.d.ts").OrderStatusHistory[],
 * }} input
 * @returns {import("./operational-reporting.d.ts").AverageTimeToConfirmationMetric}
 */
export function calculateAverageTimeToConfirmation(input) {
  const orderIds = new Set(input.orders.map((order) => order.id).filter(Boolean));
  const historiesByOrderId = groupStatusHistoryByOrder(input.statusHistory);
  const durations = [];

  for (const orderId of orderIds) {
    const history = historiesByOrderId.get(orderId) ?? [];
    const submitted = history.find((item) => item.toStatus === "SUBMITTED");
    const confirmed = history.find((item) => item.toStatus === "CONFIRMED");

    if (!submitted || !confirmed) {
      continue;
    }

    const submittedAt = Date.parse(submitted.changedAt);
    const confirmedAt = Date.parse(confirmed.changedAt);

    if (Number.isFinite(submittedAt) && Number.isFinite(confirmedAt) && confirmedAt >= submittedAt) {
      durations.push((confirmedAt - submittedAt) / 36e5);
    }
  }

  const averageHours = durations.length === 0
    ? null
    : roundToOneDecimal(durations.reduce((sum, value) => sum + value, 0) / durations.length);

  return Object.freeze({
    averageHours,
    displayValue: averageHours == null ? "Not enough data" : `${averageHours}h`,
    sampleSize: durations.length,
  });
}

/**
 * @param {{
 *   orders: readonly import("@coritech/domain/orders/semen-order.d.ts").SemenOrder[],
 *   documents: readonly import("@coritech/domain/documents/document-evidence.d.ts").Document[],
 * }} input
 * @returns {import("./operational-reporting.d.ts").DocumentationCompletionMetric}
 */
export function calculateDocumentationCompletion(input) {
  const eligibleOrderIds = input.orders
    .filter((order) =>
      DOCUMENTATION_ELIGIBLE_ORDER_STATUSES.includes(
        /** @type {import("./operational-reporting.d.ts").DocumentationEligibleOrderStatus} */ (
          order.status
        ),
      )
    )
    .map((order) => order.id)
    .filter(Boolean);
  const eligibleOrderIdSet = new Set(eligibleOrderIds);
  const documentedOrderIds = new Set(
    input.documents
      .map((document) => document.semenOrderId)
      .filter((orderId) => Boolean(orderId && eligibleOrderIdSet.has(orderId))),
  );
  const rate = eligibleOrderIds.length === 0
    ? null
    : Math.round((documentedOrderIds.size / eligibleOrderIds.length) * 100);

  return Object.freeze({
    documentedOrderCount: documentedOrderIds.size,
    eligibleOrderCount: eligibleOrderIds.length,
    rate,
    displayValue: rate == null ? "Not enough data" : `${rate}%`,
  });
}

/**
 * @param {readonly import("@coritech/domain/orders/semen-order.d.ts").SemenOrder[]} orders
 * @returns {Record<import("./operational-reporting.d.ts").OperationalReportingOrderStatus, number>}
 */
function countRequiredOrderStatuses(orders) {
  return Object.freeze(
    Object.fromEntries(
      OPERATIONAL_REPORTING_ORDER_STATUSES.map((status) => [
        status,
        orders.filter((order) => order.status === status).length,
      ]),
    ),
  );
}

/**
 * @param {string} key
 * @param {string} label
 * @param {number | null} value
 * @param {string} meta
 * @param {{ displayValue?: string }} [options]
 */
function metric(key, label, value, meta, options = {}) {
  return Object.freeze({
    key,
    label,
    value,
    displayValue: options.displayValue ?? (value == null ? "Not enough data" : String(value)),
    meta,
  });
}

/**
 * @param {readonly import("@coritech/domain/orders/semen-order.d.ts").OrderStatusHistory[]} statusHistory
 */
function groupStatusHistoryByOrder(statusHistory) {
  const grouped = new Map();

  for (const item of [...statusHistory].sort((left, right) =>
    Date.parse(left.changedAt) - Date.parse(right.changedAt)
  )) {
    const current = grouped.get(item.semenOrderId) ?? [];
    current.push(item);
    grouped.set(item.semenOrderId, current);
  }

  return grouped;
}

/**
 * @param {number} value
 */
function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}
