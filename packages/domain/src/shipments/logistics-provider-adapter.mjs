// @ts-check

import {
  createShipmentService,
  isShipmentStatus,
} from "./shipment.mjs";

export const LOGISTICS_PROVIDER_ADAPTER_KINDS = /** @type {const} */ ([
  "manual",
  "external_placeholder",
]);

const DEFAULT_MANUAL_PROVIDER_NAME = "Manual logistics";
const DEFAULT_EXTERNAL_PROVIDER_NAME = "external_placeholder";

const PROVIDER_STATUS_MAP = Object.freeze({
  label_created: "PREPARED",
  prepared: "PREPARED",
  dispatch_ready: "PREPARED",
  dispatched: "DISPATCHED",
  picked_up: "IN_TRANSIT",
  in_transit: "IN_TRANSIT",
  transit: "IN_TRANSIT",
  out_for_delivery: "IN_TRANSIT",
  delivered: "DELIVERED",
  delayed: "DELAYED",
  exception: "DELAYED",
  failed: "FAILED",
  cancelled: "CANCELLED",
  canceled: "CANCELLED",
});

export class LogisticsProviderAdapterConfigError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech logistics provider adapter configuration:\n- ${issues.join("\n- ")}`);
    this.name = "LogisticsProviderAdapterConfigError";
    this.issues = issues;
  }
}

export class LogisticsProviderAdapterUnavailableError extends Error {
  /**
   * @param {string} providerName
   */
  constructor(providerName) {
    super(
      `Logistics provider adapter '${providerName}' is a placeholder only. Configure a real provider implementation in a future ticket before using it.`,
    );
    this.name = "LogisticsProviderAdapterUnavailableError";
    this.providerName = providerName;
  }
}

export class LogisticsTrackingEventNormalizationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech logistics tracking event:\n- ${issues.join("\n- ")}`);
    this.name = "LogisticsTrackingEventNormalizationError";
    this.issues = issues;
  }
}

/**
 * @param {import("./logistics-provider-adapter.d.ts").LogisticsProviderAdapterRuntimeConfig} config
 * @param {import("./logistics-provider-adapter.d.ts").CreateLogisticsProviderAdapterOptions} [options]
 * @returns {import("./logistics-provider-adapter.d.ts").LogisticsProviderAdapter}
 */
export function createLogisticsProviderAdapter(config, options = {}) {
  const issues = validateLogisticsProviderAdapterRuntimeConfig(config);

  if (issues.length > 0) {
    throw new LogisticsProviderAdapterConfigError(issues);
  }

  if (config.provider === "manual") {
    return createManualLogisticsAdapter({
      repository: options.repository,
      auditContext: options.auditContext,
      proofService: options.proofService,
      notificationService: options.notificationService,
      transaction: options.transaction,
      providerName: config.providerName,
    });
  }

  return createExternalProviderAdapter({
    providerName: config.providerName,
  });
}

/**
 * @param {import("./logistics-provider-adapter.d.ts").CreateManualLogisticsAdapterInput} input
 * @returns {import("./logistics-provider-adapter.d.ts").LogisticsProviderAdapter}
 */
export function createManualLogisticsAdapter(input) {
  if (!input?.repository) {
    throw new LogisticsProviderAdapterConfigError([
      "repository is required for the manual logistics adapter.",
    ]);
  }

  const providerName = normalizeOptionalString(input.providerName) ?? DEFAULT_MANUAL_PROVIDER_NAME;
  const service = createShipmentService({
    repository: input.repository,
    auditContext: input.auditContext,
    proofService: input.proofService,
    notificationService: input.notificationService,
    transaction: input.transaction,
  });

  return Object.freeze({
    providerKind: "manual",
    providerName,
    supportsExternalAutomation: false,
    async createShipment(command) {
      return service.createShipment({
        ...command,
        body: {
          ...command.body,
          providerName: normalizeOptionalString(command.body.providerName) ?? providerName,
          eventSource: command.body.eventSource ?? "MANUAL",
        },
      });
    },
    async attachTrackingReference(command) {
      return service.attachTrackingReference({
        ...command,
        body: normalizeLogisticsTrackingEvent(command.body, {
          defaultProviderName: providerName,
          eventSource: "MANUAL",
        }),
      });
    },
    async recordTrackingEvent(command) {
      const body = normalizeLogisticsTrackingEvent(command.event, {
        defaultProviderName: providerName,
        eventSource: "MANUAL",
      });

      return service.updateShipmentStatus({
        actor: command.actor,
        shipmentId: command.shipmentId,
        toStatus: body.toStatus,
        body,
      });
    },
    normalizeTrackingEvent(event) {
      return normalizeLogisticsTrackingEvent(event, {
        defaultProviderName: providerName,
        eventSource: "MANUAL",
      });
    },
  });
}

/**
 * @param {import("./logistics-provider-adapter.d.ts").CreateExternalProviderAdapterInput} [input]
 * @returns {import("./logistics-provider-adapter.d.ts").LogisticsProviderAdapter}
 */
export function createExternalProviderAdapter(input = {}) {
  const providerName = normalizeOptionalString(input.providerName) ?? DEFAULT_EXTERNAL_PROVIDER_NAME;

  return Object.freeze({
    providerKind: "external_placeholder",
    providerName,
    supportsExternalAutomation: false,
    async createShipment() {
      throw new LogisticsProviderAdapterUnavailableError(providerName);
    },
    async attachTrackingReference() {
      throw new LogisticsProviderAdapterUnavailableError(providerName);
    },
    async recordTrackingEvent() {
      throw new LogisticsProviderAdapterUnavailableError(providerName);
    },
    normalizeTrackingEvent(event) {
      return normalizeLogisticsTrackingEvent(event, {
        defaultProviderName: providerName,
        eventSource: "LOGISTICS_PROVIDER",
      });
    },
  });
}

/**
 * @param {import("./logistics-provider-adapter.d.ts").LogisticsTrackingEventInput | undefined} input
 * @param {import("./logistics-provider-adapter.d.ts").NormalizeLogisticsTrackingEventOptions} [options]
 * @returns {import("./shipment.d.ts").CreateShipmentTrackingEventInputBody}
 */
export function normalizeLogisticsTrackingEvent(input = {}, options = {}) {
  const issues = [];
  const providerStatus = normalizeOptionalString(input.providerStatus);
  const toStatus = normalizeShipmentStatus(input.toStatus, providerStatus);
  const providerName = normalizeOptionalString(input.providerName) ??
    normalizeOptionalString(options.defaultProviderName);

  if (!toStatus) {
    issues.push("toStatus or a recognized providerStatus is required.");
  }

  if (issues.length > 0) {
    throw new LogisticsTrackingEventNormalizationError(issues);
  }

  return Object.freeze({
    toStatus,
    providerName,
    providerTrackingId: normalizeOptionalString(input.providerTrackingId),
    trackingUrl: normalizeOptionalString(input.trackingUrl),
    eventSource: options.eventSource ?? input.eventSource ?? "LOGISTICS_PROVIDER",
    sourceEventId: normalizeOptionalString(input.sourceEventId),
    providerStatus,
    location: normalizeOptionalString(input.location),
    notes: normalizeOptionalString(input.notes),
    occurredAt: input.occurredAt,
    now: input.now,
  });
}

/**
 * @param {import("./logistics-provider-adapter.d.ts").LogisticsProviderAdapterRuntimeConfig | undefined} config
 * @returns {string[]}
 */
export function validateLogisticsProviderAdapterRuntimeConfig(config) {
  const issues = [];

  if (!config || typeof config !== "object") {
    return ["logistics provider adapter config is required."];
  }

  if (!LOGISTICS_PROVIDER_ADAPTER_KINDS.includes(
    /** @type {import("./logistics-provider-adapter.d.ts").LogisticsProviderAdapterKind} */ (config.provider),
  )) {
    issues.push("provider must be one of: manual, external_placeholder.");
  }

  validateOptionalNonBlankString(config.providerName, "providerName", issues);

  return issues;
}

/**
 * @param {unknown} toStatus
 * @param {string | null} providerStatus
 * @returns {import("./shipment.d.ts").ShipmentStatus | null}
 */
function normalizeShipmentStatus(toStatus, providerStatus) {
  if (isShipmentStatus(toStatus)) {
    return toStatus;
  }

  const normalizedProviderStatus = normalizeProviderStatus(providerStatus);

  if (!normalizedProviderStatus) {
    return null;
  }

  return /** @type {import("./shipment.d.ts").ShipmentStatus | undefined} */ (
    PROVIDER_STATUS_MAP[normalizedProviderStatus]
  ) ?? null;
}

/**
 * @param {string | null} value
 * @returns {string | null}
 */
function normalizeProviderStatus(value) {
  return value
    ? value.trim().toLowerCase().replaceAll(/[\s-]+/g, "_")
    : null;
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
