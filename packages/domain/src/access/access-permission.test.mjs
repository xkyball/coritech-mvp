import test from "node:test";
import assert from "node:assert/strict";

import {
  ACCESS_PERMISSION_SCOPES,
  ACTIVE_ACCESS_PERMISSION_SCOPES,
  AccessPermissionValidationError,
  PREPARED_FUTURE_ACCESS_PERMISSION_SCOPES,
  canUseAccessPermission,
  checkAccessPermission,
  createAccessPermission,
  isAccessPermissionScope,
  isActiveAccessPermissionScope,
  prepareCreateAccessPermission,
  revokeAccessPermission,
} from "./access-permission.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const laterTimestamp = "2026-06-09T09:00:00.000Z";
const expiryTimestamp = "2026-06-10T08:00:00.000Z";
const platformOrganizationId = "org-platform";
const secondPlatformOrganizationId = "org-platform-2";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";
const otherStationOrganizationId = "org-station-b";

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

const secondAdminActor = {
  userId: "user-admin-2",
  roles: [
    {
      userId: "user-admin-2",
      organizationId: secondPlatformOrganizationId,
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

const stationActor = {
  userId: "user-station",
  roles: [
    {
      userId: "user-station",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const otherStationActor = {
  userId: "user-station-other",
  roles: [
    {
      userId: "user-station-other",
      organizationId: otherStationOrganizationId,
      roleCode: "BREEDING_STATION",
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

test("AccessPermission contract exposes active scopes and prepared inactive BUYER_VIEW scope", () => {
  assert.deepEqual(ACTIVE_ACCESS_PERMISSION_SCOPES, [
    "VIEW",
    "CREATE",
    "UPDATE",
    "CONFIRM",
    "UPLOAD_DOCUMENT",
    "VIEW_DOCUMENT",
    "ADMIN_SUPPORT",
  ]);
  assert.deepEqual(PREPARED_FUTURE_ACCESS_PERMISSION_SCOPES, ["BUYER_VIEW"]);
  assert.deepEqual(ACCESS_PERMISSION_SCOPES, [
    "VIEW",
    "CREATE",
    "UPDATE",
    "CONFIRM",
    "UPLOAD_DOCUMENT",
    "VIEW_DOCUMENT",
    "ADMIN_SUPPORT",
    "BUYER_VIEW",
  ]);
  assert.equal(isAccessPermissionScope("BUYER_VIEW"), true);
  assert.equal(isActiveAccessPermissionScope("BUYER_VIEW"), false);
});

test("object-level permissions can be created with expiry and audit logging", async () => {
  const repository = buildRepository();
  const change = await createAccessPermission({
    userId: breederActor.userId,
    objectType: "SemenOrder",
    objectId: "order-1",
    scope: "VIEW",
    grantedByUserId: adminActor.userId,
    grantorRoles: adminActor.roles,
    grantReason: "Breeder support review",
    expiresAt: expiryTimestamp,
    now: timestamp,
    repository,
    requestContext: {
      ipAddress: "203.0.113.24",
      userAgent: "node-test/access-permission",
    },
  });

  assert.equal(change.permission.id, "permission-1");
  assert.equal(change.permission.userId, breederActor.userId);
  assert.equal(change.permission.objectType, "SemenOrder");
  assert.equal(change.permission.objectId, "order-1");
  assert.equal(change.permission.scope, "VIEW");
  assert.equal(change.permission.expiresAt, expiryTimestamp);
  assert.equal(change.permission.grantorRoleCode, "PLATFORM_ADMIN");
  assert.equal(change.permission.grantorOrganizationId, platformOrganizationId);
  assert.equal(change.auditHook.action, "ACCESS_PERMISSION_GRANTED");
  assert.equal(change.auditLog.action, "CHANGE_PERMISSION");
  assert.equal(change.auditLog.sourceAction, "ACCESS_PERMISSION_GRANTED");
  assert.equal(change.auditLog.objectType, "AccessPermission");
  assert.equal(change.auditLog.objectId, "permission-1");
  assert.equal(change.auditLog.newValues?.scope, "VIEW");
  assert.equal(change.auditLog.ipAddress, "203.0.113.24");
});

test("service-layer checks match actor, object, scope and time window", async () => {
  const repository = buildRepository();

  await createAccessPermission({
    userId: breederActor.userId,
    objectType: "SemenOrder",
    objectId: "order-1",
    scope: "VIEW",
    grantedByUserId: adminActor.userId,
    grantorRoles: adminActor.roles,
    expiresAt: expiryTimestamp,
    now: timestamp,
    repository,
  });

  const allowed = await checkAccessPermission({
    actor: breederActor,
    objectType: "SemenOrder",
    objectId: "order-1",
    scope: "VIEW",
    now: laterTimestamp,
    repository,
  });
  const wrongActor = await checkAccessPermission({
    actor: stationActor,
    objectType: "SemenOrder",
    objectId: "order-1",
    scope: "VIEW",
    now: laterTimestamp,
    repository,
  });
  const wrongScope = await checkAccessPermission({
    actor: breederActor,
    objectType: "SemenOrder",
    objectId: "order-1",
    scope: "UPDATE",
    now: laterTimestamp,
    repository,
  });
  const expired = await checkAccessPermission({
    actor: breederActor,
    objectType: "SemenOrder",
    objectId: "order-1",
    scope: "VIEW",
    now: "2026-06-11T08:00:00.000Z",
    repository,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.permission?.id, "permission-1");
  assert.equal(wrongActor.allowed, false);
  assert.equal(wrongScope.allowed, false);
  assert.equal(expired.allowed, false);
});

test("organization and role grants require active Phase 1 actor role context", async () => {
  const repository = buildRepository();

  await createAccessPermission({
    organizationId: stationOrganizationId,
    roleCode: "BREEDING_STATION",
    objectType: "Shipment",
    objectId: "shipment-1",
    scope: "UPDATE",
    grantedByUserId: adminActor.userId,
    grantorRoles: adminActor.roles,
    grantReason: "Station shipment update",
    now: timestamp,
    repository,
  });

  const stationAllowed = await checkAccessPermission({
    actor: stationActor,
    objectType: "Shipment",
    objectId: "shipment-1",
    scope: "UPDATE",
    now: laterTimestamp,
    repository,
  });
  const otherStationDenied = await checkAccessPermission({
    actor: otherStationActor,
    objectType: "Shipment",
    objectId: "shipment-1",
    scope: "UPDATE",
    now: laterTimestamp,
    repository,
  });
  const buyerDenied = await checkAccessPermission({
    actor: futureBuyerActor,
    objectType: "Shipment",
    objectId: "shipment-1",
    scope: "UPDATE",
    now: laterTimestamp,
    repository,
  });

  assert.equal(stationAllowed.allowed, true);
  assert.equal(otherStationDenied.allowed, false);
  assert.equal(buyerDenied.allowed, false);
  assert.throws(
    () =>
      prepareCreateAccessPermission({
        roleCode: "BUYER",
        objectType: "Document",
        objectId: "document-1",
        scope: "VIEW",
        grantedByUserId: adminActor.userId,
        grantorRoles: adminActor.roles,
        now: timestamp,
      }),
    (error) =>
      error instanceof AccessPermissionValidationError &&
      error.issues.includes(
        "BUYER is prepared for later phases and cannot receive active AccessPermission grants in Phase 1.",
      ),
  );
});

test("BUYER_VIEW scope is prepared but denied by default", async () => {
  const repository = buildRepository();

  assert.throws(
    () =>
      prepareCreateAccessPermission({
        userId: futureBuyerActor.userId,
        objectType: "Document",
        objectId: "document-1",
        scope: "BUYER_VIEW",
        grantedByUserId: adminActor.userId,
        grantorRoles: adminActor.roles,
        now: timestamp,
      }),
    (error) =>
      error instanceof AccessPermissionValidationError &&
      error.issues.includes(
        "BUYER_VIEW is prepared for later buyer-view workflows and is not grantable in Phase 1.",
      ),
  );

  const decision = await checkAccessPermission({
    actor: futureBuyerActor,
    objectType: "Document",
    objectId: "document-1",
    scope: "BUYER_VIEW",
    now: laterTimestamp,
    repository,
  });
  const manualFuturePermission = {
    id: "manual-future-permission",
    userId: futureBuyerActor.userId,
    organizationId: null,
    roleCode: "BUYER",
    objectType: "Document",
    objectId: "document-1",
    scope: "BUYER_VIEW",
    grantedByUserId: adminActor.userId,
    grantorRoleCode: "PLATFORM_ADMIN",
    grantorOrganizationId: platformOrganizationId,
    grantReason: null,
    effectiveAt: timestamp,
    expiresAt: null,
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  assert.equal(decision.allowed, false);
  assert.equal(repository.listCalls.length, 0);
  assert.equal(
    canUseAccessPermission(futureBuyerActor, manualFuturePermission, {
      objectType: "Document",
      objectId: "document-1",
      scope: "BUYER_VIEW",
      now: laterTimestamp,
    }),
    false,
  );
});

test("permission revocations are audit logged and removed from usable checks", async () => {
  const repository = buildRepository();
  const granted = await createAccessPermission({
    userId: breederActor.userId,
    objectType: "Document",
    objectId: "document-1",
    scope: "VIEW_DOCUMENT",
    grantedByUserId: adminActor.userId,
    grantorRoles: adminActor.roles,
    now: timestamp,
    repository,
  });

  const revoked = await revokeAccessPermission({
    existingPermission: granted.permission,
    revokedByUserId: secondAdminActor.userId,
    revokerRoles: secondAdminActor.roles,
    revocationReason: "Temporary document review complete",
    revokedAt: laterTimestamp,
    repository,
  });
  const decision = await checkAccessPermission({
    actor: breederActor,
    objectType: "Document",
    objectId: "document-1",
    scope: "VIEW_DOCUMENT",
    now: "2026-06-09T10:00:00.000Z",
    repository,
  });

  assert.equal(revoked.permission.revokedAt, laterTimestamp);
  assert.equal(revoked.auditHook.action, "ACCESS_PERMISSION_REVOKED");
  assert.equal(revoked.auditHook.actorUserId, secondAdminActor.userId);
  assert.equal(revoked.auditHook.actorOrganizationId, secondPlatformOrganizationId);
  assert.equal(revoked.auditLog.action, "CHANGE_PERMISSION");
  assert.equal(revoked.auditLog.sourceAction, "ACCESS_PERMISSION_REVOKED");
  assert.equal(revoked.auditLog.previousValues?.revokedAt, null);
  assert.equal(revoked.auditLog.newValues?.revokedAt, laterTimestamp);
  assert.equal(decision.allowed, false);
});

function buildRepository() {
  /** @type {import("./access-permission.d.ts").AccessPermission[]} */
  const permissions = [];
  const auditLogs = [];
  const listCalls = [];
  let nextPermissionId = 1;
  let nextAuditLogId = 1;

  return {
    permissions,
    auditLogs,
    listCalls,
    async createAccessPermission(permission) {
      const persisted = Object.freeze({
        ...permission,
        id: permission.id ?? `permission-${nextPermissionId++}`,
      });

      permissions.push(persisted);
      return persisted;
    },
    async revokeAccessPermission(permission) {
      const index = permissions.findIndex((entry) => entry.id === permission.id);
      const persisted = Object.freeze({ ...permission });

      if (index >= 0) {
        permissions[index] = persisted;
      } else {
        permissions.push(persisted);
      }

      return persisted;
    },
    async listAccessPermissionsForObject(objectType, objectId, scope) {
      listCalls.push({ objectType, objectId, scope });

      return permissions.filter((permission) =>
        permission.objectType === objectType &&
        permission.objectId === objectId &&
        permission.scope === scope
      );
    },
    async createAuditLog(auditLog) {
      const persisted = Object.freeze({
        ...auditLog,
        id: `audit-log-${nextAuditLogId++}`,
      });

      auditLogs.push(persisted);
      return persisted;
    },
  };
}
