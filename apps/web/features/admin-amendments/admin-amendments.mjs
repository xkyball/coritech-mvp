// @ts-check

import {
  AMENDMENT_TARGET_MUTATION_POLICY,
  AMENDMENT_TARGET_TYPES,
  canCreateAmendment,
  createAmendmentEndpoint,
} from "@coritech/domain/amendments/amendment.mjs";

export const ADMIN_AMENDMENT_ROUTES = Object.freeze({
  list: "/app/admin/amendments",
  new: "/app/admin/amendments/new",
  audit: "/app/admin/audit",
});

/**
 * @param {import("./admin-amendments.d.ts").AdminAmendmentActorContext} actor
 * @returns {boolean}
 */
export function canAccessAdminAmendments(actor) {
  return canCreateAmendment(actor);
}

/**
 * @param {import("./admin-amendments.d.ts").AdminAmendmentViewModelInput} input
 * @returns {import("./admin-amendments.d.ts").AdminAmendmentViewModel}
 */
export function createAdminAmendmentViewModel(input) {
  const defaults = normalizeAmendmentFormDefaults(input.defaults ?? {});

  return Object.freeze({
    state: "READY",
    routes: ADMIN_AMENDMENT_ROUTES,
    canCreate: canAccessAdminAmendments(input.actor),
    targetTypes: AMENDMENT_TARGET_TYPES,
    defaults,
    rows: Object.freeze((input.amendments ?? []).map(toAmendmentRow)),
    mutationPolicy: AMENDMENT_TARGET_MUTATION_POLICY,
  });
}

/**
 * @param {import("./admin-amendments.d.ts").CreateAdminAmendmentInput} input
 */
export async function createAdminAmendment(input) {
  if (!canAccessAdminAmendments(input.actor)) {
    throw new Error("Only active Platform Admin users can create amendments.");
  }

  const normalized = normalizeAmendmentCreateInput(input);

  return createAmendmentEndpoint({
    actor: input.actor,
    repository: input.repository,
    auditContext: input.auditContext,
    body: {
      targetType: normalized.targetType,
      targetId: normalized.targetId,
      targetField: normalized.targetField,
      amendedValue: normalized.amendedValue,
      reason: normalized.reason,
      status: "SUBMITTED",
      now: input.now,
    },
  });
}

/**
 * @param {Record<string, unknown>} input
 * @returns {import("./admin-amendments.d.ts").AdminAmendmentFormDefaults}
 */
export function normalizeAmendmentFormDefaults(input) {
  return Object.freeze({
    targetType: normalizeAllowedOption(input.targetType, AMENDMENT_TARGET_TYPES),
    targetId: normalizeOptionalString(input.targetId) ?? "",
    targetField: normalizeOptionalString(input.targetField) ?? "",
    orderNumber: normalizeOptionalString(input.orderNumber) ?? "",
  });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatAmendmentLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {import("@coritech/domain/amendments/amendment.d.ts").Amendment} amendment
 * @returns {import("./admin-amendments.d.ts").AdminAmendmentRow}
 */
function toAmendmentRow(amendment) {
  const params = new URLSearchParams({
    objectType: amendment.targetType,
    objectId: amendment.targetId,
    action: "CREATE_AMENDMENT",
  });

  return Object.freeze({
    id: amendment.id,
    targetType: amendment.targetType,
    targetId: amendment.targetId,
    targetField: amendment.targetField ?? "Record",
    status: amendment.status,
    reason: amendment.reason,
    orderNumber: amendment.orderNumber ?? "",
    occurredAt: amendment.occurredAt,
    auditHref: `${ADMIN_AMENDMENT_ROUTES.audit}?${params.toString()}`,
    originalValuePreview: formatJsonPreview(amendment.originalValue),
    amendedValuePreview: formatJsonPreview(amendment.amendedValue),
  });
}

/**
 * @param {import("./admin-amendments.d.ts").CreateAdminAmendmentInput} input
 */
function normalizeAmendmentCreateInput(input) {
  const targetType = normalizeAllowedOption(input.targetType, AMENDMENT_TARGET_TYPES);
  const targetField = normalizeOptionalString(input.targetField);

  if (!targetType) {
    throw new Error("Select a supported amendment target type.");
  }

  return Object.freeze({
    targetType,
    targetId: requireNonBlankString(input.targetId, "Target ID"),
    targetField,
    amendedValue: normalizeAmendedValue(input.amendedValue, targetField),
    reason: requireNonBlankString(input.reason, "Reason"),
  });
}

/**
 * @param {unknown} value
 * @param {string | null} targetField
 */
function normalizeAmendedValue(value, targetField) {
  const rawValue = requireNonBlankString(value, "Amended value");
  const parsed = parseJsonLikeValue(rawValue);

  return targetField ? { [targetField]: parsed } : parsed;
}

/**
 * @param {string} value
 * @returns {unknown}
 */
function parseJsonLikeValue(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatJsonPreview(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * @template {string} T
 * @param {unknown} value
 * @param {readonly T[]} options
 * @returns {T | ""}
 */
function normalizeAllowedOption(value, options) {
  const normalized = normalizeOptionalString(value);

  return normalized && options.includes(/** @type {T} */ (normalized))
    ? /** @type {T} */ (normalized)
    : "";
}

/**
 * @param {unknown} value
 * @param {string} label
 * @returns {string}
 */
function requireNonBlankString(value, label) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
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
