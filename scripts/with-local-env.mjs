#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import { loadLocalEnv } from "./local-env.mjs";

const commandArgs = process.argv.slice(2);

if (commandArgs.length === 0) {
  process.stderr.write("Usage: node scripts/with-local-env.mjs <command> [args...]\n");
  process.exit(1);
}

loadLocalEnv();

const result = spawnSync(commandArgs[0], commandArgs.slice(1), {
  env: process.env,
  shell: false,
  stdio: "inherit",
});

if (result.error) {
  process.stderr.write(`${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
