// @ts-check

import { AUTH_ROUTES } from "./auth-routes.mjs";

export const ACTIVE_ROLE_ROUTE_TARGETS = Object.freeze({
  BREEDER: Object.freeze({
    appRoute: AUTH_ROUTES.breederApp,
    dashboardRoute: "/breeder-dashboard",
    label: "Breeder",
  }),
  BREEDING_STATION: Object.freeze({
    appRoute: AUTH_ROUTES.stationApp,
    dashboardRoute: "/station-dashboard",
    label: "Breeding Station",
  }),
  PLATFORM_ADMIN: Object.freeze({
    appRoute: AUTH_ROUTES.adminApp,
    dashboardRoute: AUTH_ROUTES.adminApp,
    label: "Platform Admin",
  }),
});

export const ACTIVE_ROLE_PRIORITY = Object.freeze([
  "BREEDER",
  "BREEDING_STATION",
  "PLATFORM_ADMIN",
]);
const ACTIVE_ROLE_ROUTE_PREFIXES = Object.freeze({
  BREEDER: Object.freeze([
    ACTIVE_ROLE_ROUTE_TARGETS.BREEDER.dashboardRoute,
    ACTIVE_ROLE_ROUTE_TARGETS.BREEDER.appRoute,
    "/app/catalog",
    "/app/orders",
  ]),
  BREEDING_STATION: Object.freeze([
    ACTIVE_ROLE_ROUTE_TARGETS.BREEDING_STATION.dashboardRoute,
    ACTIVE_ROLE_ROUTE_TARGETS.BREEDING_STATION.appRoute,
  ]),
  PLATFORM_ADMIN: Object.freeze([
    ACTIVE_ROLE_ROUTE_TARGETS.PLATFORM_ADMIN.dashboardRoute,
  ]),
});

/**
 * @param {import("./role-routing.d.ts").RoleRoutingInput} input
 * @returns {import("./role-routing.d.ts").RoleRoutingResult}
 */
export function resolveAppLanding(input) {
  const context = resolveActiveRoleContext(input);

  if (context.status === "unauthenticated") {
    return {
      status: "redirect",
      destination: `${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(AUTH_ROUTES.appHome)}`,
      reason: "AUTH_REQUIRED",
    };
  }

  if (context.status === "no-role") {
    return {
      status: "render",
      page: "NO_ROLE",
      reason: "NO_ACTIVE_ORGANIZATION_ROLE",
    };
  }

  if (context.status === "multi-role-selection-required") {
    return {
      status: "render",
      page: "ROLE_SELECTION",
      reason: "MULTIPLE_ACTIVE_ROLES",
      availableContexts: context.availableContexts,
    };
  }

  return {
    status: "redirect",
    destination: getDashboardRouteForRole(context.activeContext.roleCode),
    reason: "ACTIVE_ROLE",
    activeContext: context.activeContext,
  };
}

/**
 * @param {import("./role-routing.d.ts").RoleRouteInput} input
 * @returns {import("./role-routing.d.ts").RoleRoutingResult}
 */
export function resolveRoleRoute(input) {
  const context = resolveRequiredRoleContext(input);

  if (context.status === "unauthenticated") {
    return {
      status: "redirect",
      destination: `${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(
        getAppRouteForRole(input.requiredRoleCode),
      )}`,
      reason: "AUTH_REQUIRED",
    };
  }

  if (context.status === "no-role") {
    return {
      status: "render",
      page: "NO_ROLE",
      reason: "NO_ACTIVE_ORGANIZATION_ROLE",
    };
  }

  if (context.status === "multi-role-selection-required") {
    return {
      status: "render",
      page: "ROLE_SELECTION",
      reason: "MULTIPLE_ACTIVE_ROLES",
      availableContexts: context.availableContexts,
    };
  }

  if (context.activeContext.roleCode !== input.requiredRoleCode) {
    return {
      status: "redirect",
      destination: AUTH_ROUTES.unauthorized,
      reason: "ROLE_FORBIDDEN",
      activeContext: context.activeContext,
    };
  }

  return {
    status: "redirect",
    destination: getDashboardRouteForRole(input.requiredRoleCode),
    reason: "ACTIVE_ROLE",
    activeContext: context.activeContext,
  };
}

/**
 * @param {import("./role-routing.d.ts").RoleRoutingInput} input
 * @returns {import("./role-routing.d.ts").ActiveRoleContextResolution}
 */
export function resolveActiveRoleContext(input) {
  if (!input.session) {
    return {
      status: "unauthenticated",
    };
  }

  const availableContexts = extractSupportedContexts(input.session);

  if (availableContexts.length === 0) {
    return {
      status: "no-role",
      availableContexts,
    };
  }

  const activeContext = normalizeActiveContext(input.activeContext);

  if (activeContext) {
    const matchingContext = availableContexts.find((context) =>
      context.organizationId === activeContext.organizationId &&
      context.roleCode === activeContext.roleCode,
    );

    if (matchingContext) {
      return {
        status: "resolved",
        activeContext: matchingContext,
        availableContexts,
      };
    }

    if (availableContexts.length === 1) {
      return {
        status: "resolved",
        activeContext: availableContexts[0],
        availableContexts,
      };
    }

    return {
      status: "multi-role-selection-required",
      availableContexts,
    };
  }

  if (availableContexts.length === 1) {
    return {
      status: "resolved",
      activeContext: availableContexts[0],
      availableContexts,
    };
  }

  return {
    status: "multi-role-selection-required",
    availableContexts,
  };
}

/**
 * @param {import("./role-routing.d.ts").RoleRouteInput} input
 * @returns {import("./role-routing.d.ts").ActiveRoleContextResolution}
 */
export function resolveRequiredRoleContext(input) {
  const context = resolveActiveRoleContext(input);

  if (context.status !== "multi-role-selection-required") {
    return context;
  }

  if (normalizeActiveContext(input.activeContext)) {
    return context;
  }

  const matchingContexts = context.availableContexts.filter((availableContext) =>
    availableContext.roleCode === input.requiredRoleCode
  );

  if (matchingContexts.length !== 1) {
    return context;
  }

  return {
    status: "resolved",
    activeContext: matchingContexts[0],
    availableContexts: context.availableContexts,
  };
}

/**
 * @param {unknown} path
 * @returns {import("./role-routing.d.ts").SupportedRoleCode | null}
 */
export function getRequiredRoleForPath(path) {
  const pathname = normalizeRoutePathname(path);

  if (!pathname) {
    return null;
  }

  for (const roleCode of ACTIVE_ROLE_PRIORITY) {
    const prefixes = ACTIVE_ROLE_ROUTE_PREFIXES[roleCode] ?? [];

    if (prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
      return roleCode;
    }
  }

  return null;
}

/**
 * @param {import("./role-routing.d.ts").SupportedRoleCode} roleCode
 * @returns {string}
 */
export function getDashboardRouteForRole(roleCode) {
  return ACTIVE_ROLE_ROUTE_TARGETS[roleCode]?.dashboardRoute ?? AUTH_ROUTES.noRole;
}

/**
 * @param {import("./role-routing.d.ts").SupportedRoleCode} roleCode
 * @returns {string}
 */
export function getAppRouteForRole(roleCode) {
  return ACTIVE_ROLE_ROUTE_TARGETS[roleCode]?.appRoute ?? AUTH_ROUTES.appHome;
}

/**
 * @param {import("./role-routing.d.ts").ManagedAuthSessionLike} session
 * @returns {import("./role-routing.d.ts").ResolvedActiveContext[]}
 */
function extractSupportedContexts(session) {
  if (!session || !Array.isArray(session.memberships)) {
    return [];
  }

  const sessionUserId = normalizeString(session.user?.id);
  const userId = sessionUserId ?? "";
  const userLabel = normalizeString(session.user?.displayName) ??
    normalizeString(session.user?.email) ??
    sessionUserId ??
    "Current user";
  const contexts = [];

  for (const membership of session.memberships) {
    const organizationId = normalizeString(membership.organizationId);
    const organizationName = normalizeString(membership.organizationName);
    const roles = Array.isArray(membership.roles) ? membership.roles : [];

    if (!organizationId) {
      continue;
    }

    for (const roleCode of ACTIVE_ROLE_PRIORITY) {
      if (roles.includes(roleCode)) {
        contexts.push({
          userId,
          userLabel,
          organizationId,
          organizationName: organizationName ?? organizationId,
          roleCode,
          roleLabel: ACTIVE_ROLE_ROUTE_TARGETS[roleCode].label,
        });
      }
    }
  }

  return contexts;
}

/**
 * @param {unknown} context
 * @returns {import("./role-routing.d.ts").ActiveContextSelection | null}
 */
function normalizeActiveContext(context) {
  if (!context || typeof context !== "object") {
    return null;
  }

  const candidate = /** @type {{ organizationId?: unknown; roleCode?: unknown }} */ (context);
  const organizationId = normalizeString(candidate.organizationId);
  const roleCode = normalizeString(candidate.roleCode);

  if (!organizationId || !isSupportedRoleCode(roleCode)) {
    return null;
  }

  return {
    organizationId,
    roleCode,
  };
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeRoutePathname(value) {
  const normalized = normalizeString(value);

  if (!normalized || normalized.startsWith("//")) {
    return null;
  }

  try {
    return new URL(normalized, "https://coritech.local").pathname;
  } catch {
    return null;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./role-routing.d.ts").SupportedRoleCode}
 */
function isSupportedRoleCode(value) {
  return typeof value === "string" && Object.hasOwn(ACTIVE_ROLE_ROUTE_TARGETS, value);
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized === "" ? null : normalized;
}
