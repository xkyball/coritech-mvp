import assert from "node:assert/strict";
import test from "node:test";

import {
  assignRoleForAdmin,
  canManageAdminIdentity,
  createAdminIdentityViewModel,
  createOrganizationForAdmin,
  disableOrganizationForAdmin,
  disableUserForAdmin,
  updateOrganizationForAdmin,
} from "./admin-identity-management.mjs";

const platformOrganizationId = "00000000-0000-4000-8000-000000000001";
const breederOrganizationId = "00000000-0000-4000-8000-000000000002";
const breederUserId = "00000000-0000-4000-8000-000000000003";

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

test("admin identity creates and edits organizations with audit logs", async () => {
  const repository = createMemoryRepository();

  const created = await createOrganizationForAdmin({
    actor: adminActor,
    repository,
    name: "New Breeder",
    organizationType: "BREEDER",
    reason: "Contract signed",
    now: "2026-06-10T10:00:00.000Z",
  });

  assert.equal(created.organization.id, "org-2");
  assert.equal(created.auditLog.action, "ADMIN_EDIT");
  assert.equal(created.auditLog.sourceAction, "ORGANIZATION_CREATED");

  const updated = await updateOrganizationForAdmin({
    actor: adminActor,
    repository,
    organizationId: "org-2",
    name: "New Breeder Updated",
    organizationType: "BREEDER",
    reason: "Name correction",
    now: "2026-06-10T11:00:00.000Z",
  });

  assert.equal(updated.organization.name, "New Breeder Updated");
  assert.equal(updated.auditLog.previousValues?.name, "New Breeder");
  assert.equal(updated.auditLog.sourceAction, "ORGANIZATION_UPDATED");
});

test("admin identity disables users and organizations without deleting history", async () => {
  const repository = createMemoryRepository();

  const disabledUser = await disableUserForAdmin({
    actor: adminActor,
    repository,
    userId: breederUserId,
    reason: "Employment ended",
    now: "2026-06-10T10:00:00.000Z",
  });

  assert.equal(disabledUser.user.status, "DISABLED");
  assert.equal(disabledUser.auditLog.sourceAction, "USER_DISABLED");
  assert.equal(repository.users.length, 1);

  const disabledOrganization = await disableOrganizationForAdmin({
    actor: adminActor,
    repository,
    organizationId: breederOrganizationId,
    reason: "Organization offboarded",
    now: "2026-06-10T10:00:00.000Z",
  });

  assert.equal(disabledOrganization.organization.status, "DISABLED");
  assert.equal(disabledOrganization.auditLog.sourceAction, "ORGANIZATION_DISABLED");
  assert.equal(repository.organizations.length, 1);
});

test("admin identity assigns roles through the role service and audit hook", async () => {
  const repository = createMemoryRepository();

  const result = await assignRoleForAdmin({
    actor: adminActor,
    repository,
    userId: breederUserId,
    organizationId: breederOrganizationId,
    roleCode: "BREEDER",
    reason: "User manages breeder orders",
    now: "2026-06-10T10:00:00.000Z",
  });

  assert.equal(result.assignment.id, "assignment-1");
  assert.equal(result.assignment.roleCode, "BREEDER");
  assert.equal(result.auditHook.action, "ROLE_ASSIGNED");
  assert.equal(result.auditLog.action, "CHANGE_PERMISSION");
  assert.equal(result.auditLog.sourceAction, "ROLE_ASSIGNED");
});

test("admin identity rejects duplicate role assignment and non-admin actors", async () => {
  const repository = createMemoryRepository([
    assignmentFixture({
      id: "existing-assignment",
      userId: breederUserId,
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
    }),
  ]);

  await assert.rejects(
    () =>
      assignRoleForAdmin({
        actor: adminActor,
        repository,
        userId: breederUserId,
        organizationId: breederOrganizationId,
        roleCode: "BREEDER",
      }),
    /already has this active role/,
  );

  await assert.rejects(
    () =>
      disableUserForAdmin({
        actor: breederActor,
        repository,
        userId: breederUserId,
        reason: "No",
      }),
    /Only active Platform Admin/,
  );

  assert.equal(canManageAdminIdentity(adminActor), true);
  assert.equal(canManageAdminIdentity(breederActor), false);
});

test("admin identity view model exposes no-delete and invitation boundaries", () => {
  const viewModel = createAdminIdentityViewModel({
    actor: adminActor,
    users: [userFixture()],
    organizations: [organizationFixture()],
    roles: [
      {
        code: "BREEDER",
        displayName: "Breeder",
        description: "Breeder role",
        phase: "PHASE_1",
        isAssignableInPhase1: true,
      },
    ],
    assignments: [
      assignmentFixture({
        id: "assignment-1",
        userId: breederUserId,
        organizationId: breederOrganizationId,
        roleCode: "BREEDER",
      }),
    ],
  });

  assert.equal(viewModel.canEdit, true);
  assert.equal(viewModel.users[0].activeRoles[0].organizationName, "Blue Stud");
  assert.equal(viewModel.organizations[0].activeRoleCount, 1);
  assert.equal(viewModel.roles[0].assignmentCount, 1);
  assert.equal(viewModel.mutationPolicy.deleteSupported, false);
  assert.equal(viewModel.invitationBoundary.implementedHere, true);
  assert.equal(viewModel.invitationBoundary.route, "/app/admin/invitations");
});

function createMemoryRepository(initialAssignments = []) {
  const users = [userFixture()];
  const organizations = [organizationFixture()];
  const assignments = initialAssignments.map((assignment) => ({ ...assignment }));
  const auditLogs = [];

  return {
    users,
    organizations,
    assignments,
    auditLogs,
    async listUsers() {
      return users;
    },
    async listOrganizations() {
      return organizations;
    },
    async listRoles() {
      return [];
    },
    async listUserOrganizationRoles() {
      return assignments;
    },
    async getUserById(userId) {
      return users.find((user) => user.id === userId) ?? null;
    },
    async getOrganizationById(organizationId) {
      return organizations.find((organization) => organization.id === organizationId) ?? null;
    },
    async createOrganization(input) {
      const organization = {
        id: `org-${organizations.length + 1}`,
        createdAt: "2026-06-10T10:00:00.000Z",
        updatedAt: "2026-06-10T10:00:00.000Z",
        ...input,
      };
      organizations.push(organization);
      return organization;
    },
    async updateOrganization(input) {
      const index = organizations.findIndex((organization) => organization.id === input.id);

      if (index === -1) {
        throw new Error("organization not found");
      }

      organizations[index] = { ...input };
      return organizations[index];
    },
    async updateUser(input) {
      const index = users.findIndex((user) => user.id === input.id);

      if (index === -1) {
        throw new Error("user not found");
      }

      users[index] = { ...input };
      return users[index];
    },
    async createUserOrganizationRole(input) {
      const assignment = {
        ...input,
        id: input.id ?? `assignment-${assignments.length + 1}`,
      };
      assignments.push(assignment);
      return assignment;
    },
    async createAuditLog(auditLog) {
      const persisted = {
        ...auditLog,
        id: auditLog.id ?? `audit-${auditLogs.length + 1}`,
      };
      auditLogs.push(persisted);
      return persisted;
    },
  };
}

function userFixture(overrides = {}) {
  return {
    id: breederUserId,
    managedAuthSubject: "google-oauth2|breeder",
    email: "breeder@example.test",
    displayName: "Breeder One",
    status: "ACTIVE",
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T09:00:00.000Z",
    ...overrides,
  };
}

function organizationFixture(overrides = {}) {
  return {
    id: breederOrganizationId,
    name: "Blue Stud",
    organizationType: "BREEDER",
    status: "ACTIVE",
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T09:00:00.000Z",
    ...overrides,
  };
}

function assignmentFixture(overrides = {}) {
  return {
    id: "assignment-fixture",
    userId: breederUserId,
    organizationId: breederOrganizationId,
    roleCode: "BREEDER",
    assignedByUserId: adminActor.userId,
    assignmentReason: "Seed",
    effectiveAt: "2026-06-10T09:00:00.000Z",
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T09:00:00.000Z",
    ...overrides,
  };
}
