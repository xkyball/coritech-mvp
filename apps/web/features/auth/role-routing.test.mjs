import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveActiveRoleContext,
  resolveAppLanding,
  resolveRoleRoute,
} from "./role-routing.mjs";

const breederSession = {
  memberships: [
    {
      organizationId: "org-breeder",
      organizationName: "Blue Hill Breeders",
      roles: ["BREEDER"],
    },
  ],
};

const stationSession = {
  memberships: [
    {
      organizationId: "org-station",
      organizationName: "North Station",
      roles: ["BREEDING_STATION"],
    },
  ],
};

const adminSession = {
  memberships: [
    {
      organizationId: "org-platform",
      organizationName: "CoriTech",
      roles: ["PLATFORM_ADMIN"],
    },
  ],
};

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
      activeContext: {
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
      },
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
      activeContext: {
        organizationId: "org-station",
        organizationName: "North Station",
        roleCode: "BREEDING_STATION",
        roleLabel: "Breeding Station",
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
    },
  );
});

test("multi-role users without selected context receive role selection state", () => {
  const result = resolveAppLanding({ session: multiRoleSession });

  assert.equal(result.status, "render");
  assert.equal(result.page, "ROLE_SELECTION");
  assert.equal(result.availableContexts.length, 2);
});

test("users with no active organization role receive no-role state", () => {
  assert.deepEqual(resolveAppLanding({ session: { memberships: [] } }), {
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
      activeContext: {
        organizationId: "org-breeder",
        organizationName: "Blue Hill Breeders",
        roleCode: "BREEDER",
        roleLabel: "Breeder",
      },
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
});
