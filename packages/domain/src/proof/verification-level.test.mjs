import test from "node:test";
import assert from "node:assert/strict";

import {
  ACTIVE_PHASE_1_VERIFICATION_LEVELS,
  FUTURE_VERIFICATION_LEVELS,
  VERIFICATION_LEVEL_METADATA,
  VERIFICATION_LEVELS,
  deriveVerificationLevel,
  isActivePhase1VerificationLevel,
  isVerificationLevel,
  verificationLevelMetadataFor,
} from "./verification-level.mjs";

test("verification level taxonomy exposes active and future Phase 1 metadata", () => {
  assert.deepEqual(VERIFICATION_LEVELS, [
    "SELF_REPORTED",
    "SYSTEM_RECORDED",
    "STATION_CONFIRMED",
    "ADMIN_REVIEWED",
    "VET_SIGNED",
    "FEDERATION_ATTESTED",
    "VERIFIED_FOR_TRANSACTION",
  ]);
  assert.deepEqual(ACTIVE_PHASE_1_VERIFICATION_LEVELS, [
    "SELF_REPORTED",
    "SYSTEM_RECORDED",
    "STATION_CONFIRMED",
    "ADMIN_REVIEWED",
  ]);
  assert.deepEqual(FUTURE_VERIFICATION_LEVELS, [
    "VET_SIGNED",
    "FEDERATION_ATTESTED",
    "VERIFIED_FOR_TRANSACTION",
  ]);

  for (const level of VERIFICATION_LEVEL_METADATA) {
    assert.equal(typeof level.label, "string");
    assert.equal(typeof level.badgeLabel, "string");
    assert.equal(typeof level.badgeTone, "string");
    assert.equal(typeof level.description, "string");
    assert.equal(Number.isInteger(level.sortOrder), true);
  }

  assert.equal(verificationLevelMetadataFor("STATION_CONFIRMED")?.badgeTone, "success");
  assert.equal(verificationLevelMetadataFor("FEDERATION_ATTESTED")?.activeInPhase1, false);
  assert.equal(isVerificationLevel("VET_SIGNED"), true);
  assert.equal(isActivePhase1VerificationLevel("VET_SIGNED"), false);
});

test("verification level derivation uses event type and actor role", () => {
  assert.equal(
    deriveVerificationLevel({
      eventType: "SUBMITTED",
      actorRoleCode: "BREEDER",
    }),
    "SELF_REPORTED",
  );
  assert.equal(
    deriveVerificationLevel({
      eventType: "SHIPMENT_STATUS_UPDATED",
      actorRoleCode: "BREEDING_STATION",
    }),
    "SYSTEM_RECORDED",
  );
  assert.equal(
    deriveVerificationLevel({
      eventType: "CONFIRMED",
      actorRoleCode: "BREEDING_STATION",
    }),
    "STATION_CONFIRMED",
  );
  assert.equal(
    deriveVerificationLevel({
      eventType: "ADMIN_CORRECTION_CREATED",
      actorRoleCode: "PLATFORM_ADMIN",
    }),
    "ADMIN_REVIEWED",
  );
  assert.equal(
    deriveVerificationLevel({
      eventType: "DOCUMENT_UPLOADED",
      actorRoleCode: "BREEDER",
    }),
    "SYSTEM_RECORDED",
  );
  assert.equal(
    deriveVerificationLevel({
      eventType: "DOCUMENT_UPLOADED",
      actorRoleCode: "BREEDING_STATION",
    }),
    "SYSTEM_RECORDED",
  );
  assert.equal(
    deriveVerificationLevel({
      eventType: "SUBMITTED",
      actorRoleCode: "FEDERATION",
    }),
    null,
  );
  assert.equal(
    deriveVerificationLevel({
      eventType: "UNKNOWN_EVENT",
      actorRoleCode: "PLATFORM_ADMIN",
    }),
    null,
  );
});
