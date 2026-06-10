import test from "node:test";
import assert from "node:assert/strict";

import {
  EnvironmentConfigError,
  loadEnvironment,
} from "./environment.mjs";

function buildEnvironment(overrides = {}) {
  return {
    CORITECH_ENVIRONMENT: "local",
    DATABASE_URL: "postgresql://127.0.0.1:5432/coritech_phase1",
    AUTH_PROVIDER_CLIENT_ID: "replace-before-managed-auth-setup",
    AUTH_PROVIDER_CLIENT_SECRET: "replace-before-managed-auth-setup",
    AUTH_PROVIDER_DOMAIN: "replace-before-managed-auth-setup",
    EMAIL_PROVIDER_API_KEY: "replace-before-email-provider-setup",
    OBJECT_STORAGE_PROVIDER: "minio",
    OBJECT_STORAGE_ENDPOINT: "localhost",
    OBJECT_STORAGE_PORT: "9000",
    OBJECT_STORAGE_USE_SSL: "false",
    OBJECT_STORAGE_BUCKET: "coritech-local-dev",
    OBJECT_STORAGE_REGION: "local-dev",
    OBJECT_STORAGE_ACCESS_KEY: "coritech_minio_dev",
    OBJECT_STORAGE_SECRET_KEY: "coritech_minio_dev_password",
    PAYMENT_PROVIDER_SECRET: "replace-before-payment-provider-setup",
    LOGISTICS_PROVIDER_API_KEY: "replace-before-logistics-provider-setup",
    APP_BASE_URL: "http://localhost:3000",
    API_BASE_URL: "http://localhost:4000",
    AUDIT_LOG_RETENTION_DAYS: "30",
    ...overrides,
  };
}

test("loadEnvironment accepts documented local placeholder values", () => {
  const config = loadEnvironment(buildEnvironment());

  assert.equal(config.CORITECH_ENVIRONMENT, "local");
  assert.equal(config.AUDIT_LOG_RETENTION_DAYS, 30);
  assert.equal(config.OBJECT_STORAGE_PORT, 9000);
  assert.equal(config.OBJECT_STORAGE_USE_SSL, false);
  assert.equal(config.DATABASE_URL, "postgresql://127.0.0.1:5432/coritech_phase1");
});

test("loadEnvironment fails when a required value is missing", () => {
  assert.throws(
    () => loadEnvironment(buildEnvironment({ DATABASE_URL: "" })),
    (error) =>
      error instanceof EnvironmentConfigError &&
      error.issues.includes("DATABASE_URL is required."),
  );
});

test("loadEnvironment rejects placeholder secrets outside local development", () => {
  assert.throws(
    () =>
      loadEnvironment(
        buildEnvironment({
          CORITECH_ENVIRONMENT: "staging",
          OBJECT_STORAGE_ACCESS_KEY: "replace-before-object-storage-setup",
        }),
      ),
    (error) =>
      error instanceof EnvironmentConfigError &&
      error.issues.some((issue) =>
        issue.includes("AUTH_PROVIDER_CLIENT_ID must be replaced"),
      ),
  );
});

test("loadEnvironment validates object storage port and SSL flag", () => {
  assert.throws(
    () =>
      loadEnvironment(
        buildEnvironment({
          OBJECT_STORAGE_PORT: "9000.5",
          OBJECT_STORAGE_USE_SSL: "sometimes",
        }),
      ),
    (error) =>
      error instanceof EnvironmentConfigError &&
      error.issues.includes("OBJECT_STORAGE_PORT must be a positive integer.") &&
      error.issues.includes("OBJECT_STORAGE_USE_SSL must be either true or false."),
  );
});

test("loadEnvironment rejects localhost base URLs outside local development", () => {
  assert.throws(
    () =>
      loadEnvironment(
        buildEnvironment({
          CORITECH_ENVIRONMENT: "production",
          DATABASE_URL: "postgresql://db.internal:5432/coritech",
          AUTH_PROVIDER_CLIENT_ID: "prod-client-id",
          AUTH_PROVIDER_CLIENT_SECRET: "prod-secret",
          AUTH_PROVIDER_DOMAIN: "auth.provider.test",
          EMAIL_PROVIDER_API_KEY: "prod-email-key",
          OBJECT_STORAGE_PROVIDER: "s3-compatible",
          OBJECT_STORAGE_ENDPOINT: "storage.coritech.test",
          OBJECT_STORAGE_PORT: "443",
          OBJECT_STORAGE_USE_SSL: "true",
          OBJECT_STORAGE_BUCKET: "coritech-prod-bucket",
          OBJECT_STORAGE_REGION: "eu-west-1",
          OBJECT_STORAGE_ACCESS_KEY: "prod-storage-user",
          OBJECT_STORAGE_SECRET_KEY: "prod-storage-secret",
          PAYMENT_PROVIDER_SECRET: "prod-payment-secret",
          LOGISTICS_PROVIDER_API_KEY: "prod-logistics-key",
        }),
      ),
    (error) =>
      error instanceof EnvironmentConfigError &&
      error.issues.some((issue) =>
        issue.includes("APP_BASE_URL cannot point to localhost"),
      ),
  );
});

test("loadEnvironment accepts non-local environments with concrete values", () => {
  const config = loadEnvironment(
    buildEnvironment({
      CORITECH_ENVIRONMENT: "staging",
      DATABASE_URL: "postgresql://db.internal:5432/coritech",
      AUTH_PROVIDER_CLIENT_ID: "staging-client-id",
      AUTH_PROVIDER_CLIENT_SECRET: "staging-secret",
      AUTH_PROVIDER_DOMAIN: "auth.provider.test",
      EMAIL_PROVIDER_API_KEY: "staging-email-key",
      OBJECT_STORAGE_PROVIDER: "s3-compatible",
      OBJECT_STORAGE_ENDPOINT: "storage.coritech.test",
      OBJECT_STORAGE_PORT: "443",
      OBJECT_STORAGE_USE_SSL: "true",
      OBJECT_STORAGE_BUCKET: "coritech-staging-bucket",
      OBJECT_STORAGE_REGION: "eu-west-1",
      OBJECT_STORAGE_ACCESS_KEY: "staging-storage-user",
      OBJECT_STORAGE_SECRET_KEY: "staging-storage-secret",
      PAYMENT_PROVIDER_SECRET: "staging-payment-secret",
      LOGISTICS_PROVIDER_API_KEY: "staging-logistics-key",
      APP_BASE_URL: "https://staging.app.coritech.test",
      API_BASE_URL: "https://staging.api.coritech.test",
      AUDIT_LOG_RETENTION_DAYS: "90",
    }),
  );

  assert.equal(config.CORITECH_ENVIRONMENT, "staging");
  assert.equal(config.AUDIT_LOG_RETENTION_DAYS, 90);
  assert.equal(config.OBJECT_STORAGE_PROVIDER, "s3-compatible");
  assert.equal(config.OBJECT_STORAGE_ENDPOINT, "storage.coritech.test");
  assert.equal(config.OBJECT_STORAGE_PORT, 443);
  assert.equal(config.OBJECT_STORAGE_USE_SSL, true);
  assert.equal(config.OBJECT_STORAGE_REGION, "eu-west-1");
});
