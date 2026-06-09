import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const matrix = readFileSync(
  new URL("./role-permission-matrix.md", import.meta.url),
  "utf8",
);

test("role-permission matrix covers Ticket 12.2 required roles", () => {
  for (const role of [
    "BREEDER",
    "BREEDING_STATION",
    "PLATFORM_ADMIN",
    "VET",
    "FEDERATION",
    "BUYER",
    "TECH_SUPPORT",
  ]) {
    assert.ok(matrix.includes(`\`${role}\``), `missing ${role}`);
  }

  assert.match(matrix, /Active Phase 1 Matrix/);
  assert.match(matrix, /Future Role Preparation/);
});

test("role-permission matrix documents buyer-view and support guardrails", () => {
  assert.match(matrix, /Buyer View is not full database access/);
  assert.match(matrix, /generated,\s+permissioned,\s+read-only view/);
  assert.match(matrix, /does not grant a buyer\s+role/);
  assert.match(matrix, /External technical support is restricted and time-bounded/);
  assert.match(matrix, /No standing access/);
  assert.match(matrix, /expiry time/);
});
