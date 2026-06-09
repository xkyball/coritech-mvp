// @ts-check

import {
  FUTURE_VERIFICATION_LEVELS,
  VERIFICATION_LEVELS,
  deriveVerificationLevel,
  isActivePhase1VerificationLevel,
  isVerificationLevel,
} from "./verification-level.mjs";

export {
  ACTIVE_PHASE_1_VERIFICATION_LEVELS,
  FUTURE_VERIFICATION_LEVELS,
  VERIFICATION_LEVEL_METADATA,
  VERIFICATION_LEVELS,
  deriveVerificationLevel,
  isActivePhase1VerificationLevel,
  isVerificationLevel,
  verificationLevelMetadataFor,
} from "./verification-level.mjs";

export const PROOF_EVENT_TYPES = /** @type {const} */ ([
  "SEMEN_ORDER_CREATED",
  "SUBMITTED",
  "CONFIRMED",
  "REJECTED",
  "SHIPMENT_CREATED",
  "SHIPMENT_STATUS_UPDATED",
  "SHIPMENT_CONFIRMED",
  "DOCUMENT_UPLOADED",
  "ORDER_COMPLETED",
  "ADMIN_CORRECTION_CREATED",
]);

export const PROOF_EVENT_SOURCES = /** @type {const} */ ([
  "ORDER_STATUS_CHANGE",
  "SHIPMENT_TRACKING_EVENT",
  "DOCUMENT_UPLOAD",
  "ADMIN_CORRECTION",
]);

export const PROOF_EVENT_STATUSES = /** @type {const} */ ([
  "RECORDED",
  "VOIDED",
]);

export const PROOF_EVENT_DELETION_POLICY = Object.freeze({
  supported: false,
  reason:
    "Proof events are append-only in Phase 1. Corrections must be represented by a later amendment/admin-correction workflow, not by silent deletion.",
});

const PHASE_1_ACTOR_ROLE_CODES = /** @type {const} */ ([
  "BREEDER",
  "BREEDING_STATION",
  "PLATFORM_ADMIN",
]);

const ORDER_EVENT_TYPES = Object.freeze([
  "SEMEN_ORDER_CREATED",
  "SUBMITTED",
  "CONFIRMED",
  "REJECTED",
  "ORDER_COMPLETED",
]);

const SHIPMENT_EVENT_TYPES = Object.freeze([
  "SHIPMENT_CREATED",
  "SHIPMENT_STATUS_UPDATED",
  "SHIPMENT_CONFIRMED",
]);

export class ProofEventValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech proof event input:\n- ${issues.join("\n- ")}`);
    this.name = "ProofEventValidationError";
    this.issues = issues;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./proof-event.d.ts").ProofEventType}
 */
export function isProofEventType(value) {
  return typeof value === "string" && PROOF_EVENT_TYPES.includes(
    /** @type {import("./proof-event.d.ts").ProofEventType} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./proof-event.d.ts").ProofEventSource}
 */
export function isProofEventSource(value) {
  return typeof value === "string" && PROOF_EVENT_SOURCES.includes(
    /** @type {import("./proof-event.d.ts").ProofEventSource} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./proof-event.d.ts").ProofEventStatus}
 */
export function isProofEventStatus(value) {
  return typeof value === "string" && PROOF_EVENT_STATUSES.includes(
    /** @type {import("./proof-event.d.ts").ProofEventStatus} */ (value),
  );
}

/**
 * Phase 1 exposes no normal delete path for proof events.
 *
 * @returns {false}
 */
export function canDeleteProofEvent() {
  return false;
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventInput} input
 * @returns {string[]}
 */
export function validateCreateProofEventInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["proof event input is required."];
  }

  const eventType = normalizeRequiredString(input.eventType);
  const source = normalizeRequiredString(input.source);
  const status = normalizeRequiredString(input.status) || "RECORDED";
  const verificationLevel = normalizeOptionalString(input.verificationLevel);

  if (!eventType) {
    issues.push("eventType is required.");
  } else if (!isProofEventType(eventType)) {
    issues.push(`eventType must be one of: ${PROOF_EVENT_TYPES.join(", ")}.`);
  }

  if (!source) {
    issues.push("source is required.");
  } else if (!isProofEventSource(source)) {
    issues.push(`source must be one of: ${PROOF_EVENT_SOURCES.join(", ")}.`);
  }

  if (!status) {
    issues.push("status is required.");
  } else if (!isProofEventStatus(status)) {
    issues.push(`status must be one of: ${PROOF_EVENT_STATUSES.join(", ")}.`);
  }

  validateRequiredNonBlankString(input.triggerType, "triggerType", issues);
  validateJsonObject(input.triggerRef, "triggerRef", issues);
  validateRequiredNonBlankString(input.lifecycleStage, "lifecycleStage", issues);
  validateActor(input.actor, issues);
  validateVerificationLevelForProofEvent(
    {
      eventType,
      actorRoleCode: actorRoleCodeFromInput(input.actor),
      verificationLevel,
    },
    issues,
  );
  validateJsonObject(input.auditHookRef, "auditHookRef", issues);
  validateOptionalJsonArray(input.documentationRefs, "documentationRefs", issues);
  validateOptionalJsonObject(input.signatureRef, "signatureRef", issues);
  validateOptionalJsonArray(input.attestationRefs, "attestationRefs", issues);
  validateOptionalNonBlankString(input.proofEventId, "proofEventId", issues);
  validateOptionalNonBlankString(input.semenOrderId, "semenOrderId", issues);
  validateOptionalNonBlankString(input.shipmentId, "shipmentId", issues);
  validateOptionalNonBlankString(input.horseId, "horseId", issues);
  validateOptionalNonBlankString(input.orderNumber, "orderNumber", issues);
  validateOptionalNonBlankString(
    input.breederOrganizationId,
    "breederOrganizationId",
    issues,
  );
  validateOptionalNonBlankString(
    input.breedingStationOrganizationId,
    "breedingStationOrganizationId",
    issues,
  );
  validateOptionalNonBlankString(input.auditLogId, "auditLogId", issues);
  validateOptionalTimestamp(input.occurredAt, "occurredAt", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (isProofEventType(eventType) && isProofEventSource(source)) {
    validateSourceEventTypePair(source, eventType, issues);
    validateOrderContextShape(input, issues);
    validateShipmentContextShape(input, issues);
    validateLinkContextForSource(source, input, issues);
  }

  return issues;
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventInput} input
 * @returns {import("./proof-event.d.ts").PreparedProofEventChange}
 */
export function prepareCreateProofEvent(input) {
  const issues = validateCreateProofEventInput(input);

  if (issues.length > 0) {
    throw new ProofEventValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.occurredAt ?? input.createdAt ?? input.now ?? new Date());
  const createdAt = toIsoTimestamp(input.createdAt ?? input.now ?? occurredAt);
  const proofEvent = Object.freeze({
    id: normalizeOptionalString(input.proofEventId),
    eventType: /** @type {import("./proof-event.d.ts").ProofEventType} */ (
      normalizeRequiredString(input.eventType)
    ),
    source: /** @type {import("./proof-event.d.ts").ProofEventSource} */ (
      normalizeRequiredString(input.source)
    ),
    triggerType: normalizeRequiredString(input.triggerType),
    triggerRef: /** @type {Readonly<Record<string, unknown>>} */ (
      freezeJsonValue(input.triggerRef)
    ),
    semenOrderId: normalizeOptionalString(input.semenOrderId),
    shipmentId: normalizeOptionalString(input.shipmentId),
    horseId: normalizeOptionalString(input.horseId),
    orderNumber: normalizeOptionalString(input.orderNumber),
    breederOrganizationId: normalizeOptionalString(input.breederOrganizationId),
    breedingStationOrganizationId: normalizeOptionalString(
      input.breedingStationOrganizationId,
    ),
    lifecycleStage:
      /** @type {import("./proof-event.d.ts").ProofEventLifecycleStage} */ (
        normalizeRequiredString(input.lifecycleStage)
      ),
    verificationLevel: resolveVerificationLevelForProofEvent({
      eventType: normalizeRequiredString(input.eventType),
      actorRoleCode: input.actor.roleCode.trim(),
      verificationLevel: normalizeOptionalString(input.verificationLevel),
    }),
    status: /** @type {import("./proof-event.d.ts").ProofEventStatus} */ (
      normalizeRequiredString(input.status) || "RECORDED"
    ),
    actorUserId: input.actor.userId.trim(),
    actorRoleCode: /** @type {import("./proof-event.d.ts").ProofEventActorRoleCode} */ (
      input.actor.roleCode.trim()
    ),
    actorOrganizationId: input.actor.organizationId.trim(),
    documentationRefs: /** @type {readonly unknown[]} */ (
      freezeJsonValue(input.documentationRefs ?? [])
    ),
    signatureRef: input.signatureRef === undefined || input.signatureRef === null
      ? null
      : /** @type {Readonly<Record<string, unknown>>} */ (
        freezeJsonValue(input.signatureRef)
      ),
    attestationRefs: /** @type {readonly unknown[]} */ (
      freezeJsonValue(input.attestationRefs ?? [])
    ),
    auditLogId: normalizeOptionalString(input.auditLogId),
    auditHookRef: /** @type {Readonly<Record<string, unknown>>} */ (
      freezeJsonValue(input.auditHookRef)
    ),
    occurredAt,
    createdAt,
    updatedAt: createdAt,
  });

  return Object.freeze({
    proofEvent,
    auditHook: buildProofEventCreationAuditHook({ proofEvent }),
  });
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventFromHookInput} input
 * @returns {string[]}
 */
export function validateCreateProofEventFromHookInput(input) {
  try {
    return validateCreateProofEventInput(createProofEventInputFromHook(input));
  } catch (error) {
    if (error instanceof ProofEventValidationError) {
      return [...error.issues];
    }

    throw error;
  }
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventFromHookInput} input
 * @returns {import("./proof-event.d.ts").PreparedProofEventChange}
 */
export function prepareProofEventFromHook(input) {
  return prepareCreateProofEvent(createProofEventInputFromHook(input));
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventFromHookServiceInput} input
 * @returns {Promise<import("./proof-event.d.ts").PersistedProofEventChange>}
 */
export async function createProofEventFromHook(input) {
  const createProofEvent = requireRepositoryMethod(input.repository, "createProofEvent");
  const prepared = prepareProofEventFromHook(input);
  const proofEvent = await createProofEvent(prepared.proofEvent);

  return Object.freeze({
    proofEvent,
    auditHook: buildProofEventCreationAuditHook({ proofEvent }),
  });
}

/**
 * @param {{ proofEvent: import("./proof-event.d.ts").ProofEvent }} input
 * @returns {import("./proof-event.d.ts").ProofEventCreationAuditHook}
 */
export function buildProofEventCreationAuditHook(input) {
  return Object.freeze({
    eventType: "PROOF_EVENT",
    action: "PROOF_EVENT_CREATED",
    actorUserId: input.proofEvent.actorUserId,
    actorRoleCode: input.proofEvent.actorRoleCode,
    actorOrganizationId: input.proofEvent.actorOrganizationId,
    targetType: "ProofEvent",
    targetId: input.proofEvent.id,
    targetRef: Object.freeze({
      proofEventId: input.proofEvent.id,
      proofEventType: input.proofEvent.eventType,
      source: input.proofEvent.source,
      semenOrderId: input.proofEvent.semenOrderId,
      shipmentId: input.proofEvent.shipmentId,
      horseId: input.proofEvent.horseId,
      verificationLevel: input.proofEvent.verificationLevel,
      status: input.proofEvent.status,
    }),
    reason: null,
    occurredAt: input.proofEvent.createdAt,
  });
}

/**
 * @param {import("../orders/semen-order.d.ts").SemenOrderStatus} toStatus
 * @returns {import("./proof-event.d.ts").ProofEventType | null}
 */
export function proofEventTypeForOrderStatus(toStatus) {
  switch (toStatus) {
    case "DRAFT":
      return "SEMEN_ORDER_CREATED";
    case "SUBMITTED":
      return "SUBMITTED";
    case "CONFIRMED":
      return "CONFIRMED";
    case "REJECTED":
      return "REJECTED";
    case "COMPLETED":
      return "ORDER_COMPLETED";
    default:
      return null;
  }
}

/**
 * @param {import("../shipments/shipment.d.ts").ShipmentTrackingAuditAction} action
 * @param {import("../shipments/shipment.d.ts").ShipmentStatus} toStatus
 * @returns {import("./proof-event.d.ts").ProofEventType}
 */
export function proofEventTypeForShipmentStatus(action, toStatus) {
  if (action === "SHIPMENT_CREATED") {
    return "SHIPMENT_CREATED";
  }

  return toStatus === "DELIVERED"
    ? "SHIPMENT_CONFIRMED"
    : "SHIPMENT_STATUS_UPDATED";
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventFromHookInput} input
 * @returns {import("./proof-event.d.ts").CreateProofEventInput}
 */
function createProofEventInputFromHook(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    throw new ProofEventValidationError(["proofHook input is required."]);
  }

  const hook = input.proofHook;

  if (!hook || typeof hook !== "object") {
    throw new ProofEventValidationError(["proofHook is required."]);
  }

  if (hook.hookType !== "PROOF_EVENT_REQUEST") {
    throw new ProofEventValidationError(["proofHook.hookType must be PROOF_EVENT_REQUEST."]);
  }

  if (hook.source === "ORDER_STATUS_CHANGE") {
    return createOrderProofEventInputFromHook(input);
  }

  if (hook.source === "SHIPMENT_TRACKING_EVENT") {
    return createShipmentProofEventInputFromHook(input);
  }

  issues.push("proofHook.source must be ORDER_STATUS_CHANGE or SHIPMENT_TRACKING_EVENT for Ticket 1.6 hook generation.");
  throw new ProofEventValidationError(issues);
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventFromHookInput} input
 * @returns {import("./proof-event.d.ts").CreateProofEventInput}
 */
function createOrderProofEventInputFromHook(input) {
  const hook = /** @type {import("../orders/semen-order.d.ts").SemenOrderProofHook} */ (
    input.proofHook
  );
  const eventType = proofEventTypeForOrderStatus(hook.triggerRef.toStatus);

  if (!eventType) {
    throw new ProofEventValidationError([
      `order status ${hook.triggerRef.toStatus} is not a Ticket 1.6 proof-event milestone.`,
    ]);
  }

  return {
    proofEventId: input.proofEventId,
    eventType,
    source: "ORDER_STATUS_CHANGE",
    triggerType: hook.triggerType,
    triggerRef: hook.triggerRef,
    semenOrderId: hook.triggerRef.targetId,
    shipmentId: null,
    horseId: input.horseId,
    orderNumber: hook.triggerRef.orderNumber,
    breederOrganizationId: hook.triggerRef.breederOrganizationId,
    breedingStationOrganizationId: hook.triggerRef.breedingStationOrganizationId,
    lifecycleStage: lifecycleStageForProofEventType(eventType),
    verificationLevel: input.verificationLevel,
    actor: hook.actorRef,
    documentationRefs: hook.documentationRefs,
    signatureRef: hook.signatureRef,
    attestationRefs: input.attestationRefs,
    auditLogId: input.auditLogId,
    auditHookRef: hook.auditHookRef,
    occurredAt: hook.occurredAt,
    createdAt: input.createdAt,
    now: input.now,
  };
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventFromHookInput} input
 * @returns {import("./proof-event.d.ts").CreateProofEventInput}
 */
function createShipmentProofEventInputFromHook(input) {
  const hook = /** @type {import("../shipments/shipment.d.ts").ShipmentProofHook} */ (
    input.proofHook
  );
  const action = /** @type {import("../shipments/shipment.d.ts").ShipmentTrackingAuditAction} */ (
    hook.auditHookRef.action
  );
  const eventType = proofEventTypeForShipmentStatus(action, hook.triggerRef.toStatus);

  return {
    proofEventId: input.proofEventId,
    eventType,
    source: "SHIPMENT_TRACKING_EVENT",
    triggerType: hook.triggerType,
    triggerRef: hook.triggerRef,
    semenOrderId: hook.triggerRef.semenOrderId,
    shipmentId: hook.triggerRef.targetId,
    horseId: input.horseId,
    orderNumber: hook.triggerRef.orderNumber,
    breederOrganizationId: hook.triggerRef.breederOrganizationId,
    breedingStationOrganizationId: hook.triggerRef.breedingStationOrganizationId,
    lifecycleStage: lifecycleStageForProofEventType(eventType),
    verificationLevel: input.verificationLevel,
    actor: hook.actorRef,
    documentationRefs: hook.documentationRefs,
    signatureRef: hook.signatureRef,
    attestationRefs: input.attestationRefs,
    auditLogId: input.auditLogId,
    auditHookRef: hook.auditHookRef,
    occurredAt: hook.occurredAt,
    createdAt: input.createdAt,
    now: input.now,
  };
}

/**
 * @param {import("./proof-event.d.ts").ProofEventType} eventType
 * @returns {import("./proof-event.d.ts").ProofEventLifecycleStage}
 */
function lifecycleStageForProofEventType(eventType) {
  switch (eventType) {
    case "SEMEN_ORDER_CREATED":
      return "ORDER_CREATED";
    case "SUBMITTED":
      return "ORDER_SUBMITTED";
    case "CONFIRMED":
      return "ORDER_CONFIRMED";
    case "REJECTED":
      return "ORDER_REJECTED";
    case "ORDER_COMPLETED":
      return "ORDER_COMPLETED";
    case "SHIPMENT_CREATED":
      return "SHIPMENT_CREATED";
    case "SHIPMENT_CONFIRMED":
      return "SHIPMENT_CONFIRMED";
    case "DOCUMENT_UPLOADED":
      return "DOCUMENTATION";
    case "ADMIN_CORRECTION_CREATED":
      return "ADMIN_CORRECTION";
    case "SHIPMENT_STATUS_UPDATED":
    default:
      return "SHIPMENT_UPDATED";
  }
}

/**
 * @param {import("./proof-event.d.ts").ProofEventSource} source
 * @param {import("./proof-event.d.ts").ProofEventType} eventType
 * @param {string[]} issues
 * @returns {void}
 */
function validateSourceEventTypePair(source, eventType, issues) {
  if (source === "ORDER_STATUS_CHANGE" && !ORDER_EVENT_TYPES.includes(eventType)) {
    issues.push("ORDER_STATUS_CHANGE proof events must use an order event type.");
  }

  if (source === "SHIPMENT_TRACKING_EVENT" && !SHIPMENT_EVENT_TYPES.includes(eventType)) {
    issues.push("SHIPMENT_TRACKING_EVENT proof events must use a shipment event type.");
  }

  if (source === "DOCUMENT_UPLOAD" && eventType !== "DOCUMENT_UPLOADED") {
    issues.push("DOCUMENT_UPLOAD proof events must use DOCUMENT_UPLOADED.");
  }

  if (source === "ADMIN_CORRECTION" && eventType !== "ADMIN_CORRECTION_CREATED") {
    issues.push("ADMIN_CORRECTION proof events must use ADMIN_CORRECTION_CREATED.");
  }
}

/**
 * @param {import("./proof-event.d.ts").ProofEventSource} source
 * @param {import("./proof-event.d.ts").CreateProofEventInput} input
 * @param {string[]} issues
 * @returns {void}
 */
function validateLinkContextForSource(source, input, issues) {
  if (
    !normalizeOptionalString(input.semenOrderId) &&
    !normalizeOptionalString(input.shipmentId) &&
    !normalizeOptionalString(input.horseId)
  ) {
    issues.push("proof event must link to an order, shipment or horse.");
  }

  if (source === "ORDER_STATUS_CHANGE") {
    validateRequiredLinkField(input.semenOrderId, "semenOrderId", issues);
    validateRequiredLinkField(input.orderNumber, "orderNumber", issues);
    validateRequiredLinkField(
      input.breederOrganizationId,
      "breederOrganizationId",
      issues,
    );
    validateRequiredLinkField(
      input.breedingStationOrganizationId,
      "breedingStationOrganizationId",
      issues,
    );

    if (normalizeOptionalString(input.shipmentId)) {
      issues.push("ORDER_STATUS_CHANGE proof events must not link to a shipment.");
    }
  }

  if (source === "SHIPMENT_TRACKING_EVENT") {
    validateRequiredLinkField(input.shipmentId, "shipmentId", issues);
    validateRequiredLinkField(input.semenOrderId, "semenOrderId", issues);
    validateRequiredLinkField(input.orderNumber, "orderNumber", issues);
    validateRequiredLinkField(
      input.breederOrganizationId,
      "breederOrganizationId",
      issues,
    );
    validateRequiredLinkField(
      input.breedingStationOrganizationId,
      "breedingStationOrganizationId",
      issues,
    );
  }
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventInput} input
 * @param {string[]} issues
 * @returns {void}
 */
function validateOrderContextShape(input, issues) {
  const orderFields = [
    input.semenOrderId,
    input.orderNumber,
    input.breederOrganizationId,
    input.breedingStationOrganizationId,
  ];
  const hasAnyOrderField = orderFields.some((value) => normalizeOptionalString(value));
  const hasEveryOrderField = orderFields.every((value) => normalizeOptionalString(value));

  if (hasAnyOrderField && !hasEveryOrderField) {
    issues.push(
      "order-linked proof events must include semenOrderId, orderNumber, breederOrganizationId and breedingStationOrganizationId.",
    );
  }
}

/**
 * @param {import("./proof-event.d.ts").CreateProofEventInput} input
 * @param {string[]} issues
 * @returns {void}
 */
function validateShipmentContextShape(input, issues) {
  if (
    normalizeOptionalString(input.shipmentId) &&
    !(
      normalizeOptionalString(input.semenOrderId) &&
      normalizeOptionalString(input.orderNumber)
    )
  ) {
    issues.push(
      "shipment-linked proof events must include shipmentId, semenOrderId and orderNumber.",
    );
  }
}

/**
 * @param {unknown} actor
 * @param {string[]} issues
 * @returns {void}
 */
function validateActor(actor, issues) {
  if (!actor || typeof actor !== "object") {
    issues.push("actor is required.");
    return;
  }

  const actorRef = /** @type {Partial<import("./proof-event.d.ts").ProofEventActorRef>} */ (actor);
  const roleCode = normalizeRequiredString(actorRef.roleCode);

  validateRequiredNonBlankString(actorRef.userId, "actor.userId", issues);
  validateRequiredNonBlankString(actorRef.roleCode, "actor.roleCode", issues);
  validateRequiredNonBlankString(
    actorRef.organizationId,
    "actor.organizationId",
    issues,
  );

  if (roleCode && !PHASE_1_ACTOR_ROLE_CODES.includes(
    /** @type {import("./proof-event.d.ts").ProofEventActorRoleCode} */ (roleCode),
  )) {
    issues.push(
      `actor.roleCode must be one of: ${PHASE_1_ACTOR_ROLE_CODES.join(", ")}.`,
    );
  }
}

/**
 * @param {{
 *   eventType: string,
 *   actorRoleCode: string,
 *   verificationLevel: string | null,
 * }} input
 * @param {string[]} issues
 * @returns {void}
 */
function validateVerificationLevelForProofEvent(input, issues) {
  if (input.verificationLevel && !isVerificationLevel(input.verificationLevel)) {
    issues.push(
      `verificationLevel must be one of: ${VERIFICATION_LEVELS.join(", ")}.`,
    );
    return;
  }

  if (
    input.verificationLevel &&
    FUTURE_VERIFICATION_LEVELS.includes(
      /** @type {import("./verification-level.d.ts").FutureVerificationLevel} */ (
        input.verificationLevel
      ),
    )
  ) {
    issues.push(
      `verificationLevel ${input.verificationLevel} is reserved for a future phase and is not active in Phase 1.`,
    );
    return;
  }

  if (!isProofEventType(input.eventType) || !isPhase1ActorRoleCode(input.actorRoleCode)) {
    return;
  }

  const derivedVerificationLevel = deriveVerificationLevel({
    eventType: input.eventType,
    actorRoleCode: input.actorRoleCode,
  });

  if (!derivedVerificationLevel) {
    issues.push("verificationLevel could not be derived from eventType and actor.roleCode.");
    return;
  }

  if (
    input.verificationLevel &&
    isActivePhase1VerificationLevel(input.verificationLevel) &&
    input.verificationLevel !== derivedVerificationLevel
  ) {
    issues.push(
      `verificationLevel must be ${derivedVerificationLevel} for ${input.eventType} by ${input.actorRoleCode}.`,
    );
  }
}

/**
 * @param {{
 *   eventType: import("./proof-event.d.ts").ProofEventType | string,
 *   actorRoleCode: import("./proof-event.d.ts").ProofEventActorRoleCode | string,
 *   verificationLevel: string | null,
 * }} input
 * @returns {import("./verification-level.d.ts").ActivePhase1VerificationLevel}
 */
function resolveVerificationLevelForProofEvent(input) {
  const derivedVerificationLevel = deriveVerificationLevel({
    eventType: input.eventType,
    actorRoleCode: input.actorRoleCode,
  });

  if (!derivedVerificationLevel) {
    throw new ProofEventValidationError([
      "verificationLevel could not be derived from eventType and actor.roleCode.",
    ]);
  }

  if (
    input.verificationLevel &&
    input.verificationLevel !== derivedVerificationLevel
  ) {
    throw new ProofEventValidationError([
      `verificationLevel must be ${derivedVerificationLevel} for ${input.eventType} by ${input.actorRoleCode}.`,
    ]);
  }

  return derivedVerificationLevel;
}

/**
 * @param {unknown} actor
 * @returns {string}
 */
function actorRoleCodeFromInput(actor) {
  if (!actor || typeof actor !== "object") {
    return "";
  }

  return normalizeRequiredString(
    /** @type {Partial<import("./proof-event.d.ts").ProofEventActorRef>} */ (actor)
      .roleCode,
  );
}

/**
 * @param {string} value
 * @returns {value is import("./proof-event.d.ts").ProofEventActorRoleCode}
 */
function isPhase1ActorRoleCode(value) {
  return PHASE_1_ACTOR_ROLE_CODES.includes(
    /** @type {import("./proof-event.d.ts").ProofEventActorRoleCode} */ (value),
  );
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredLinkField(value, fieldName, issues) {
  if (!normalizeRequiredString(value)) {
    issues.push(`${fieldName} is required for this proof event source.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredNonBlankString(value, fieldName, issues) {
  if (!normalizeRequiredString(value)) {
    issues.push(`${fieldName} is required.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${fieldName} cannot be blank when provided.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateJsonObject(value, fieldName, issues) {
  if (!isPlainObject(value)) {
    issues.push(`${fieldName} must be a JSON object.`);
    return;
  }

  if (!isJsonValue(value)) {
    issues.push(`${fieldName} must contain only JSON-safe values.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalJsonObject(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  validateJsonObject(value, fieldName, issues);
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalJsonArray(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (!Array.isArray(value)) {
    issues.push(`${fieldName} must be a JSON array.`);
    return;
  }

  if (!isJsonValue(value)) {
    issues.push(`${fieldName} must contain only JSON-safe values.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalTimestamp(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (!isValidTimestamp(value)) {
    issues.push(`${fieldName} must be a valid date or ISO timestamp.`);
  }
}

/**
 * @param {unknown} repository
 * @param {string} methodName
 * @returns {Function}
 */
function requireRepositoryMethod(repository, methodName) {
  if (!repository || typeof repository !== "object") {
    throw new TypeError("repository is required.");
  }

  const method = /** @type {Record<string, unknown>} */ (repository)[methodName];

  if (typeof method !== "function") {
    throw new TypeError(`repository.${methodName} is required.`);
  }

  return method.bind(repository);
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.getPrototypeOf(value) === Object.prototype,
  );
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isJsonValue(value) {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return Number.isFinite(value) || typeof value !== "number";
  }

  if (Array.isArray(value)) {
    return value.every((item) => isJsonValue(item));
  }

  if (isPlainObject(value)) {
    return Object.values(value).every((item) => isJsonValue(item));
  }

  return false;
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function freezeJsonValue(value) {
  if (Array.isArray(value)) {
    return Object.freeze(value.map((item) => freezeJsonValue(item)));
  }

  if (isPlainObject(value)) {
    return Object.freeze(
      Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, freezeJsonValue(item)]),
      ),
    );
  }

  return value;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidTimestamp(value) {
  if (!(typeof value === "string" || value instanceof Date)) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
