import { spawnSync } from "node:child_process";
import { closeSync, mkdirSync, openSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULT_OUTPUT_DIR = "backups/database";
const FORMAT_FLAGS = Object.freeze({
  custom: "custom",
  plain: "plain",
});

export class BackupScriptError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackupScriptError";
  }
}

export function createBackupPlan(argv = process.argv.slice(2), env = process.env, now = new Date()) {
  const options = parseArgs(argv);
  const format = options.format ?? "custom";

  if (!hasOwn(FORMAT_FLAGS, format)) {
    throw new BackupScriptError("Backup format must be custom or plain.");
  }

  const output =
    options.output ??
    `${DEFAULT_OUTPUT_DIR}/coritech-db-${formatTimestamp(now)}.${format === "plain" ? "sql" : "dump"}`;
  const databaseUrl = options.databaseUrl ?? env.DATABASE_URL ?? null;
  const mode = databaseUrl ? "env" : "compose";

  return Object.freeze({
    databaseName: options.databaseName ?? env.POSTGRES_DB ?? "coritech_mvp",
    databaseUrl,
    dryRun: options.dryRun,
    format,
    mode,
    output: resolve(output),
    postgresUser: options.postgresUser ?? env.POSTGRES_USER ?? "coritech",
  });
}

export function buildBackupCommand(plan) {
  if (plan.mode === "env") {
    return Object.freeze({
      command: "pg_dump",
      args: [
        `--dbname=${plan.databaseUrl}`,
        `--format=${FORMAT_FLAGS[plan.format]}`,
      ],
      redacted: `pg_dump --dbname=${redactDatabaseUrl(plan.databaseUrl)} --format=${FORMAT_FLAGS[plan.format]}`,
    });
  }

  const args = [
    "scripts/docker-compose.mjs",
    "exec",
    "-T",
    "db",
    "pg_dump",
    "-U",
    plan.postgresUser,
    "-d",
    plan.databaseName,
    `--format=${FORMAT_FLAGS[plan.format]}`,
  ];

  return Object.freeze({
    command: process.execPath,
    args,
    redacted: `node ${args.join(" ")}`,
  });
}

export function printBackupHelp() {
  return [
    "Usage: node scripts/backup-database.mjs [options]",
    "",
    "Options:",
    "  --output <path>         Backup file path. Defaults to backups/database/coritech-db-<timestamp>.dump",
    "  --database-url <url>    Use pg_dump against a database URL instead of local Docker Compose",
    "  --format <custom|plain> Backup format. Defaults to custom",
    "  --postgres-user <user>  Local Compose database user. Defaults to POSTGRES_USER or coritech",
    "  --database <name>       Local Compose database name. Defaults to POSTGRES_DB or coritech_mvp",
    "  --dry-run              Print the command and output path without running pg_dump",
    "  --help                 Show this help",
  ].join("\n");
}

function run() {
  if (process.argv.includes("--help")) {
    process.stdout.write(`${printBackupHelp()}\n`);
    return 0;
  }

  try {
    const plan = createBackupPlan();
    const command = buildBackupCommand(plan);

    process.stdout.write(`Backup output: ${plan.output}\n`);
    process.stdout.write(`Backup source: ${plan.mode === "env" ? "DATABASE_URL" : "local Docker Compose db"}\n`);
    process.stdout.write(`Backup command: ${command.redacted}\n`);

    if (plan.dryRun) {
      process.stdout.write("Dry run only; no backup file was created.\n");
      return 0;
    }

    mkdirSync(dirname(plan.output), { recursive: true, mode: 0o700 });
    const outputFd = openSync(plan.output, "w", 0o600);

    try {
      const result = spawnSync(command.command, command.args, {
        shell: false,
        stdio: ["ignore", outputFd, "inherit"],
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        throw new BackupScriptError(`Database backup failed with exit code ${result.status}.`);
      }
    } finally {
      closeSync(outputFd);
    }

    process.stdout.write("Database backup completed.\n");
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    output: null,
    databaseUrl: null,
    format: null,
    postgresUser: null,
    databaseName: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--output":
        options.output = readValue(argv, index, arg);
        index += 1;
        break;
      case "--database-url":
        options.databaseUrl = readValue(argv, index, arg);
        index += 1;
        break;
      case "--format":
        options.format = readValue(argv, index, arg);
        index += 1;
        break;
      case "--postgres-user":
        options.postgresUser = readValue(argv, index, arg);
        index += 1;
        break;
      case "--database":
        options.databaseName = readValue(argv, index, arg);
        index += 1;
        break;
      default:
        throw new BackupScriptError(`Unknown backup option: ${arg}`);
    }
  }

  return options;
}

function readValue(argv, index, optionName) {
  const value = argv[index + 1];

  if (!value || value.startsWith("--")) {
    throw new BackupScriptError(`${optionName} requires a value.`);
  }

  return value;
}

function formatTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function redactDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    return "";
  }

  try {
    const parsed = new URL(databaseUrl);

    if (parsed.password) {
      parsed.password = "redacted";
    }

    if (parsed.username) {
      parsed.username = parsed.username ? "redacted" : "";
    }

    return parsed.toString();
  } catch {
    return "[redacted-database-url]";
  }
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(run());
}
