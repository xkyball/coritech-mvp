import type { CoriTechConfig } from "@coritech/config/environment.d.ts";

export type ObjectStorageProviderName = "minio" | "s3-compatible";

export interface ObjectStorageConfig {
  kind: "S3_COMPATIBLE_OBJECT_STORAGE";
  provider: ObjectStorageProviderName;
  endpoint: string;
  port: number;
  useSsl: boolean;
  bucket: string;
  region: string;
  baseUrl: string;
  accessKeyEnvironmentKey: "OBJECT_STORAGE_ACCESS_KEY";
  secretKeyEnvironmentKey: "OBJECT_STORAGE_SECRET_KEY";
  accessKeyConfigured: true;
  secretKeyConfigured: true;
  bucketPrivateByDefault: true;
  publicLinksAllowed: false;
}

export interface MinioClientOptions {
  endPoint: string;
  port: number;
  useSSL: boolean;
  accessKey: string;
  secretKey: string;
  region: string;
}

export interface ObjectKeyInput {
  key: string;
}

export interface PutObjectInput extends ObjectKeyInput {
  body: unknown;
  contentType?: string | null;
  metadata?: Record<string, string> | null;
}

export interface PresignedGetUrlInput extends ObjectKeyInput {
  expiresInSeconds: number;
}

export interface NormalizedObjectKeyInput {
  key: string;
}

export interface NormalizedPutObjectInput extends NormalizedObjectKeyInput {
  body: unknown;
  contentType: string | null;
  metadata?: Readonly<Record<string, string>>;
}

export interface NormalizedPresignedGetUrlInput
  extends NormalizedObjectKeyInput {
  expiresInSeconds: number;
}

export interface ObjectStorageReference {
  provider: ObjectStorageProviderName;
  bucket: string;
  key: string;
  etag: string | null;
  versionId: string | null;
}

export interface DeletedObjectStorageReference {
  provider: ObjectStorageProviderName;
  bucket: string;
  key: string;
  deleted: true;
}

export interface ObjectStorageClient {
  putObject(input: {
    bucket: string;
    key: string;
    body: unknown;
    contentType: string | null;
    metadata?: Readonly<Record<string, string>>;
  }): Promise<{ etag?: string | null; ETag?: string | null; versionId?: string | null; VersionId?: string | null } | void>;
  getObject(input: { bucket: string; key: string }): Promise<unknown>;
  deleteObject(input: { bucket: string; key: string }): Promise<unknown>;
  headObject(input: { bucket: string; key: string }): Promise<unknown>;
  createPresignedGetUrl?(input: {
    bucket: string;
    key: string;
    expiresInSeconds: number;
  }): Promise<string>;
}

export interface ObjectStorageProviderInput {
  config: ObjectStorageConfig;
  client: ObjectStorageClient;
}

export interface ObjectStorageProvider {
  config: ObjectStorageConfig;
  putObject(input: PutObjectInput): Promise<Readonly<ObjectStorageReference>>;
  getObject(input: ObjectKeyInput): Promise<unknown>;
  deleteObject(
    input: ObjectKeyInput,
  ): Promise<Readonly<DeletedObjectStorageReference>>;
  headObject(input: ObjectKeyInput): Promise<unknown>;
  objectExists(input: ObjectKeyInput): Promise<boolean>;
  createInfrastructurePresignedGetUrl(
    input: PresignedGetUrlInput,
  ): Promise<string>;
}

export declare const OBJECT_STORAGE_PROVIDER_KIND:
  "S3_COMPATIBLE_OBJECT_STORAGE";
export declare const SUPPORTED_OBJECT_STORAGE_PROVIDERS:
  readonly ObjectStorageProviderName[];
export declare const OBJECT_STORAGE_CLIENT_OPERATIONS: readonly [
  "putObject",
  "getObject",
  "deleteObject",
  "headObject",
];

export declare class ObjectStorageConfigError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class ObjectStorageValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function isObjectStorageProviderName(
  value: unknown,
): value is ObjectStorageProviderName;

export declare function validateObjectStorageEnvironment(
  environment: CoriTechConfig | Record<string, unknown>,
): string[];

export declare function createObjectStorageConfig(
  environment: CoriTechConfig | Record<string, unknown>,
): Readonly<ObjectStorageConfig>;

export declare function createMinioClientOptions(
  environment: CoriTechConfig | Record<string, unknown>,
): Readonly<MinioClientOptions>;

export declare function createObjectStorageProvider(
  input: ObjectStorageProviderInput,
): ObjectStorageProvider;

export declare function createMinioClientAdapter(
  minioClient: unknown,
): ObjectStorageClient;
