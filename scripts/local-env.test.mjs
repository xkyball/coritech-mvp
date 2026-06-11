import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  loadLocalEnv,
  parseDotEnv,
} from "./local-env.mjs";

test("parseDotEnv handles comments, quotes and export prefixes", () => {
  assert.deepEqual(
    parseDotEnv(`
      # local developer config
      export APP_BASE_URL=http://localhost:3000
      AUTH_SESSION_SECRET="line\\nwith\\ttabs"
      EMAIL_FROM_NAME='CoriTech Local'
      INLINE_COMMENT=value # comment
    `),
    {
      APP_BASE_URL: "http://localhost:3000",
      AUTH_SESSION_SECRET: "line\nwith\ttabs",
      EMAIL_FROM_NAME: "CoriTech Local",
      INLINE_COMMENT: "value",
    },
  );
});

test("loadLocalEnv loads root-style env files without overriding explicit shell values", () => {
  const directory = mkdtempSync(join(tmpdir(), "coritech-env-"));
  const envFilePath = join(directory, ".env");
  const targetEnv = {
    DATABASE_URL: "postgresql://explicit-shell-value",
  };

  try {
    writeFileSync(
      envFilePath,
      [
        "DATABASE_URL=postgresql://from-file",
        "APP_BASE_URL=http://localhost:3000",
        "NODE_ENV=development",
      ].join("\n"),
    );

    const result = loadLocalEnv({
      envFilePath,
      targetEnv,
    });

    assert.equal(result.skipped, false);
    assert.deepEqual(result.loadedKeys, ["APP_BASE_URL"]);
    assert.equal(targetEnv.DATABASE_URL, "postgresql://explicit-shell-value");
    assert.equal(targetEnv.APP_BASE_URL, "http://localhost:3000");
    assert.equal(targetEnv.NODE_ENV, undefined);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});
