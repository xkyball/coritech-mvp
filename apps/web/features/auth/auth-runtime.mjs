// @ts-check

import { loadEnvironment } from "@coritech/config/environment";
import {
  buildManagedAuthLoginUrl,
  buildManagedAuthLogoutUrl,
  createManagedAuthProviderConfig,
  ManagedAuthConfigError,
  prepareManagedAuthPasswordResetRequest,
} from "@coritech/domain/auth/managed-auth-provider.mjs";

import { AUTH_ROUTES } from "./auth-routes.mjs";

/**
 * @param {Record<string, string | undefined> | NodeJS.ProcessEnv} [source]
 * @returns {{ enabled: true; config: import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig; issues: string[] } | { enabled: false; config: null; issues: string[] }}
 */
export function getManagedAuthRuntime(source = process.env) {
  try {
    const environment = loadEnvironment(source);
    const config = createManagedAuthProviderConfig(environment, {
      callbackPath: AUTH_ROUTES.callback,
      logoutReturnPath: AUTH_ROUTES.loggedOut,
      postLoginPath: AUTH_ROUTES.appHome,
    });

    return {
      enabled: true,
      config,
      issues: [],
    };
  } catch (error) {
    return {
      enabled: false,
      config: null,
      issues: sanitizeConfigurationIssues(error),
    };
  }
}

/**
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {Omit<import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthRedirectInput, "flow">} input
 * @returns {string}
 */
export function buildRuntimeLoginUrl(config, input) {
  return buildManagedAuthLoginUrl(config, input);
}

/**
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthLogoutInput} input
 * @returns {string}
 */
export function buildRuntimeLogoutUrl(config, input) {
  return buildManagedAuthLogoutUrl(config, input);
}

/**
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderConfig} config
 * @param {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthPasswordResetInput} input
 * @returns {import("@coritech/domain/auth/managed-auth-provider.d.ts").ManagedAuthProviderActionRequest}
 */
export function prepareRuntimePasswordResetRequest(config, input) {
  return prepareManagedAuthPasswordResetRequest(config, input);
}

/**
 * @param {unknown} error
 * @returns {string[]}
 */
function sanitizeConfigurationIssues(error) {
  if (
    error instanceof ManagedAuthConfigError ||
    (error && typeof error === "object" && Array.isArray(error.issues))
  ) {
    return /** @type {{ issues: string[] }} */ (error).issues.map(sanitizeIssue);
  }

  if (error && typeof error === "object" && "issues" in error && Array.isArray(error.issues)) {
    return error.issues.map(sanitizeIssue);
  }

  return ["Managed auth environment configuration is not available."];
}

/**
 * @param {unknown} issue
 * @returns {string}
 */
function sanitizeIssue(issue) {
  const normalized = typeof issue === "string" && issue.trim()
    ? issue.trim()
    : "Managed auth configuration issue.";

  return normalized.replace(/AUTH_PROVIDER_CLIENT_SECRET[^.]*\./g, "AUTH_PROVIDER_CLIENT_SECRET is required.");
}
