// @ts-check

import { pathToFileURL } from "node:url";

/**
 * @typedef {"local" | "staging" | "production"} CoriTechEnvironment
 */

/**
 * @typedef {Object} CoriTechConfig
 * @property {CoriTechEnvironment} CORITECH_ENVIRONMENT
 * @property {string} DATABASE_URL
 * @property {string} AUTH_PROVIDER_CLIENT_ID
 * @property {string} AUTH_PROVIDER_CLIENT_SECRET
 * @property {string} AUTH_PROVIDER_DOMAIN
 * @property {string} EMAIL_PROVIDER_API_KEY
 * @property {string} OBJECT_STORAGE_BUCKET
 * @property {string} OBJECT_STORAGE_ACCESS_KEY
 * @property {string} OBJECT_STORAGE_SECRET_KEY
 * @property {string} PAYMENT_PROVIDER_SECRET
 * @property {string} LOGISTICS_PROVIDER_API_KEY
 * @property {string} APP_BASE_URL
 * @property {string} API_BASE_URL
 * @property {number} AUDIT_LOG_RETENTION_DAYS
 */

export const ENVIRONMENT_NAMES = /** @type {const} */ ([
  "local",
  "staging",
  "production",
]);

export const REQUIRED_ENVIRONMENT_KEYS = /** @type {const} */ ([
  "DATABASE_URL",
  "AUTH_PROVIDER_CLIENT_ID",
  "AUTH_PROVIDER_CLIENT_SECRET",
  "AUTH_PROVIDER_DOMAIN",
  "EMAIL_PROVIDER_API_KEY",
  "OBJECT_STORAGE_BUCKET",
  "OBJECT_STORAGE_ACCESS_KEY",
  "OBJECT_STORAGE_SECRET_KEY",
  "PAYMENT_PROVIDER_SECRET",
  "LOGISTICS_PROVIDER_API_KEY",
  "APP_BASE_URL",
  "API_BASE_URL",
  "AUDIT_LOG_RETENTION_DAYS",
]);

const PLACEHOLDER_VALUE_PATTERNS = [
  /\[pending/i,
  /changeme/i,
  /example/i,
  /placeholder/i,
  /replace-/i,
  /^todo$/i,
];

export class EnvironmentConfigError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech environment configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EnvironmentConfigError";
    this.issues = issues;
  }
}

/**
 * @param {Record<string, string | undefined> | NodeJS.ProcessEnv} [source]
 * @returns {CoriTechConfig}
 */
export function loadEnvironment(source = process.env) {
  const environmentName = source.CORITECH_ENVIRONMENT ?? "local";
  const issues = [];

  if (!isSupportedEnvironment(environmentName)) {
    throw new EnvironmentConfigError([
      `CORITECH_ENVIRONMENT must be one of: ${ENVIRONMENT_NAMES.join(", ")}.`,
    ]);
  }

  /** @type {Record<string, string>} */
  const values = {};

  for (const key of REQUIRED_ENVIRONMENT_KEYS) {
    const value = normalize(source[key]);

    if (!value) {
      issues.push(`${key} is required.`);
      continue;
    }

    values[key] = value;
  }

  validateUrl("APP_BASE_URL", values.APP_BASE_URL, issues);
  validateUrl("API_BASE_URL", values.API_BASE_URL, issues);

  const retentionDays = Number.parseInt(values.AUDIT_LOG_RETENTION_DAYS ?? "", 10);

  if (!Number.isInteger(retentionDays) || retentionDays <= 0) {
    issues.push("AUDIT_LOG_RETENTION_DAYS must be a positive integer.");
  }

  if (environmentName !== "local") {
    for (const key of REQUIRED_ENVIRONMENT_KEYS) {
      const value = values[key];

      if (value && looksLikePlaceholder(value)) {
        issues.push(
          `${key} must be replaced with a real ${environmentName} value outside version control.`,
        );
      }
    }

    validateNonLocalUrl("APP_BASE_URL", values.APP_BASE_URL, issues);
    validateNonLocalUrl("API_BASE_URL", values.API_BASE_URL, issues);
  }

  if (issues.length > 0) {
    throw new EnvironmentConfigError(issues);
  }

  return {
    CORITECH_ENVIRONMENT: environmentName,
    DATABASE_URL: values.DATABASE_URL,
    AUTH_PROVIDER_CLIENT_ID: values.AUTH_PROVIDER_CLIENT_ID,
    AUTH_PROVIDER_CLIENT_SECRET: values.AUTH_PROVIDER_CLIENT_SECRET,
    AUTH_PROVIDER_DOMAIN: values.AUTH_PROVIDER_DOMAIN,
    EMAIL_PROVIDER_API_KEY: values.EMAIL_PROVIDER_API_KEY,
    OBJECT_STORAGE_BUCKET: values.OBJECT_STORAGE_BUCKET,
    OBJECT_STORAGE_ACCESS_KEY: values.OBJECT_STORAGE_ACCESS_KEY,
    OBJECT_STORAGE_SECRET_KEY: values.OBJECT_STORAGE_SECRET_KEY,
    PAYMENT_PROVIDER_SECRET: values.PAYMENT_PROVIDER_SECRET,
    LOGISTICS_PROVIDER_API_KEY: values.LOGISTICS_PROVIDER_API_KEY,
    APP_BASE_URL: values.APP_BASE_URL,
    API_BASE_URL: values.API_BASE_URL,
    AUDIT_LOG_RETENTION_DAYS: retentionDays,
  };
}

/**
 * @param {Record<string, string | undefined> | NodeJS.ProcessEnv} [source]
 * @returns {void}
 */
export function validateEnvironment(source = process.env) {
  loadEnvironment(source);
}

/**
 * @param {string} value
 * @returns {value is CoriTechEnvironment}
 */
function isSupportedEnvironment(value) {
  return ENVIRONMENT_NAMES.includes(
    /** @type {CoriTechEnvironment} */ (value),
  );
}

/**
 * @param {string | undefined} value
 * @returns {string}
 */
function normalize(value) {
  return value?.trim() ?? "";
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function looksLikePlaceholder(value) {
  return PLACEHOLDER_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * @param {string} key
 * @param {string | undefined} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateUrl(key, value, issues) {
  if (!value) {
    return;
  }

  try {
    new URL(value);
  } catch {
    issues.push(`${key} must be a valid absolute URL.`);
  }
}

/**
 * @param {string} key
 * @param {string | undefined} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateNonLocalUrl(key, value, issues) {
  if (!value) {
    return;
  }

  try {
    const url = new URL(value);

    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      issues.push(`${key} cannot point to localhost outside local development.`);
    }
  } catch {
    // validateUrl reports URL parsing issues.
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const config = loadEnvironment();
    process.stdout.write(
      `CoriTech environment config is valid for ${config.CORITECH_ENVIRONMENT}.\n`,
    );
  } catch (error) {
    if (error instanceof EnvironmentConfigError) {
      process.stderr.write(`${error.message}\n`);
      process.exitCode = 1;
    } else {
      throw error;
    }
  }
}
