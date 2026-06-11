import assert from "node:assert/strict";
import test from "node:test";

import {
  getRequiredRoleForPath,
  resolveActiveRoleContext,
  resolveAppLanding,
  resolveRequiredRoleContext,
  resolveRoleRoute,
} from "./role-routing.mjs";

const currentUser = {
  id: "user-christoph",
  displayName: "Christoph Hoffmann",
  email: "christoph@example.com",
};

const breederSession = {
  user: currentUser,
  memberships: [
    {
      organizationId: "org-breeder",
      organizationName: "Blue Hill Breeders",
      roles: ["BREEDER"],
    },
  ],
};

const stationSession = {
  user: currentUser,
  memberships: [
    {
      organizationId: "org-station",
      organizationName: "North Station",
      roles: ["BREEDING_STATION"],
    },
  ],
};

const adminSession = {
  user: currentUser,
  memberships: [
    {
      organizationId: "org-platform",
      organizationName: "CoriTech",
      roles: ["PLATFORM_ADMIN"],
    },
  ],
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
const multiStationSession = {
  user: currentUser,
  memberships: [
    {
      organizationId: "org-station-a",
      organizationName: "North Station",
      roles: ["BREEDING_STATION"],
    },
    {
      organizationId: "org-station-b",
      organizationName: "South Station",
      roles: ["BREEDING_STATION"],
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

test("app landing sends unauthenticated users to login", () => {
  assert.deepEqual(resolveAppLanding({ session: null }), {
    status: "redirect",
    destination: "/login?returnTo=%2Fapp",
    reason: "AUTH_REQUIRED",
  });
});

test("app landing redirects single-role users to the correct dashboard", () => {
  assert.equal(resolveAppLanding({ session: breederSession }).destination, "/breeder-dashboard");
  assert.equal(resolveAppLanding({ session: stationSession }).destination, "/station-dashboard");
  assert.equal(resolveAppLanding({ session: adminSession }).destination, "/app/admin");
});

test("app landing uses the selected context for multi-role users", () => {
  assert.deepEqual(
    resolveAppLanding({
      session: multiRoleSession,
      activeContext: {
        organizationId: "org-station",
        roleCode: "BREEDING_STATION",
      },
    }),
    {
      status: "redirect",
      destination: "/station-dashboard",
      reason: "ACTIVE_ROLE",
      activeContext: expectedContext({
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
      }),
    },
  );
});

test("active context chooses the selected role for multi-role users", () => {
  assert.deepEqual(
    resolveActiveRoleContext({
      session: multiRoleSession,
      activeContext: {
        organizationId: "org-station",
        roleCode: "BREEDING_STATION",
      },
    }),
    {
      status: "resolved",
      activeContext: expectedContext({
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
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
    },
  );
});

test("multi-role users without selected context receive role selection state", () => {
  const result = resolveAppLanding({ session: multiRoleSession });

  assert.equal(result.status, "render");
  assert.equal(result.page, "ROLE_SELECTION");
  assert.equal(result.availableContexts.length, 2);
});

test("role-specific routes infer a single matching context when no context is selected", () => {
  assert.deepEqual(
    resolveRequiredRoleContext({
      session: multiRoleSession,
      requiredRoleCode: "BREEDING_STATION",
    }),
    {
      status: "resolved",
      activeContext: expectedContext({
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
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
    },
  );
  assert.equal(
    resolveRoleRoute({
      session: multiRoleSession,
      requiredRoleCode: "BREEDING_STATION",
    }).destination,
    "/station-dashboard",
  );
});

test("role-specific inference does not override a selected active context", () => {
  assert.deepEqual(
    resolveRoleRoute({
      session: multiRoleSession,
      activeContext: {
        organizationId: "org-breeder",
        roleCode: "BREEDER",
      },
      requiredRoleCode: "BREEDING_STATION",
    }),
    {
      status: "redirect",
      destination: "/unauthorized",
      reason: "ROLE_FORBIDDEN",
      activeContext: expectedContext({
        organizationId: "org-breeder",
        organizationName: "Blue Hill Breeders",
        roleCode: "BREEDER",
        roleLabel: "Breeder",
      }),
    },
  );
});

test("role-specific inference requires a single matching organization context", () => {
  const result = resolveRequiredRoleContext({
    session: multiStationSession,
    requiredRoleCode: "BREEDING_STATION",
  });

  assert.equal(result.status, "multi-role-selection-required");
  assert.equal(result.availableContexts.length, 2);
});

test("invalid persisted context falls back safely for single-context users", () => {
  assert.deepEqual(
    resolveActiveRoleContext({
      session: breederSession,
      activeContext: {
        organizationId: "old-org",
        roleCode: "BREEDING_STATION",
      },
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

test("invalid persisted context requires reselection for multi-context users", () => {
  const result = resolveActiveRoleContext({
    session: multiRoleSession,
    activeContext: {
      organizationId: "old-org",
      roleCode: "PLATFORM_ADMIN",
    },
  });

  assert.equal(result.status, "multi-role-selection-required");
  assert.equal(result.availableContexts.length, 2);
});

test("users with no active organization role receive no-role state", () => {
  assert.deepEqual(resolveAppLanding({ session: { user: currentUser, memberships: [] } }), {
    status: "render",
    page: "NO_ROLE",
    reason: "NO_ACTIVE_ORGANIZATION_ROLE",
  });
});

test("role routes enforce the selected active role", () => {
  assert.equal(
    resolveRoleRoute({
      session: breederSession,
      requiredRoleCode: "BREEDER",
    }).destination,
    "/breeder-dashboard",
  );

  assert.deepEqual(
    resolveRoleRoute({
      session: breederSession,
      requiredRoleCode: "BREEDING_STATION",
    }),
    {
      status: "redirect",
      destination: "/unauthorized",
      reason: "ROLE_FORBIDDEN",
      activeContext: expectedContext({
        organizationId: "org-breeder",
        organizationName: "Blue Hill Breeders",
        roleCode: "BREEDER",
        roleLabel: "Breeder",
      }),
    },
  );
});

test("role routes cover station and admin redirects without auth loops", () => {
  assert.deepEqual(resolveRoleRoute({ session: null, requiredRoleCode: "BREEDER" }), {
    status: "redirect",
    destination: "/login?returnTo=%2Fapp%2Fbreeder",
    reason: "AUTH_REQUIRED",
  });
  assert.equal(
    resolveRoleRoute({
      session: stationSession,
      requiredRoleCode: "BREEDING_STATION",
    }).destination,
    "/station-dashboard",
  );
  assert.equal(
    resolveRoleRoute({
      session: adminSession,
      requiredRoleCode: "PLATFORM_ADMIN",
    }).destination,
    "/app/admin",
  );

  assert.deepEqual(
    resolveRoleRoute({
      session: stationSession,
      requiredRoleCode: "PLATFORM_ADMIN",
    }),
    {
      status: "redirect",
      destination: "/unauthorized",
      reason: "ROLE_FORBIDDEN",
      activeContext: expectedContext({
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
      }),
    },
  );
});

test("route paths map to the role needed for post-login context selection", () => {
  assert.equal(getRequiredRoleForPath("/station-dashboard?orderId=1"), "BREEDING_STATION");
  assert.equal(getRequiredRoleForPath("/breeder-dashboard"), "BREEDER");
  assert.equal(getRequiredRoleForPath("/app/admin/orders"), "PLATFORM_ADMIN");
  assert.equal(getRequiredRoleForPath("/app/catalog/listing-1"), "BREEDER");
  assert.equal(getRequiredRoleForPath("/app/documents/upload"), null);
});
