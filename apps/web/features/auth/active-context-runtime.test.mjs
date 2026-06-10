import assert from "node:assert/strict";
import test from "node:test";

import {
  buildActiveContextSelectionKey,
  createDashboardContextOptions,
  parseActiveContextCookie,
  resolveActiveContextFromSession,
  resolveActiveContextSwitch,
  serializeActiveContextCookie,
} from "./active-context-runtime.mjs";

const multiRoleSession = {
  memberships: [
    {
      organizationId: "org-breeder",
      organizationName: "Blue Hill Breeders",
      roles: ["BREEDER"],
    },
    {
      organizationId: "org-station",
      organizationName: "North Station",
      roles: ["BREEDING_STATION"],
    },
  ],
};

test("active context cookie is only a validated selection preference", () => {
  const resolution = resolveActiveContextFromSession({
    session: multiRoleSession,
    cookieValue: "org-station:BREEDING_STATION",
  });

  assert.equal(resolution.status, "resolved");
  assert.deepEqual(resolution.activeContext, {
    organizationId: "org-station",
    organizationName: "North Station",
    roleCode: "BREEDING_STATION",
    roleLabel: "Breeding Station",
  });

  assert.equal(
    resolveActiveContextFromSession({
      session: multiRoleSession,
      cookieValue: "org-admin:PLATFORM_ADMIN",
    }).status,
    "no-role",
  );
});

test("context switch validates the requested context against session memberships", () => {
  const switched = resolveActiveContextSwitch({
    session: multiRoleSession,
    selectedContextKey: "org-breeder:BREEDER",
  });

  assert.deepEqual(switched, {
    ok: true,
    reason: "CONTEXT_SWITCHED",
    activeContext: {
      organizationId: "org-breeder",
      organizationName: "Blue Hill Breeders",
      roleCode: "BREEDER",
      roleLabel: "Breeder",
    },
    availableContexts: [
      {
        organizationId: "org-breeder",
        organizationName: "Blue Hill Breeders",
        roleCode: "BREEDER",
        roleLabel: "Breeder",
      },
      {
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
      },
    ],
    cookieValue: "org-breeder:BREEDER",
    redirectTo: "/breeder-dashboard",
  });
});

test("context switch rejects missing sessions, malformed selections and unauthorized memberships", () => {
  assert.deepEqual(resolveActiveContextSwitch({ session: null }), {
    ok: false,
    reason: "AUTH_REQUIRED",
    cookieValue: "",
    redirectTo: "/login?returnTo=%2Fapp",
  });
  assert.equal(
    resolveActiveContextSwitch({
      session: multiRoleSession,
      selectedContextKey: "org-breeder:BUYER",
    }).reason,
    "INVALID_CONTEXT",
  );
  assert.equal(
    resolveActiveContextSwitch({
      session: multiRoleSession,
      selectedContextKey: "org-admin:PLATFORM_ADMIN",
    }).reason,
    "UNAUTHORIZED_CONTEXT",
  );
});

test("dashboard context options use the same key as the switch action", () => {
  const resolved = resolveActiveContextFromSession({
    session: multiRoleSession,
    cookieValue: "org-station:BREEDING_STATION",
  });

  assert.equal(resolved.status, "resolved");

  const options = createDashboardContextOptions(resolved.availableContexts);

  assert.deepEqual(options, [
    {
      key: "org-breeder:BREEDER",
      label: "Blue Hill Breeders - Breeder",
      organizationName: "Blue Hill Breeders",
      roleLabel: "Breeder",
    },
    {
      key: "org-station:BREEDING_STATION",
      label: "North Station - Breeding Station",
      organizationName: "North Station",
      roleLabel: "Breeding Station",
    },
  ]);
  assert.equal(
    buildActiveContextSelectionKey(resolved.activeContext),
    "org-station:BREEDING_STATION",
  );
  assert.deepEqual(
    parseActiveContextCookie(serializeActiveContextCookie(resolved.activeContext)),
    {
      organizationId: "org-station",
      roleCode: "BREEDING_STATION",
    },
  );
});
