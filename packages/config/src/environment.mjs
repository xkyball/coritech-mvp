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
 * @property {"console" | "http_api"} EMAIL_PROVIDER
 * @property {string} EMAIL_PROVIDER_API_KEY
 * @property {string} EMAIL_PROVIDER_ENDPOINT
 * @property {string} EMAIL_FROM_ADDRESS
 * @property {string} EMAIL_FROM_NAME
 * @property {string} OBJECT_STORAGE_PROVIDER
 * @property {string} OBJECT_STORAGE_ENDPOINT
 * @property {number} OBJECT_STORAGE_PORT
 * @property {boolean} OBJECT_STORAGE_USE_SSL
 * @property {string} OBJECT_STORAGE_BUCKET
 * @property {string} OBJECT_STORAGE_REGION
 * @property {string} OBJECT_STORAGE_ACCESS_KEY
 * @property {string} OBJECT_STORAGE_SECRET_KEY
 * @property {string} PAYMENT_PROVIDER_SECRET
 * @property {string} LOGISTICS_PROVIDER_API_KEY
 * @property {string} MONITORING_PROVIDER
 * @property {string} MONITORING_ENDPOINT
 * @property {string} ERROR_TRACKING_DSN
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
  "EMAIL_PROVIDER",
  "EMAIL_PROVIDER_API_KEY",
  "EMAIL_PROVIDER_ENDPOINT",
  "EMAIL_FROM_ADDRESS",
  "EMAIL_FROM_NAME",
  "OBJECT_STORAGE_PROVIDER",
  "OBJECT_STORAGE_ENDPOINT",
  "OBJECT_STORAGE_PORT",
  "OBJECT_STORAGE_USE_SSL",
  "OBJECT_STORAGE_BUCKET",
  "OBJECT_STORAGE_REGION",
  "OBJECT_STORAGE_ACCESS_KEY",
  "OBJECT_STORAGE_SECRET_KEY",
  "PAYMENT_PROVIDER_SECRET",
  "LOGISTICS_PROVIDER_API_KEY",
  "MONITORING_PROVIDER",
  "MONITORING_ENDPOINT",
  "ERROR_TRACKING_DSN",
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
  validateUrl("EMAIL_PROVIDER_ENDPOINT", values.EMAIL_PROVIDER_ENDPOINT, issues);
  validateEmailProvider(values.EMAIL_PROVIDER, environmentName, issues);
  validateEmailAddress("EMAIL_FROM_ADDRESS", values.EMAIL_FROM_ADDRESS, issues);
  validateUrl("MONITORING_ENDPOINT", values.MONITORING_ENDPOINT, issues);

  const objectStoragePort = parsePositiveInteger(
    values.OBJECT_STORAGE_PORT,
    "OBJECT_STORAGE_PORT",
    issues,
  );
  const objectStorageUseSsl = parseBoolean(
    values.OBJECT_STORAGE_USE_SSL,
    "OBJECT_STORAGE_USE_SSL",
    issues,
  );
  const retentionDays = parsePositiveInteger(
    values.AUDIT_LOG_RETENTION_DAYS,
    "AUDIT_LOG_RETENTION_DAYS",
    issues,
  );

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
    validateNonLocalUrl(
      "EMAIL_PROVIDER_ENDPOINT",
      values.EMAIL_PROVIDER_ENDPOINT,
      issues,
    );
    validateNonLocalUrl(
      "MONITORING_ENDPOINT",
      values.MONITORING_ENDPOINT,
      issues,
    );
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
    EMAIL_PROVIDER: /** @type {"console" | "http_api"} */ (values.EMAIL_PROVIDER),
    EMAIL_PROVIDER_API_KEY: values.EMAIL_PROVIDER_API_KEY,
    EMAIL_PROVIDER_ENDPOINT: values.EMAIL_PROVIDER_ENDPOINT,
    EMAIL_FROM_ADDRESS: values.EMAIL_FROM_ADDRESS,
    EMAIL_FROM_NAME: values.EMAIL_FROM_NAME,
    OBJECT_STORAGE_PROVIDER: values.OBJECT_STORAGE_PROVIDER,
    OBJECT_STORAGE_ENDPOINT: values.OBJECT_STORAGE_ENDPOINT,
    OBJECT_STORAGE_PORT: objectStoragePort,
    OBJECT_STORAGE_USE_SSL: objectStorageUseSsl,
    OBJECT_STORAGE_BUCKET: values.OBJECT_STORAGE_BUCKET,
    OBJECT_STORAGE_REGION: values.OBJECT_STORAGE_REGION,
    OBJECT_STORAGE_ACCESS_KEY: values.OBJECT_STORAGE_ACCESS_KEY,
    OBJECT_STORAGE_SECRET_KEY: values.OBJECT_STORAGE_SECRET_KEY,
    PAYMENT_PROVIDER_SECRET: values.PAYMENT_PROVIDER_SECRET,
    LOGISTICS_PROVIDER_API_KEY: values.LOGISTICS_PROVIDER_API_KEY,
    MONITORING_PROVIDER: values.MONITORING_PROVIDER,
    MONITORING_ENDPOINT: values.MONITORING_ENDPOINT,
    ERROR_TRACKING_DSN: values.ERROR_TRACKING_DSN,
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
 * @param {string | undefined} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {number}
 */
function parsePositiveInteger(value, key, issues) {
  if (!value) {
    return NaN;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0 || String(parsed) !== value) {
    issues.push(`${key} must be a positive integer.`);
  }

  return parsed;
}

/**
 * @param {string | undefined} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {boolean}
 */
function parseBoolean(value, key, issues) {
  if (!value) {
    return false;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  issues.push(`${key} must be either true or false.`);
  return false;
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

/**
 * @param {string | undefined} value
 * @param {CoriTechEnvironment} environmentName
 * @param {string[]} issues
 * @returns {void}
 */
function validateEmailProvider(value, environmentName, issues) {
  if (value !== "console" && value !== "http_api") {
    issues.push("EMAIL_PROVIDER must be one of: console, http_api.");
    return;
  }

  if (environmentName !== "local" && value === "console") {
    issues.push("EMAIL_PROVIDER cannot be console outside local development.");
  }
}

/**
 * @param {string} key
 * @param {string | undefined} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateEmailAddress(key, value, issues) {
  if (!value) {
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    issues.push(`${key} must be a valid email address.`);
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
