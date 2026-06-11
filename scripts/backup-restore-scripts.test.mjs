import test from "node:test";
import assert from "node:assert/strict";

import {
  buildBackupCommand,
  createBackupPlan,
} from "./backup-database.mjs";
import {
  buildRestoreCommand,
  createRestorePlan,
  RestoreScriptError,
} from "./restore-database.mjs";

test("backup plan defaults to local Docker Compose with a timestamped custom dump", () => {
  const plan = createBackupPlan([], {}, new Date("2026-06-10T12:34:56.789Z"));
  const command = buildBackupCommand(plan);

  assert.equal(plan.mode, "compose");
  assert.match(plan.output, /backups\/database\/coritech-db-20260610T123456Z\.dump$/);
  assert.equal(plan.format, "custom");
  assert.equal(command.args.includes("pg_dump"), true);
  assert.equal(command.redacted.includes("coritech_mvp"), true);
});

test("backup plan can target a provider-managed database URL without exposing the password", () => {
  const plan = createBackupPlan(
    [
      "--database-url",
      "postgresql://admin:super-secret@db.example.test:5432/coritech",
      "--output",
      "tmp/staging.dump",
      "--dry-run",
    ],
    {},
  );
  const command = buildBackupCommand(plan);

  assert.equal(plan.mode, "env");
  assert.equal(plan.dryRun, true);
  assert.equal(command.command, "pg_dump");
  assert.equal(command.redacted.includes("super-secret"), false);
  assert.equal(command.redacted.includes("redacted"), true);
});

test("restore plan requires input and uses safe dry-run planning", () => {
  assert.throws(
    () => createRestorePlan([], {}),
    (error) =>
      error instanceof RestoreScriptError &&
      error.message.includes("Restore input is required"),
  );

  const plan = createRestorePlan(["--input", "tmp/staging.dump", "--dry-run"], {});
  const command = buildRestoreCommand(plan);

  assert.equal(plan.mode, "compose");
  assert.equal(plan.format, "custom");
  assert.equal(plan.confirmRestore, false);
  assert.equal(command.inputMode, "stdin");
  assert.equal(command.redacted.includes("<"), true);
});

test("restore plan maps SQL files to psql for provider-managed database URLs", () => {
  const plan = createRestorePlan(
    [
      "--input",
      "tmp/staging.sql",
      "--database-url",
      "postgresql://admin:super-secret@db.example.test:5432/coritech",
      "--confirm-restore",
    ],
    {},
  );
  const command = buildRestoreCommand(plan);

  assert.equal(plan.mode, "env");
  assert.equal(plan.format, "plain");
  assert.equal(plan.confirmRestore, true);
  assert.equal(command.command, "psql");
  assert.equal(command.redacted.includes("super-secret"), false);
});
