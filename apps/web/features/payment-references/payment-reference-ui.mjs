// @ts-check

import {
  PAYMENT_REFERENCE_STATUSES,
  createPaymentReferenceService,
} from "@coritech/domain/payments/payment-reference.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import {
  formatStatusDisplayLabel,
  getStatusDescription,
} from "../status-display/status-display-registry.mjs";

export const PAYMENT_REFERENCE_ROUTES = Object.freeze({
  stationOrders: "/app/station/orders",
  adminOrders: "/app/admin/orders",
});

export const PAYMENT_REFERENCE_SENSITIVE_FIELD_NAMES = Object.freeze([
  "cardNumber",
  "cardCvc",
  "cardCvv",
  "cardExpiry",
  "cardholderName",
  "bankAccountNumber",
  "iban",
  "providerPayload",
  "rawProviderResponse",
]);

export class PaymentReferenceUiAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "PaymentReferenceUiAuthorizationError";
  }
}

export class PaymentReferenceUiValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech payment reference form:\n- ${issues.join("\n- ")}`);
    this.name = "PaymentReferenceUiValidationError";
    this.issues = issues;
  }
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferencePanelInput} input
 * @returns {import("./payment-reference-ui.d.ts").PaymentReferencePanelViewModel}
 */
export function createPaymentReferencePanelViewModel(input) {
  const issues = validatePaymentReferencePanelInput(input);

  if (issues.length > 0) {
    throw new PaymentReferenceUiValidationError(issues);
  }

  const order = input.order;
  const paymentReference = input.paymentReference ?? null;
  const canView = canViewPaymentReference({
    actor: input.actor,
    order,
  });

  if (!canView) {
    throw new PaymentReferenceUiAuthorizationError(
      "actor is not authorized to view payment references for this order.",
    );
  }

  const canMaintain = canMaintainPaymentReference({
    actor: input.actor,
    order,
  });
  const status = paymentReference?.status ?? "NOT_REQUIRED";
  const orderId = normalizeOptionalString(order.id);

  return deepFreeze({
    title: "Payment reference",
    summary: paymentReference
      ? "Manual payment reference state for this order."
      : "No payment reference is required or recorded for this Phase 1 order.",
    status,
    statusLabel: formatStatusDisplayLabel(status, "payment"),
    statusDescription: getStatusDescription(status, "payment"),
    referenceOnlyNotice: "Reference only. CoriTech does not collect card, bank credential or checkout data in this flow.",
    settlementNotice: "A provider reference is not proof of settlement unless the payment status policy marks it paid.",
    paymentReferenceId: paymentReference?.id ?? null,
    displayRows: Object.freeze(buildDisplayRows(paymentReference)),
    feedback: normalizeFeedback(input.feedback),
    maintenance: Object.freeze({
      canMaintain,
      deniedReason: canMaintain
        ? null
        : "Only platform admins and the assigned breeding station can maintain manual payment references.",
      form: canMaintain && orderId
        ? buildMaintenanceForm({
          orderId,
          paymentReference,
          returnTo: input.returnTo,
        })
        : null,
    }),
  });
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceMaintenanceAccessInput} input
 * @returns {boolean}
 */
export function canViewPaymentReference(input) {
  return canMaintainPaymentReference(input) ||
    hasActiveOrderRole(input.actor, "BREEDER", input.order.breederOrganizationId);
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceMaintenanceAccessInput} input
 * @returns {boolean}
 */
export function canMaintainPaymentReference(input) {
  return hasActivePlatformAdminRole(input.actor) ||
    hasActiveOrderRole(input.actor, "BREEDING_STATION", input.order.breedingStationOrganizationId);
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceMaintenanceAccessInput} input
 */
export function authorizePaymentReferenceMaintenance(input) {
  if (!canMaintainPaymentReference(input)) {
    throw new PaymentReferenceUiAuthorizationError(
      "actor must be a platform admin or the assigned breeding station to maintain payment references.",
    );
  }
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceMutationInput} input
 * @returns {import("./payment-reference-ui.d.ts").PaymentReferenceMutationCommand}
 */
export function buildPaymentReferenceMutationCommand(input) {
  authorizePaymentReferenceMaintenance({
    actor: input.actor,
    order: input.order,
  });

  const values = normalizePaymentReferenceFormValues(input.values);
  const order = toOrderRef(input.order);

  if (input.existingPaymentReference) {
    const paymentReferenceId = normalizeOptionalString(input.existingPaymentReference.id);

    if (!paymentReferenceId) {
      throw new PaymentReferenceUiValidationError([
        "paymentReferenceId is required when updating a payment reference.",
      ]);
    }

    if (input.existingPaymentReference.semenOrderId !== order.id) {
      throw new PaymentReferenceUiAuthorizationError(
        "payment reference does not belong to the selected order.",
      );
    }

    return deepFreeze({
      kind: "update",
      command: {
        actor: input.actor,
        paymentReferenceId,
        status: values.status,
        providerName: values.providerName,
        providerReferenceId: values.providerReferenceId,
        amount: values.amount,
        currency: values.currency,
        reason: values.reason,
        now: input.now,
      },
    });
  }

  return deepFreeze({
    kind: "create",
    command: {
      actor: input.actor,
      order,
      status: values.status,
      providerName: values.providerName,
      providerReferenceId: values.providerReferenceId,
      amount: values.amount,
      currency: values.currency,
      reason: values.reason,
      now: input.now,
    },
  });
}

/**
 * @param {import("./payment-reference-ui.d.ts").ExecutePaymentReferenceMutationInput} input
 * @returns {Promise<import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceServiceResult>}
 */
export async function executePaymentReferenceMutation(input) {
  const mutation = buildPaymentReferenceMutationCommand(input);
  const service = createPaymentReferenceService({
    repository: input.repository,
    auditContext: input.auditContext,
  });

  return mutation.kind === "create"
    ? service.createPaymentReference(mutation.command)
    : service.updatePaymentReferenceStatus(mutation.command);
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceFormValuesInput} input
 * @returns {import("./payment-reference-ui.d.ts").PaymentReferenceFormValues}
 */
export function normalizePaymentReferenceFormValues(input) {
  const issues = [];
  const status = normalizeOptionalString(getFormValue(input, "status")) ?? "PENDING";

  for (const fieldName of PAYMENT_REFERENCE_SENSITIVE_FIELD_NAMES) {
    if (hasNonEmptyFormValue(input, fieldName)) {
      issues.push(`${fieldName} is not accepted by the payment reference UI.`);
    }
  }

  if (!PAYMENT_REFERENCE_STATUSES.includes(
    /** @type {import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceStatus} */ (status),
  )) {
    issues.push(`status must be one of: ${PAYMENT_REFERENCE_STATUSES.join(", ")}.`);
  }

  const amount = normalizeAmountValue(getFormValue(input, "amount"), issues);
  const currency = normalizeOptionalString(getFormValue(input, "currency"));

  if (currency && !/^[A-Z]{3}$/.test(currency.toUpperCase())) {
    issues.push("currency must be a 3-letter ISO currency code.");
  }

  if (issues.length > 0) {
    throw new PaymentReferenceUiValidationError(issues);
  }

  return Object.freeze({
    status: /** @type {import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceStatus} */ (status),
    providerName: normalizeOptionalString(getFormValue(input, "providerName")),
    providerReferenceId: normalizeOptionalString(getFormValue(input, "providerReferenceId")),
    amount,
    currency: currency ? currency.toUpperCase() : null,
    reason: normalizeOptionalString(getFormValue(input, "reason")),
  });
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferencePanelInput | undefined} input
 * @returns {string[]}
 */
export function validatePaymentReferencePanelInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["payment reference panel input is required."];
  }

  if (!input.actor || typeof input.actor !== "object") {
    issues.push("actor is required.");
  } else {
    validateRequiredString(input.actor.userId, "actor.userId", issues);

    if (!Array.isArray(input.actor.roles)) {
      issues.push("actor.roles must list the signed-in user's active role context.");
    }
  }

  if (!input.order || typeof input.order !== "object") {
    issues.push("order is required.");
  } else {
    validateRequiredString(input.order.orderNumber, "order.orderNumber", issues);
    validateRequiredString(input.order.breederOrganizationId, "order.breederOrganizationId", issues);
    validateRequiredString(input.order.breedingStationOrganizationId, "order.breedingStationOrganizationId", issues);
  }

  return issues;
}

/**
 * @param {import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceLike | null} paymentReference
 * @returns {readonly import("./payment-reference-ui.d.ts").PaymentReferenceDisplayRow[]}
 */
function buildDisplayRows(paymentReference) {
  if (!paymentReference) {
    return Object.freeze([
      Object.freeze({ label: "Provider", value: "Not recorded" }),
      Object.freeze({ label: "Provider reference", value: "Not recorded" }),
      Object.freeze({ label: "Amount", value: "Not recorded" }),
      Object.freeze({ label: "Updated", value: "Not recorded" }),
    ]);
  }

  return Object.freeze([
    Object.freeze({ label: "Provider", value: paymentReference.providerName ?? "Not recorded" }),
    Object.freeze({ label: "Provider reference", value: paymentReference.providerReferenceId ?? "Not recorded" }),
    Object.freeze({ label: "Amount", value: formatAmount(paymentReference) }),
    Object.freeze({ label: "Updated", value: paymentReference.updatedAt }),
  ]);
}

/**
 * @param {{
 *   orderId: string;
 *   paymentReference: import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceLike | null;
 *   returnTo?: string | null;
 * }} input
 * @returns {import("./payment-reference-ui.d.ts").PaymentReferenceMaintenanceFormViewModel}
 */
function buildMaintenanceForm(input) {
  return Object.freeze({
    orderId: input.orderId,
    paymentReferenceId: input.paymentReference?.id ?? null,
    returnTo: normalizeOptionalString(input.returnTo),
    submitLabel: input.paymentReference ? "Update payment reference" : "Create payment reference",
    statusOptions: PAYMENT_REFERENCE_STATUSES.map((status) =>
      Object.freeze({
        value: status,
        label: formatStatusDisplayLabel(status, "payment"),
      })
    ),
    values: Object.freeze({
      status: input.paymentReference?.status ?? "PENDING",
      providerName: input.paymentReference?.providerName ?? "",
      providerReferenceId: input.paymentReference?.providerReferenceId ?? "",
      amount: input.paymentReference?.amount == null ? "" : String(input.paymentReference.amount),
      currency: input.paymentReference?.currency ?? "",
      reason: "",
    }),
    fieldNames: Object.freeze([
      "orderId",
      "paymentReferenceId",
      "returnTo",
      "status",
      "providerName",
      "providerReferenceId",
      "amount",
      "currency",
      "reason",
    ]),
  });
}

/**
 * @param {import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceLike} paymentReference
 * @returns {string}
 */
function formatAmount(paymentReference) {
  if (paymentReference.amount == null || !paymentReference.currency) {
    return "Not recorded";
  }

  return `${paymentReference.currency} ${paymentReference.amount.toFixed(2)}`;
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceMutationInput["order"]} order
 * @returns {import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceOrderRef}
 */
function toOrderRef(order) {
  return {
    id: normalizeOptionalString(order.id) ?? "",
    orderNumber: normalizeOptionalString(order.orderNumber) ?? "",
    breederOrganizationId: normalizeOptionalString(order.breederOrganizationId) ?? "",
    breedingStationOrganizationId: normalizeOptionalString(order.breedingStationOrganizationId) ?? "",
  };
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferencePanelFeedback | undefined} feedback
 * @returns {import("./payment-reference-ui.d.ts").PaymentReferencePanelFeedback | null}
 */
function normalizeFeedback(feedback) {
  if (!feedback) {
    return null;
  }

  return Object.freeze({
    tone: feedback.tone === "danger" ? "danger" : "success",
    title: normalizeOptionalString(feedback.title) ?? "Payment reference",
    message: normalizeOptionalString(feedback.message) ?? "",
  });
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceActorContext} actor
 * @returns {boolean}
 */
function hasActivePlatformAdminRole(actor) {
  return Boolean(actor?.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceActorContext} actor
 * @param {"BREEDER" | "BREEDING_STATION"} roleCode
 * @param {string} organizationId
 * @returns {boolean}
 */
function hasActiveOrderRole(actor, roleCode, organizationId) {
  return Boolean(actor?.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === roleCode &&
    role.organizationId === organizationId &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceFormValuesInput} input
 * @param {string} key
 * @returns {string | null}
 */
function getFormValue(input, key) {
  if (input instanceof FormData) {
    const value = input.get(key);

    return typeof value === "string" ? value : null;
  }

  if (input instanceof URLSearchParams) {
    return input.get(key);
  }

  const value = input?.[key];

  return typeof value === "string" || typeof value === "number" ? String(value) : null;
}

/**
 * @param {import("./payment-reference-ui.d.ts").PaymentReferenceFormValuesInput} input
 * @param {string} key
 * @returns {boolean}
 */
function hasNonEmptyFormValue(input, key) {
  return normalizeOptionalString(getFormValue(input, key)) !== null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {number | null}
 */
function normalizeAmountValue(value, issues) {
  const text = normalizeOptionalString(value);

  if (!text) {
    return null;
  }

  const amount = Number(text);

  if (!Number.isFinite(amount) || amount < 0) {
    issues.push("amount must be a non-negative number when provided.");
    return null;
  }

  return Math.round(amount * 100) / 100;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateRequiredString(value, fieldName, issues) {
  if (!normalizeOptionalString(value)) {
    issues.push(`${fieldName} is required.`);
  }
}

/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.freeze(value);

    for (const nested of Object.values(value)) {
      if (nested && typeof nested === "object" && !Object.isFrozen(nested)) {
        deepFreeze(nested);
      }
    }
  }

  return value;
}
