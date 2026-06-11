import test from "node:test";
import assert from "node:assert/strict";

import { loadEnvironment } from "@coritech/config/environment";
import {
  ObjectStorageConfigError,
  ObjectStorageValidationError,
  createMinioClientAdapter,
  createMinioClientOptions,
  createObjectStorageConfig,
  createObjectStorageProvider,
  createS3CompatibleFetchClient,
  validateObjectStorageEnvironment,
} from "./object-storage.mjs";

function buildEnvironment(overrides = {}) {
  return loadEnvironment({
    CORITECH_ENVIRONMENT: "local",
    DATABASE_URL: "postgresql://127.0.0.1:5432/coritech_phase1",
    AUTH_PROVIDER_CLIENT_ID: "replace-before-managed-auth-setup",
    AUTH_PROVIDER_CLIENT_SECRET: "replace-before-managed-auth-setup",
    AUTH_PROVIDER_DOMAIN: "replace-before-managed-auth-setup",
    EMAIL_PROVIDER: "console",
    EMAIL_PROVIDER_API_KEY: "replace-before-email-provider-setup",
    EMAIL_PROVIDER_ENDPOINT: "http://localhost:3000/api/dev-email",
    EMAIL_FROM_ADDRESS: "support@local.coritech.test",
    EMAIL_FROM_NAME: "CoriTech Local",
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
    MONITORING_PROVIDER: "console",
    MONITORING_ENDPOINT: "http://localhost:3000/api/dev-monitoring",
    ERROR_TRACKING_DSN: "local-error-tracking-disabled",
    APP_BASE_URL: "http://localhost:3000",
    API_BASE_URL: "http://localhost:4000",
    AUDIT_LOG_RETENTION_DAYS: "30",
    ...overrides,
  });
}

test("createObjectStorageConfig prepares local MinIO configuration without exposing public links", () => {
  const config = createObjectStorageConfig(buildEnvironment());

  assert.deepEqual(config, {
    kind: "S3_COMPATIBLE_OBJECT_STORAGE",
    provider: "minio",
    endpoint: "localhost",
    port: 9000,
    useSsl: false,
    bucket: "coritech-local-dev",
    region: "local-dev",
    baseUrl: "http://localhost:9000",
    accessKeyEnvironmentKey: "OBJECT_STORAGE_ACCESS_KEY",
    secretKeyEnvironmentKey: "OBJECT_STORAGE_SECRET_KEY",
    accessKeyConfigured: true,
    secretKeyConfigured: true,
    bucketPrivateByDefault: true,
    publicLinksAllowed: false,
  });
});

test("createObjectStorageConfig supports S3-compatible provider selection", () => {
  const config = createObjectStorageConfig(
    buildEnvironment({
      CORITECH_ENVIRONMENT: "staging",
      AUTH_PROVIDER_CLIENT_ID: "staging-client",
      AUTH_PROVIDER_CLIENT_SECRET: "staging-secret",
      AUTH_PROVIDER_DOMAIN: "auth.coritech.test",
      EMAIL_PROVIDER: "http_api",
      EMAIL_PROVIDER_API_KEY: "staging-email-key",
      EMAIL_PROVIDER_ENDPOINT: "https://email.provider.test/send",
      EMAIL_FROM_ADDRESS: "notifications@staging.coritech.test",
      EMAIL_FROM_NAME: "CoriTech Staging",
      OBJECT_STORAGE_PROVIDER: "s3",
      OBJECT_STORAGE_ENDPOINT: "https://storage.coritech.test",
      OBJECT_STORAGE_PORT: "443",
      OBJECT_STORAGE_USE_SSL: "true",
      OBJECT_STORAGE_BUCKET: "coritech-staging-documents",
      OBJECT_STORAGE_REGION: "eu-west-1",
      OBJECT_STORAGE_ACCESS_KEY: "staging-storage-user",
      OBJECT_STORAGE_SECRET_KEY: "staging-storage-secret",
      PAYMENT_PROVIDER_SECRET: "staging-payment-secret",
      LOGISTICS_PROVIDER_API_KEY: "staging-logistics-key",
      MONITORING_PROVIDER: "http_api",
      MONITORING_ENDPOINT: "https://monitoring.provider.test/ingest",
      ERROR_TRACKING_DSN: "https://errors.provider.test/project",
      APP_BASE_URL: "https://staging.app.coritech.test",
      API_BASE_URL: "https://staging.api.coritech.test",
    }),
  );

  assert.equal(config.provider, "s3-compatible");
  assert.equal(config.endpoint, "storage.coritech.test");
  assert.equal(config.port, 443);
  assert.equal(config.useSsl, true);
  assert.equal(config.baseUrl, "https://storage.coritech.test:443");
});

test("validateObjectStorageEnvironment rejects placeholders and unsupported providers", () => {
  const issues = validateObjectStorageEnvironment({
    OBJECT_STORAGE_PROVIDER: "filesystem",
    OBJECT_STORAGE_ENDPOINT: "localhost/documents",
    OBJECT_STORAGE_PORT: "0",
    OBJECT_STORAGE_USE_SSL: "maybe",
    OBJECT_STORAGE_BUCKET: "coritech-local-dev",
    OBJECT_STORAGE_REGION: "local-dev",
    OBJECT_STORAGE_ACCESS_KEY: "replace-before-object-storage-setup",
    OBJECT_STORAGE_SECRET_KEY: "replace-before-object-storage-setup",
  });

  assert.deepEqual(issues, [
    "OBJECT_STORAGE_PROVIDER must be one of: minio, s3-compatible.",
    "OBJECT_STORAGE_ENDPOINT must be a hostname without path, query string or hash.",
    "OBJECT_STORAGE_PORT must be a positive integer.",
    "OBJECT_STORAGE_USE_SSL must be either true or false.",
    "OBJECT_STORAGE_ACCESS_KEY must be configured with a concrete object storage value.",
    "OBJECT_STORAGE_SECRET_KEY must be configured with a concrete object storage value.",
  ]);
});

test("createMinioClientOptions maps environment config to MinIO SDK option names", () => {
  const options = createMinioClientOptions(buildEnvironment());

  assert.deepEqual(options, {
    endPoint: "localhost",
    port: 9000,
    useSSL: false,
    accessKey: "coritech_minio_dev",
    secretKey: "coritech_minio_dev_password",
    region: "local-dev",
  });

  assert.throws(
    () =>
      createMinioClientOptions(
        buildEnvironment({
          CORITECH_ENVIRONMENT: "staging",
          AUTH_PROVIDER_CLIENT_ID: "staging-client",
          AUTH_PROVIDER_CLIENT_SECRET: "staging-secret",
          AUTH_PROVIDER_DOMAIN: "auth.coritech.test",
          EMAIL_PROVIDER: "http_api",
          EMAIL_PROVIDER_API_KEY: "staging-email-key",
          EMAIL_PROVIDER_ENDPOINT: "https://email.provider.test/send",
          EMAIL_FROM_ADDRESS: "notifications@staging.coritech.test",
          EMAIL_FROM_NAME: "CoriTech Staging",
          OBJECT_STORAGE_PROVIDER: "s3-compatible",
          OBJECT_STORAGE_ENDPOINT: "storage.coritech.test",
          OBJECT_STORAGE_PORT: "443",
          OBJECT_STORAGE_USE_SSL: "true",
          OBJECT_STORAGE_BUCKET: "coritech-staging-documents",
          OBJECT_STORAGE_REGION: "eu-west-1",
          OBJECT_STORAGE_ACCESS_KEY: "staging-storage-user",
          OBJECT_STORAGE_SECRET_KEY: "staging-storage-secret",
          PAYMENT_PROVIDER_SECRET: "staging-payment-secret",
          LOGISTICS_PROVIDER_API_KEY: "staging-logistics-key",
          MONITORING_PROVIDER: "http_api",
          MONITORING_ENDPOINT: "https://monitoring.provider.test/ingest",
          ERROR_TRACKING_DSN: "https://errors.provider.test/project",
          APP_BASE_URL: "https://staging.app.coritech.test",
          API_BASE_URL: "https://staging.api.coritech.test",
        }),
      ),
    (error) =>
      error instanceof ObjectStorageConfigError &&
      error.issues.includes(
        "createMinioClientOptions requires OBJECT_STORAGE_PROVIDER=minio.",
      ),
  );
});

test("createObjectStorageProvider delegates put, get, head, exists and delete to an injected client", async () => {
  const calls = [];
  const storedObjects = new Map();
  const client = {
    async putObject(input) {
      calls.push(["putObject", input]);
      storedObjects.set(input.key, input.body);
      return { etag: "etag-1", versionId: "version-1" };
    },
    async getObject(input) {
      calls.push(["getObject", input]);
      return storedObjects.get(input.key);
    },
    async deleteObject(input) {
      calls.push(["deleteObject", input]);
      storedObjects.delete(input.key);
    },
    async headObject(input) {
      calls.push(["headObject", input]);

      if (!storedObjects.has(input.key)) {
        const error = new Error("not found");
        error.code = "NoSuchKey";
        throw error;
      }

      return { key: input.key };
    },
    async createPresignedGetUrl(input) {
      calls.push(["createPresignedGetUrl", input]);
      return `https://controlled.example.invalid/${input.key}?ttl=${input.expiresInSeconds}`;
    },
  };
  const provider = createObjectStorageProvider({
    config: createObjectStorageConfig(buildEnvironment()),
    client,
  });

  const putResult = await provider.putObject({
    key: "orders/order-1/health-certificate.pdf",
    body: "file-bytes",
    contentType: "application/pdf",
    metadata: { source: "test" },
  });

  assert.deepEqual(putResult, {
    provider: "minio",
    bucket: "coritech-local-dev",
    key: "orders/order-1/health-certificate.pdf",
    etag: "etag-1",
    versionId: "version-1",
  });
  assert.equal(
    await provider.getObject({ key: "orders/order-1/health-certificate.pdf" }),
    "file-bytes",
  );
  assert.deepEqual(
    await provider.headObject({ key: "orders/order-1/health-certificate.pdf" }),
    { key: "orders/order-1/health-certificate.pdf" },
  );
  assert.equal(
    await provider.objectExists({ key: "orders/order-1/health-certificate.pdf" }),
    true,
  );
  assert.equal(await provider.objectExists({ key: "missing.pdf" }), false);
  assert.equal(
    await provider.createInfrastructurePresignedGetUrl({
      key: "orders/order-1/health-certificate.pdf",
      expiresInSeconds: 60,
    }),
    "https://controlled.example.invalid/orders/order-1/health-certificate.pdf?ttl=60",
  );
  assert.deepEqual(
    await provider.deleteObject({ key: "orders/order-1/health-certificate.pdf" }),
    {
      provider: "minio",
      bucket: "coritech-local-dev",
      key: "orders/order-1/health-certificate.pdf",
      deleted: true,
    },
  );

  assert.deepEqual(
    calls.map(([name]) => name),
    [
      "putObject",
      "getObject",
      "headObject",
      "headObject",
      "headObject",
      "createPresignedGetUrl",
      "deleteObject",
    ],
  );
});

test("createObjectStorageProvider rejects URL and local filesystem object keys", async () => {
  const provider = createObjectStorageProvider({
    config: createObjectStorageConfig(buildEnvironment()),
    client: {
      async putObject() {},
      async getObject() {},
      async deleteObject() {},
      async headObject() {},
    },
  });

  await assert.rejects(
    () => provider.putObject({ key: "file:///tmp/document.pdf", body: "bytes" }),
    (error) =>
      error instanceof ObjectStorageValidationError &&
      error.issues.includes(
        "key must be an object-storage key, not a URL or local filesystem path.",
      ),
  );
});

test("createMinioClientAdapter adapts the MinIO SDK method names", async () => {
  const calls = [];
  const minioClient = {
    putObject(bucket, key, body, size, metadata) {
      calls.push(["putObject", bucket, key, body, size, metadata]);
      return Promise.resolve({ etag: "etag-minio" });
    },
    getObject(bucket, key) {
      calls.push(["getObject", bucket, key]);
      return Promise.resolve("stream");
    },
    removeObject(bucket, key) {
      calls.push(["removeObject", bucket, key]);
      return Promise.resolve();
    },
    statObject(bucket, key) {
      calls.push(["statObject", bucket, key]);
      return Promise.resolve({ size: 5 });
    },
    presignedGetObject(bucket, key, expiresInSeconds) {
      calls.push(["presignedGetObject", bucket, key, expiresInSeconds]);
      return Promise.resolve("http://localhost:9000/presigned");
    },
  };
  const adapter = createMinioClientAdapter(minioClient);

  assert.deepEqual(
    await adapter.putObject({
      bucket: "coritech-local-dev",
      key: "documents/file.pdf",
      body: "bytes",
      contentType: "application/pdf",
      metadata: { "x-amz-meta-owner": "coritech" },
    }),
    { etag: "etag-minio" },
  );
  assert.equal(
    await adapter.createPresignedGetUrl({
      bucket: "coritech-local-dev",
      key: "documents/file.pdf",
      expiresInSeconds: 60,
    }),
    "http://localhost:9000/presigned",
  );
  assert.deepEqual(calls[0], [
    "putObject",
    "coritech-local-dev",
    "documents/file.pdf",
    "bytes",
    undefined,
    {
      "x-amz-meta-owner": "coritech",
      "Content-Type": "application/pdf",
    },
  ]);
  assert.deepEqual(calls.at(-1), [
    "presignedGetObject",
    "coritech-local-dev",
    "documents/file.pdf",
    60,
  ]);
});

test("createS3CompatibleFetchClient signs upload requests and controlled GET URLs", async () => {
  const requests = [];
  const config = createObjectStorageConfig(buildEnvironment());
  const client = createS3CompatibleFetchClient({
    config,
    accessKey: "coritech_minio_dev",
    secretKey: "coritech_minio_dev_password",
    now: () => new Date("2026-06-10T12:34:56.000Z"),
    fetch: async (url, init) => {
      requests.push({ url: String(url), init });

      return new Response("", {
        status: 200,
        headers: {
          etag: "fetch-etag",
          "x-amz-version-id": "fetch-version",
        },
      });
    },
  });

  const result = await client.putObject({
    bucket: config.bucket,
    key: "orders/order-1/station-confirmation.pdf",
    body: "file-bytes",
    contentType: "application/pdf",
    metadata: { source: "domain-test" },
  });

  assert.deepEqual(result, {
    etag: "fetch-etag",
    versionId: "fetch-version",
  });
  assert.equal(
    requests[0].url,
    "http://localhost:9000/coritech-local-dev/orders/order-1/station-confirmation.pdf",
  );
  assert.equal(requests[0].init.method, "PUT");
  assert.equal(requests[0].init.headers["x-amz-date"], "20260610T123456Z");
  assert.equal(requests[0].init.headers["content-type"], "application/pdf");
  assert.equal(requests[0].init.headers["x-amz-meta-source"], "domain-test");
  assert.match(
    requests[0].init.headers.authorization,
    /^AWS4-HMAC-SHA256 Credential=coritech_minio_dev\/20260610\/local-dev\/s3\/aws4_request,/,
  );

  const accessUrl = await client.createPresignedGetUrl({
    bucket: config.bucket,
    key: "orders/order-1/station-confirmation.pdf",
    expiresInSeconds: 120,
  });

  const parsed = new URL(accessUrl);

  assert.equal(parsed.origin, "http://localhost:9000");
  assert.equal(
    parsed.pathname,
    "/coritech-local-dev/orders/order-1/station-confirmation.pdf",
  );
  assert.equal(parsed.searchParams.get("X-Amz-Algorithm"), "AWS4-HMAC-SHA256");
  assert.equal(parsed.searchParams.get("X-Amz-Expires"), "120");
  assert.equal(parsed.searchParams.get("X-Amz-SignedHeaders"), "host");
  assert.ok(parsed.searchParams.get("X-Amz-Signature"));
});
