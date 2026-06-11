// @ts-check

import { SEMEN_ORDER_STATUSES } from "@coritech/domain/orders/semen-order.mjs";
import { SHIPMENT_STATUSES } from "@coritech/domain/shipments/shipment.mjs";
import {
  ACTIVE_PHASE_1_VERIFICATION_LEVELS,
} from "@coritech/domain/proof/verification-level.mjs";

import {
  ORDER_STATUS_DISPLAY,
  PAYMENT_REFERENCE_STATUSES,
  PAYMENT_STATUS_DISPLAY,
  SHIPMENT_STATUS_DISPLAY,
  VERIFICATION_STATUS_DISPLAY,
  missingConfigCodes,
} from "./status-display-registry.mjs";

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
    order: missingConfigCodes(SEMEN_ORDER_STATUSES, ORDER_STATUS_DISPLAY),
    shipment: missingConfigCodes(SHIPMENT_STATUSES, SHIPMENT_STATUS_DISPLAY),
    payment: missingConfigCodes(PAYMENT_REFERENCE_STATUSES, PAYMENT_STATUS_DISPLAY),
    verification: missingConfigCodes(
      ACTIVE_PHASE_1_VERIFICATION_LEVELS,
      VERIFICATION_STATUS_DISPLAY,
    ),
  });
}
