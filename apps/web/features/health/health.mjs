const DEFAULT_SERVICE_NAME = "coritech-web";

export function createHealthStatus(options = {}) {
  const {
    service = DEFAULT_SERVICE_NAME,
    now = new Date(),
    environment = process.env.NODE_ENV ?? "development"
  } = options;

  return Object.freeze({
    status: "ok",
    service,
    environment: normalizeEnvironment(environment),
    timestamp: now.toISOString()
  });
}

function normalizeEnvironment(environment) {
  if (environment === "production" || environment === "test") {
    return environment;
  }

  return "development";
}
