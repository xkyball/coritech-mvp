// @ts-check

export const AUTH_ROUTES = Object.freeze({
  loginPage: "/login",
  loginAction: "/auth/login",
  callback: "/auth/callback",
  logoutPage: "/logout",
  logoutAction: "/auth/logout",
  loggedOut: "/logged-out",
  error: "/auth/error",
  passwordResetPage: "/password-reset",
  passwordResetAction: "/auth/password-reset",
  emailVerificationPage: "/auth/verification",
  appHome: "/app",
  breederApp: "/app/breeder",
  stationApp: "/app/station",
  adminApp: "/app/admin",
  noRole: "/app/no-role",
  selectRole: "/app/select-role",
  unauthorized: "/unauthorized",
});

export const SESSION_COOKIE_NAMES = Object.freeze([
  "__Host-coritech_session",
  "coritech_session",
]);

export const AUTH_FLOW_COOKIE_NAMES = Object.freeze({
  state: "coritech_auth_state",
  nonce: "coritech_auth_nonce",
  returnTo: "coritech_auth_return_to",
});

export const PROTECTED_ROUTE_PREFIXES = Object.freeze([
  "/app",
  "/breeder-dashboard",
  "/station-dashboard",
]);

const AUTH_PAGE_PREFIXES = [
  "/auth",
  AUTH_ROUTES.loginPage,
  AUTH_ROUTES.logoutPage,
  AUTH_ROUTES.loggedOut,
  AUTH_ROUTES.passwordResetPage,
];

export const AUTH_ERROR_MESSAGES = Object.freeze({
  provider_not_configured: Object.freeze({
    title: "Managed login is not configured",
    message:
      "The hosted auth provider is not ready for this environment yet. No local password fallback is available.",
  }),
  provider_error: Object.freeze({
    title: "The auth provider returned an error",
    message:
      "The hosted auth flow stopped before CoriTech could create a session. You can retry from the login page.",
  }),
  invalid_callback: Object.freeze({
    title: "The login callback was incomplete",
    message:
      "The auth provider did not return the expected callback fields. Start a new login attempt.",
  }),
  invalid_state: Object.freeze({
    title: "The login session could not be verified",
    message:
      "For your safety, CoriTech only accepts callbacks that match the current browser login attempt.",
  }),
  session_adapter_pending: Object.freeze({
    title: "Provider callback wiring is pending",
    message:
      "The callback route is present, but the provider-specific token exchange adapter is not configured in this runtime.",
  }),
  password_reset_provider_managed: Object.freeze({
    title: "Password reset is provider-managed",
    message:
      "CoriTech does not create password reset tokens. The selected auth provider owns reset delivery and password update screens.",
  }),
});

/**
 * @param {unknown} code
 * @returns {{ title: string; message: string }}
 */
export function getAuthErrorDisplay(code) {
  const normalized = normalizeOptionalString(code) ?? "provider_error";

  return AUTH_ERROR_MESSAGES[normalized] ?? AUTH_ERROR_MESSAGES.provider_error;
}

/**
 * @param {unknown} pathname
 * @returns {boolean}
 */
export function isProtectedPath(pathname) {
  const normalized = normalizePathname(pathname);

  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

/**
 * @param {unknown} cookieHeader
 * @param {readonly string[]} [sessionCookieNames]
 * @returns {boolean}
 */
export function hasAuthenticatedSessionCookie(
  cookieHeader,
  sessionCookieNames = SESSION_COOKIE_NAMES,
) {
  if (typeof cookieHeader !== "string" || cookieHeader.trim() === "") {
    return false;
  }

  const cookies = parseCookieHeader(cookieHeader);

  return sessionCookieNames.some((cookieName) => {
    const value = cookies.get(cookieName);

    return typeof value === "string" && value.trim() !== "";
  });
}

/**
 * @returns {string[]}
 */
export function getAuthCookieClearNames() {
  return [
    ...SESSION_COOKIE_NAMES,
    AUTH_FLOW_COOKIE_NAMES.state,
    AUTH_FLOW_COOKIE_NAMES.nonce,
    AUTH_FLOW_COOKIE_NAMES.returnTo,
  ];
}

/**
 * @param {unknown} value
 * @param {{ fallback?: string; currentOrigin?: string }} [options]
 * @returns {string}
 */
export function sanitizeReturnTo(value, options = {}) {
  const fallback = sanitizeFallback(options.fallback ?? AUTH_ROUTES.appHome);
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return fallback;
  }

  let pathWithSearch = normalized;

  if (looksLikeAbsoluteUrl(pathWithSearch)) {
    if (!options.currentOrigin) {
      return fallback;
    }

    let parsed;

    try {
      parsed = new URL(pathWithSearch);
    } catch {
      return fallback;
    }

    if (parsed.origin !== options.currentOrigin) {
      return fallback;
    }

    pathWithSearch = `${parsed.pathname}${parsed.search}`;
  }

  if (!pathWithSearch.startsWith("/") || pathWithSearch.startsWith("//")) {
    return fallback;
  }

  let parsed;

  try {
    parsed = new URL(pathWithSearch, "https://coritech.local");
  } catch {
    return fallback;
  }

  if (parsed.origin !== "https://coritech.local") {
    return fallback;
  }

  if (isAuthPage(parsed.pathname)) {
    return fallback;
  }

  return `${parsed.pathname}${parsed.search}`;
}

/**
 * @param {{ url: string; cookieHeader?: string | null; currentOrigin?: string }} input
 * @returns {{ allowed: true; redirectTo: null } | { allowed: false; redirectTo: string }}
 */
export function resolveProtectedRouteRequest(input) {
  const currentOrigin = input.currentOrigin ?? "https://coritech.local";
  const url = new URL(input.url, currentOrigin);

  if (hasAuthenticatedSessionCookie(input.cookieHeader ?? "")) {
    return {
      allowed: true,
      redirectTo: null,
    };
  }

  const returnTo = sanitizeReturnTo(`${url.pathname}${url.search}`, {
    currentOrigin: url.origin,
  });
  const loginUrl = new URL(AUTH_ROUTES.loginPage, url.origin);
  loginUrl.searchParams.set("returnTo", returnTo);

  return {
    allowed: false,
    redirectTo: `${loginUrl.pathname}${loginUrl.search}`,
  };
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized === "" ? null : normalized;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizePathname(value) {
  const normalized = normalizeOptionalString(value);

  if (!normalized) {
    return "/";
  }

  if (!normalized.startsWith("/")) {
    return `/${normalized}`;
  }

  return normalized;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isAuthPage(value) {
  return AUTH_PAGE_PREFIXES.some((prefix) =>
    value === prefix || value.startsWith(`${prefix}/`),
  );
}

/**
 * @param {string} value
 * @returns {string}
 */
function sanitizeFallback(value) {
  if (!value.startsWith("/") || value.startsWith("//") || isAuthPage(value)) {
    return AUTH_ROUTES.appHome;
  }

  return value;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function looksLikeAbsoluteUrl(value) {
  return /^[a-z][a-z\d+\-.]*:\/\//i.test(value);
}

/**
 * @param {string} cookieHeader
 * @returns {Map<string, string>}
 */
function parseCookieHeader(cookieHeader) {
  const cookies = new Map();

  for (const part of cookieHeader.split(";")) {
    const separatorIndex = part.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const name = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();

    if (name) {
      cookies.set(name, value);
    }
  }

  return cookies;
}
