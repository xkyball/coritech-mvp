// @ts-check

import { groupActiveRolesByOrganization } from "../identity/role-model.mjs";

export const MANAGED_AUTH_PROVIDER_KIND = "OIDC_MANAGED_AUTH";

export const MANAGED_AUTH_SCOPES = /** @type {const} */ ([
  "openid",
  "profile",
  "email",
]);

export const MANAGED_AUTH_FLOWS = /** @type {const} */ ([
  "LOGIN",
  "SIGN_UP",
]);

export const MANAGED_AUTH_ROUTES = Object.freeze([
  Object.freeze({
    method: "GET",
    path: "/auth/signup",
    handler: "redirectToManagedAuthSignUp",
    access: "Public provider-hosted sign-up; provider handles passwords and email verification policy",
  }),
  Object.freeze({
    method: "GET",
    path: "/auth/login",
    handler: "redirectToManagedAuthLogin",
    access: "Public provider-hosted login; provider handles credentials and MFA challenges",
  }),
  Object.freeze({
    method: "GET",
    path: "/auth/callback",
    handler: "handleManagedAuthCallback",
    access: "Managed auth provider callback; maps verified provider identity to CoriTech User",
  }),
  Object.freeze({
    method: "POST",
    path: "/auth/logout",
    handler: "redirectToManagedAuthLogout",
    access: "Authenticated session; delegates logout to managed provider",
  }),
  Object.freeze({
    method: "POST",
    path: "/auth/password-reset",
    handler: "startManagedAuthPasswordReset",
    access: "Public provider-hosted password reset; no CoriTech password tokens",
  }),
  Object.freeze({
    method: "POST",
    path: "/auth/email-verification",
    handler: "startManagedAuthEmailVerification",
    access: "Authenticated user or admin support path when provider supports verification sends",
  }),
  Object.freeze({
    method: "GET",
    path: "/auth/session",
    handler: "readManagedAuthSession",
    access: "Authenticated session context only",
  }),
]);

export const PASSWORD_HANDLING_POLICY = Object.freeze({
  handledBy: "MANAGED_AUTH_PROVIDER",
  customPasswordStorage: false,
  customPasswordHashing: false,
  customPasswordResetTokens: false,
  localPasswordFieldsAllowed: false,
  reason:
    "CoriTech Phase 1 delegates credential collection, password storage, password reset and email verification controls to the managed auth provider.",
});

export const ADMIN_MFA_POLICY = Object.freeze({
  requiredForRoles: Object.freeze(["PLATFORM_ADMIN"]),
  enforcement: "MANAGED_AUTH_PROVIDER_TENANT_POLICY",
  documentationPath: "docs/security/managed-auth-provider.md",
});

export const AUTH_PROVIDER_ACCOUNT_OWNERSHIP_POLICY = Object.freeze({
  requiredOwner: "CoriTech",
  vendorOwnedProductionAccountAllowed: false,
  evidenceDocument: "docs/vendor-ip/account-ownership-checklist.md",
});

const SUPPORTED_ENVIRONMENTS = /** @type {const} */ ([
  "local",
  "staging",
  "production",
]);

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

const DEFAULT_SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

export class ManagedAuthConfigError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech managed auth configuration:\n- ${issues.join("\n- ")}`);
    this.name = "ManagedAuthConfigError";
    this.issues = issues;
  }
}

export class ManagedAuthValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech managed auth input:\n- ${issues.join("\n- ")}`);
    this.name = "ManagedAuthValidationError";
    this.issues = issues;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./managed-auth-provider.d.ts").ManagedAuthFlow}
 */
export function isManagedAuthFlow(value) {
  return typeof value === "string" && MANAGED_AUTH_FLOWS.includes(
    /** @type {import("./managed-auth-provider.d.ts").ManagedAuthFlow} */ (value),
  );
}

/**
 * @param {import("../../config/environment.d.ts").CoriTechConfig} environment
 * @returns {string[]}
 */
export function validateManagedAuthProviderEnvironment(environment) {
  const issues = [];

  if (!environment || typeof environment !== "object") {
    return ["environment config is required."];
  }

  const environmentName = normalizeRequiredString(environment.CORITECH_ENVIRONMENT);
  const clientId = normalizeRequiredString(environment.AUTH_PROVIDER_CLIENT_ID);
  const clientSecret = normalizeRequiredString(environment.AUTH_PROVIDER_CLIENT_SECRET);
  const providerDomain = normalizeRequiredString(environment.AUTH_PROVIDER_DOMAIN);
  const appBaseUrl = normalizeRequiredString(environment.APP_BASE_URL);
  const apiBaseUrl = normalizeRequiredString(environment.API_BASE_URL);

  if (!environmentName) {
    issues.push("CORITECH_ENVIRONMENT is required.");
  } else if (!SUPPORTED_ENVIRONMENTS.includes(
    /** @type {import("../../config/environment.d.ts").CoriTechEnvironment} */ (
      environmentName
    ),
  )) {
    issues.push(`CORITECH_ENVIRONMENT must be one of: ${SUPPORTED_ENVIRONMENTS.join(", ")}.`);
  }

  validateRequiredProviderValue(clientId, "AUTH_PROVIDER_CLIENT_ID", issues);
  validateRequiredProviderValue(clientSecret, "AUTH_PROVIDER_CLIENT_SECRET", issues);
  validateRequiredProviderValue(providerDomain, "AUTH_PROVIDER_DOMAIN", issues);

  validateAbsoluteBaseUrl(appBaseUrl, "APP_BASE_URL", environmentName, issues);
  validateAbsoluteBaseUrl(apiBaseUrl, "API_BASE_URL", environmentName, issues);
  validateProviderDomain(providerDomain, environmentName, issues);

  return issues;
}

/**
 * @param {import("../../config/environment.d.ts").CoriTechConfig} environment
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfigOptions} [options]
 * @returns {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig}
 */
export function createManagedAuthProviderConfig(environment, options = {}) {
  const issues = validateManagedAuthProviderEnvironment(environment);

  validateOptionalRoutePath(options.callbackPath, "callbackPath", issues);
  validateOptionalRoutePath(options.logoutReturnPath, "logoutReturnPath", issues);
  validateOptionalRoutePath(options.postLoginPath, "postLoginPath", issues);
  validateOptionalCookieName(options.sessionCookieName, issues);

  if (issues.length > 0) {
    throw new ManagedAuthConfigError(issues);
  }

  const issuerBaseUrl = normalizeIssuerBaseUrl(environment.AUTH_PROVIDER_DOMAIN);
  const appBaseUrl = normalizeBaseUrl(environment.APP_BASE_URL);
  const apiBaseUrl = normalizeBaseUrl(environment.API_BASE_URL);
  const callbackPath = options.callbackPath ?? "/auth/callback";
  const logoutReturnPath = options.logoutReturnPath ?? "/logged-out";
  const postLoginPath = options.postLoginPath ?? "/";

  return deepFreeze({
    kind: MANAGED_AUTH_PROVIDER_KIND,
    issuerBaseUrl,
    clientId: environment.AUTH_PROVIDER_CLIENT_ID.trim(),
    clientSecretEnvironmentKey: "AUTH_PROVIDER_CLIENT_SECRET",
    clientSecretConfigured: true,
    authorizationEndpoint: `${issuerBaseUrl}/authorize`,
    tokenEndpoint: `${issuerBaseUrl}/oauth/token`,
    logoutEndpoint: `${issuerBaseUrl}/v2/logout`,
    jwksUri: `${issuerBaseUrl}/.well-known/jwks.json`,
    openidConfigurationUrl: `${issuerBaseUrl}/.well-known/openid-configuration`,
    callbackUrl: buildUrl(apiBaseUrl, callbackPath),
    logoutReturnUrl: buildUrl(appBaseUrl, logoutReturnPath),
    defaultPostLoginUrl: buildUrl(appBaseUrl, postLoginPath),
    scope: [...MANAGED_AUTH_SCOPES],
    sessionCookie: {
      name: options.sessionCookieName ?? "__Host-coritech_session",
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
      secure: environment.CORITECH_ENVIRONMENT !== "local",
      maxAgeSeconds: DEFAULT_SESSION_MAX_AGE_SECONDS,
    },
    passwordHandling: PASSWORD_HANDLING_POLICY,
    adminMfa: ADMIN_MFA_POLICY,
    providerAccountOwnership: AUTH_PROVIDER_ACCOUNT_OWNERSHIP_POLICY,
  });
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthRedirectInput} input
 * @returns {string}
 */
export function buildManagedAuthRedirectUrl(config, input) {
  const issues = validateManagedAuthRedirectInput(config, input);

  if (issues.length > 0) {
    throw new ManagedAuthValidationError(issues);
  }

  const url = new URL(config.authorizationEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("redirect_uri", config.callbackUrl);
  url.searchParams.set("scope", config.scope.join(" "));
  url.searchParams.set("state", input.state.trim());
  url.searchParams.set("nonce", input.nonce.trim());

  if (input.flow === "SIGN_UP") {
    url.searchParams.set("screen_hint", "signup");
  }

  const loginHint = normalizeOptionalString(input.loginHint);
  const prompt = normalizeOptionalString(input.prompt);

  if (loginHint) {
    url.searchParams.set("login_hint", loginHint);
  }

  if (prompt) {
    url.searchParams.set("prompt", prompt);
  }

  return url.href;
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {Omit<import("./managed-auth-provider.d.ts").ManagedAuthRedirectInput, "flow">} input
 * @returns {string}
 */
export function buildManagedAuthLoginUrl(config, input) {
  return buildManagedAuthRedirectUrl(config, {
    ...input,
    flow: "LOGIN",
  });
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {Omit<import("./managed-auth-provider.d.ts").ManagedAuthRedirectInput, "flow">} input
 * @returns {string}
 */
export function buildManagedAuthSignUpUrl(config, input) {
  return buildManagedAuthRedirectUrl(config, {
    ...input,
    flow: "SIGN_UP",
  });
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthLogoutInput} [input]
 * @returns {string}
 */
export function buildManagedAuthLogoutUrl(config, input = {}) {
  const issues = validateManagedAuthProviderConfig(config);
  const returnTo = normalizeOptionalString(input.returnTo) ?? config.logoutReturnUrl;

  validateAbsoluteUrl(returnTo, "returnTo", issues);

  if (issues.length > 0) {
    throw new ManagedAuthValidationError(issues);
  }

  const url = new URL(config.logoutEndpoint);
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("returnTo", returnTo);

  if (input.federated === true) {
    url.searchParams.set("federated", "");
  }

  return url.href;
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthPasswordResetInput} input
 * @returns {import("./managed-auth-provider.d.ts").ManagedAuthProviderActionRequest}
 */
export function prepareManagedAuthPasswordResetRequest(config, input) {
  const issues = validateManagedAuthProviderConfig(config);
  const email = normalizeEmail(input?.email);

  if (!email) {
    issues.push("email is required.");
  }

  if (issues.length > 0) {
    throw new ManagedAuthValidationError(issues);
  }

  return deepFreeze({
    action: "PASSWORD_RESET",
    handledByProvider: true,
    passwordHandledBy: PASSWORD_HANDLING_POLICY.handledBy,
    route: "/auth/password-reset",
    userEmail: email,
    providerIssuerBaseUrl: config.issuerBaseUrl,
    providerEndpoint: null,
    customPasswordTokenCreated: false,
    delivery: "MANAGED_AUTH_PROVIDER_EMAIL",
    notes:
      "The application must delegate password reset token generation, delivery and password update screens to the managed auth provider.",
  });
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthEmailVerificationInput} input
 * @returns {import("./managed-auth-provider.d.ts").ManagedAuthProviderActionRequest}
 */
export function prepareManagedAuthEmailVerificationRequest(config, input) {
  const issues = validateManagedAuthProviderConfig(config);
  const subject = normalizeRequiredString(input?.subject);
  const email = normalizeEmail(input?.email);

  if (!subject) {
    issues.push("subject is required.");
  }

  if (!email) {
    issues.push("email is required.");
  }

  if (issues.length > 0) {
    throw new ManagedAuthValidationError(issues);
  }

  return deepFreeze({
    action: "EMAIL_VERIFICATION",
    handledByProvider: true,
    passwordHandledBy: PASSWORD_HANDLING_POLICY.handledBy,
    route: "/auth/email-verification",
    subject,
    userEmail: email,
    providerIssuerBaseUrl: config.issuerBaseUrl,
    providerEndpoint: null,
    customPasswordTokenCreated: false,
    delivery: "MANAGED_AUTH_PROVIDER_EMAIL",
    notes:
      "The application must request a provider-managed verification email when the selected provider supports resend operations.",
  });
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthIdentityMappingInput} input
 * @returns {import("./managed-auth-provider.d.ts").ManagedAuthMappedUser}
 */
export function mapManagedAuthIdentityToInternalUser(input) {
  const issues = validateManagedAuthIdentityMapping(input);

  if (issues.length > 0) {
    throw new ManagedAuthValidationError(issues);
  }

  const identity = input.identity;
  const existingUser = input.existingUser;
  const now = toIsoTimestamp(input.now ?? new Date());
  const subject = normalizeRequiredString(identity.subject);
  const email = /** @type {string} */ (normalizeEmail(identity.email));
  const displayName = resolveDisplayName(identity);
  const userId = normalizeOptionalString(input.userId) ?? existingUser?.id ?? null;

  return deepFreeze({
    id: userId,
    managedAuthSubject: subject,
    email,
    displayName,
    status: existingUser?.status ?? "ACTIVE",
    createdAt: existingUser?.createdAt ?? now,
    updatedAt: now,
  });
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthSessionInput} input
 * @returns {import("./managed-auth-provider.d.ts").ManagedAuthSessionContext}
 */
export function prepareManagedAuthSession(input) {
  const issues = validateManagedAuthSessionInput(input);

  if (issues.length > 0) {
    throw new ManagedAuthValidationError(issues);
  }

  const issuedAt = toIsoTimestamp(input.issuedAt ?? input.now ?? new Date());
  const expiresAt = toIsoTimestamp(
    input.expiresAt ?? addSeconds(new Date(issuedAt), DEFAULT_SESSION_MAX_AGE_SECONDS),
  );
  const user = input.user;
  const activeAssignments = (input.roleAssignments ?? []).filter((assignment) =>
    assignment.userId === user.id,
  );

  return deepFreeze({
    id: normalizeOptionalString(input.sessionId),
    user: {
      id: /** @type {string} */ (user.id),
      managedAuthSubject: user.managedAuthSubject,
      email: user.email,
      displayName: user.displayName,
      status: user.status,
    },
    providerSessionId: normalizeOptionalString(input.providerSessionId),
    memberships: groupActiveRolesByOrganization(activeAssignments),
    issuedAt,
    expiresAt,
  });
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthRedirectInput} input
 * @returns {string[]}
 */
function validateManagedAuthRedirectInput(config, input) {
  const issues = validateManagedAuthProviderConfig(config);

  if (!input || typeof input !== "object") {
    issues.push("redirect input is required.");
    return issues;
  }

  const flow = normalizeRequiredString(input.flow);

  if (!flow) {
    issues.push("flow is required.");
  } else if (!isManagedAuthFlow(flow)) {
    issues.push(`flow must be one of: ${MANAGED_AUTH_FLOWS.join(", ")}.`);
  }

  validateRequiredNonBlankString(input.state, "state", issues);
  validateRequiredNonBlankString(input.nonce, "nonce", issues);
  validateOptionalNonBlankString(input.loginHint, "loginHint", issues);
  validateOptionalNonBlankString(input.prompt, "prompt", issues);

  return issues;
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @returns {string[]}
 */
function validateManagedAuthProviderConfig(config) {
  const issues = [];

  if (!config || typeof config !== "object") {
    return ["managed auth provider config is required."];
  }

  validateRequiredNonBlankString(config.clientId, "clientId", issues);
  validateAbsoluteUrl(config.authorizationEndpoint, "authorizationEndpoint", issues);
  validateAbsoluteUrl(config.logoutEndpoint, "logoutEndpoint", issues);
  validateAbsoluteUrl(config.callbackUrl, "callbackUrl", issues);
  validateAbsoluteUrl(config.logoutReturnUrl, "logoutReturnUrl", issues);

  if (!Array.isArray(config.scope) || config.scope.length === 0) {
    issues.push("scope must include managed auth provider scopes.");
  }

  return issues;
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthIdentityMappingInput} input
 * @returns {string[]}
 */
function validateManagedAuthIdentityMapping(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["identity mapping input is required."];
  }

  if (!input.identity || typeof input.identity !== "object") {
    return ["identity is required."];
  }

  const subject = normalizeRequiredString(input.identity.subject);
  const email = normalizeEmail(input.identity.email);

  if (!subject) {
    issues.push("identity.subject is required.");
  }

  if (!email) {
    issues.push("identity.email is required.");
  }

  if (
    input.identity.emailVerified !== undefined &&
    typeof input.identity.emailVerified !== "boolean"
  ) {
    issues.push("identity.emailVerified must be a boolean when provided.");
  }

  validateOptionalNonBlankString(input.userId, "userId", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (input.existingUser != null) {
    validateExistingUser(input.existingUser, subject, issues);
  }

  return issues;
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthSessionInput} input
 * @returns {string[]}
 */
function validateManagedAuthSessionInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["session input is required."];
  }

  if (!input.user || typeof input.user !== "object") {
    return ["user is required."];
  }

  validateRequiredNonBlankString(input.user?.id, "user.id", issues);
  validateRequiredNonBlankString(
    input.user?.managedAuthSubject,
    "user.managedAuthSubject",
    issues,
  );
  validateRequiredNonBlankString(input.user?.email, "user.email", issues);
  validateRequiredNonBlankString(input.user?.displayName, "user.displayName", issues);
  validateOptionalNonBlankString(input.sessionId, "sessionId", issues);
  validateOptionalNonBlankString(input.providerSessionId, "providerSessionId", issues);
  validateOptionalTimestamp(input.issuedAt, "issuedAt", issues);
  validateOptionalTimestamp(input.expiresAt, "expiresAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  if (input.user?.status !== "ACTIVE") {
    issues.push("user.status must be ACTIVE to create a managed auth session.");
  }

  if (input.roleAssignments !== undefined && !Array.isArray(input.roleAssignments)) {
    issues.push("roleAssignments must be an array when provided.");
  }

  const issuedAt = input.issuedAt ?? input.now;
  const expiresAt = input.expiresAt;
  const issuedAtTime = issuedAt === undefined ? NaN : Date.parse(String(issuedAt));
  const expiresAtTime = expiresAt === undefined ? NaN : Date.parse(String(expiresAt));

  if (
    Number.isFinite(issuedAtTime) &&
    Number.isFinite(expiresAtTime) &&
    expiresAtTime <= issuedAtTime
  ) {
    issues.push("expiresAt must be after issuedAt.");
  }

  return issues;
}

/**
 * @param {import("./managed-auth-provider.d.ts").ManagedAuthMappedUser} existingUser
 * @param {string} subject
 * @param {string[]} issues
 * @returns {void}
 */
function validateExistingUser(existingUser, subject, issues) {
  validateOptionalNonBlankString(existingUser.id, "existingUser.id", issues);
  validateRequiredNonBlankString(
    existingUser.managedAuthSubject,
    "existingUser.managedAuthSubject",
    issues,
  );
  validateRequiredNonBlankString(existingUser.email, "existingUser.email", issues);
  validateRequiredNonBlankString(existingUser.displayName, "existingUser.displayName", issues);

  if (
    subject &&
    existingUser.managedAuthSubject &&
    existingUser.managedAuthSubject !== subject
  ) {
    issues.push("existingUser.managedAuthSubject must match identity.subject.");
  }

  if (existingUser.status !== "ACTIVE" && existingUser.status !== "DISABLED") {
    issues.push("existingUser.status must be ACTIVE or DISABLED.");
  }
}

/**
 * @param {string} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredProviderValue(value, key, issues) {
  if (!value) {
    issues.push(`${key} is required.`);
    return;
  }

  if (looksLikePlaceholder(value)) {
    issues.push(`${key} must be replaced with managed auth provider configuration before auth routes are enabled.`);
  }
}

/**
 * @param {string} value
 * @param {string} key
 * @param {string} environmentName
 * @param {string[]} issues
 * @returns {void}
 */
function validateAbsoluteBaseUrl(value, key, environmentName, issues) {
  if (!value) {
    issues.push(`${key} is required.`);
    return;
  }

  validateAbsoluteUrl(value, key, issues);

  if (environmentName !== "local") {
    try {
      const url = new URL(value);

      if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
        issues.push(`${key} cannot point to localhost outside local development.`);
      }
    } catch {
      // validateAbsoluteUrl reports parsing issues.
    }
  }
}

/**
 * @param {string} value
 * @param {string} environmentName
 * @param {string[]} issues
 * @returns {void}
 */
function validateProviderDomain(value, environmentName, issues) {
  if (!value || looksLikePlaceholder(value)) {
    return;
  }

  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);

    if (url.protocol !== "https:" && environmentName !== "local") {
      issues.push("AUTH_PROVIDER_DOMAIN must use https outside local development.");
    }

    if (!url.hostname || url.username || url.password || url.search || url.hash) {
      issues.push("AUTH_PROVIDER_DOMAIN must be a provider host or issuer URL without credentials, query or hash.");
    }

    if (
      environmentName !== "local" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    ) {
      issues.push("AUTH_PROVIDER_DOMAIN cannot point to localhost outside local development.");
    }
  } catch {
    issues.push("AUTH_PROVIDER_DOMAIN must be a valid provider host or issuer URL.");
  }
}

/**
 * @param {unknown} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {void}
 */
function validateRequiredNonBlankString(value, key, issues) {
  if (!normalizeRequiredString(value)) {
    issues.push(`${key} is required.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, key, issues) {
  if (value !== undefined && value !== null && normalizeOptionalString(value) === null) {
    issues.push(`${key} cannot be blank when provided.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalTimestamp(value, key, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (Number.isNaN(Date.parse(String(value)))) {
    issues.push(`${key} must be a valid timestamp.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {void}
 */
function validateAbsoluteUrl(value, key, issues) {
  const normalized = normalizeRequiredString(value);

  if (!normalized) {
    issues.push(`${key} is required.`);
    return;
  }

  try {
    const url = new URL(normalized);

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      issues.push(`${key} must use http or https.`);
    }
  } catch {
    issues.push(`${key} must be a valid absolute URL.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} key
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalRoutePath(value, key, issues) {
  if (value === undefined || value === null) {
    return;
  }

  const path = normalizeOptionalString(value);

  if (!path) {
    issues.push(`${key} cannot be blank when provided.`);
  } else if (!path.startsWith("/") || path.startsWith("//")) {
    issues.push(`${key} must be an application path that starts with /.`);
  }
}

/**
 * @param {unknown} value
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalCookieName(value, issues) {
  if (value === undefined || value === null) {
    return;
  }

  const name = normalizeOptionalString(value);

  if (!name) {
    issues.push("sessionCookieName cannot be blank when provided.");
  } else if (!/^[A-Za-z0-9!#$%&'*+.^_`|~-]+$/.test(name)) {
    issues.push("sessionCookieName must be a valid cookie name.");
  }
}

/**
 * @param {unknown} identity
 * @returns {string}
 */
function resolveDisplayName(identity) {
  if (!identity || typeof identity !== "object") {
    return "";
  }

  const record = /** @type {Record<string, unknown>} */ (identity);
  const directName = normalizeOptionalString(record.name);
  const nickname = normalizeOptionalString(record.nickname);
  const givenName = normalizeOptionalString(record.givenName);
  const familyName = normalizeOptionalString(record.familyName);
  const email = normalizeEmail(record.email);

  if (directName) {
    return directName;
  }

  if (givenName || familyName) {
    return [givenName, familyName].filter(Boolean).join(" ");
  }

  if (nickname) {
    return nickname;
  }

  return email ? email.split("@")[0] : "CoriTech User";
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
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = normalizeRequiredString(value);

  return normalized || null;
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeEmail(value) {
  const normalized = normalizeRequiredString(value).toLowerCase();

  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return null;
  }

  return normalized;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function looksLikePlaceholder(value) {
  return PLACEHOLDER_VALUE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeIssuerBaseUrl(value) {
  const url = new URL(value.includes("://") ? value : `https://${value}`);

  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/\/+$/, "");

  return url.href.replace(/\/$/, "");
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeBaseUrl(value) {
  const url = new URL(value);

  url.search = "";
  url.hash = "";

  return url.href.replace(/\/$/, "");
}

/**
 * @param {string} baseUrl
 * @param {string} path
 * @returns {string}
 */
function buildUrl(baseUrl, path) {
  return new URL(path, `${baseUrl}/`).href;
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}

/**
 * @param {Date} value
 * @param {number} seconds
 * @returns {Date}
 */
function addSeconds(value, seconds) {
  return new Date(value.getTime() + seconds * 1000);
}

/**
 * @template T
 * @param {T} value
 * @returns {Readonly<T>}
 */
function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      if (child && typeof child === "object") {
        deepFreeze(child);
      }
    }

    Object.freeze(value);
  }

  return /** @type {Readonly<T>} */ (value);
}
