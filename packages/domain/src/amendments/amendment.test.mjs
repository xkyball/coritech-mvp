import test from "node:test";
import assert from "node:assert/strict";

import {
  AMENDMENT_ROUTES,
  AMENDMENT_STATUSES,
  AMENDMENT_TARGET_MUTATION_POLICY,
  AMENDMENT_TARGET_TYPES,
  AmendmentValidationError,
  canCreateAmendment,
  canSilentlyOverwriteAmendmentTarget,
  createAmendment,
  createAmendmentEndpoint,
  prepareCreateAmendment,
} from "./amendment.mjs";
import { prepareProofEventFromHook } from "../proof/proof-event.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const platformOrganizationId = "org-platform";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";

const adminActor = {
  userId: "user-admin",
  roles: [
    {
      userId: "user-admin",
      organizationId: platformOrganizationId,
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    },
  ],
};

const approverActor = {
  userId: "user-approver",
  roles: [
    {
      userId: "user-approver",
      organizationId: platformOrganizationId,
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    },
  ],
};

const breederActor = {
  userId: "user-breeder",
  roles: [
    {
      userId: "user-breeder",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const shipmentTargetSnapshot = Object.freeze({
  targetType: "Shipment",
  targetId: "shipment-1",
  targetField: "providerTrackingId",
  targetRef: {
    semenOrderId: "order-1",
    orderNumber: "SO-20260609-000001",
  },
  originalValue: {
    providerTrackingId: "TRACK-OLD",
  },
  semenOrderId: "order-1",
  shipmentId: "shipment-1",
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
});

test("amendment contract is scoped to selected Phase 1 proof-relevant targets", () => {
  assert.deepEqual(AMENDMENT_STATUSES, [
    "DRAFT",
    "SUBMITTED",
    "APPROVED",
    "REJECTED",
  ]);
  assert.deepEqual(AMENDMENT_TARGET_TYPES, [
    "SemenOrder",
    "OrderStatusHistory",
    "Shipment",
    "ShipmentTrackingEvent",
    "Document",
    "EvidenceAttachment",
    "ProofEvent",
  ]);
  assert.deepEqual(
    AMENDMENT_ROUTES.map((route) => `${route.method} ${route.path}`),
    ["POST /amendments"],
  );
  assert.equal(canCreateAmendment(adminActor), true);
  assert.equal(canCreateAmendment(breederActor), false);
  assert.equal(AMENDMENT_TARGET_MUTATION_POLICY.silentlyOverwriteTarget, false);
  assert.equal(canSilentlyOverwriteAmendmentTarget(), false);
});

test("admin can prepare an amendment that preserves original and amended values", () => {
  const prepared = prepareCreateAmendment({
    amendmentId: "amendment-1",
    targetType: "Shipment",
    targetId: "shipment-1",
    targetField: "providerTrackingId",
    targetRef: {
      semenOrderId: "order-1",
      orderNumber: "SO-20260609-000001",
    },
    originalValue: {
      providerTrackingId: "TRACK-OLD",
    },
    amendedValue: {
      providerTrackingId: "TRACK-NEW",
    },
    reason: "Carrier corrected the tracking reference.",
    actor: adminActor,
    proofEventId: "proof-correction-1",
    semenOrderId: "order-1",
    shipmentId: "shipment-1",
    orderNumber: "SO-20260609-000001",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    now: timestamp,
  });

  assert.equal(prepared.amendment.id, "amendment-1");
  assert.equal(prepared.amendment.status, "SUBMITTED");
  assert.deepEqual(prepared.amendment.originalValue, {
    providerTrackingId: "TRACK-OLD",
  });
  assert.deepEqual(prepared.amendment.amendedValue, {
    providerTrackingId: "TRACK-NEW",
  });
  assert.equal(Object.isFrozen(prepared.amendment.originalValue), true);
  assert.equal(prepared.auditHook.action, "AMENDMENT_CREATED");
  assert.equal(prepared.auditHook.targetType, "Shipment");
  assert.equal(prepared.auditHook.targetId, "shipment-1");
  assert.deepEqual(prepared.auditHook.previousValue.originalValue, {
    providerTrackingId: "TRACK-OLD",
  });
  assert.deepEqual(prepared.auditHook.newValue.amendedValue, {
    providerTrackingId: "TRACK-NEW",
  });
  assert.equal(prepared.proofHook?.source, "ADMIN_CORRECTION");
  assert.equal(prepared.proofHook?.triggerRef.amendmentTargetType, "Shipment");
});

test("amendment requires a reason and a platform-admin actor", () => {
  assert.throws(
    () =>
      prepareCreateAmendment({
        targetType: "Shipment",
        targetId: "shipment-1",
        originalValue: {
          providerTrackingId: "TRACK-OLD",
        },
        amendedValue: {
          providerTrackingId: "TRACK-NEW",
        },
        reason: " ",
        actor: adminActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof AmendmentValidationError &&
      error.issues.includes("reason is required."),
  );

  assert.throws(
    () =>
      prepareCreateAmendment({
        targetType: "Shipment",
        targetId: "shipment-1",
        originalValue: {
          providerTrackingId: "TRACK-OLD",
        },
        amendedValue: {
          providerTrackingId: "TRACK-NEW",
        },
        reason: "Carrier corrected the tracking reference.",
        actor: breederActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof AmendmentValidationError &&
      error.issues.includes(
        "actor must be an active PLATFORM_ADMIN user to create amendments.",
      ),
  );
});

test("approved and rejected amendment records require a platform-admin approver", () => {
  assert.throws(
    () =>
      prepareCreateAmendment({
        targetType: "ProofEvent",
        targetId: "proof-event-1",
        originalValue: {
          status: "RECORDED",
        },
        amendedValue: {
          status: "VOIDED",
        },
        reason: "Duplicate proof event recorded during support replay.",
        status: "APPROVED",
        actor: adminActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof AmendmentValidationError &&
      error.issues.includes(
        "approver is required for APPROVED or REJECTED amendments.",
      ),
  );

  const prepared = prepareCreateAmendment({
    targetType: "ProofEvent",
    targetId: "proof-event-1",
    originalValue: {
      status: "RECORDED",
    },
    amendedValue: {
      status: "VOIDED",
    },
    reason: "Duplicate proof event recorded during support replay.",
    status: "APPROVED",
    actor: adminActor,
    approver: approverActor,
    now: timestamp,
  });

  assert.equal(prepared.amendment.status, "APPROVED");
  assert.equal(prepared.amendment.approverUserId, "user-approver");
  assert.equal(prepared.amendment.approverRoleCode, "PLATFORM_ADMIN");
  assert.equal(prepared.amendment.decidedAt, timestamp);
});

test("amendment service persists an amendment and creates an audit log without mutating the target", async () => {
  const repository = buildAmendmentRepository();
  const result = await createAmendment({
    repository,
    targetType: "Shipment",
    targetId: "shipment-1",
    targetField: "providerTrackingId",
    targetRef: shipmentTargetSnapshot.targetRef,
    originalValue: shipmentTargetSnapshot.originalValue,
    amendedValue: {
      providerTrackingId: "TRACK-NEW",
    },
    reason: "Carrier corrected the tracking reference.",
    actor: adminActor,
    semenOrderId: "order-1",
    shipmentId: "shipment-1",
    orderNumber: "SO-20260609-000001",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    now: timestamp,
    auditContext: {
      ipAddress: "203.0.113.20",
      userAgent: "node-test/amendment",
    },
  });

  assert.equal(result.amendment.id, "amendment-1");
  assert.equal(result.auditLog.id, "audit-log-1");
  assert.equal(result.auditLog.action, "CREATE_AMENDMENT");
  assert.equal(result.auditLog.sourceAction, "AMENDMENT_CREATED");
  assert.equal(result.auditLog.objectType, "Shipment");
  assert.equal(result.auditLog.objectId, "shipment-1");
  assert.deepEqual(result.auditLog.previousValues?.originalValue, {
    providerTrackingId: "TRACK-OLD",
  });
  assert.deepEqual(result.auditLog.newValues?.amendedValue, {
    providerTrackingId: "TRACK-NEW",
  });
  assert.equal(repository.targetWasMutated, false);
});

test("create amendment endpoint loads the original value from the repository snapshot", async () => {
  const repository = buildAmendmentRepository({
    targetSnapshot: shipmentTargetSnapshot,
  });
  const response = await createAmendmentEndpoint({
    repository,
    actor: adminActor,
    body: {
      targetType: "Shipment",
      targetId: "shipment-1",
      targetField: "providerTrackingId",
      originalValue: {
        providerTrackingId: "CLIENT-SUPPLIED-OLD",
      },
      amendedValue: {
        providerTrackingId: "TRACK-NEW",
      },
      reason: "Carrier corrected the tracking reference.",
      now: timestamp,
    },
  });

  assert.equal(response.status, 201);
  assert.deepEqual(response.body.amendment.originalValue, {
    providerTrackingId: "TRACK-OLD",
  });
  assert.deepEqual(response.body.amendment.amendedValue, {
    providerTrackingId: "TRACK-NEW",
  });
  assert.equal(response.auditLog?.action, "CREATE_AMENDMENT");
});

test("amendment proof hook can be materialized as an admin correction proof event", () => {
  const prepared = prepareCreateAmendment({
    amendmentId: "amendment-1",
    targetType: "Shipment",
    targetId: "shipment-1",
    targetField: "providerTrackingId",
    targetRef: shipmentTargetSnapshot.targetRef,
    originalValue: shipmentTargetSnapshot.originalValue,
    amendedValue: {
      providerTrackingId: "TRACK-NEW",
    },
    reason: "Carrier corrected the tracking reference.",
    actor: adminActor,
    semenOrderId: "order-1",
    shipmentId: "shipment-1",
    orderNumber: "SO-20260609-000001",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    now: timestamp,
  });

  assert.ok(prepared.proofHook);

  const proofChange = prepareProofEventFromHook({
    proofHook: prepared.proofHook,
    proofEventId: "proof-correction-1",
    createdAt: timestamp,
  });

  assert.equal(proofChange.proofEvent.eventType, "ADMIN_CORRECTION_CREATED");
  assert.equal(proofChange.proofEvent.source, "ADMIN_CORRECTION");
  assert.equal(proofChange.proofEvent.lifecycleStage, "ADMIN_CORRECTION");
  assert.equal(proofChange.proofEvent.verificationLevel, "ADMIN_REVIEWED");
  assert.equal(proofChange.proofEvent.shipmentId, "shipment-1");
  assert.equal(
    proofChange.proofEvent.triggerRef.amendmentTargetType,
    "Shipment",
  );
});

function buildAmendmentRepository(options = {}) {
  const amendments = [];
  const auditLogs = [];
  const repository = {
    targetWasMutated: false,
    async findAmendmentTargetSnapshot(targetType, targetId) {
      const snapshot = options.targetSnapshot ?? null;

      if (
        snapshot &&
        snapshot.targetType === targetType &&
        snapshot.targetId === targetId
      ) {
        return snapshot;
      }

      return null;
    },
    async createAmendment(amendment) {
      const persisted = Object.freeze({
        ...amendment,
        id: amendment.id ?? `amendment-${amendments.length + 1}`,
      });

      amendments.push(persisted);
      return persisted;
    },
    async createAuditLog(auditLog) {
      const persisted = Object.freeze({
        ...auditLog,
        id: auditLog.id ?? `audit-log-${auditLogs.length + 1}`,
      });

      auditLogs.push(persisted);
      return persisted;
    },
  };

  return repository;
}
