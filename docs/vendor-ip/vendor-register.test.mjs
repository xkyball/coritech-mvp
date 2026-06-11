import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const markdown = readFileSync(
  new URL("./vendor-register.md", import.meta.url),
  "utf8",
);
const csv = readFileSync(new URL("./vendor-register.csv", import.meta.url), "utf8");

test("vendor register includes required Phase 1 vendor types", () => {
  for (const vendorType of [
    "Development agency / freelancer",
    "UX designer / design studio",
    "Cloud / hosting provider",
    "Managed auth provider",
    "Payment provider",
    "Notification/email provider",
    "Object storage provider",
    "Legal / GDPR adviser",
  ]) {
    assert.ok(markdown.includes(vendorType), `missing ${vendorType}`);
    assert.ok(csv.includes(vendorType), `missing ${vendorType} in CSV`);
  }
});

test("vendor register contains contract, handover, risk, owner and status fields", () => {
  for (const field of [
    "Vendor type",
    "Role",
    "Access level",
    "Data access",
    "IP created",
    "Contract required",
    "Exit/handover requirement",
    "Risk level",
    "Current owner",
    "Status",
  ]) {
    assert.ok(markdown.includes(field), `missing markdown field ${field}`);
    assert.ok(csv.startsWith("Vendor type,Role,Access level,Data access,IP created,Contract required,Exit/handover requirement,Risk level,Current owner,Status"));
  }
});
