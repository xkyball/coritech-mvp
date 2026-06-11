// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";

export const PAYMENT_REFERENCE_STATUSES = /** @type {const} */ ([
  "NOT_REQUIRED",
  "PENDING",
  "AUTHORIZED",
  "PAID",
  "FAILED",
  "REFUNDED",
]);

const UNSUPPORTED_PAYMENT_DATA_FIELDS = Object.freeze([
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

export class PaymentReferenceValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech payment reference input:\n- ${issues.join("\n- ")}`);
    this.name = "PaymentReferenceValidationError";
    this.issues = issues;
  }
}

export class PaymentReferenceAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "PaymentReferenceAuthorizationError";
  }
}

export class PaymentReferenceService {
  /**
   * @param {import("./payment-reference.d.ts").PaymentReferenceServiceOptions} options
   */
  constructor(options) {
    if (!options?.repository) {
      throw new TypeError("PaymentReferenceService requires a repository.");
    }

    this.repository = options.repository;
    this.auditContext = options.auditContext ?? null;
  }

  /**
   * @param {import("./payment-reference.d.ts").CreatePaymentReferenceCommand} command
   * @returns {Promise<import("./payment-reference.d.ts").PaymentReferenceServiceResult>}
   */
  async createPaymentReference(command) {
    const createPaymentReference = requireRepositoryMethod(this.repository, "createPaymentReference");
    const prepared = prepareCreatePaymentReference(command);
    const persisted = await createPaymentReference(prepared.paymentReference);
    const paymentReference = Object.freeze(persisted ?? prepared.paymentReference);
    const auditLog = await createAuditLogFromHook({
      repository: this.repository,
      auditHook: buildPaymentReferenceAuditHook({
        action: "PAYMENT_REFERENCE_CREATED",
        actorRole: prepared.actorRole,
        paymentReference,
        previousPaymentReference: null,
        reason: prepared.reason,
        occurredAt: prepared.occurredAt,
      }),
      requestContext: this.auditContext,
    });

    return deepFreeze({
      paymentReference,
      auditHook: buildPaymentReferenceAuditHook({
        action: "PAYMENT_REFERENCE_CREATED",
        actorRole: prepared.actorRole,
        paymentReference,
        previousPaymentReference: null,
        reason: prepared.reason,
        occurredAt: prepared.occurredAt,
      }),
      auditLog,
    });
  }

  /**
   * @param {import("./payment-reference.d.ts").UpdatePaymentReferenceStatusCommand} command
   * @returns {Promise<import("./payment-reference.d.ts").PaymentReferenceServiceResult>}
   */
  async updatePaymentReferenceStatus(command) {
    const findPaymentReferenceById = requireRepositoryMethod(this.repository, "findPaymentReferenceById");
    const updatePaymentReference = requireRepositoryMethod(this.repository, "updatePaymentReference");
    const existing = await findPaymentReferenceById(command.paymentReferenceId);

    if (!existing) {
      throw new PaymentReferenceValidationError([
        `PaymentReference was not found: ${command.paymentReferenceId}`,
      ]);
    }

    const prepared = prepareUpdatePaymentReferenceStatus({
      ...command,
      existingPaymentReference: existing,
    });
    const persisted = await updatePaymentReference(prepared.paymentReference);
    const paymentReference = Object.freeze(persisted ?? prepared.paymentReference);
    const auditHook = buildPaymentReferenceAuditHook({
      action: "PAYMENT_REFERENCE_STATUS_UPDATED",
      actorRole: prepared.actorRole,
      paymentReference,
      previousPaymentReference: existing,
      reason: prepared.reason,
      occurredAt: prepared.occurredAt,
    });
    const auditLog = await createAuditLogFromHook({
      repository: this.repository,
      auditHook,
      requestContext: this.auditContext,
    });

    return deepFreeze({
      paymentReference,
      auditHook,
      auditLog,
    });
  }
}

/**
 * @param {import("./payment-reference.d.ts").PaymentReferenceServiceOptions} options
 */
export function createPaymentReferenceService(options) {
  return new PaymentReferenceService(options);
}

/**
 * @param {unknown} value
 * @returns {value is import("./payment-reference.d.ts").PaymentReferenceStatus}
 */
export function isPaymentReferenceStatus(value) {
  return typeof value === "string" && PAYMENT_REFERENCE_STATUSES.includes(
    /** @type {import("./payment-reference.d.ts").PaymentReferenceStatus} */ (value),
  );
}

/**
 * @param {import("./payment-reference.d.ts").CreatePaymentReferenceInput} input
 * @returns {string[]}
 */
export function validateCreatePaymentReferenceInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const status = normalizeRequiredString(input.status) || "PENDING";

  issues.push(...actorIssues);
  validateOrderRef(input.order, issues);
  validateNoSensitivePaymentFields(input, issues);
  validateOptionalNonBlankString(input.paymentReferenceId, "paymentReferenceId", issues);
  validateOptionalNonBlankString(input.providerName, "providerName", issues);
  validateOptionalNonBlankString(input.providerReferenceId, "providerReferenceId", issues);
  validateAmount(input.amount, issues);
  validateCurrency(input.currency, issues);
  validateOptionalNonBlankString(input.reason, "reason", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (status && !isPaymentReferenceStatus(status)) {
    issues.push(`status must be one of: ${PAYMENT_REFERENCE_STATUSES.join(", ")}.`);
  }

  if (status !== "NOT_REQUIRED") {
    validateRequiredNonBlankString(input.providerName, "providerName", issues);
    validateRequiredNonBlankString(input.providerReferenceId, "providerReferenceId", issues);
  }

  return issues;
}

/**
 * @param {import("./payment-reference.d.ts").CreatePaymentReferenceInput} input
 * @returns {import("./payment-reference.d.ts").PreparedPaymentReferenceChange}
 */
export function prepareCreatePaymentReference(input) {
  const issues = validateCreatePaymentReferenceInput(input);

  if (issues.length > 0) {
    throw new PaymentReferenceValidationError(issues);
  }

  const actorRole = findPaymentActorRole(input.actor);

  if (!actorRole) {
    throw new PaymentReferenceAuthorizationError(
      "actor must have an active Phase 1 role before creating payment references.",
    );
  }

  const occurredAt = toIsoTimestamp(input.createdAt ?? input.now ?? new Date());
  const paymentReference = Object.freeze({
    id: normalizeOptionalString(input.paymentReferenceId),
    semenOrderId: normalizeRequiredString(input.order.id),
    orderNumber: normalizeRequiredString(input.order.orderNumber),
    breederOrganizationId: normalizeRequiredString(input.order.breederOrganizationId),
    breedingStationOrganizationId: normalizeRequiredString(input.order.breedingStationOrganizationId),
    providerName: normalizeOptionalString(input.providerName),
    providerReferenceId: normalizeOptionalString(input.providerReferenceId),
    status: /** @type {import("./payment-reference.d.ts").PaymentReferenceStatus} */ (
      normalizeRequiredString(input.status) || "PENDING"
    ),
    amount: normalizeAmount(input.amount),
    currency: normalizeCurrency(input.currency),
    createdByUserId: input.actor.userId.trim(),
    updatedByUserId: input.actor.userId.trim(),
    createdAt: occurredAt,
    updatedAt: occurredAt,
  });

  return Object.freeze({
    paymentReference,
    actorRole,
    reason: normalizeOptionalString(input.reason),
    occurredAt,
  });
}

/**
 * @param {import("./payment-reference.d.ts").UpdatePaymentReferenceStatusInput} input
 * @returns {string[]}
 */
export function validateUpdatePaymentReferenceStatusInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const status = normalizeRequiredString(input.status);

  issues.push(...actorIssues);
  validatePaymentReferenceRecord(input.existingPaymentReference, issues);
  validateNoSensitivePaymentFields(input, issues);
  validateOptionalNonBlankString(input.providerName, "providerName", issues);
  validateOptionalNonBlankString(input.providerReferenceId, "providerReferenceId", issues);
  validateAmount(input.amount, issues);
  validateCurrency(input.currency, issues);
  validateOptionalNonBlankString(input.reason, "reason", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (!status) {
    issues.push("status is required.");
  } else if (!isPaymentReferenceStatus(status)) {
    issues.push(`status must be one of: ${PAYMENT_REFERENCE_STATUSES.join(", ")}.`);
  }

  return issues;
}

/**
 * @param {import("./payment-reference.d.ts").UpdatePaymentReferenceStatusInput} input
 * @returns {import("./payment-reference.d.ts").PreparedPaymentReferenceChange}
 */
export function prepareUpdatePaymentReferenceStatus(input) {
  const issues = validateUpdatePaymentReferenceStatusInput(input);

  if (issues.length > 0) {
    throw new PaymentReferenceValidationError(issues);
  }

  const actorRole = findPaymentActorRole(input.actor);

  if (!actorRole) {
    throw new PaymentReferenceAuthorizationError(
      "actor must have an active Phase 1 role before updating payment references.",
    );
  }

  const occurredAt = toIsoTimestamp(input.now ?? new Date());
  const providerName = normalizeOptionalString(input.providerName) ??
    input.existingPaymentReference.providerName;
  const providerReferenceId = normalizeOptionalString(input.providerReferenceId) ??
    input.existingPaymentReference.providerReferenceId;
  const status = /** @type {import("./payment-reference.d.ts").PaymentReferenceStatus} */ (
    input.status.trim()
  );
  const paymentReference = Object.freeze({
    ...input.existingPaymentReference,
    providerName,
    providerReferenceId,
    status,
    amount: input.amount === undefined ? input.existingPaymentReference.amount : normalizeAmount(input.amount),
    currency: input.currency === undefined ? input.existingPaymentReference.currency : normalizeCurrency(input.currency),
    updatedByUserId: input.actor.userId.trim(),
    updatedAt: occurredAt,
  });

  if (status !== "NOT_REQUIRED" && (!providerName || !providerReferenceId)) {
    throw new PaymentReferenceValidationError([
      "providerName and providerReferenceId are required unless status is NOT_REQUIRED.",
    ]);
  }

  return Object.freeze({
    paymentReference,
    actorRole,
    reason: normalizeOptionalString(input.reason),
    occurredAt,
  });
}

/**
 * @param {import("./payment-reference.d.ts").PaymentReferenceAuditHookInput} input
 * @returns {import("./payment-reference.d.ts").PaymentReferenceAuditHook}
 */
export function buildPaymentReferenceAuditHook(input) {
  return Object.freeze({
    eventType: "PAYMENT_REFERENCE",
    action: input.action,
    actorUserId: input.actorRole.userId,
    actorRoleCode: input.actorRole.roleCode,
    actorOrganizationId: input.actorRole.organizationId,
    targetType: "PaymentReference",
    targetId: input.paymentReference.id,
    targetRef: Object.freeze({
      semenOrderId: input.paymentReference.semenOrderId,
      orderNumber: input.paymentReference.orderNumber,
      providerName: input.paymentReference.providerName,
      providerReferenceId: input.paymentReference.providerReferenceId,
      breederOrganizationId: input.paymentReference.breederOrganizationId,
      breedingStationOrganizationId: input.paymentReference.breedingStationOrganizationId,
    }),
    previousValue: input.previousPaymentReference
      ? paymentReferenceAuditValue(input.previousPaymentReference)
      : null,
    newValue: paymentReferenceAuditValue(input.paymentReference),
    reason: input.reason,
    occurredAt: input.occurredAt,
  });
}

/**
 * @param {import("./payment-reference.d.ts").PaymentReferenceLike} paymentReference
 */
function paymentReferenceAuditValue(paymentReference) {
  return Object.freeze({
    status: paymentReference.status,
    amount: paymentReference.amount,
    currency: paymentReference.currency,
    providerName: paymentReference.providerName,
    providerReferenceId: paymentReference.providerReferenceId,
  });
}

/**
 * @param {unknown} value
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | null}
 */
function findPaymentActorRole(value) {
  const actor = /** @type {import("./payment-reference.d.ts").PaymentReferenceActorContext} */ (value);

  if (!actor || !Array.isArray(actor.roles)) {
    return null;
  }

  return actor.roles.find((role) =>
    role.userId === actor.userId &&
    isActiveRoleAssignment(role) &&
    ["BREEDER", "BREEDING_STATION", "PLATFORM_ADMIN"].includes(role.roleCode)
  ) ?? null;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function validateActor(value) {
  const issues = [];
  const actor = /** @type {import("./payment-reference.d.ts").PaymentReferenceActorContext} */ (value);

  if (!actor || typeof actor !== "object") {
    return ["actor is required."];
  }

  validateRequiredNonBlankString(actor.userId, "actor.userId", issues);

  if (!findPaymentActorRole(actor)) {
    issues.push("actor.roles must include one active Phase 1 role assignment.");
  }

  return issues;
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 */
function validateOrderRef(value, issues) {
  const order = /** @type {import("./payment-reference.d.ts").PaymentReferenceOrderRef} */ (value);

  if (!order || typeof order !== "object") {
    issues.push("order is required.");
    return;
  }

  validateRequiredNonBlankString(order.id, "order.id", issues);
  validateRequiredNonBlankString(order.orderNumber, "order.orderNumber", issues);
  validateRequiredNonBlankString(order.breederOrganizationId, "order.breederOrganizationId", issues);
  validateRequiredNonBlankString(order.breedingStationOrganizationId, "order.breedingStationOrganizationId", issues);
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 */
function validatePaymentReferenceRecord(value, issues) {
  const paymentReference = /** @type {import("./payment-reference.d.ts").PaymentReferenceLike} */ (value);

  if (!paymentReference || typeof paymentReference !== "object") {
    issues.push("existingPaymentReference is required.");
    return;
  }

  validateRequiredNonBlankString(paymentReference.id, "existingPaymentReference.id", issues);
  validateRequiredNonBlankString(paymentReference.semenOrderId, "existingPaymentReference.semenOrderId", issues);
  validateRequiredNonBlankString(paymentReference.orderNumber, "existingPaymentReference.orderNumber", issues);
}

/**
 * @param {Record<string, unknown>} input
 * @param {string[]} issues
 */
function validateNoSensitivePaymentFields(input, issues) {
  for (const fieldName of UNSUPPORTED_PAYMENT_DATA_FIELDS) {
    if (Object.hasOwn(input, fieldName) && input[fieldName] != null) {
      issues.push(`${fieldName} is not stored by CoriTech payment references.`);
    }
  }
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 */
function validateAmount(value, issues) {
  if (value == null) {
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    issues.push("amount must be a non-negative number when provided.");
  }
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 */
function validateCurrency(value, issues) {
  if (value == null) {
    return;
  }

  if (typeof value !== "string" || !/^[A-Z]{3}$/.test(value.trim().toUpperCase())) {
    issues.push("currency must be a 3-letter ISO currency code when provided.");
  }
}

/**
 * @param {unknown} value
 * @returns {number | null}
 */
function normalizeAmount(value) {
  return typeof value === "number" ? Math.round(value * 100) / 100 : null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeCurrency(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : null;
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
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return normalizeOptionalString(value) ?? "";
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateRequiredNonBlankString(value, fieldName, issues) {
  if (!normalizeOptionalString(value)) {
    issues.push(`${fieldName} is required.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (typeof value === "string" && value.trim().length === 0) {
    issues.push(`${fieldName} cannot be blank when provided.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateOptionalTimestamp(value, fieldName, issues) {
  if (value == null) {
    return;
  }

  if (Number.isNaN(new Date(/** @type {string | Date} */ (value)).getTime())) {
    issues.push(`${fieldName} must be a valid date or ISO timestamp.`);
  }
}

/**
 * @param {unknown} repository
 * @param {string} methodName
 * @returns {Function}
 */
function requireRepositoryMethod(repository, methodName) {
  const method = repository?.[methodName];

  if (typeof method !== "function") {
    throw new PaymentReferenceValidationError([
      `repository.${methodName} is required.`,
    ]);
  }

  return method.bind(repository);
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
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
