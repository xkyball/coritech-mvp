// @ts-check

import {
  createPaymentReferenceService,
} from "./payment-reference.mjs";

export const PAYMENT_PROVIDER_ADAPTER_KINDS = /** @type {const} */ ([
  "manual_reference",
  "provider_placeholder",
]);

const DEFAULT_MANUAL_PROVIDER_NAME = "manual_reference";

export class PaymentProviderAdapterConfigError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech payment provider adapter configuration:\n- ${issues.join("\n- ")}`);
    this.name = "PaymentProviderAdapterConfigError";
    this.issues = issues;
  }
}

export class PaymentProviderAdapterUnavailableError extends Error {
  /**
   * @param {string} providerName
   */
  constructor(providerName) {
    super(
      `Payment provider adapter '${providerName}' is a placeholder only. Configure a real provider implementation in a future ticket before using it.`,
    );
    this.name = "PaymentProviderAdapterUnavailableError";
    this.providerName = providerName;
  }
}

/**
 * @param {import("./payment-provider-adapter.d.ts").PaymentProviderAdapterRuntimeConfig} config
 * @param {import("./payment-provider-adapter.d.ts").CreatePaymentProviderAdapterOptions} [options]
 * @returns {import("./payment-provider-adapter.d.ts").PaymentProviderAdapter}
 */
export function createPaymentProviderAdapter(config, options = {}) {
  const issues = validatePaymentProviderAdapterRuntimeConfig(config);

  if (issues.length > 0) {
    throw new PaymentProviderAdapterConfigError(issues);
  }

  if (config.provider === "manual_reference") {
    return createManualPaymentProviderAdapter({
      repository: options.repository,
      auditContext: options.auditContext,
      providerName: config.providerName,
    });
  }

  return createPlaceholderPaymentProviderAdapter({
    providerName: config.providerName,
  });
}

/**
 * @param {import("./payment-provider-adapter.d.ts").CreateManualPaymentProviderAdapterInput} input
 * @returns {import("./payment-provider-adapter.d.ts").PaymentProviderAdapter}
 */
export function createManualPaymentProviderAdapter(input) {
  if (!input?.repository) {
    throw new PaymentProviderAdapterConfigError([
      "repository is required for the manual_reference payment adapter.",
    ]);
  }

  const providerName = normalizeOptionalString(input.providerName) ?? DEFAULT_MANUAL_PROVIDER_NAME;
  const service = createPaymentReferenceService({
    repository: input.repository,
    auditContext: input.auditContext,
  });

  return Object.freeze({
    providerKind: "manual_reference",
    providerName,
    supportsRealProcessing: false,
    storesSensitivePaymentData: false,
    async createPaymentReference(command) {
      return service.createPaymentReference({
        ...command,
        providerName: normalizeOptionalString(command.providerName) ?? providerName,
      });
    },
    async updatePaymentReferenceStatus(command) {
      return service.updatePaymentReferenceStatus(command);
    },
  });
}

/**
 * @param {import("./payment-provider-adapter.d.ts").CreatePlaceholderPaymentProviderAdapterInput} [input]
 * @returns {import("./payment-provider-adapter.d.ts").PaymentProviderAdapter}
 */
export function createPlaceholderPaymentProviderAdapter(input = {}) {
  const providerName = normalizeOptionalString(input.providerName) ?? "provider_placeholder";

  return Object.freeze({
    providerKind: "provider_placeholder",
    providerName,
    supportsRealProcessing: false,
    storesSensitivePaymentData: false,
    async createPaymentReference() {
      throw new PaymentProviderAdapterUnavailableError(providerName);
    },
    async updatePaymentReferenceStatus() {
      throw new PaymentProviderAdapterUnavailableError(providerName);
    },
  });
}

/**
 * @param {import("./payment-provider-adapter.d.ts").PaymentProviderAdapterRuntimeConfig | undefined} config
 * @returns {string[]}
 */
export function validatePaymentProviderAdapterRuntimeConfig(config) {
  const issues = [];

  if (!config || typeof config !== "object") {
    return ["payment provider adapter config is required."];
  }

  if (!PAYMENT_PROVIDER_ADAPTER_KINDS.includes(
    /** @type {import("./payment-provider-adapter.d.ts").PaymentProviderAdapterKind} */ (config.provider),
  )) {
    issues.push("provider must be one of: manual_reference, provider_placeholder.");
  }

  validateOptionalNonBlankString(config.providerName, "providerName", issues);

  return issues;
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
 * @param {string} fieldName
 * @param {string[]} issues
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (typeof value === "string" && value.trim().length === 0) {
    issues.push(`${fieldName} cannot be blank when provided.`);
  }
}
