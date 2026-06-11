import { spawnSync } from "node:child_process";
import { closeSync, openSync, statSync } from "node:fs";
import { extname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export class RestoreScriptError extends Error {
  constructor(message) {
    super(message);
    this.name = "RestoreScriptError";
  }
}

export function createRestorePlan(argv = process.argv.slice(2), env = process.env) {
  const options = parseArgs(argv);

  if (!options.input) {
    throw new RestoreScriptError("Restore input is required. Use --input <path>.");
  }

  const databaseUrl = options.databaseUrl ?? env.DATABASE_URL ?? null;

  return Object.freeze({
    clean: options.clean,
    confirmRestore: options.confirmRestore,
    databaseName: options.databaseName ?? env.POSTGRES_DB ?? "coritech_mvp",
    databaseUrl,
    dryRun: options.dryRun,
    format: inferFormat(options.input),
    input: resolve(options.input),
    mode: databaseUrl ? "env" : "compose",
    postgresUser: options.postgresUser ?? env.POSTGRES_USER ?? "coritech",
  });
}

export function buildRestoreCommand(plan) {
  if (plan.mode === "env") {
    if (plan.format === "plain") {
      return Object.freeze({
        command: "psql",
        args: [`--dbname=${plan.databaseUrl}`, "--set=ON_ERROR_STOP=1", "--file", plan.input],
        inputMode: "fileArg",
        redacted: `psql --dbname=${redactDatabaseUrl(plan.databaseUrl)} --set=ON_ERROR_STOP=1 --file ${plan.input}`,
      });
    }

    return Object.freeze({
      command: "pg_restore",
      args: [
        `--dbname=${plan.databaseUrl}`,
        ...(plan.clean ? ["--clean", "--if-exists"] : []),
        plan.input,
      ],
      inputMode: "fileArg",
      redacted: `pg_restore --dbname=${redactDatabaseUrl(plan.databaseUrl)}${plan.clean ? " --clean --if-exists" : ""} ${plan.input}`,
    });
  }

  const restoreCommand = plan.format === "plain" ? "psql" : "pg_restore";
  const restoreArgs =
    plan.format === "plain"
      ? ["-U", plan.postgresUser, "-d", plan.databaseName, "-v", "ON_ERROR_STOP=1"]
      : [
          "-U",
          plan.postgresUser,
          "-d",
          plan.databaseName,
          ...(plan.clean ? ["--clean", "--if-exists"] : []),
        ];
  const args = ["scripts/docker-compose.mjs", "exec", "-T", "db", restoreCommand, ...restoreArgs];

  return Object.freeze({
    command: process.execPath,
    args,
    inputMode: "stdin",
    redacted: `node ${args.join(" ")} < ${plan.input}`,
  });
}

export function printRestoreHelp() {
  return [
    "Usage: node scripts/restore-database.mjs --input <path> --confirm-restore [options]",
    "",
    "Options:",
    "  --input <path>         Backup file to restore. .sql files use psql; other files use pg_restore",
    "  --database-url <url>    Restore into a database URL instead of local Docker Compose",
    "  --clean                Pass --clean --if-exists to pg_restore for custom-format backups",
    "  --postgres-user <user>  Local Compose database user. Defaults to POSTGRES_USER or coritech",
    "  --database <name>       Local Compose database name. Defaults to POSTGRES_DB or coritech_mvp",
    "  --confirm-restore      Required for actual restore execution",
    "  --dry-run              Print the command without restoring",
    "  --help                 Show this help",
  ].join("\n");
}

function run() {
  if (process.argv.includes("--help")) {
    process.stdout.write(`${printRestoreHelp()}\n`);
    return 0;
  }

  try {
    const plan = createRestorePlan();
    const command = buildRestoreCommand(plan);

    process.stdout.write(`Restore input: ${plan.input}\n`);
    process.stdout.write(`Restore target: ${plan.mode === "env" ? "DATABASE_URL" : "local Docker Compose db"}\n`);
    process.stdout.write(`Restore command: ${command.redacted}\n`);

    if (plan.dryRun) {
      process.stdout.write("Dry run only; no database restore was executed.\n");
      return 0;
    }

    if (!plan.confirmRestore) {
      throw new RestoreScriptError("Refusing to restore without --confirm-restore.");
    }

    statSync(plan.input);

    if (command.inputMode === "stdin") {
      const inputFd = openSync(plan.input, "r");

      try {
        const result = spawnSync(command.command, command.args, {
          shell: false,
          stdio: [inputFd, "inherit", "inherit"],
        });

        if (result.error) {
          throw result.error;
        }

        if (result.status !== 0) {
          throw new RestoreScriptError(`Database restore failed with exit code ${result.status}.`);
        }
      } finally {
        closeSync(inputFd);
      }
    } else {
      const result = spawnSync(command.command, command.args, {
        shell: false,
        stdio: "inherit",
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        throw new RestoreScriptError(`Database restore failed with exit code ${result.status}.`);
      }
    }

    process.stdout.write("Database restore completed.\n");
    return 0;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

function parseArgs(argv) {
  const options = {
    clean: false,
    confirmRestore: false,
    databaseName: null,
    databaseUrl: null,
    dryRun: false,
    input: null,
    postgresUser: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--clean":
        options.clean = true;
        break;
      case "--confirm-restore":
        options.confirmRestore = true;
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--database":
        options.databaseName = readValue(argv, index, arg);
        index += 1;
        break;
      case "--database-url":
        options.databaseUrl = readValue(argv, index, arg);
        index += 1;
        break;
      case "--input":
        options.input = readValue(argv, index, arg);
        index += 1;
        break;
      case "--postgres-user":
        options.postgresUser = readValue(argv, index, arg);
        index += 1;
        break;
      default:
        throw new RestoreScriptError(`Unknown restore option: ${arg}`);
    }
  }

  return options;
}

function readValue(argv, index, optionName) {
  const value = argv[index + 1];

  if (!value || value.startsWith("--")) {
    throw new RestoreScriptError(`${optionName} requires a value.`);
  }

  return value;
}

function inferFormat(input) {
  return extname(input).toLowerCase() === ".sql" ? "plain" : "custom";
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
      parsed.username = "redacted";
    }

    return parsed.toString();
  } catch {
    return "[redacted-database-url]";
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(run());
}
