export type CoriTechEnvironment = "local" | "staging" | "production";
export type EmailProvider = "console" | "http_api";

export interface CoriTechConfig {
  CORITECH_ENVIRONMENT: CoriTechEnvironment;
  DATABASE_URL: string;
  AUTH_PROVIDER_CLIENT_ID: string;
  AUTH_PROVIDER_CLIENT_SECRET: string;
  AUTH_PROVIDER_DOMAIN: string;
  EMAIL_PROVIDER: EmailProvider;
  EMAIL_PROVIDER_API_KEY: string;
  EMAIL_PROVIDER_ENDPOINT: string;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_FROM_NAME: string;
  OBJECT_STORAGE_PROVIDER: string;
  OBJECT_STORAGE_ENDPOINT: string;
  OBJECT_STORAGE_PORT: number;
  OBJECT_STORAGE_USE_SSL: boolean;
  OBJECT_STORAGE_BUCKET: string;
  OBJECT_STORAGE_REGION: string;
  OBJECT_STORAGE_ACCESS_KEY: string;
  OBJECT_STORAGE_SECRET_KEY: string;
  PAYMENT_PROVIDER_SECRET: string;
  LOGISTICS_PROVIDER_API_KEY: string;
  MONITORING_PROVIDER: string;
  MONITORING_ENDPOINT: string;
  ERROR_TRACKING_DSN: string;
  APP_BASE_URL: string;
  API_BASE_URL: string;
  AUDIT_LOG_RETENTION_DAYS: number;
}

export declare const ENVIRONMENT_NAMES: readonly CoriTechEnvironment[];
export declare const REQUIRED_ENVIRONMENT_KEYS: readonly string[];

export declare class EnvironmentConfigError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function loadEnvironment(
  source?: Record<string, string | undefined> | NodeJS.ProcessEnv,
): CoriTechConfig;

export declare function validateEnvironment(
  source?: Record<string, string | undefined> | NodeJS.ProcessEnv,
): void;
