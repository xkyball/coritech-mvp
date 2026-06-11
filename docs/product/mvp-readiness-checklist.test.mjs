import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const checklist = readFileSync(
  new URL("./mvp-readiness-checklist.md", import.meta.url),
  "utf8",
);

test("MVP readiness checklist covers required groups and statuses", () => {
  for (const heading of [
    "Product",
    "Auth",
    "Workflow",
    "Proof/Audit",
    "Documents",
    "Security",
    "Infrastructure",
    "Testing",
    "Demo",
    "DD",
  ]) {
    assert.match(checklist, new RegExp(`## ${heading}`));
  }

  for (const status of ["PASS", "FAIL", "BLOCKED", "PENDING_REVIEW"]) {
    assert.ok(checklist.includes(status), `missing ${status}`);
  }
});

test("MVP readiness checklist includes acceptance-critical checks", () => {
  for (const phrase of [
    "Auth/login checks pass",
    "Role redirect/context checks pass",
    "Breeder-to-station order flow checks pass",
    "Draft-to-submit check passes",
    "Shipment/document checks pass",
    "Proof/audit checks pass",
    "Staging/deployment checks documented",
    "Backup/error tracking checks documented",
    "Demo script readiness",
    "DD evidence links/fields present",
    "No hardcoded secrets check",
    "No public document links",
    "permission boundaries",
    "Admin access/ownership checks",
  ]) {
    assert.match(checklist, new RegExp(phrase, "i"));
  }
});
