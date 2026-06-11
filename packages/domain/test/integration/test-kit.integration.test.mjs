import assert from "node:assert/strict";
import test from "node:test";

import { evaluateRbacPermission } from "../../src/auth/rbac-middleware.mjs";
import {
  TEST_ORGANIZATIONS,
  createMockActiveContext,
} from "../../src/testing/test-kit.mjs";

test("service integration tests can use mocked auth context with RBAC", async () => {
  const mockContext = createMockActiveContext();

  const permission = await evaluateRbacPermission({
    action: "CREATE_SEMEN_ORDER",
    handlerName: "createDraftSemenOrderEndpoint",
    request: {
      actor: mockContext.actor,
      repository: {},
      body: {
        breederOrganizationId: TEST_ORGANIZATIONS.breeder.id,
      },
    },
    now: "2026-06-10T10:00:00.000Z",
  });

  assert.equal(permission.allowed, true);
  assert.equal(permission.actorRoleCode, "BREEDER");
  assert.equal(permission.actorOrganizationId, TEST_ORGANIZATIONS.breeder.id);
});
