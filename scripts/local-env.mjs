import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
export const defaultLocalEnvPath = join(repositoryRoot, ".env");
const DEFAULT_SKIP_KEYS = Object.freeze(["NODE_ENV"]);

/**
 * @param {{
 *   envFilePath?: string;
 *   targetEnv?: NodeJS.ProcessEnv | Record<string, string | undefined>;
 *   override?: boolean;
 *   skipKeys?: readonly string[];
 * }} [options]
 * @returns {{ envFilePath: string; loadedKeys: string[]; skipped: boolean }}
 */
export function loadLocalEnv(options = {}) {
  const envFilePath = options.envFilePath ?? defaultLocalEnvPath;
  const targetEnv = options.targetEnv ?? process.env;
  const override = options.override ?? false;
  const skipKeys = new Set(options.skipKeys ?? DEFAULT_SKIP_KEYS);

  if (!existsSync(envFilePath)) {
    return {
      envFilePath,
      loadedKeys: [],
      skipped: true,
    };
  }

  const parsed = parseDotEnv(readFileSync(envFilePath, "utf8"));
  const loadedKeys = [];

  for (const [key, value] of Object.entries(parsed)) {
    if (skipKeys.has(key)) {
      continue;
    }

    if (!override && targetEnv[key] !== undefined) {
      continue;
    }

    targetEnv[key] = value;
    loadedKeys.push(key);
  }

  return {
    envFilePath,
    loadedKeys,
    skipped: false,
  };
}

/**
 * @param {string} source
 * @returns {Record<string, string>}
 */
export function parseDotEnv(source) {
  const values = {};

  for (const rawLine of source.split(/\r?\n/u)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/u.exec(line);

    if (!match) {
      continue;
    }

    values[match[1]] = normalizeDotEnvValue(match[2]);
  }

  return values;
}

/**
 * @param {string} rawValue
 * @returns {string}
 */
function normalizeDotEnvValue(rawValue) {
  const value = rawValue.trim();

  if (value.startsWith("\"") && value.endsWith("\"")) {
    return value
      .slice(1, -1)
      .replace(/\\n/gu, "\n")
      .replace(/\\r/gu, "\r")
      .replace(/\\t/gu, "\t")
      .replace(/\\"/gu, "\"")
      .replace(/\\\\/gu, "\\");
  }

  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }

  const commentIndex = value.search(/\s+#/u);

  return (commentIndex === -1 ? value : value.slice(0, commentIndex)).trim();
}
