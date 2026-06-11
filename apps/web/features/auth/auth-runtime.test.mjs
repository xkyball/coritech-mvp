import assert from "node:assert/strict";
import test from "node:test";

import { getManagedAuthRuntime } from "./auth-runtime.mjs";

const configuredEnvironment = {
  CORITECH_ENVIRONMENT: "local",
  DATABASE_URL: "postgresql://coritech:coritech@localhost:5432/coritech",
  AUTH_PROVIDER_CLIENT_ID: "coritech-local-client",
  AUTH_PROVIDER_CLIENT_SECRET: "local-secret",
  AUTH_PROVIDER_DOMAIN: "http://localhost:9000",
  EMAIL_PROVIDER: "console",
  EMAIL_PROVIDER_API_KEY: "local-email-key",
  EMAIL_PROVIDER_ENDPOINT: "http://localhost:3000/api/dev-email",
  EMAIL_FROM_ADDRESS: "support@local.coritech.test",
  EMAIL_FROM_NAME: "CoriTech Local",
  OBJECT_STORAGE_PROVIDER: "minio",
  OBJECT_STORAGE_ENDPOINT: "localhost",
  OBJECT_STORAGE_PORT: "9001",
  OBJECT_STORAGE_USE_SSL: "false",
  OBJECT_STORAGE_BUCKET: "coritech-local",
  OBJECT_STORAGE_REGION: "local",
  OBJECT_STORAGE_ACCESS_KEY: "local-access",
  OBJECT_STORAGE_SECRET_KEY: "local-secret",
  PAYMENT_PROVIDER_SECRET: "local-payment-secret",
  LOGISTICS_PROVIDER_API_KEY: "local-logistics-key",
  MONITORING_PROVIDER: "console",
  MONITORING_ENDPOINT: "http://localhost:3000/api/dev-monitoring",
  ERROR_TRACKING_DSN: "local-error-tracking-disabled",
  APP_BASE_URL: "http://localhost:3000",
  API_BASE_URL: "http://localhost:3000",
  AUDIT_LOG_RETENTION_DAYS: "365",
};

test("managed auth runtime enables provider redirects when environment is complete", () => {
  const runtime = getManagedAuthRuntime(configuredEnvironment);

  assert.equal(runtime.enabled, true);
  assert.equal(runtime.config.callbackUrl, "http://localhost:3000/auth/callback");
  assert.equal(runtime.config.defaultPostLoginUrl, "http://localhost:3000/app");
  assert.equal(runtime.config.logoutReturnUrl, "http://localhost:3000/logged-out");
});

test("managed auth runtime reports safe local-dev issues when provider config is missing", () => {
  const runtime = getManagedAuthRuntime({});

  assert.equal(runtime.enabled, false);
  assert.equal(runtime.config, null);
  assert.ok(runtime.issues.some((issue) => issue.includes("AUTH_PROVIDER_CLIENT_ID")));
  assert.ok(!runtime.issues.some((issue) => issue.includes("local-secret")));
});

test("managed auth runtime does not enable browser redirects on bind-host public URLs", () => {
  const runtime = getManagedAuthRuntime({
    ...configuredEnvironment,
    APP_BASE_URL: "http://0.0.0.0:3000",
    API_BASE_URL: "http://0.0.0.0:3000",
  });

  assert.equal(runtime.enabled, false);
  assert.equal(runtime.config, null);
  assert.ok(runtime.issues.some((issue) =>
    issue.includes("APP_BASE_URL must use a browser-facing host"),
  ));
  assert.ok(runtime.issues.some((issue) =>
    issue.includes("API_BASE_URL must use a browser-facing host"),
  ));
});
