import assert from "node:assert/strict";
import test from "node:test";

import {
  TEST_CLOCK_ISO,
  TEST_ORGANIZATIONS,
  createMockActiveContext,
  createMockExternalProvider,
  createTestDatabaseStrategy,
  createTestRoleAssignment,
  createTestUser,
} from "./test-kit.mjs";

test("test factories create deterministic users and role assignments", () => {
  const user = createTestUser();
  const assignment = createTestRoleAssignment({
    userId: user.id,
    organizationId: TEST_ORGANIZATIONS.breeder.id,
  });

  assert.equal(TEST_CLOCK_ISO, "2026-06-10T10:00:00.000Z");
  assert.equal(user.email, "breeder.test@example.invalid");
  assert.equal(assignment.roleCode, "BREEDER");
  assert.equal(assignment.revokedAt, null);
});

test("auth-context helper returns actor and attribution shapes for service tests", () => {
  const context = createMockActiveContext();

  assert.equal(context.activeContext.organizationId, TEST_ORGANIZATIONS.breeder.id);
  assert.equal(context.actor.roles[0].roleCode, "BREEDER");
  assert.deepEqual(context.attribution.actorContext, {
    type: "MANAGED_AUTH_ACTOR_CONTEXT",
    userId: context.user.id,
    roleCode: "BREEDER",
    organizationId: TEST_ORGANIZATIONS.breeder.id,
  });
});

test("mock external provider records calls without real credentials", async () => {
  const provider = createMockExternalProvider("email");
  const result = await provider.send({
    to: "user@example.invalid",
    template: "ORDER_SUBMITTED",
  });

  assert.deepEqual(result, {
    provider: "email",
    status: "MOCK_ACCEPTED",
    providerMessageId: "email-1",
  });
  assert.equal(provider.calls.length, 1);
});

test("test database strategy reports configuration without exposing URLs", () => {
  const strategy = createTestDatabaseStrategy({
    env: {
      TEST_DATABASE_URL: "postgresql://user:password@localhost:5432/coritech_test",
    },
  });

  assert.equal(strategy.status, "AVAILABLE");
  assert.equal(strategy.safeConnectionLabel, "TEST_DATABASE_URL configured");
  assert.equal(Object.hasOwn(strategy, "databaseUrl"), false);
});
