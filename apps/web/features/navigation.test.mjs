import assert from "node:assert/strict";
import test from "node:test";

import {
  adminNavigation,
  breederNavigation,
  canRoleSeeNavigationItem,
  getNavigationForRole,
  roleNavigationGroups,
  stationNavigation,
} from "./navigation.mjs";

test("role navigation groups are centralized for breeder, station and admin", () => {
  assert.deepEqual(Object.keys(roleNavigationGroups).sort(), [
    "BREEDER",
    "BREEDING_STATION",
    "PLATFORM_ADMIN",
  ]);
  assert.equal(breederNavigation.length > 0, true);
  assert.equal(stationNavigation.length > 0, true);
  assert.equal(adminNavigation.length > 0, true);
});

test("navigation visibility follows the active role", () => {
  assert.equal(canRoleSeeNavigationItem("BREEDER", "/app/catalog"), true);
  assert.equal(canRoleSeeNavigationItem("BREEDER", "/app/station/listings"), false);
  assert.equal(canRoleSeeNavigationItem("BREEDING_STATION", "/app/station/orders"), true);
  assert.equal(canRoleSeeNavigationItem("BREEDING_STATION", "/app/station/stallions"), true);
  assert.equal(canRoleSeeNavigationItem("BREEDING_STATION", "/app/station/listings"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/users"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/invitations"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/organizations"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/roles"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/orders"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/support"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/proof"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/audit"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/permissions"), true);
  assert.equal(canRoleSeeNavigationItem("PLATFORM_ADMIN", "/app/admin/amendments"), true);
});

test("unknown roles receive no protected navigation links", () => {
  assert.deepEqual(getNavigationForRole("BUYER"), []);
  assert.equal(canRoleSeeNavigationItem("BUYER", "/app/catalog"), false);
});
