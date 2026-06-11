import assert from "node:assert/strict";
import test from "node:test";

import { createHealthStatus } from "./health.mjs";

test("createHealthStatus returns safe runtime status", () => {
  const status = createHealthStatus({
    now: new Date("2026-06-10T10:00:00.000Z"),
    environment: "production"
  });

  assert.deepEqual(status, {
    status: "ok",
    service: "coritech-web",
    environment: "production",
    timestamp: "2026-06-10T10:00:00.000Z"
  });
});

test("createHealthStatus normalizes unknown environments", () => {
  const status = createHealthStatus({
    now: new Date("2026-06-10T10:00:00.000Z"),
    environment: "local-preview"
  });

  assert.equal(status.environment, "development");
  assert.equal(Object.hasOwn(status, "DATABASE_URL"), false);
});
