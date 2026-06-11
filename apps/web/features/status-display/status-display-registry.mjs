// @ts-check

export const PAYMENT_REFERENCE_STATUSES = /** @type {const} */ ([
  "NOT_REQUIRED",
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

export const STATUS_DISPLAY_KINDS = /** @type {const} */ ([
  "order",
  "shipment",
  "payment",
  "verification",
]);

export const ORDER_STATUS_DISPLAY = buildStatusMap([
  status("DRAFT", "Draft", "Saved by the breeder and not yet submitted to the station.", "warning", {
    BREEDER: "Review and submit the draft when ready.",
  }),
  status("SUBMITTED", "Submitted", "Submitted by the breeder and awaiting station intake.", "info", {
    BREEDING_STATION: "Receive the order or cancel where the workflow allows.",
    BREEDER: "Wait for station review.",
  }),
  status("RECEIVED", "Received", "Received by the breeding station for operational review.", "warning", {
    BREEDING_STATION: "Confirm or reject the received order.",
    BREEDER: "Wait for the station decision.",
  }),
  status("CONFIRMED", "Confirmed", "Confirmed by the station and ready for fulfilment planning.", "success", {
    BREEDING_STATION: "Prepare fulfilment and create shipment evidence where needed.",
    BREEDER: "Review station confirmation and next steps.",
  }),
  status("REJECTED", "Rejected", "Rejected by the station with an auditable reason.", "danger", {
    BREEDER: "Review the station response and decide the next operational step.",
  }),
  status("IN_FULFILMENT", "In fulfilment", "Confirmed order is being prepared by the station.", "info", {
    BREEDING_STATION: "Continue fulfilment and shipment preparation.",
    BREEDER: "Track fulfilment progress.",
  }),
  status("SHIPPED", "Shipped", "Shipment has left the station workflow.", "info", {
    BREEDER: "Track shipment progress.",
    BREEDING_STATION: "Keep shipment tracking evidence current.",
  }),
  status("DELIVERED", "Delivered", "Shipment has been marked delivered.", "success", {
    BREEDER: "Confirm receipt where applicable.",
  }),
  status("COMPLETED", "Completed", "Order workflow is complete for Phase 1 operations.", "success"),
  status("CANCELLED", "Cancelled", "Order workflow was cancelled with an auditable reason.", "neutral"),
]);

export const SHIPMENT_STATUS_DISPLAY = buildStatusMap([
  status("PREPARED", "Prepared", "Shipment record exists and is ready for dispatch.", "info", {
    BREEDING_STATION: "Add dispatch or tracking updates when available.",
  }),
  status("DISPATCHED", "Dispatched", "Shipment has been dispatched by the station.", "info", {
    BREEDING_STATION: "Keep tracking evidence current.",
    BREEDER: "Track shipment progress.",
  }),
  status("IN_TRANSIT", "In transit", "Shipment is moving through the delivery workflow.", "warning", {
    BREEDING_STATION: "Update tracking if status changes.",
    BREEDER: "Confirm receipt once material is checked.",
  }),
  status("DELIVERED", "Delivered", "Shipment was marked delivered.", "success", {
    BREEDER: "Confirm receipt where applicable.",
  }),
  status("DELAYED", "Delayed", "Shipment has a delay that needs operational attention.", "warning", {
    BREEDING_STATION: "Record the latest tracking update.",
  }),
  status("FAILED", "Failed", "Shipment failed and needs operational follow-up outside automated logistics.", "danger", {
    BREEDING_STATION: "Review and record the corrective next step.",
  }),
  status("CANCELLED", "Cancelled", "Shipment workflow was cancelled.", "neutral"),
]);

export const PAYMENT_STATUS_DISPLAY = buildStatusMap([
  status("NOT_REQUIRED", "Not required", "No payment reference is required for this Phase 1 order.", "neutral"),
  status("PENDING", "Pending", "Payment reference exists but is not yet authorized or paid.", "warning", {
    BREEDING_STATION: "Update the manual reference when evidence changes.",
    PLATFORM_ADMIN: "Review reference evidence if support is needed.",
  }),
  status("AUTHORIZED", "Authorized", "Payment was authorized by an external reference, not stored card data.", "info", {
    BREEDING_STATION: "Update to paid when settlement evidence is available.",
    PLATFORM_ADMIN: "Review reference evidence if support is needed.",
  }),
  status("PAID", "Paid", "Payment reference is marked paid based on external evidence.", "success"),
  status("FAILED", "Failed", "Payment reference failed or could not be completed externally.", "danger", {
    BREEDING_STATION: "Update or replace the manual reference where allowed.",
    PLATFORM_ADMIN: "Support the manual reference correction flow.",
  }),
  status("REFUNDED", "Refunded", "Payment reference was refunded externally.", "neutral"),
]);

export const VERIFICATION_STATUS_DISPLAY = buildStatusMap([
  status(
    "SELF_REPORTED",
    "Self reported",
    "A breeder-entered or participant-entered workflow fact that has not been confirmed by the station or reviewed by an admin.",
    "neutral",
  ),
  status(
    "SYSTEM_RECORDED",
    "System recorded",
    "A CoriTech workflow event captured by the application from an allowed order, shipment or document action.",
    "info",
  ),
  status(
    "STATION_CONFIRMED",
    "Station confirmed",
    "A workflow fact confirmed by the breeding station in its assigned operational role.",
    "success",
  ),
  status(
    "ADMIN_REVIEWED",
    "Admin reviewed",
    "A Phase 1 platform-admin review or correction recorded through approved support workflows.",
    "accent",
  ),
]);

export const STATUS_DISPLAY_CONFIG = Object.freeze({
  order: ORDER_STATUS_DISPLAY,
  shipment: SHIPMENT_STATUS_DISPLAY,
  payment: PAYMENT_STATUS_DISPLAY,
  verification: VERIFICATION_STATUS_DISPLAY,
});

/**
 * @param {import("./status-display.d.ts").StatusDisplayKind} kind
 * @param {unknown} value
 * @returns {import("./status-display.d.ts").StatusDisplayConfig | null}
 */
export function getStatusDisplayConfig(kind, value) {
  const code = normalizeStatusCode(value);

  if (!code || !hasOwn(STATUS_DISPLAY_CONFIG, kind)) {
    return null;
  }

  return STATUS_DISPLAY_CONFIG[kind][code] ?? null;
}

/**
 * @param {unknown} value
 * @param {import("./status-display.d.ts").StatusDisplayKind} [kind]
 * @returns {string}
 */
export function formatStatusDisplayLabel(value, kind) {
  const config = kind ? getStatusDisplayConfig(kind, value) : findStatusDisplayConfig(value);

  return config?.label ?? fallbackLabel(value);
}

/**
 * @param {unknown} value
 * @param {import("./status-display.d.ts").StatusDisplayKind} [kind]
 * @returns {import("./status-display.d.ts").StatusDisplayTone}
 */
export function getStatusBadgeTone(value, kind) {
  const config = kind ? getStatusDisplayConfig(kind, value) : findStatusDisplayConfig(value);

  return config?.tone ?? fallbackTone(value);
}

/**
 * @param {unknown} value
 * @param {import("./status-display.d.ts").StatusDisplayKind} kind
 * @returns {string | null}
 */
export function getStatusDescription(value, kind) {
  return getStatusDisplayConfig(kind, value)?.description ?? null;
}

/**
 * @param {{
 *   kind: import("./status-display.d.ts").StatusDisplayKind;
 *   status: unknown;
 *   roleCode?: import("./status-display.d.ts").StatusDisplayRoleCode | string | null;
 * }} input
 * @returns {string | null}
 */
export function getStatusNextActionHint(input) {
  const roleCode = normalizeStatusCode(input.roleCode);
  const config = getStatusDisplayConfig(input.kind, input.status);

  if (!roleCode || !config) {
    return null;
  }

  return config.nextActionHints[roleCode] ?? null;
}

/**
 * @param {import("./status-display.d.ts").StatusDisplayKind} kind
 * @returns {readonly import("./status-display.d.ts").StatusDisplayConfig[]}
 */
export function listStatusDisplayOptions(kind) {
  if (!hasOwn(STATUS_DISPLAY_CONFIG, kind)) {
    return [];
  }

  return Object.freeze(Object.values(STATUS_DISPLAY_CONFIG[kind]));
}

/**
 * @param {unknown} value
 * @param {import("./status-display.d.ts").StatusDisplayKind} [kind]
 * @returns {{ label: string, tone: import("./status-display.d.ts").StatusDisplayTone }}
 */
export function getStatusBadgeViewModel(value, kind) {
  return Object.freeze({
    label: formatStatusDisplayLabel(value, kind),
    tone: getStatusBadgeTone(value, kind),
  });
}

/**
 * @param {readonly string[]} codes
 * @param {Readonly<Record<string, import("./status-display.d.ts").StatusDisplayConfig>>} registry
 * @returns {readonly string[]}
 */
export function missingConfigCodes(codes, registry) {
  return Object.freeze(codes.filter((code) => !registry[code]));
}

/**
 * @param {import("./status-display.d.ts").StatusDisplayConfig[]} entries
 * @returns {Readonly<Record<string, import("./status-display.d.ts").StatusDisplayConfig>>}
 */
function buildStatusMap(entries) {
  return Object.freeze(Object.fromEntries(entries.map((entry) => [entry.code, entry])));
}

/**
 * @param {string} code
 * @param {string} label
 * @param {string} description
 * @param {import("./status-display.d.ts").StatusDisplayTone} tone
 * @param {Record<string, string>} [nextActionHints]
 * @returns {import("./status-display.d.ts").StatusDisplayConfig}
 */
function status(code, label, description, tone, nextActionHints = {}) {
  return Object.freeze({
    code,
    label,
    description,
    tone,
    nextActionHints: Object.freeze({ ...nextActionHints }),
  });
}

/**
 * @param {unknown} value
 * @returns {import("./status-display.d.ts").StatusDisplayConfig | null}
 */
function findStatusDisplayConfig(value) {
  const code = normalizeStatusCode(value);

  if (!code) {
    return null;
  }

  for (const registry of Object.values(STATUS_DISPLAY_CONFIG)) {
    if (registry[code]) {
      return registry[code];
    }
  }

  return null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeStatusCode(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed.toUpperCase() : null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function fallbackLabel(value) {
  return String(value)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {unknown} value
 * @returns {import("./status-display.d.ts").StatusDisplayTone}
 */
function fallbackTone(value) {
  const normalized = String(value).toLowerCase();

  if (
    normalized.includes("unavailable") ||
    normalized.includes("cancel") ||
    normalized.includes("reject") ||
    normalized.includes("error") ||
    normalized.includes("fail")
  ) {
    return "danger";
  }

  if (
    normalized.includes("verified") ||
    normalized.includes("available") ||
    normalized === "active" ||
    normalized.includes("complete") ||
    normalized.includes("delivered") ||
    normalized.includes("submitted") ||
    normalized.includes("approved")
  ) {
    return "success";
  }

  if (
    normalized.includes("pending") ||
    normalized.includes("draft") ||
    normalized.includes("requested") ||
    normalized.includes("transit") ||
    normalized.includes("review")
  ) {
    return "warning";
  }

  if (
    normalized.includes("tracking") ||
    normalized.includes("shipment") ||
    normalized.includes("document") ||
    normalized.includes("proof")
  ) {
    return "info";
  }

  return "neutral";
}

/**
 * @template {object} T
 * @param {T} value
 * @param {PropertyKey} key
 * @returns {key is keyof T}
 */
function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}
