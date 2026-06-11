export type HealthStatus = Readonly<{
  status: "ok";
  service: string;
  environment: "development" | "test" | "production";
  timestamp: string;
}>;

export function createHealthStatus(options?: {
  service?: string;
  now?: Date;
  environment?: string;
}): HealthStatus;
