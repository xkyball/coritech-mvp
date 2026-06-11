import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPermissionManagementHref,
  canManageAccessPermissions,
  createPermissionManagementViewModel,
  grantManagedAccessPermission,
  normalizePermissionFilters,
  revokeManagedAccessPermission,
} from "./permission-management.mjs";

const platformOrganizationId = "00000000-0000-4000-8000-000000000001";
const breederOrganizationId = "00000000-0000-4000-8000-000000000002";
const breederUserId = "00000000-0000-4000-8000-000000000003";
const orderId = "00000000-0000-4000-8000-000000000004";

const adminActor = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000010",
  organizationId: platformOrganizationId,
  organizationName: "CoriTech Platform",
  roleCode: "PLATFORM_ADMIN",
  roles: Object.freeze([
    Object.freeze({
      id: "role-admin",
      userId: "00000000-0000-4000-8000-000000000010",
      organizationId: platformOrganizationId,
      roleCode: "PLATFORM_ADMIN",
      effectiveAt: "2026-06-01T00:00:00.000Z",
      revokedAt: null,
    }),
  ]),
});

const breederActor = Object.freeze({
  userId: breederUserId,
  organizationId: breederOrganizationId,
  organizationName: "Blue Stud",
  roleCode: "BREEDER",
  roles: Object.freeze([
    Object.freeze({
      id: "role-breeder",
      userId: breederUserId,
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      effectiveAt: "2026-06-01T00:00:00.000Z",
      revokedAt: null,
    }),
  ]),
});

const users = Object.freeze([
  Object.freeze({
    id: breederUserId,
    displayName: "Breeder One",
    email: "breeder@example.test",
  }),
]);

const organizations = Object.freeze([
  Object.freeze({
    id: breederOrganizationId,
    name: "Blue Stud",
    organizationType: "BREEDER",
  }),
]);

test("permission management grants scoped user permission and audit logs the change", async () => {
  const repository = createMemoryRepository();

  const change = await grantManagedAccessPermission({
    actor: adminActor,
    repository,
    subjectType: "user",
    userId: breederUserId,
    objectType: "SemenOrder",
    objectId: orderId,
    scope: "VIEW_DOCUMENT",
    expiresAt: "2026-06-20T10:00:00.000Z",
    grantReason: "Breeder document review",
    now: "2026-06-10T10:00:00.000Z",
  });

  assert.equal(change.permission.id, "permission-1");
  assert.equal(change.permission.userId, breederUserId);
  assert.equal(change.permission.organizationId, null);
  assert.equal(change.permission.scope, "VIEW_DOCUMENT");
  assert.equal(change.auditLog.action, "CHANGE_PERMISSION");
  assert.equal(change.auditLog.sourceAction, "ACCESS_PERMISSION_GRANTED");
  assert.equal(repository.auditLogs.length, 1);
});

test("permission management revokes scoped permission and audit logs the change", async () => {
  const repository = createMemoryRepository([
    permissionFixture({
      id: "permission-1",
      userId: breederUserId,
      scope: "VIEW",
    }),
  ]);

  const change = await revokeManagedAccessPermission({
    actor: adminActor,
    repository,
    permissionId: "permission-1",
    revocationReason: "Support window closed",
    now: "2026-06-12T10:00:00.000Z",
  });

  assert.equal(change.permission.revokedByUserId, adminActor.userId);
  assert.equal(change.permission.revocationReason, "Support window closed");
  assert.equal(change.auditLog.action, "CHANGE_PERMISSION");
  assert.equal(change.auditLog.sourceAction, "ACCESS_PERMISSION_REVOKED");
  assert.equal(change.auditLog.previousValues?.revokedAt, null);
  assert.equal(repository.permissions[0].revokedAt, "2026-06-12T10:00:00.000Z");
});

test("permission management view model shows active expired and revoked permissions", () => {
  const viewModel = createPermissionManagementViewModel({
    actor: adminActor,
    users,
    organizations,
    now: "2026-06-10T10:00:00.000Z",
    permissions: [
      permissionFixture({
        id: "active",
        userId: breederUserId,
        expiresAt: "2026-06-11T10:00:00.000Z",
      }),
      permissionFixture({
        id: "expired",
        organizationId: breederOrganizationId,
        expiresAt: "2026-06-09T10:00:00.000Z",
      }),
      permissionFixture({
        id: "revoked",
        organizationId: breederOrganizationId,
        revokedAt: "2026-06-09T10:00:00.000Z",
        revokedByUserId: adminActor.userId,
        revocationReason: "No longer needed",
      }),
    ],
  });

  assert.equal(viewModel.canEdit, true);
  assert.deepEqual(viewModel.rows.map((row) => row.status), [
    "active",
    "expired",
    "revoked",
  ]);
  assert.equal(viewModel.rows[0].subjectLabel, "Breeder One <breeder@example.test>");
  assert.equal(viewModel.rows[1].subjectLabel, "Blue Stud");
  assert.equal(viewModel.rows[2].canRevoke, false);
});

test("permission management denies non-admin grant and revoke actions", async () => {
  const repository = createMemoryRepository([
    permissionFixture({ id: "permission-1", userId: breederUserId }),
  ]);

  assert.equal(canManageAccessPermissions(adminActor), true);
  assert.equal(canManageAccessPermissions(breederActor), false);

  await assert.rejects(
    () =>
      grantManagedAccessPermission({
        actor: breederActor,
        repository,
        subjectType: "user",
        userId: breederUserId,
        objectType: "SemenOrder",
        objectId: orderId,
        scope: "VIEW",
      }),
    /Only active Platform Admin/,
  );

  await assert.rejects(
    () =>
      revokeManagedAccessPermission({
        actor: breederActor,
        repository,
        permissionId: "permission-1",
        revocationReason: "No longer needed",
      }),
    /Only active Platform Admin/,
  );
});

test("permission management rejects future buyer-view scope and preserves filters", async () => {
  const repository = createMemoryRepository();

  await assert.rejects(
    () =>
      grantManagedAccessPermission({
        actor: adminActor,
        repository,
        subjectType: "user",
        userId: breederUserId,
        objectType: "SemenOrder",
        objectId: orderId,
        scope: "BUYER_VIEW",
      }),
    /active Phase 1 permission scope/,
  );

  const filters = normalizePermissionFilters({
    objectType: "SemenOrder",
    objectId: orderId,
    userId: breederUserId,
    scope: "VIEW",
    status: "active",
    pageSize: "10",
  });

  assert.equal(
    buildPermissionManagementHref(filters, { page: 2 }),
    `/app/admin/permissions?objectType=SemenOrder&objectId=${orderId}&userId=${breederUserId}&scope=VIEW&status=active&pageSize=10&page=2`,
  );
});

function createMemoryRepository(initialPermissions = []) {
  const permissions = initialPermissions.map((permission) => ({ ...permission }));
  const auditLogs = [];

  return {
    permissions,
    auditLogs,
    async createAccessPermission(permission) {
      const persisted = {
        ...permission,
        id: permission.id ?? `permission-${permissions.length + 1}`,
      };
      permissions.push(persisted);
      return persisted;
    },
    async revokeAccessPermission(permission) {
      const index = permissions.findIndex((candidate) => candidate.id === permission.id);

      if (index === -1) {
        throw new Error("permission not found");
      }

      permissions[index] = { ...permission };
      return permissions[index];
    },
    async createAuditLog(auditLog) {
      const persisted = {
        ...auditLog,
        id: auditLog.id ?? `audit-${auditLogs.length + 1}`,
      };
      auditLogs.push(persisted);
      return persisted;
    },
    async getAccessPermissionById(permissionId) {
      return permissions.find((permission) => permission.id === permissionId) ?? null;
    },
    async listAccessPermissions() {
      return permissions;
    },
    async listAccessPermissionsForObject(objectType, objectId, scope) {
      return permissions.filter((permission) =>
        permission.objectType === objectType &&
        permission.objectId === objectId &&
        permission.scope === scope
      );
    },
    async listAccessPermissionsForUser(userId) {
      return permissions.filter((permission) => permission.userId === userId);
    },
    async listAccessPermissionsForOrganization(organizationId) {
      return permissions.filter((permission) =>
        permission.organizationId === organizationId
      );
    },
  };
}

function permissionFixture(overrides = {}) {
  return {
    id: "permission-fixture",
    userId: null,
    organizationId: null,
    roleCode: null,
    objectType: "SemenOrder",
    objectId: orderId,
    scope: "VIEW",
    grantedByUserId: adminActor.userId,
    grantorRoleCode: "PLATFORM_ADMIN",
    grantorOrganizationId: platformOrganizationId,
    grantReason: "Support review",
    effectiveAt: "2026-06-10T09:00:00.000Z",
    expiresAt: null,
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T09:00:00.000Z",
    ...overrides,
  };
}
