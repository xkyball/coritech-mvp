// @ts-check

import { sendNotificationEmail } from "./email-provider.mjs";

const ORDER_EVENTS_TO_BREEDER = new Set([
  "ORDER_RECEIVED",
  "ORDER_CONFIRMED",
  "ORDER_REJECTED",
]);
const SHIPMENT_EVENTS_TO_BREEDER = new Set([
  "SHIPMENT_CREATED",
  "SHIPMENT_STATUS_UPDATED",
  "SHIPMENT_DELIVERED",
]);

export class NotificationOrchestrationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech notification orchestration input:\n- ${issues.join("\n- ")}`);
    this.name = "NotificationOrchestrationError";
    this.issues = issues;
  }
}

/**
 * @param {import("./notification-orchestration.d.ts").NotificationOrchestrationServiceOptions} options
 * @returns {import("./notification-orchestration.d.ts").NotificationOrchestrationService}
 */
export function createNotificationOrchestrationService(options) {
  validateServiceOptions(options);

  return Object.freeze({
    recordOrderNotificationHook(hook) {
      return dispatchOrderNotification({
        ...options,
        hook,
      });
    },
    enqueueOrderNotification(hook) {
      return dispatchOrderNotification({
        ...options,
        hook,
      });
    },
    recordShipmentNotificationHook(hook) {
      return dispatchShipmentNotification({
        ...options,
        hook,
      });
    },
    enqueueShipmentNotification(hook) {
      return dispatchShipmentNotification({
        ...options,
        hook,
      });
    },
    sendDocumentUploadNotification(document) {
      return dispatchDocumentUploadNotification({
        ...options,
        document,
      });
    },
  });
}

/**
 * @param {import("./notification-orchestration.d.ts").DispatchOrderNotificationInput} input
 * @returns {Promise<import("./notification-orchestration.d.ts").NotificationDispatchResult>}
 */
export async function dispatchOrderNotification(input) {
  validateServiceOptions(input);

  if (!input.hook) {
    return skippedResult("ORDER", null, "no notification hook supplied");
  }

  const plan = await buildOrderNotificationPlan(input);

  if (!plan) {
    return skippedResult("ORDER", input.hook.eventType, "event has no Phase 1 notification rule");
  }

  return dispatchNotificationPlan({
    ...input,
    occurredAt: input.hook.occurredAt,
    plan,
  });
}

/**
 * @param {import("./notification-orchestration.d.ts").DispatchShipmentNotificationInput} input
 * @returns {Promise<import("./notification-orchestration.d.ts").NotificationDispatchResult>}
 */
export async function dispatchShipmentNotification(input) {
  validateServiceOptions(input);

  if (!input.hook) {
    return skippedResult("SHIPMENT", null, "no notification hook supplied");
  }

  const plan = await buildShipmentNotificationPlan(input);

  if (!plan) {
    return skippedResult("SHIPMENT", input.hook.eventType, "event has no Phase 1 notification rule");
  }

  return dispatchNotificationPlan({
    ...input,
    occurredAt: input.hook.occurredAt,
    plan,
  });
}

/**
 * @param {import("./notification-orchestration.d.ts").DispatchDocumentUploadNotificationInput} input
 * @returns {Promise<import("./notification-orchestration.d.ts").NotificationDispatchResult>}
 */
export async function dispatchDocumentUploadNotification(input) {
  validateServiceOptions(input);

  if (!input.document) {
    return skippedResult("DOCUMENT", null, "no document supplied");
  }

  const plan = buildDocumentUploadNotificationPlan(input.document);

  if (!plan) {
    return skippedResult("DOCUMENT", "DOCUMENT_UPLOADED", "document has no Phase 1 notification rule");
  }

  return dispatchNotificationPlan({
    ...input,
    occurredAt: input.document.createdAt,
    plan,
  });
}

/**
 * @param {import("./notification-orchestration.d.ts").DispatchNotificationPlanInput} input
 * @returns {Promise<import("./notification-orchestration.d.ts").NotificationDispatchResult>}
 */
async function dispatchNotificationPlan(input) {
  const recipients = await resolveRecipients({
    queries: input.plan.recipientQueries,
    recipientResolver: input.recipientResolver,
  });

  if (recipients.length === 0) {
    return Object.freeze({
      ok: true,
      source: input.plan.source,
      eventType: input.plan.eventType,
      skipped: true,
      skipReason: "no active recipients matched the notification rule",
      recipients,
      deliveries: Object.freeze([]),
    });
  }

  const deliveries = [];

  for (const recipient of recipients) {
    deliveries.push(await sendNotificationEmail({
      eventType: input.plan.eventType,
      variables: input.plan.variables,
      recipient,
      payload: input.plan.payload,
      provider: input.provider,
      logRepository: input.logRepository,
      now: input.occurredAt ?? input.now,
    }));
  }

  return Object.freeze({
    ok: deliveries.every((delivery) => delivery.ok),
    source: input.plan.source,
    eventType: input.plan.eventType,
    skipped: false,
    skipReason: null,
    recipients: Object.freeze(recipients),
    deliveries: Object.freeze(deliveries),
  });
}

/**
 * @param {import("./notification-orchestration.d.ts").BuildOrderNotificationPlanInput} input
 * @returns {Promise<import("./notification-orchestration.d.ts").NotificationDispatchPlan | null>}
 */
async function buildOrderNotificationPlan(input) {
  const hook = input.hook;
  const breederOrganizationName = await resolveOrganizationName(
    input.recipientResolver,
    hook.orderRef.breederOrganizationId,
  );
  const stationOrganizationName = await resolveOrganizationName(
    input.recipientResolver,
    hook.orderRef.breedingStationOrganizationId,
  );
  const basePayload = Object.freeze({
    source: hook.source,
    commandName: hook.commandName,
    orderRef: hook.orderRef,
    actorRef: hook.actorRef,
  });

  if (hook.eventType === "ORDER_SUBMITTED") {
    return Object.freeze({
      source: "ORDER",
      eventType: hook.eventType,
      variables: Object.freeze({
        orderNumber: hook.orderRef.orderNumber,
        breederOrganizationName,
      }),
      payload: basePayload,
      recipientQueries: Object.freeze([
        query({
          recipientRule: "ORDER_BREEDING_STATION",
          organizationId: hook.orderRef.breedingStationOrganizationId,
          roleCode: "BREEDING_STATION",
        }),
      ]),
    });
  }

  if (ORDER_EVENTS_TO_BREEDER.has(hook.eventType)) {
    return Object.freeze({
      source: "ORDER",
      eventType: hook.eventType,
      variables: Object.freeze({
        orderNumber: hook.orderRef.orderNumber,
        stationOrganizationName,
        reason: hook.reason ?? "Reason recorded in CoriTech.",
      }),
      payload: basePayload,
      recipientQueries: Object.freeze([
        query({
          recipientRule: "ORDER_BREEDER",
          organizationId: hook.orderRef.breederOrganizationId,
          roleCode: "BREEDER",
        }),
      ]),
    });
  }

  if (hook.eventType === "ORDER_CANCELLED") {
    const notifyStation = hook.actorRef.roleCode === "BREEDER";

    return Object.freeze({
      source: "ORDER",
      eventType: hook.eventType,
      variables: Object.freeze({
        orderNumber: hook.orderRef.orderNumber,
        reason: hook.reason ?? "Reason recorded in CoriTech.",
      }),
      payload: basePayload,
      recipientQueries: Object.freeze([
        query({
          recipientRule: notifyStation ? "ORDER_BREEDING_STATION" : "ORDER_BREEDER",
          organizationId: notifyStation
            ? hook.orderRef.breedingStationOrganizationId
            : hook.orderRef.breederOrganizationId,
          roleCode: notifyStation ? "BREEDING_STATION" : "BREEDER",
          excludeUserId: hook.actorRef.userId,
        }),
      ]),
    });
  }

  return null;
}

/**
 * @param {import("./notification-orchestration.d.ts").BuildShipmentNotificationPlanInput} input
 * @returns {Promise<import("./notification-orchestration.d.ts").NotificationDispatchPlan | null>}
 */
async function buildShipmentNotificationPlan(input) {
  const hook = input.hook;

  if (!SHIPMENT_EVENTS_TO_BREEDER.has(hook.eventType)) {
    return null;
  }

  const stationOrganizationName = await resolveOrganizationName(
    input.recipientResolver,
    hook.breedingStationOrganizationId,
  );

  return Object.freeze({
    source: "SHIPMENT",
    eventType: hook.eventType,
    variables: Object.freeze({
      orderNumber: hook.orderNumber,
      shipmentStatus: formatStatusLabel(hook.toStatus),
      stationOrganizationName,
    }),
    payload: Object.freeze({
      source: "SHIPMENT_COMMAND",
      commandName: hook.commandName,
      shipmentId: hook.shipmentId,
      semenOrderId: hook.semenOrderId,
      orderNumber: hook.orderNumber,
      fromStatus: hook.fromStatus,
      toStatus: hook.toStatus,
      trackingEventId: hook.trackingEventId,
    }),
    recipientQueries: Object.freeze([
      query({
        recipientRule: "ORDER_BREEDER",
        organizationId: hook.breederOrganizationId,
        roleCode: "BREEDER",
      }),
    ]),
  });
}

/**
 * @param {import("../documents/document-evidence.d.ts").DocumentLike} document
 * @returns {import("./notification-orchestration.d.ts").NotificationDispatchPlan | null}
 */
function buildDocumentUploadNotificationPlan(document) {
  const queries = [];

  if (document.accessClassification === "ADMIN_ONLY") {
    queries.push(query({
      recipientRule: "PLATFORM_ADMIN",
      roleCode: "PLATFORM_ADMIN",
      excludeUserId: document.uploadedByUserId,
    }));
  } else if (document.accessClassification === "INTERNAL") {
    queries.push(query({
      recipientRule: "DOCUMENT_RELEVANT_ROLE",
      organizationId: document.breedingStationOrganizationId,
      roleCode: "BREEDING_STATION",
      excludeUserId: document.uploadedByUserId,
    }));
  } else if (document.accessClassification === "RESTRICTED") {
    queries.push(query({
      recipientRule: "DOCUMENT_RELEVANT_ROLE",
      organizationId: document.uploaderOrganizationId,
      roleCode: document.uploaderRoleCode,
      excludeUserId: document.uploadedByUserId,
    }));
    queries.push(query({
      recipientRule: "PLATFORM_ADMIN",
      roleCode: "PLATFORM_ADMIN",
      excludeUserId: document.uploadedByUserId,
    }));
  } else if (
    document.accessClassification === "ORDER_PARTICIPANTS" ||
    document.accessClassification === "BUYER_VIEW_ELIGIBLE"
  ) {
    queries.push(query({
      recipientRule: "DOCUMENT_RELEVANT_ROLE",
      organizationId: document.breederOrganizationId,
      roleCode: "BREEDER",
      excludeUserId: document.uploadedByUserId,
    }));
    queries.push(query({
      recipientRule: "DOCUMENT_RELEVANT_ROLE",
      organizationId: document.breedingStationOrganizationId,
      roleCode: "BREEDING_STATION",
      excludeUserId: document.uploadedByUserId,
    }));
  }

  if (queries.length === 0) {
    return null;
  }

  return Object.freeze({
    source: "DOCUMENT",
    eventType: "DOCUMENT_UPLOADED",
    variables: Object.freeze({
      orderNumber: document.orderNumber ?? document.targetId,
      documentType: document.documentType,
    }),
    payload: Object.freeze({
      source: "DOCUMENT_UPLOAD",
      documentId: document.id,
      targetType: document.targetType,
      targetId: document.targetId,
      semenOrderId: document.semenOrderId,
      shipmentId: document.shipmentId,
      orderNumber: document.orderNumber,
      accessClassification: document.accessClassification,
    }),
    recipientQueries: Object.freeze(queries),
  });
}

/**
 * @param {{
 *   recipientResolver: import("./notification-orchestration.d.ts").NotificationRecipientResolver;
 *   queries: readonly import("./notification-orchestration.d.ts").NotificationRecipientQuery[];
 * }} input
 * @returns {Promise<import("./email-provider.d.ts").EmailRecipientContext[]>}
 */
async function resolveRecipients(input) {
  const recipients = [];

  for (const recipientQuery of input.queries) {
    const resolved = await input.recipientResolver.listNotificationRecipients(recipientQuery);
    recipients.push(...resolved);
  }

  const seen = new Set();

  return recipients.filter((recipient) => {
    const key = `${recipient.email.toLowerCase()}|${recipient.userId ?? ""}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

/**
 * @param {import("./notification-orchestration.d.ts").NotificationRecipientResolver} recipientResolver
 * @param {string | null | undefined} organizationId
 * @returns {Promise<string>}
 */
async function resolveOrganizationName(recipientResolver, organizationId) {
  const normalizedOrganizationId = normalizeOptionalString(organizationId);

  if (!normalizedOrganizationId) {
    return "Unknown organization";
  }

  if (typeof recipientResolver.findNotificationOrganizationById !== "function") {
    return normalizedOrganizationId;
  }

  const organization = await recipientResolver.findNotificationOrganizationById(
    normalizedOrganizationId,
  );

  return organization?.name ?? normalizedOrganizationId;
}

/**
 * @param {Omit<import("./notification-orchestration.d.ts").NotificationRecipientQuery, "recipientRule"> & { recipientRule: string }} input
 * @returns {import("./notification-orchestration.d.ts").NotificationRecipientQuery}
 */
function query(input) {
  return Object.freeze({
    recipientRule: input.recipientRule,
    organizationId: normalizeOptionalString(input.organizationId),
    roleCode: normalizeOptionalString(input.roleCode),
    excludeUserId: normalizeOptionalString(input.excludeUserId),
  });
}

/**
 * @param {unknown} options
 * @returns {void}
 */
function validateServiceOptions(options) {
  const value = /** @type {Partial<import("./notification-orchestration.d.ts").NotificationOrchestrationServiceOptions>} */ (options);
  const issues = [];

  if (!value || typeof value !== "object") {
    throw new NotificationOrchestrationError(["options are required."]);
  }

  if (!value.provider || typeof value.provider.sendEmail !== "function") {
    issues.push("provider with sendEmail is required.");
  }

  if (!value.logRepository || typeof value.logRepository.createNotificationLog !== "function") {
    issues.push("logRepository with createNotificationLog is required.");
  }

  if (!value.recipientResolver || typeof value.recipientResolver.listNotificationRecipients !== "function") {
    issues.push("recipientResolver with listNotificationRecipients is required.");
  }

  if (issues.length > 0) {
    throw new NotificationOrchestrationError(issues);
  }
}

/**
 * @param {import("./notification-orchestration.d.ts").NotificationDispatchSource} source
 * @param {string | null} eventType
 * @param {string} reason
 */
function skippedResult(source, eventType, reason) {
  return Object.freeze({
    ok: true,
    source,
    eventType,
    skipped: true,
    skipReason: reason,
    recipients: Object.freeze([]),
    deliveries: Object.freeze([]),
  });
}

/**
 * @param {string} status
 * @returns {string}
 */
function formatStatusLabel(status) {
  return status.toLowerCase().replaceAll("_", " ");
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
