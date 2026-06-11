// @ts-check

import {
  buildActiveContextAttribution,
  createActorFromActiveContext,
  resolveActiveOrganizationRoleContext,
} from "../identity/active-context.mjs";

export const TEST_CLOCK_ISO = "2026-06-10T10:00:00.000Z";

export const TEST_ORGANIZATIONS = deepFreeze({
  breeder: {
    id: "test-org-breeder",
    name: "Test Breeder Organization",
    organizationType: "BREEDER",
    status: "ACTIVE",
  },
  station: {
    id: "test-org-station",
    name: "Test Breeding Station",
    organizationType: "BREEDING_STATION",
    status: "ACTIVE",
  },
  platform: {
    id: "test-org-platform",
    name: "CoriTech Test Platform",
    organizationType: "PLATFORM",
    status: "ACTIVE",
  },
});

/**
 * @param {Partial<import("./test-kit.d.ts").TestUser>} [overrides]
 * @returns {Readonly<import("./test-kit.d.ts").TestUser>}
 */
export function createTestUser(overrides = {}) {
  return Object.freeze({
    id: "test-user-breeder",
    email: "breeder.test@example.invalid",
    displayName: "Test Breeder",
    status: "ACTIVE",
    ...overrides,
  });
}

/**
 * @param {Partial<import("./test-kit.d.ts").TestOrganization>} [overrides]
 * @returns {Readonly<import("./test-kit.d.ts").TestOrganization>}
 */
export function createTestOrganization(overrides = {}) {
  return Object.freeze({
    ...TEST_ORGANIZATIONS.breeder,
    ...overrides,
  });
}

/**
 * @param {Partial<import("./test-kit.d.ts").TestRoleAssignment>} [overrides]
 * @returns {Readonly<import("./test-kit.d.ts").TestRoleAssignment>}
 */
export function createTestRoleAssignment(overrides = {}) {
  const userId = overrides.userId ?? "test-user-breeder";
  const organizationId = overrides.organizationId ?? TEST_ORGANIZATIONS.breeder.id;
  const roleCode = overrides.roleCode ?? "BREEDER";

  return Object.freeze({
    id: `test-role-${userId}-${organizationId}-${roleCode}`,
    userId,
    organizationId,
    roleCode,
    revokedAt: null,
    ...overrides,
  });
}

/**
 * @param {import("./test-kit.d.ts").CreateMockActiveContextInput} [input]
 * @returns {Readonly<import("./test-kit.d.ts").MockActiveContext>}
 */
export function createMockActiveContext(input = {}) {
  const user = input.user ?? createTestUser();
  const organization = input.organization ?? createTestOrganization();
  const roleAssignment = input.roleAssignment ?? createTestRoleAssignment({
    userId: user.id,
    organizationId: organization.id,
    roleCode: input.roleCode ?? "BREEDER",
  });

  const resolution = resolveActiveOrganizationRoleContext({
    userId: user.id,
    roleAssignments: [roleAssignment],
    organizations: [organization],
    selectedContext: {
      organizationId: roleAssignment.organizationId,
      roleCode: roleAssignment.roleCode,
    },
  });

  if (resolution.status !== "RESOLVED" || !resolution.activeContext) {
    throw new Error("Test active context could not be resolved.");
  }

  return deepFreeze({
    user,
    organization,
    roleAssignment,
    activeContext: resolution.activeContext,
    actor: createActorFromActiveContext(resolution.activeContext),
    attribution: buildActiveContextAttribution(resolution.activeContext),
  });
}

/**
 * @param {string} [name]
 * @returns {import("./test-kit.d.ts").MockExternalProvider}
 */
export function createMockExternalProvider(name = "mock-provider") {
  const calls = [];

  return {
    name,
    calls,
    async send(payload) {
      const call = deepFreeze({
        sequence: calls.length + 1,
        payload: cloneJson(payload),
      });
      calls.push(call);

      return Object.freeze({
        provider: name,
        status: "MOCK_ACCEPTED",
        providerMessageId: `${name}-${call.sequence}`,
      });
    },
  };
}

/**
 * @param {{ env?: Record<string, string | undefined> }} [input]
 * @returns {Readonly<import("./test-kit.d.ts").TestDatabaseStrategy>}
 */
export function createTestDatabaseStrategy(input = {}) {
  const env = input.env ?? process.env;
  const hasTestDatabaseUrl = typeof env.TEST_DATABASE_URL === "string" &&
    env.TEST_DATABASE_URL.trim().length > 0;

  return Object.freeze({
    kind: "POSTGRES_TEST_DATABASE",
    status: hasTestDatabaseUrl ? "AVAILABLE" : "UNCONFIGURED",
    requiredEnv: "TEST_DATABASE_URL",
    safeConnectionLabel: hasTestDatabaseUrl
      ? "TEST_DATABASE_URL configured"
      : "TEST_DATABASE_URL not configured",
  });
}

function cloneJson(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);

  for (const child of Object.values(value)) {
    deepFreeze(child);
  }

  return value;
}
