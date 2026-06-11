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
import { getNavigationForRole } from "../navigation.mjs";

const currentUser = {
  id: "user-christoph",
  displayName: "Christoph Hoffmann",
  email: "christoph@example.com",
};

const multiRoleSession = {
  user: currentUser,
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

const singleRoleSession = {
  user: currentUser,
  memberships: [
    {
      organizationId: "org-breeder",
      organizationName: "Blue Hill Breeders",
      roles: ["BREEDER"],
    },
  ],
};

function expectedContext(input) {
  return {
    userId: currentUser.id,
    userLabel: currentUser.displayName,
    ...input,
  };
}

test("active context cookie is only a validated selection preference", () => {
  const resolution = resolveActiveContextFromSession({
    session: multiRoleSession,
    cookieValue: "org-station:BREEDING_STATION",
  });

  assert.equal(resolution.status, "resolved");
  assert.deepEqual(resolution.activeContext, expectedContext({
    organizationId: "org-station",
    organizationName: "North Station",
    roleCode: "BREEDING_STATION",
    roleLabel: "Breeding Station",
  }));

  assert.equal(
    resolveActiveContextFromSession({
      session: multiRoleSession,
      cookieValue: "org-admin:PLATFORM_ADMIN",
    }).status,
    "multi-role-selection-required",
  );
});

test("single-context users recover safely from an invalid persisted context", () => {
  assert.deepEqual(
    resolveActiveContextFromSession({
      session: singleRoleSession,
      cookieValue: "old-org:BREEDING_STATION",
    }),
    {
      status: "resolved",
      activeContext: expectedContext({
        organizationId: "org-breeder",
        organizationName: "Blue Hill Breeders",
        roleCode: "BREEDER",
        roleLabel: "Breeder",
      }),
      availableContexts: [
        expectedContext({
          organizationId: "org-breeder",
          organizationName: "Blue Hill Breeders",
          roleCode: "BREEDER",
          roleLabel: "Breeder",
        }),
      ],
    },
  );
});

test("active context persists across refresh through a revalidated cookie preference", () => {
  const firstResolution = resolveActiveContextFromSession({
    session: multiRoleSession,
    cookieValue: "org-station:BREEDING_STATION",
  });

  assert.equal(firstResolution.status, "resolved");

  const refreshedResolution = resolveActiveContextFromSession({
    session: multiRoleSession,
    cookieValue: serializeActiveContextCookie(firstResolution.activeContext),
  });

  assert.equal(refreshedResolution.status, "resolved");
  assert.deepEqual(refreshedResolution.activeContext, firstResolution.activeContext);
});

test("context switch validates the requested context against session memberships", () => {
  const switched = resolveActiveContextSwitch({
    session: multiRoleSession,
    selectedContextKey: "org-breeder:BREEDER",
  });

  assert.deepEqual(switched, {
    ok: true,
    reason: "CONTEXT_SWITCHED",
    activeContext: expectedContext({
      organizationId: "org-breeder",
      organizationName: "Blue Hill Breeders",
      roleCode: "BREEDER",
      roleLabel: "Breeder",
    }),
    availableContexts: [
      expectedContext({
        organizationId: "org-breeder",
        organizationName: "Blue Hill Breeders",
        roleCode: "BREEDER",
        roleLabel: "Breeder",
      }),
      expectedContext({
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
      }),
    ],
    cookieValue: "org-breeder:BREEDER",
    redirectTo: "/breeder-dashboard",
  });

  assert.deepEqual(
    getNavigationForRole(switched.activeContext.roleCode).map((item) => item.href),
    [
      "/breeder-dashboard",
      "/app/catalog",
      "/app/orders/new",
      "/app/documents/upload",
    ],
  );
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
      label: "Christoph Hoffmann / Blue Hill Breeders / Breeder",
      organizationName: "Blue Hill Breeders",
      roleLabel: "Breeder",
    },
    {
      key: "org-station:BREEDING_STATION",
      label: "Christoph Hoffmann / North Station / Breeding Station",
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
