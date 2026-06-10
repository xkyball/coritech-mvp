// @ts-check

export const ERROR_ROUTES = Object.freeze({
  login: "/login",
  appHome: "/app",
  accessDenied: "/access-denied",
});

export const SAFE_UNEXPECTED_ERROR_MESSAGE =
  "Something went wrong while loading this workspace. The issue can be retried, and CoriTech support can review the logged event.";

const API_ERROR_KIND_BY_STATUS = Object.freeze({
  401: "unauthenticated",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "validation",
});

const DISPLAY_BY_KIND = Object.freeze({
  unauthenticated: Object.freeze({
    title: "Sign in required",
    message: "Start a managed login session to continue.",
    actionLabel: "Go to login",
    actionHref: ERROR_ROUTES.login,
  }),
  forbidden: Object.freeze({
    title: "Access denied",
    message:
      "Your active organization and role cannot open this workspace or action.",
    actionLabel: "Return to app home",
    actionHref: ERROR_ROUTES.appHome,
  }),
  not_found: Object.freeze({
    title: "Page not found",
    message: "The page or record is not available in this workspace.",
    actionLabel: "Return home",
    actionHref: "/",
  }),
  conflict: Object.freeze({
    title: "The record changed",
    message: "Refresh the workspace and try the action again.",
    actionLabel: "Return to app home",
    actionHref: ERROR_ROUTES.appHome,
  }),
  validation: Object.freeze({
    title: "Check the highlighted fields",
    message: "Review the validation issues and try again.",
    actionLabel: "Review fields",
    actionHref: null,
  }),
  unexpected: Object.freeze({
    title: "Unable to load workspace",
    message: SAFE_UNEXPECTED_ERROR_MESSAGE,
    actionLabel: "Return to app home",
    actionHref: ERROR_ROUTES.appHome,
  }),
});

/**
 * @param {{
 *   status?: number | null;
 *   body?: unknown;
 *   fallbackMessage?: string;
 * }} input
 * @returns {import("./error-handling.d.ts").MappedApiError}
 */
export function mapApiErrorToUi(input) {
  const status = Number.isInteger(input.status) ? Number(input.status) : 500;
  const envelope = normalizeApiErrorEnvelope(input.body);
  const kind = resolveErrorKind(status, envelope?.code);
  const display = DISPLAY_BY_KIND[kind] ?? DISPLAY_BY_KIND.unexpected;
  const validationIssues = normalizeValidationIssues(envelope?.details);
  const apiMessage = sanitizeUserMessage(envelope?.message);
  const canUseApiMessage = kind !== "unexpected" && apiMessage !== null;

  return {
    kind,
    status,
    code: envelope?.code ?? statusCodeToCode(status),
    title: display.title,
    message: canUseApiMessage ? apiMessage : display.message,
    actionLabel: display.actionLabel,
    actionHref: display.actionHref,
    validationIssues,
  };
}

/**
 * @param {unknown} details
 * @returns {import("./error-handling.d.ts").ValidationIssue[]}
 */
export function normalizeValidationIssues(details) {
  const issues = getIssueCandidates(details);

  return issues
    .map((issue) => {
      if (typeof issue === "string") {
        const message = normalizeOptionalString(issue);

        return message ? { field: null, message } : null;
      }

      if (!issue || typeof issue !== "object") {
        return null;
      }

      const record = /** @type {Record<string, unknown>} */ (issue);
      const message =
        normalizeOptionalString(record.message) ??
        normalizeOptionalString(record.issue) ??
        normalizeOptionalString(record.error);

      if (!message) {
        return null;
      }

      return {
        field:
          normalizeOptionalString(record.field) ??
          normalizeOptionalString(record.path) ??
          null,
        message,
      };
    })
    .filter((issue) => issue !== null);
}

/**
 * @param {readonly import("./error-handling.d.ts").ValidationIssue[]} issues
 * @returns {string}
 */
export function formatValidationSummary(issues) {
  if (issues.length === 0) {
    return "Review the highlighted fields and try again.";
  }

  if (issues.length === 1) {
    const [issue] = issues;

    return issue.field ? `${issue.field}: ${issue.message}` : issue.message;
  }

  return `${issues.length} fields need attention before this can be saved.`;
}

/**
 * @param {{ reason?: unknown; returnHref?: string }} [input]
 * @returns {import("./error-handling.d.ts").ErrorSurfaceModel}
 */
export function createAccessDeniedViewModel(input = {}) {
  return {
    eyebrow: "Access denied",
    title: "This route is not available for your active role",
    message:
      normalizeOptionalString(input.reason) ??
      "The active organization and role context for this session cannot open that workspace.",
    badge: "403",
    actionLabel: "Return to app home",
    actionHref: input.returnHref ?? ERROR_ROUTES.appHome,
  };
}

/**
 * @returns {import("./error-handling.d.ts").ErrorSurfaceModel}
 */
export function createUnauthenticatedViewModel() {
  return {
    eyebrow: "Sign in required",
    title: "Managed login is required",
    message:
      "Start a provider-managed login session before opening a protected CoriTech workspace.",
    badge: "401",
    actionLabel: "Go to login",
    actionHref: ERROR_ROUTES.login,
  };
}

/**
 * @param {{ resourceLabel?: unknown; returnHref?: string }} [input]
 * @returns {import("./error-handling.d.ts").ErrorSurfaceModel}
 */
export function createNotFoundViewModel(input = {}) {
  const resourceLabel = normalizeOptionalString(input.resourceLabel) ?? "page";

  return {
    eyebrow: "Not found",
    title: `${capitalize(resourceLabel)} not found`,
    message:
      "The requested page or record is not available. If the object is sensitive, CoriTech does not disclose whether it exists outside your active context.",
    badge: "404",
    actionLabel: "Return home",
    actionHref: input.returnHref ?? "/",
  };
}

/**
 * @returns {import("./error-handling.d.ts").ErrorSurfaceModel}
 */
export function createUnexpectedErrorViewModel() {
  return {
    eyebrow: "Runtime error",
    title: "Unable to load workspace",
    message: SAFE_UNEXPECTED_ERROR_MESSAGE,
    badge: "500",
    actionLabel: "Return to app home",
    actionHref: ERROR_ROUTES.appHome,
  };
}

/**
 * Placeholder hook for future hosted error tracking.
 *
 * @param {unknown} error
 * @param {Record<string, unknown>} [context]
 * @param {(event: import("./error-handling.d.ts").RuntimeErrorLogEvent) => void} [logger]
 * @returns {import("./error-handling.d.ts").RuntimeErrorLogEvent}
 */
export function reportRuntimeError(error, context = {}, logger = defaultLogger) {
  const event = createRuntimeErrorLogEvent(error, context);
  logger(event);

  return event;
}

/**
 * @param {unknown} error
 * @param {Record<string, unknown>} [context]
 * @returns {import("./error-handling.d.ts").RuntimeErrorLogEvent}
 */
export function createRuntimeErrorLogEvent(error, context = {}) {
  const digest =
    error && typeof error === "object" && "digest" in error
      ? normalizeOptionalString(/** @type {{ digest?: unknown }} */ (error).digest)
      : null;
  const name =
    error && typeof error === "object" && "name" in error
      ? normalizeOptionalString(/** @type {{ name?: unknown }} */ (error).name)
      : null;

  return {
    eventType: "runtime_error",
    digest,
    name: name ?? "Error",
    context: sanitizeLogContext(context),
  };
}

/**
 * @param {unknown} body
 * @returns {{ code: string | null; message: string | null; details: unknown } | null}
 */
function normalizeApiErrorEnvelope(body) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const record = /** @type {Record<string, unknown>} */ (body);
  const source = record.error && typeof record.error === "object"
    ? /** @type {Record<string, unknown>} */ (record.error)
    : record;

  return {
    code: normalizeOptionalString(source.code),
    message: normalizeOptionalString(source.message),
    details: source.details,
  };
}

/**
 * @param {number} status
 * @param {string | null | undefined} code
 * @returns {import("./error-handling.d.ts").MappedApiErrorKind}
 */
function resolveErrorKind(status, code) {
  const normalizedCode = String(code ?? "").toUpperCase();

  if (
    normalizedCode === "VALIDATION_FAILED" ||
    normalizedCode === "UNPROCESSABLE_ENTITY"
  ) {
    return "validation";
  }

  if (normalizedCode === "CONFLICT" || normalizedCode === "INVALID_STATE") {
    return "conflict";
  }

  return API_ERROR_KIND_BY_STATUS[status] ?? "unexpected";
}

/**
 * @param {number} status
 * @returns {string}
 */
function statusCodeToCode(status) {
  const codes = {
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "VALIDATION_FAILED",
  };

  return codes[status] ?? "INTERNAL_ERROR";
}

/**
 * @param {unknown} details
 * @returns {unknown[]}
 */
function getIssueCandidates(details) {
  if (!details) {
    return [];
  }

  if (Array.isArray(details)) {
    return details;
  }

  if (typeof details !== "object") {
    return [];
  }

  const record = /** @type {Record<string, unknown>} */ (details);

  if (Array.isArray(record.issues)) {
    return record.issues;
  }

  if (Array.isArray(record.errors)) {
    return record.errors;
  }

  return [];
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function sanitizeUserMessage(value) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return null;
  }

  if (/stack trace|prisma|select\s+.+from|insert\s+into|sql|secret|token/i.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * @param {Record<string, unknown>} context
 * @returns {Record<string, string | number | boolean | null>}
 */
function sanitizeLogContext(context) {
  return Object.fromEntries(
    Object.entries(context)
      .filter(([key]) => !/(secret|token|password|credential|cookie|authorization)/i.test(key))
      .map(([key, value]) => [key, sanitizeLogValue(value)]),
  );
}

/**
 * @param {unknown} value
 * @returns {string | number | boolean | null}
 */
function sanitizeLogValue(value) {
  if (typeof value === "string") {
    return value.slice(0, 160);
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return null;
}

/**
 * @param {import("./error-handling.d.ts").RuntimeErrorLogEvent} event
 * @returns {void}
 */
function defaultLogger(event) {
  if (typeof console !== "undefined" && typeof console.error === "function") {
    console.error("[coritech-runtime-error]", event);
  }
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed === "" ? null : trimmed;
}

/**
 * @param {string} value
 * @returns {string}
 */
function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
