import test from "node:test";
import assert from "node:assert/strict";

import {
  PHASE_1_ROLE_CODES,
  PREPARED_FUTURE_ROLE_CODES,
  ROLE_METADATA,
  RoleModelValidationError,
  assignUserOrganizationRole,
  groupActiveRolesByOrganization,
  hasActiveRole,
  isPhase1RoleCode,
  isPreparedFutureRoleCode,
} from "./role-model.mjs";

const adminRole = {
  userId: "user-platform-admin",
  organizationId: "org-coritech",
  roleCode: "PLATFORM_ADMIN",
  revokedAt: null,
};

test("role metadata includes assignable Phase 1 roles and prepared future roles", () => {
  assert.deepEqual(PHASE_1_ROLE_CODES, [
    "BREEDER",
    "BREEDING_STATION",
    "PLATFORM_ADMIN",
  ]);

  assert.deepEqual(PREPARED_FUTURE_ROLE_CODES, [
    "VET",
    "FEDERATION",
    "SALES_VENUE",
    "BUYER",
    "TECH_SUPPORT",
  ]);

  assert.equal(ROLE_METADATA.BREEDER.assignableInPhase1, true);
  assert.equal(ROLE_METADATA.BUYER.assignableInPhase1, false);
  assert.equal(isPhase1RoleCode("BREEDING_STATION"), true);
  assert.equal(isPreparedFutureRoleCode("FEDERATION"), true);
});

test("groupActiveRolesByOrganization supports multiple organizations and roles per organization", () => {
  const memberships = groupActiveRolesByOrganization([
    {
      userId: "user-breeder",
      organizationId: "org-breeder-a",
      roleCode: "BREEDER",
      revokedAt: null,
    },
    {
      userId: "user-breeder",
      organizationId: "org-breeder-b",
      roleCode: "BREEDER",
      revokedAt: null,
    },
    {
      userId: "user-breeder",
      organizationId: "org-breeder-b",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
    {
      userId: "user-breeder",
      organizationId: "org-revoked",
      roleCode: "BREEDER",
      revokedAt: "2026-06-01T00:00:00.000Z",
    },
  ]);

  assert.deepEqual(memberships, [
    {
      organizationId: "org-breeder-a",
      roles: ["BREEDER"],
    },
    {
      organizationId: "org-breeder-b",
      roles: ["BREEDER", "BREEDING_STATION"],
    },
  ]);
});

test("assignUserOrganizationRole prepares an admin role assignment with an audit hook", () => {
  const prepared = assignUserOrganizationRole({
    userId: "user-station-manager",
    organizationId: "org-station",
    roleCode: "BREEDING_STATION",
    assignedByUserId: "user-platform-admin",
    assignerRoles: [adminRole],
    assignmentReason: "Station onboarding",
    assignedAt: "2026-06-09T08:00:00.000Z",
  });

  assert.deepEqual(prepared.assignment, {
    id: null,
    userId: "user-station-manager",
    organizationId: "org-station",
    roleCode: "BREEDING_STATION",
    assignedByUserId: "user-platform-admin",
    assignmentReason: "Station onboarding",
    effectiveAt: "2026-06-09T08:00:00.000Z",
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    createdAt: "2026-06-09T08:00:00.000Z",
    updatedAt: "2026-06-09T08:00:00.000Z",
  });

  assert.deepEqual(prepared.auditHook, {
    eventType: "ROLE_ASSIGNMENT",
    action: "ROLE_ASSIGNED",
    actorUserId: "user-platform-admin",
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: "org-coritech",
    targetType: "UserOrganizationRole",
    targetId: null,
    targetRef: {
      userId: "user-station-manager",
      organizationId: "org-station",
      roleCode: "BREEDING_STATION",
    },
    previousValue: null,
    newValue: {
      userId: "user-station-manager",
      organizationId: "org-station",
      roleCode: "BREEDING_STATION",
      effectiveAt: "2026-06-09T08:00:00.000Z",
    },
    reason: "Station onboarding",
    occurredAt: "2026-06-09T08:00:00.000Z",
  });
});

test("assignUserOrganizationRole rejects assignment by a non-admin user", () => {
  assert.throws(
    () =>
      assignUserOrganizationRole({
        userId: "user-breeder",
        organizationId: "org-breeder",
        roleCode: "BREEDER",
        assignedByUserId: "user-station-manager",
        assignerRoles: [
          {
            userId: "user-station-manager",
            organizationId: "org-station",
            roleCode: "BREEDING_STATION",
            revokedAt: null,
          },
        ],
      }),
    (error) =>
      error instanceof RoleModelValidationError &&
      error.issues.includes(
        "assignedByUserId must have an active PLATFORM_ADMIN role assignment.",
      ),
  );
});

test("assignUserOrganizationRole rejects prepared future roles in Phase 1", () => {
  assert.throws(
    () =>
      assignUserOrganizationRole({
        userId: "user-future",
        organizationId: "org-future",
        roleCode: "VET",
        assignedByUserId: "user-platform-admin",
        assignerRoles: [adminRole],
      }),
    (error) =>
      error instanceof RoleModelValidationError &&
      error.issues.includes(
        "VET is prepared for later phases and is not assignable in Phase 1.",
      ),
  );
});

test("hasActiveRole can check organization-specific role context", () => {
  const assignments = [
    {
      userId: "user-multi-role",
      organizationId: "org-a",
      roleCode: "BREEDER",
      revokedAt: null,
    },
    {
      userId: "user-multi-role",
      organizationId: "org-b",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ];

  assert.equal(hasActiveRole(assignments, "BREEDER", "org-a"), true);
  assert.equal(hasActiveRole(assignments, "BREEDER", "org-b"), false);
});
