import test from "node:test";
import assert from "node:assert/strict";

import {
  AUDIT_LOG_ACTIONS,
  AUDIT_LOG_MUTATION_POLICY,
  AUDIT_LOG_ROUTES,
  AuditLogAuthorizationError,
  AuditLogValidationError,
  canDeleteAuditLog,
  canUpdateAuditLog,
  canViewAuditLogsForObject,
  createAuditLogFromHook,
  listAuditLogsForObject,
  prepareAuditLogEntry,
  prepareAuditLogEntryFromHook,
} from "./audit-log.mjs";
import { assignUserOrganizationRole } from "../identity/role-model.mjs";
import { prepareTransitionSemenOrderStatus } from "../orders/semen-order.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";
const platformOrganizationId = "org-platform";

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

const futureBuyerActor = {
  userId: "user-buyer",
  roles: [
    {
      userId: "user-buyer",
      organizationId: "org-buyer",
      roleCode: "BUYER",
      revokedAt: null,
    },
  ],
};

const draftOrder = {
  id: "order-1",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "DRAFT",
  createdByUserId: "user-breeder",
  updatedByUserId: "user-breeder",
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("audit log contract exposes only Phase 1 normalized actions and append-only mutation policy", () => {
  assert.deepEqual(AUDIT_LOG_ACTIONS, [
    "CREATE",
    "UPDATE",
    "STATUS_CHANGE",
    "UPLOAD_DOCUMENT",
    "VIEW_DOCUMENT",
    "CREATE_PROOF_EVENT",
    "CHANGE_PERMISSION",
    "ADMIN_EDIT",
    "CREATE_AMENDMENT",
    "LOGIN",
    "LOGOUT",
  ]);
  assert.deepEqual(
    AUDIT_LOG_ROUTES.map((route) => `${route.method} ${route.path}`),
    ["GET /audit-logs"],
  );
  assert.equal(AUDIT_LOG_MUTATION_POLICY.appendOnly, true);
  assert.equal(canUpdateAuditLog(), false);
  assert.equal(canDeleteAuditLog(), false);
});

test("workflow audit hooks materialize actor, role, organization, object and request metadata", async () => {
  const repository = buildAuditRepository();
  const orderChange = prepareTransitionSemenOrderStatus({
    existingOrder: draftOrder,
    toStatus: "SUBMITTED",
    reason: "Ready for station review",
    actor: breederActor,
    now: timestamp,
  });
  const auditLog = await createAuditLogFromHook({
    repository,
    auditHook: orderChange.auditHook,
    requestContext: {
      ipAddress: "203.0.113.20",
      userAgent: "node-test/audit-log",
    },
  });

  assert.equal(auditLog.id, "audit-log-1");
  assert.equal(auditLog.actorUserId, "user-breeder");
  assert.equal(auditLog.actorRoleCode, "BREEDER");
  assert.equal(auditLog.actorOrganizationId, breederOrganizationId);
  assert.equal(auditLog.action, "STATUS_CHANGE");
  assert.equal(auditLog.sourceAction, "SEMEN_ORDER_SUBMITTED");
  assert.equal(auditLog.objectType, "SemenOrder");
  assert.equal(auditLog.objectId, "order-1");
  assert.equal(auditLog.previousValues?.status, "DRAFT");
  assert.equal(auditLog.newValues?.status, "SUBMITTED");
  assert.equal(auditLog.reason, "Ready for station review");
  assert.equal(auditLog.ipAddress, "203.0.113.20");
  assert.equal(auditLog.userAgent, "node-test/audit-log");
  assert.equal(auditLog.occurredAt, timestamp);
});

test("document, proof-event, permission and admin-edit hooks map to canonical audit actions", () => {
  const documentViewLog = prepareAuditLogEntryFromHook({
    auditHook: {
      eventType: "DOCUMENT_ACCESS",
      action: "DOCUMENT_VIEWED",
      actorUserId: "user-breeder",
      actorRoleCode: "BREEDER",
      actorOrganizationId: breederOrganizationId,
      targetType: "Document",
      targetId: "document-1",
      targetRef: {
        targetType: "Shipment",
        targetId: "shipment-1",
      },
      documentRef: {
        documentType: "HEALTH_CERTIFICATE",
      },
      reason: null,
      occurredAt: timestamp,
    },
  });
  const proofEventLog = prepareAuditLogEntryFromHook({
    auditHook: {
      eventType: "PROOF_EVENT",
      action: "PROOF_EVENT_CREATED",
      actorUserId: "user-station",
      actorRoleCode: "BREEDING_STATION",
      actorOrganizationId: stationOrganizationId,
      targetType: "ProofEvent",
      targetId: "proof-event-1",
      targetRef: {
        proofEventType: "SHIPMENT_CONFIRMED",
        shipmentId: "shipment-1",
      },
      reason: null,
      occurredAt: timestamp,
    },
  });
  const permissionChange = assignUserOrganizationRole({
    userId: "user-station",
    organizationId: stationOrganizationId,
    roleCode: "BREEDING_STATION",
    assignedByUserId: "user-admin",
    assignerRoles: adminActor.roles,
    assignmentId: "role-assignment-1",
    assignmentReason: "Station operator approved",
    assignedAt: timestamp,
  });
  const permissionLog = prepareAuditLogEntryFromHook({
    auditHook: permissionChange.auditHook,
  });
  const adminEditLog = prepareAuditLogEntryFromHook({
    auditHook: {
      eventType: "SEMEN_LISTING_CHANGE",
      action: "SEMEN_LISTING_UPDATED",
      actorUserId: "user-admin",
      actorRoleCode: "PLATFORM_ADMIN",
      actorOrganizationId: platformOrganizationId,
      targetType: "SemenListing",
      targetId: "listing-1",
      targetRef: {
        stallionId: "stallion-1",
      },
      previousValue: {
        availabilityStatus: "AVAILABLE",
      },
      newValue: {
        availabilityStatus: "LIMITED",
      },
      reason: "Support correction",
      occurredAt: timestamp,
    },
  });

  assert.equal(documentViewLog.action, "VIEW_DOCUMENT");
  assert.equal(documentViewLog.newValues?.documentType, "HEALTH_CERTIFICATE");
  assert.equal(proofEventLog.action, "CREATE_PROOF_EVENT");
  assert.equal(proofEventLog.newValues?.proofEventType, "SHIPMENT_CONFIRMED");
  assert.equal(permissionLog.action, "CHANGE_PERMISSION");
  assert.equal(permissionLog.actorRoleCode, "PLATFORM_ADMIN");
  assert.equal(adminEditLog.action, "ADMIN_EDIT");
  assert.equal(adminEditLog.actorRoleCode, "PLATFORM_ADMIN");
});

test("normal users cannot create admin-edit audit entries", () => {
  assert.throws(
    () =>
      prepareAuditLogEntry({
        actorUserId: "user-breeder",
        actorRoleCode: "BREEDER",
        actorOrganizationId: breederOrganizationId,
        action: "ADMIN_EDIT",
        objectType: "SemenOrder",
        objectId: "order-1",
        reason: "Support correction",
        occurredAt: timestamp,
      }),
    (error) =>
      error instanceof AuditLogValidationError &&
      error.issues.includes(
        "ADMIN_EDIT audit logs must be created by PLATFORM_ADMIN actors.",
      ),
  );
});

test("audit logs are queryable by object with participant-aware access", async () => {
  const repository = buildAuditRepository();
  const objectContext = {
    objectType: "SemenOrder",
    objectId: "order-1",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
  };

  await createAuditLogFromHook({
    repository,
    auditHook: prepareTransitionSemenOrderStatus({
      existingOrder: draftOrder,
      toStatus: "SUBMITTED",
      reason: "Ready for station review",
      actor: breederActor,
      now: timestamp,
    }).auditHook,
  });

  assert.equal(canViewAuditLogsForObject(breederActor, objectContext), true);
  assert.equal(canViewAuditLogsForObject(adminActor, null), true);
  assert.equal(canViewAuditLogsForObject(futureBuyerActor, objectContext), false);

  const auditLogs = await listAuditLogsForObject({
    repository,
    actor: breederActor,
    objectContext,
    objectType: "SemenOrder",
    objectId: "order-1",
  });

  assert.equal(auditLogs.length, 1);
  assert.equal(auditLogs[0].objectId, "order-1");

  await assert.rejects(
    () =>
      listAuditLogsForObject({
        repository,
        actor: futureBuyerActor,
        objectContext,
        objectType: "SemenOrder",
        objectId: "order-1",
      }),
    AuditLogAuthorizationError,
  );

  await assert.rejects(
    () =>
      listAuditLogsForObject({
        repository,
        actor: breederActor,
        objectContext,
        objectType: "SemenOrder",
        objectId: "order-2",
      }),
    (error) =>
      error instanceof AuditLogAuthorizationError &&
      error.message.includes("object context must match"),
  );
});

function buildAuditRepository() {
  const auditLogsByObject = new Map();
  let auditLogSequence = 1;

  return {
    async createAuditLog(auditLog) {
      const persistedAuditLog = {
        ...auditLog,
        id: auditLog.id ?? `audit-log-${auditLogSequence++}`,
      };
      const objectLogs = auditLogsByObject.get(persistedAuditLog.objectId) ?? [];

      objectLogs.push(persistedAuditLog);
      auditLogsByObject.set(persistedAuditLog.objectId, objectLogs);

      return persistedAuditLog;
    },
    async listAuditLogsForObject(_objectType, objectId) {
      return auditLogsByObject.get(objectId) ?? [];
    },
  };
}
