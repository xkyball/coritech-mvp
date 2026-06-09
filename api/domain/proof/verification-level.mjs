// @ts-check

export const VERIFICATION_LEVEL_METADATA = Object.freeze([
  Object.freeze({
    code: "SELF_REPORTED",
    label: "Self reported",
    badgeLabel: "Self reported",
    badgeTone: "neutral",
    activeInPhase1: true,
    phase: "Phase 1",
    sortOrder: 10,
    description:
      "A breeder-entered or participant-entered workflow fact that has not been confirmed by the station or reviewed by an admin.",
  }),
  Object.freeze({
    code: "SYSTEM_RECORDED",
    label: "System recorded",
    badgeLabel: "System recorded",
    badgeTone: "info",
    activeInPhase1: true,
    phase: "Phase 1",
    sortOrder: 20,
    description:
      "A CoriTech workflow event captured by the application from an allowed order, shipment or document action.",
  }),
  Object.freeze({
    code: "STATION_CONFIRMED",
    label: "Station confirmed",
    badgeLabel: "Station confirmed",
    badgeTone: "success",
    activeInPhase1: true,
    phase: "Phase 1",
    sortOrder: 30,
    description:
      "A workflow fact confirmed by the breeding station in its assigned operational role.",
  }),
  Object.freeze({
    code: "ADMIN_REVIEWED",
    label: "Admin reviewed",
    badgeLabel: "Admin reviewed",
    badgeTone: "review",
    activeInPhase1: true,
    phase: "Phase 1",
    sortOrder: 40,
    description:
      "A Phase 1 platform-admin review or correction recorded through approved support workflows.",
  }),
  Object.freeze({
    code: "VET_SIGNED",
    label: "Vet signed",
    badgeLabel: "Vet signed",
    badgeTone: "future",
    activeInPhase1: false,
    phase: "Future",
    sortOrder: 50,
    description:
      "Reserved for a later veterinary signature workflow. Not assignable in Phase 1.",
  }),
  Object.freeze({
    code: "FEDERATION_ATTESTED",
    label: "Federation attested",
    badgeLabel: "Federation attested",
    badgeTone: "future",
    activeInPhase1: false,
    phase: "Future",
    sortOrder: 60,
    description:
      "Reserved for a later federation or studbook attestation workflow. Not assignable in Phase 1.",
  }),
  Object.freeze({
    code: "VERIFIED_FOR_TRANSACTION",
    label: "Verified for transaction",
    badgeLabel: "Verified",
    badgeTone: "future",
    activeInPhase1: false,
    phase: "Future",
    sortOrder: 70,
    description:
      "Reserved for a later transaction-readiness verification workflow. Not assignable in Phase 1.",
  }),
]);

export const VERIFICATION_LEVELS = Object.freeze(
  VERIFICATION_LEVEL_METADATA.map((level) => level.code),
);

export const ACTIVE_PHASE_1_VERIFICATION_LEVELS = Object.freeze(
  VERIFICATION_LEVEL_METADATA
    .filter((level) => level.activeInPhase1)
    .map((level) => level.code),
);

export const FUTURE_VERIFICATION_LEVELS = Object.freeze(
  VERIFICATION_LEVEL_METADATA
    .filter((level) => !level.activeInPhase1)
    .map((level) => level.code),
);

const BREEDING_STATION_CONFIRMED_EVENTS = Object.freeze([
  "CONFIRMED",
  "REJECTED",
  "SHIPMENT_CONFIRMED",
  "DOCUMENT_UPLOADED",
]);

const BREEDER_SELF_REPORTED_EVENTS = Object.freeze([
  "SEMEN_ORDER_CREATED",
  "SUBMITTED",
  "DOCUMENT_UPLOADED",
]);

const DERIVABLE_PROOF_EVENT_TYPES = Object.freeze([
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

/**
 * @param {unknown} value
 * @returns {value is import("./verification-level.d.ts").VerificationLevel}
 */
export function isVerificationLevel(value) {
  return typeof value === "string" && VERIFICATION_LEVELS.includes(
    /** @type {import("./verification-level.d.ts").VerificationLevel} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./verification-level.d.ts").ActivePhase1VerificationLevel}
 */
export function isActivePhase1VerificationLevel(value) {
  return typeof value === "string" &&
    ACTIVE_PHASE_1_VERIFICATION_LEVELS.includes(
      /** @type {import("./verification-level.d.ts").ActivePhase1VerificationLevel} */ (
        value
      ),
    );
}

/**
 * @param {unknown} value
 * @returns {Readonly<import("./verification-level.d.ts").VerificationLevelMetadata> | null}
 */
export function verificationLevelMetadataFor(value) {
  if (!isVerificationLevel(value)) {
    return null;
  }

  return VERIFICATION_LEVEL_METADATA.find((level) => level.code === value) ??
    null;
}

/**
 * Derives the Phase 1 proof strength from workflow fact and actor role only.
 *
 * @param {import("./verification-level.d.ts").DeriveVerificationLevelInput} input
 * @returns {import("./verification-level.d.ts").ActivePhase1VerificationLevel | null}
 */
export function deriveVerificationLevel(input) {
  if (!input || typeof input !== "object") {
    return null;
  }

  const eventType = normalizeString(input.eventType);
  const actorRoleCode = normalizeString(input.actorRoleCode);

  if (
    !eventType ||
    !actorRoleCode ||
    !DERIVABLE_PROOF_EVENT_TYPES.includes(eventType)
  ) {
    return null;
  }

  if (actorRoleCode === "PLATFORM_ADMIN" || eventType === "ADMIN_CORRECTION_CREATED") {
    return "ADMIN_REVIEWED";
  }

  if (actorRoleCode === "BREEDING_STATION") {
    return BREEDING_STATION_CONFIRMED_EVENTS.includes(eventType)
      ? "STATION_CONFIRMED"
      : "SYSTEM_RECORDED";
  }

  if (actorRoleCode === "BREEDER") {
    return BREEDER_SELF_REPORTED_EVENTS.includes(eventType)
      ? "SELF_REPORTED"
      : "SYSTEM_RECORDED";
  }

  return null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}
