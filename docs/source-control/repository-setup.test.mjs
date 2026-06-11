import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const codeowners = readFileSync(new URL("../../.github/CODEOWNERS", import.meta.url), "utf8");
const branchProtection = readFileSync(
  new URL("./branch-protection.md", import.meta.url),
  "utf8",
);
const ownership = readFileSync(
  new URL("./repository-ownership.md", import.meta.url),
  "utf8",
);

test("repository setup docs define CODEOWNERS and branch protection requirements", () => {
  assert.match(codeowners, /@coritech\/maintainers/);
  assert.match(branchProtection, /pull request required before merge/);
  assert.match(branchProtection, /CI \/ Install, lint, typecheck, test and build/);
  assert.match(branchProtection, /force pushes disabled/);
});

test("repository ownership docs do not treat the local remote as proof", () => {
  assert.match(ownership, /not sufficient proof of CoriTech ownership/);
  assert.match(ownership, /xkyball\/coritech-mvp/);
  assert.match(ownership, /Backup admin/);
});
