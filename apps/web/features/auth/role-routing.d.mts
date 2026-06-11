export type SupportedRoleCode = "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";

export interface RoleRouteTarget {
  appRoute: string;
  dashboardRoute: string;
  label: string;
}

export interface ManagedAuthSessionMembershipLike {
  organizationId: string;
  organizationName?: string | null;
  roles: string[];
}

export interface ManagedAuthSessionUserLike {
  id: string;
  displayName?: string | null;
  email?: string | null;
}

export interface ManagedAuthSessionLike {
  user?: ManagedAuthSessionUserLike;
  memberships: ManagedAuthSessionMembershipLike[];
}

export interface ActiveContextSelection {
  organizationId: string;
  roleCode: SupportedRoleCode;
}

export interface ResolvedActiveContext extends ActiveContextSelection {
  userId: string;
  userLabel: string;
  organizationName: string;
  roleLabel: string;
}

export interface RoleRoutingInput {
  session?: ManagedAuthSessionLike | null;
  activeContext?: ActiveContextSelection | null;
}

export interface RoleRouteInput extends RoleRoutingInput {
  requiredRoleCode: SupportedRoleCode;
}

export type ActiveRoleContextResolution =
  | { status: "unauthenticated" }
  | { status: "no-role"; availableContexts: ResolvedActiveContext[] }
  | { status: "multi-role-selection-required"; availableContexts: ResolvedActiveContext[] }
  | {
      status: "resolved";
      activeContext: ResolvedActiveContext;
      availableContexts: ResolvedActiveContext[];
    };

export type RoleRoutingResult =
  | {
      status: "redirect";
      destination: string;
      reason: "AUTH_REQUIRED" | "ACTIVE_ROLE" | "ROLE_FORBIDDEN";
      activeContext?: ResolvedActiveContext;
    }
  | {
      status: "render";
      page: "NO_ROLE";
      reason: "NO_ACTIVE_ORGANIZATION_ROLE";
    }
  | {
      status: "render";
      page: "ROLE_SELECTION";
      reason: "MULTIPLE_ACTIVE_ROLES";
      availableContexts: ResolvedActiveContext[];
    };

export declare const ACTIVE_ROLE_ROUTE_TARGETS: Readonly<Record<SupportedRoleCode, RoleRouteTarget>>;
export declare const ACTIVE_ROLE_PRIORITY: readonly SupportedRoleCode[];

export declare function resolveAppLanding(input: RoleRoutingInput): RoleRoutingResult;
export declare function resolveRoleRoute(input: RoleRouteInput): RoleRoutingResult;
export declare function resolveActiveRoleContext(input: RoleRoutingInput): ActiveRoleContextResolution;
export declare function resolveRequiredRoleContext(input: RoleRouteInput): ActiveRoleContextResolution;
export declare function getRequiredRoleForPath(path: unknown): SupportedRoleCode | null;
export declare function getDashboardRouteForRole(roleCode: SupportedRoleCode): string;
export declare function getAppRouteForRole(roleCode: SupportedRoleCode): string;
