// @ts-check

export const OBJECT_STORAGE_PROVIDER_KIND = "S3_COMPATIBLE_OBJECT_STORAGE";

export const SUPPORTED_OBJECT_STORAGE_PROVIDERS = /** @type {const} */ ([
  "minio",
  "s3-compatible",
]);

export const OBJECT_STORAGE_CLIENT_OPERATIONS = /** @type {const} */ ([
  "putObject",
  "getObject",
  "deleteObject",
  "headObject",
]);

const ACCESS_KEY_ENVIRONMENT_KEY = "OBJECT_STORAGE_ACCESS_KEY";
const SECRET_KEY_ENVIRONMENT_KEY = "OBJECT_STORAGE_SECRET_KEY";

const PLACEHOLDER_VALUE_PATTERNS = [
  /\[pending/i,
  /changeme/i,
  /example/i,
  /placeholder/i,
  /replace-/i,
  /replace-in-/i,
  /replace-with-/i,
  /^todo$/i,
];

export class ObjectStorageConfigError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech object storage configuration:\n- ${issues.join("\n- ")}`);
    this.name = "ObjectStorageConfigError";
    this.issues = issues;
  }
}

export class ObjectStorageValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech object storage input:\n- ${issues.join("\n- ")}`);
    this.name = "ObjectStorageValidationError";
    this.issues = issues;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./object-storage.d.ts").ObjectStorageProviderName}
 */
export function isObjectStorageProviderName(value) {
  return typeof value === "string" && SUPPORTED_OBJECT_STORAGE_PROVIDERS.includes(
    /** @type {import("./object-storage.d.ts").ObjectStorageProviderName} */ (
      normalizeProviderName(value)
    ),
  );
}

/**
 * @param {import("@coritech/config/environment.d.ts").CoriTechConfig | Record<string, unknown>} environment
 * @returns {string[]}
 */
export function validateObjectStorageEnvironment(environment) {
  const issues = [];

  if (!environment || typeof environment !== "object") {
    return ["environment config is required."];
  }

  const provider = normalizeRequiredString(environment.OBJECT_STORAGE_PROVIDER);
  const endpoint = normalizeRequiredString(environment.OBJECT_STORAGE_ENDPOINT);
  const port = normalizePort(environment.OBJECT_STORAGE_PORT);
  const useSsl = normalizeBoolean(environment.OBJECT_STORAGE_USE_SSL);
  const bucket = normalizeRequiredString(environment.OBJECT_STORAGE_BUCKET);
  const region = normalizeRequiredString(environment.OBJECT_STORAGE_REGION);
  const accessKey = normalizeRequiredString(environment.OBJECT_STORAGE_ACCESS_KEY);
  const secretKey = normalizeRequiredString(environment.OBJECT_STORAGE_SECRET_KEY);

  if (!provider) {
    issues.push("OBJECT_STORAGE_PROVIDER is required.");
  } else if (!isObjectStorageProviderName(provider)) {
    issues.push(
      `OBJECT_STORAGE_PROVIDER must be one of: ${SUPPORTED_OBJECT_STORAGE_PROVIDERS.join(", ")}.`,
    );
  }

  if (!endpoint) {
    issues.push("OBJECT_STORAGE_ENDPOINT is required.");
  } else {
    validateEndpoint(endpoint, "OBJECT_STORAGE_ENDPOINT", issues);
  }

  if (!Number.isInteger(port) || port <= 0) {
    issues.push("OBJECT_STORAGE_PORT must be a positive integer.");
  }

  if (useSsl == null) {
    issues.push("OBJECT_STORAGE_USE_SSL must be either true or false.");
  }

  validateRequiredProviderValue(bucket, "OBJECT_STORAGE_BUCKET", issues, {
    allowLocalDevName: true,
  });
  validateRequiredProviderValue(region, "OBJECT_STORAGE_REGION", issues, {
    allowLocalDevName: true,
  });
  validateRequiredProviderValue(accessKey, ACCESS_KEY_ENVIRONMENT_KEY, issues);
  validateRequiredProviderValue(secretKey, SECRET_KEY_ENVIRONMENT_KEY, issues);

  return issues;
}

/**
 * @param {import("@coritech/config/environment.d.ts").CoriTechConfig | Record<string, unknown>} environment
 * @returns {import("./object-storage.d.ts").ObjectStorageConfig}
 */
export function createObjectStorageConfig(environment) {
  const issues = validateObjectStorageEnvironment(environment);

  if (issues.length > 0) {
    throw new ObjectStorageConfigError(issues);
  }

  const provider =
    /** @type {import("./object-storage.d.ts").ObjectStorageProviderName} */ (
      normalizeProviderName(environment.OBJECT_STORAGE_PROVIDER)
    );
  const endpoint = normalizeEndpoint(environment.OBJECT_STORAGE_ENDPOINT);
  const port = /** @type {number} */ (normalizePort(environment.OBJECT_STORAGE_PORT));
  const useSsl = /** @type {boolean} */ (
    normalizeBoolean(environment.OBJECT_STORAGE_USE_SSL)
  );
  const bucket = normalizeRequiredString(environment.OBJECT_STORAGE_BUCKET);
  const region = normalizeRequiredString(environment.OBJECT_STORAGE_REGION);
  const protocol = useSsl ? "https" : "http";

  return deepFreeze({
    kind: OBJECT_STORAGE_PROVIDER_KIND,
    provider,
    endpoint,
    port,
    useSsl,
    bucket,
    region,
    baseUrl: `${protocol}://${endpoint}:${port}`,
    accessKeyEnvironmentKey: ACCESS_KEY_ENVIRONMENT_KEY,
    secretKeyEnvironmentKey: SECRET_KEY_ENVIRONMENT_KEY,
    accessKeyConfigured: true,
    secretKeyConfigured: true,
    bucketPrivateByDefault: true,
    publicLinksAllowed: false,
  });
}

/**
 * @param {import("@coritech/config/environment.d.ts").CoriTechConfig | Record<string, unknown>} environment
 * @returns {import("./object-storage.d.ts").MinioClientOptions}
 */
export function createMinioClientOptions(environment) {
  const config = createObjectStorageConfig(environment);

  if (config.provider !== "minio") {
    throw new ObjectStorageConfigError([
      "createMinioClientOptions requires OBJECT_STORAGE_PROVIDER=minio.",
    ]);
  }

  return deepFreeze({
    endPoint: config.endpoint,
    port: config.port,
    useSSL: config.useSsl,
    accessKey: normalizeRequiredString(environment.OBJECT_STORAGE_ACCESS_KEY),
    secretKey: normalizeRequiredString(environment.OBJECT_STORAGE_SECRET_KEY),
    region: config.region,
  });
}

/**
 * @param {import("./object-storage.d.ts").ObjectStorageProviderInput} input
 * @returns {import("./object-storage.d.ts").ObjectStorageProvider}
 */
export function createObjectStorageProvider(input) {
  const issues = validateObjectStorageProviderInput(input);

  if (issues.length > 0) {
    throw new ObjectStorageConfigError(issues);
  }

  const config = input.config;
  const client = input.client;

  return Object.freeze({
    config,
    putObject: async (objectInput) => {
      const normalized = normalizePutObjectInput(objectInput);
      const result = await client.putObject({
        bucket: config.bucket,
        key: normalized.key,
        body: normalized.body,
        contentType: normalized.contentType,
        metadata: normalized.metadata,
      });

      return deepFreeze({
        provider: config.provider,
        bucket: config.bucket,
        key: normalized.key,
        etag: normalizeOptionalString(result?.etag ?? result?.ETag),
        versionId: normalizeOptionalString(result?.versionId ?? result?.VersionId),
      });
    },
    getObject: async (objectInput) => {
      const normalized = normalizeObjectKeyInput(objectInput);

      return client.getObject({
        bucket: config.bucket,
        key: normalized.key,
      });
    },
    deleteObject: async (objectInput) => {
      const normalized = normalizeObjectKeyInput(objectInput);

      await client.deleteObject({
        bucket: config.bucket,
        key: normalized.key,
      });

      return deepFreeze({
        provider: config.provider,
        bucket: config.bucket,
        key: normalized.key,
        deleted: true,
      });
    },
    headObject: async (objectInput) => {
      const normalized = normalizeObjectKeyInput(objectInput);

      return client.headObject({
        bucket: config.bucket,
        key: normalized.key,
      });
    },
    objectExists: async (objectInput) => {
      const normalized = normalizeObjectKeyInput(objectInput);

      try {
        await client.headObject({
          bucket: config.bucket,
          key: normalized.key,
        });
        return true;
      } catch (error) {
        if (isObjectNotFoundError(error)) {
          return false;
        }

        throw error;
      }
    },
    createInfrastructurePresignedGetUrl: async (objectInput) => {
      if (typeof client.createPresignedGetUrl !== "function") {
        throw new ObjectStorageConfigError([
          "object storage client does not support infrastructure-level presigned URLs.",
        ]);
      }

      const normalized = normalizePresignedUrlInput(objectInput);

      return client.createPresignedGetUrl({
        bucket: config.bucket,
        key: normalized.key,
        expiresInSeconds: normalized.expiresInSeconds,
      });
    },
  });
}

/**
 * @param {unknown} minioClient
 * @returns {import("./object-storage.d.ts").ObjectStorageClient}
 */
export function createMinioClientAdapter(minioClient) {
  const issues = [];

  if (!minioClient || typeof minioClient !== "object") {
    throw new ObjectStorageConfigError(["MinIO client is required."]);
  }

  for (const methodName of [
    "putObject",
    "getObject",
    "removeObject",
    "statObject",
  ]) {
    if (typeof minioClient[methodName] !== "function") {
      issues.push(`MinIO client must provide ${methodName}().`);
    }
  }

  if (issues.length > 0) {
    throw new ObjectStorageConfigError(issues);
  }

  const client = /** @type {Record<string, Function>} */ (minioClient);

  return Object.freeze({
    putObject: ({ bucket, key, body, contentType, metadata }) => {
      const minioMetadata = {
        ...(metadata ?? {}),
      };

      if (contentType) {
        minioMetadata["Content-Type"] = contentType;
      }

      return client.putObject(bucket, key, body, undefined, minioMetadata);
    },
    getObject: ({ bucket, key }) => client.getObject(bucket, key),
    deleteObject: ({ bucket, key }) => client.removeObject(bucket, key),
    headObject: ({ bucket, key }) => client.statObject(bucket, key),
    createPresignedGetUrl: ({ bucket, key, expiresInSeconds }) => {
      if (typeof client.presignedGetObject !== "function") {
        throw new ObjectStorageConfigError([
          "MinIO client does not provide presignedGetObject().",
        ]);
      }

      return client.presignedGetObject(bucket, key, expiresInSeconds);
    },
  });
}

/**
 * @param {import("./object-storage.d.ts").ObjectStorageProviderInput | undefined} input
 * @returns {string[]}
 */
function validateObjectStorageProviderInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["object storage provider input is required."];
  }

  validateObjectStorageConfig(input.config, issues);
  validateObjectStorageClient(input.client, issues);

  return issues;
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateObjectStorageConfig(value, issues) {
  if (!value || typeof value !== "object") {
    issues.push("object storage config is required.");
    return;
  }

  const config = /** @type {Partial<import("./object-storage.d.ts").ObjectStorageConfig>} */ (
    value
  );

  if (config.kind !== OBJECT_STORAGE_PROVIDER_KIND) {
    issues.push(`object storage config kind must be ${OBJECT_STORAGE_PROVIDER_KIND}.`);
  }

  if (!isObjectStorageProviderName(config.provider)) {
    issues.push(
      `object storage config provider must be one of: ${SUPPORTED_OBJECT_STORAGE_PROVIDERS.join(", ")}.`,
    );
  }

  validateRequiredNonBlankString(config.bucket, "object storage config bucket", issues);
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateObjectStorageClient(value, issues) {
  if (!value || typeof value !== "object") {
    issues.push("object storage client is required.");
    return;
  }

  const client = /** @type {Record<string, unknown>} */ (value);

  for (const operation of OBJECT_STORAGE_CLIENT_OPERATIONS) {
    if (typeof client[operation] !== "function") {
      issues.push(`object storage client must provide ${operation}().`);
    }
  }
}

/**
 * @param {import("./object-storage.d.ts").PutObjectInput} input
 * @returns {import("./object-storage.d.ts").NormalizedPutObjectInput}
 */
function normalizePutObjectInput(input) {
  const issues = [];
  const objectKey = normalizeObjectKey(input?.key, "key", issues);

  if (input?.body == null) {
    issues.push("body is required.");
  }

  validateOptionalNonBlankString(input?.contentType, "contentType", issues);

  if (
    input?.metadata !== undefined &&
    (input.metadata == null || typeof input.metadata !== "object" || Array.isArray(input.metadata))
  ) {
    issues.push("metadata must be an object when provided.");
  }

  if (issues.length > 0) {
    throw new ObjectStorageValidationError(issues);
  }

  return {
    key: objectKey,
    body: input.body,
    contentType: normalizeOptionalString(input.contentType),
    metadata: input.metadata ? Object.freeze({ ...input.metadata }) : undefined,
  };
}

/**
 * @param {import("./object-storage.d.ts").ObjectKeyInput} input
 * @returns {import("./object-storage.d.ts").NormalizedObjectKeyInput}
 */
function normalizeObjectKeyInput(input) {
  const issues = [];
  const objectKey = normalizeObjectKey(input?.key, "key", issues);

  if (issues.length > 0) {
    throw new ObjectStorageValidationError(issues);
  }

  return { key: objectKey };
}

/**
 * @param {import("./object-storage.d.ts").PresignedGetUrlInput} input
 * @returns {import("./object-storage.d.ts").NormalizedPresignedGetUrlInput}
 */
function normalizePresignedUrlInput(input) {
  const issues = [];
  const objectKey = normalizeObjectKey(input?.key, "key", issues);
  const expiresInSeconds = normalizePort(input?.expiresInSeconds);

  if (!Number.isInteger(expiresInSeconds) || expiresInSeconds <= 0) {
    issues.push("expiresInSeconds must be a positive integer.");
  }

  if (issues.length > 0) {
    throw new ObjectStorageValidationError(issues);
  }

  return { key: objectKey, expiresInSeconds };
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {string}
 */
function normalizeObjectKey(value, fieldName, issues) {
  const objectKey = normalizeRequiredString(value);

  if (!objectKey) {
    issues.push(`${fieldName} is required.`);
    return "";
  }

  if (/^(https?:\/\/|file:\/\/|\/|\.{1,2}\/|~)/i.test(objectKey)) {
    issues.push(
      `${fieldName} must be an object-storage key, not a URL or local filesystem path.`,
    );
  }

  return objectKey;
}

/**
 * @param {string} value
 * @param {string} key
 * @param {string[]} issues
 * @param {{ allowLocalDevName?: boolean }} [options]
 * @returns {void}
 */
function validateRequiredProviderValue(value, key, issues, options = {}) {
  if (!value) {
    issues.push(`${key} is required.`);
    return;
  }

  if (!options.allowLocalDevName && looksLikePlaceholder(value)) {
    issues.push(`${key} must be configured with a concrete object storage value.`);
  }
}

/**
 * @param {string} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {void}
 */
function validateEndpoint(value, key, issues) {
  if (value.includes("://")) {
    try {
      const url = new URL(value);

      if (url.pathname !== "/" || url.search || url.hash) {
        issues.push(`${key} must not include a path, query string or hash.`);
      }
    } catch {
      issues.push(`${key} must be a hostname or absolute endpoint URL.`);
    }
    return;
  }

  if (/[/?#]/.test(value)) {
    issues.push(`${key} must be a hostname without path, query string or hash.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredNonBlankString(value, fieldName, issues) {
  if (!normalizeRequiredString(value)) {
    issues.push(`${fieldName} is required.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value !== undefined && value !== null && !normalizeRequiredString(value)) {
    issues.push(`${fieldName} must not be blank when provided.`);
  }
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeProviderName(value) {
  const normalized = normalizeRequiredString(value).toLowerCase();

  if (normalized === "s3" || normalized === "s3_compatible") {
    return "s3-compatible";
  }

  return normalized;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeEndpoint(value) {
  const normalized = normalizeRequiredString(value);

  if (normalized.includes("://")) {
    return new URL(normalized).hostname;
  }

  return normalized.replace(/\/+$/, "");
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizePort(value) {
  if (typeof value === "number") {
    return value;
  }

  const normalized = normalizeRequiredString(value);

  if (!normalized) {
    return NaN;
  }

  const parsed = Number.parseInt(normalized, 10);

  return String(parsed) === normalized ? parsed : NaN;
}

/**
 * @param {unknown} value
 * @returns {boolean | null}
 */
function normalizeBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }

  const normalized = normalizeRequiredString(value);

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  return null;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  const normalized = normalizeRequiredString(value);
  return normalized || null;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function looksLikePlaceholder(value) {
  return PLACEHOLDER_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
function isObjectNotFoundError(error) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const candidate = /** @type {Record<string, unknown>} */ (error);
  const code = String(candidate.code ?? candidate.Code ?? candidate.name ?? "");
  const httpStatusCode = candidate.statusCode ?? candidate.$metadata?.httpStatusCode;

  return (
    code === "NoSuchKey" ||
    code === "NoSuchObject" ||
    code === "NotFound" ||
    httpStatusCode === 404
  );
}

/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
  if (value && typeof value === "object") {
    for (const child of Object.values(value)) {
      if (child && typeof child === "object") {
        deepFreeze(child);
      }
    }

    Object.freeze(value);
  }

  return /** @type {Readonly<T>} */ (value);
}
