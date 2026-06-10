import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRbacPermission } from "../auth/rbac-middleware.mjs";
import {
  ActiveContextValidationError,
  activeContextMatches,
  buildActiveContextAttribution,
  createActorFromActiveContext,
  resolveActiveOrganizationRoleContext,
  switchActiveOrganizationRoleContext,
} from "./active-context.mjs";

const timestamp = "2026-06-10T10:00:00.000Z";
const userId = "user-multi";
const breederOrganizationId = "org-breeder";
const stationOrganizationId = "org-station";
const disabledOrganizationId = "org-disabled";

const organizations = [
  {
    id: breederOrganizationId,
    name: "Blue Hill Breeders",
    organizationType: "BREEDER",
    status: "ACTIVE",
  },
  {
    id: stationOrganizationId,
    name: "North Station",
    organizationType: "BREEDING_STATION",
    status: "ACTIVE",
  },
  {
    id: disabledOrganizationId,
    name: "Disabled Station",
    organizationType: "BREEDING_STATION",
    status: "DISABLED",
  },
];

const breederAssignment = {
  id: "role-breeder",
  userId,
  organizationId: breederOrganizationId,
  roleCode: "BREEDER",
  revokedAt: null,
};

const stationAssignment = {
  id: "role-station",
  userId,
  organizationId: stationOrganizationId,
  roleCode: "BREEDING_STATION",
  revokedAt: null,
};

const disabledOrganizationAssignment = {
  id: "role-disabled-station",
  userId,
  organizationId: disabledOrganizationId,
  roleCode: "BREEDING_STATION",
  revokedAt: null,
};

const futureRoleAssignment = {
  id: "role-buyer",
  userId,
  organizationId: "org-buyer",
  roleCode: "BUYER",
  revokedAt: null,
};

test("single active role resolves automatically as active context", () => {
  const resolution = resolveActiveOrganizationRoleContext({
    userId,
    roleAssignments: [
      breederAssignment,
      disabledOrganizationAssignment,
      futureRoleAssignment,
    ],
    organizations,
  });

  assert.equal(resolution.status, "RESOLVED");
  assert.deepEqual(resolution.activeContext, {
    userId,
    organizationId: breederOrganizationId,
    organizationName: "Blue Hill Breeders",
    organizationType: "BREEDER",
    roleCode: "BREEDER",
    roleLabel: "Breeder",
    assignmentId: "role-breeder",
  });
  assert.equal(resolution.availableContexts.length, 1);
});

test("multi-context users must select a context and can switch to a validated membership", () => {
  const needsSelection = resolveActiveOrganizationRoleContext({
    userId,
    roleAssignments: [breederAssignment, stationAssignment],
    organizations,
  });

  assert.equal(needsSelection.status, "SELECTION_REQUIRED");
  assert.equal(needsSelection.activeContext, null);
  assert.equal(needsSelection.availableContexts.length, 2);

  const switched = switchActiveOrganizationRoleContext({
    userId,
    roleAssignments: [breederAssignment, stationAssignment],
    organizations,
    selectedContext: {
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
    },
    now: timestamp,
  });

  assert.equal(switched.status, "SWITCHED");
  assert.deepEqual(switched.sessionState, {
    userId,
    activeOrganizationId: stationOrganizationId,
    activeRoleCode: "BREEDING_STATION",
    activeContextKey: `${userId}:${stationOrganizationId}:BREEDING_STATION`,
    persistedAt: timestamp,
  });
});

test("invalid active context switches are rejected", () => {
  assert.throws(
    () =>
      switchActiveOrganizationRoleContext({
        userId,
        roleAssignments: [breederAssignment],
        organizations,
        selectedContext: {
          organizationId: stationOrganizationId,
          roleCode: "BREEDING_STATION",
        },
      }),
    ActiveContextValidationError,
  );
});

test("no active Phase 1 organization role returns no-context state", () => {
  const resolution = resolveActiveOrganizationRoleContext({
    userId,
    roleAssignments: [futureRoleAssignment],
    organizations,
  });

  assert.deepEqual(resolution, {
    status: "NO_ACTIVE_CONTEXT",
    activeContext: null,
    availableContexts: [],
    reason: "No active Phase 1 organization role exists for this user.",
  });
});

test("RBAC permission checks use the actor derived from active context", async () => {
  const breederContext = switchActiveOrganizationRoleContext({
    userId,
    roleAssignments: [breederAssignment, stationAssignment],
    organizations,
    selectedContext: {
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
    },
  }).activeContext;
  const stationContext = switchActiveOrganizationRoleContext({
    userId,
    roleAssignments: [breederAssignment, stationAssignment],
    organizations,
    selectedContext: {
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
    },
  }).activeContext;

  const allowed = await evaluateRbacPermission({
    action: "CREATE_SEMEN_ORDER",
    request: {
      actor: createActorFromActiveContext(breederContext),
      repository: {},
      body: {
        breederOrganizationId,
      },
    },
    handlerName: "createDraftSemenOrderEndpoint",
    now: timestamp,
  });
  const denied = await evaluateRbacPermission({
    action: "CREATE_SEMEN_ORDER",
    request: {
      actor: createActorFromActiveContext(stationContext),
      repository: {},
      body: {
        breederOrganizationId,
      },
    },
    handlerName: "createDraftSemenOrderEndpoint",
    now: timestamp,
  });

  assert.equal(allowed.allowed, true);
  assert.equal(allowed.actorRoleCode, "BREEDER");
  assert.equal(allowed.actorOrganizationId, breederOrganizationId);
  assert.equal(denied.allowed, false);
  assert.equal(denied.actorRoleCode, "BREEDING_STATION");
  assert.equal(denied.actorOrganizationId, stationOrganizationId);
});

test("audit and proof attribution can be derived from active context", () => {
  const context = switchActiveOrganizationRoleContext({
    userId,
    roleAssignments: [stationAssignment],
    organizations,
    selectedContext: {
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
    },
  }).activeContext;

  assert.equal(activeContextMatches(context, "BREEDING_STATION", stationOrganizationId), true);
  assert.deepEqual(buildActiveContextAttribution(context), {
    actorUserId: userId,
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: stationOrganizationId,
    actorContext: {
      type: "MANAGED_AUTH_ACTOR_CONTEXT",
      userId,
      roleCode: "BREEDING_STATION",
      organizationId: stationOrganizationId,
    },
  });
});
