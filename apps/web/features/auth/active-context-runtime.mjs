// @ts-check

import {
  getDashboardRouteForRole,
  resolveActiveRoleContext,
} from "./role-routing.mjs";

export const ACTIVE_CONTEXT_COOKIE_NAME = "coritech_active_context";

/**
 * @param {import("./role-routing.d.ts").ResolvedActiveContext | import("./role-routing.d.ts").ActiveContextSelection} context
 * @returns {string}
 */
export function buildActiveContextSelectionKey(context) {
  return `${context.organizationId}:${context.roleCode}`;
}

/**
 * @param {unknown} value
 * @returns {import("./role-routing.d.ts").ActiveContextSelection | null}
 */
export function parseActiveContextSelectionKey(value) {
  if (typeof value !== "string") {
    return null;
  }

  const [organizationId, roleCode, extra] = value.split(":");

  if (extra !== undefined || !organizationId || !isSupportedRoleCode(roleCode)) {
    return null;
  }

  return {
    organizationId,
    roleCode,
  };
}

/**
 * @param {import("./role-routing.d.ts").ActiveContextSelection | null | undefined} context
 * @returns {string}
 */
export function serializeActiveContextCookie(context) {
  if (!context) {
    return "";
  }

  return buildActiveContextSelectionKey(context);
}

/**
 * @param {unknown} value
 * @returns {import("./role-routing.d.ts").ActiveContextSelection | null}
 */
export function parseActiveContextCookie(value) {
  return parseActiveContextSelectionKey(value);
}

/**
 * @param {{
 *   session?: import("./role-routing.d.ts").ManagedAuthSessionLike | null;
 *   cookieValue?: unknown;
 * }} input
 * @returns {import("./role-routing.d.ts").ActiveRoleContextResolution}
 */
export function resolveActiveContextFromSession(input) {
  return resolveActiveRoleContext({
    session: input.session ?? null,
    activeContext: parseActiveContextCookie(input.cookieValue),
  });
}

/**
 * @param {{
 *   session?: import("./role-routing.d.ts").ManagedAuthSessionLike | null;
 *   selectedContextKey?: unknown;
 * }} input
 * @returns {import("./active-context-runtime.d.ts").ActiveContextSwitchRuntimeResult}
 */
export function resolveActiveContextSwitch(input) {
  const selectedContext = parseActiveContextSelectionKey(input.selectedContextKey);

  if (!input.session) {
    return {
      ok: false,
      reason: "AUTH_REQUIRED",
      cookieValue: "",
      redirectTo: "/login?returnTo=%2Fapp",
    };
  }

  if (!selectedContext) {
    return {
      ok: false,
      reason: "INVALID_CONTEXT",
      cookieValue: "",
      redirectTo: "/app/select-role?status=invalid-context",
    };
  }

  const resolution = resolveActiveRoleContext({
    session: input.session,
    activeContext: selectedContext,
  });

  if (resolution.status !== "resolved") {
    return {
      ok: false,
      reason: "UNAUTHORIZED_CONTEXT",
      cookieValue: "",
      redirectTo: "/app/select-role?status=unauthorized-context",
    };
  }

  return {
    ok: true,
    reason: "CONTEXT_SWITCHED",
    activeContext: resolution.activeContext,
    availableContexts: resolution.availableContexts,
    cookieValue: serializeActiveContextCookie(resolution.activeContext),
    redirectTo: getDashboardRouteForRole(resolution.activeContext.roleCode),
  };
}

/**
 * @param {readonly import("./role-routing.d.ts").ResolvedActiveContext[]} availableContexts
 * @returns {import("../../components/ui").DashboardContextOption[]}
 */
export function createDashboardContextOptions(availableContexts) {
  return availableContexts.map((context) => ({
    key: buildActiveContextSelectionKey(context),
    label: `${context.userLabel} / ${context.organizationName} / ${context.roleLabel}`,
    organizationName: context.organizationName,
    roleLabel: context.roleLabel,
  }));
}

/**
 * @param {unknown} value
 * @returns {value is import("./role-routing.d.ts").SupportedRoleCode}
 */
function isSupportedRoleCode(value) {
  return value === "BREEDER" ||
    value === "BREEDING_STATION" ||
    value === "PLATFORM_ADMIN";
}
