import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const note = readFileSync(
  new URL("./security-gdpr-note.md", import.meta.url),
  "utf8",
);

test("security GDPR note includes Ticket 12.3 acceptance statements", () => {
  assert.match(note, /Horse and equine transaction data is not harmless by default/);
  assert.match(note, /assess lawful basis per data flow/);
  assert.match(note, /Consent inside the product is a permission signal/);
  assert.match(note, /not automatically the GDPR\s+lawful basis/);
  assert.match(note, /MVP does not require blockchain or tokens/);
});

test("security GDPR note covers MVP controls and due-diligence sections", () => {
  for (const heading of [
    "Executive Position",
    "Data Classification",
    "Roles and Permissions",
    "Proof Chain Security",
    "MVP Security Controls",
    "Document Access",
    "Buyer View Boundary",
    "Risk-Control Mapping",
    "Due-Diligence Checklist",
    "Security Roadmap",
  ]) {
    assert.match(note, new RegExp(`## ${heading}`));
  }
});
