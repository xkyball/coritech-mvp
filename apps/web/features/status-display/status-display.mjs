import {
  ORDER_STATUS_DISPLAY,
  PAYMENT_REFERENCE_STATUSES,
  PAYMENT_STATUS_DISPLAY,
  SHIPMENT_STATUS_DISPLAY,
  VERIFICATION_STATUS_DISPLAY,
  missingConfigCodes,
} from "./status-display-registry.mjs";

const ORDER_STATUS_CODES = /** @type {const} */ ([
  "DRAFT",
  "SUBMITTED",
  "RECEIVED",
  "CONFIRMED",
  "REJECTED",
  "IN_FULFILMENT",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);
const SHIPMENT_STATUS_CODES = /** @type {const} */ ([
  "PREPARED",
  "DISPATCHED",
  "IN_TRANSIT",
  "DELIVERED",
  "DELAYED",
  "FAILED",
  "CANCELLED",
]);
const ACTIVE_PHASE_1_VERIFICATION_LEVEL_CODES = /** @type {const} */ ([
  "SELF_REPORTED",
  "SYSTEM_RECORDED",
  "STATION_CONFIRMED",
  "ADMIN_REVIEWED",
]);

export {
  ORDER_STATUS_DISPLAY,
  PAYMENT_REFERENCE_STATUSES,
  PAYMENT_STATUS_DISPLAY,
  SHIPMENT_STATUS_DISPLAY,
  STATUS_DISPLAY_CONFIG,
  STATUS_DISPLAY_KINDS,
  VERIFICATION_STATUS_DISPLAY,
  formatStatusDisplayLabel,
  getStatusBadgeTone,
  getStatusBadgeViewModel,
  getStatusDescription,
  getStatusDisplayConfig,
  getStatusNextActionHint,
  listStatusDisplayOptions,
} from "./status-display-registry.mjs";

/**
 * @returns {import("./status-display.d.ts").StatusDisplayCompletenessReport}
 */
export function validateStatusDisplayCompleteness() {
  return Object.freeze({
    order: missingConfigCodes(ORDER_STATUS_CODES, ORDER_STATUS_DISPLAY),
    shipment: missingConfigCodes(SHIPMENT_STATUS_CODES, SHIPMENT_STATUS_DISPLAY),
    payment: missingConfigCodes(PAYMENT_REFERENCE_STATUSES, PAYMENT_STATUS_DISPLAY),
    verification: missingConfigCodes(
      ACTIVE_PHASE_1_VERIFICATION_LEVEL_CODES,
      VERIFICATION_STATUS_DISPLAY,
    ),
  });
}
