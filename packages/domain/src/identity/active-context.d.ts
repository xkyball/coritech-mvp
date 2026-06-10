import type {
  Organization,
  OrganizationType,
  Phase1RoleCode,
  UserOrganizationRoleLike,
} from "./role-model.d.ts";

export type ActiveContextResolutionStatus =
  | "RESOLVED"
  | "SELECTION_REQUIRED"
  | "NO_ACTIVE_CONTEXT";

export interface ActiveContextSelection {
  organizationId: string;
  roleCode: Phase1RoleCode;
}

export interface ActiveOrganizationRoleContext extends ActiveContextSelection {
  userId: string;
  organizationName: string;
  organizationType: OrganizationType | null;
  roleLabel: string;
  assignmentId: string | null;
}

export interface ResolveActiveContextInput {
  userId: string;
  roleAssignments: UserOrganizationRoleLike[];
  organizations?: Pick<Organization, "id" | "name" | "organizationType" | "status">[];
  selectedContext?: ActiveContextSelection | null;
}

export interface NormalizedResolveActiveContextInput {
  userId: string;
  roleAssignments: UserOrganizationRoleLike[];
  organizations: Pick<Organization, "id" | "name" | "organizationType" | "status">[];
  selectedContext: ActiveContextSelection | null;
}

export interface ActiveContextResolution {
  status: ActiveContextResolutionStatus;
  activeContext: ActiveOrganizationRoleContext | null;
  availableContexts: readonly ActiveOrganizationRoleContext[];
  reason: string;
}

export interface SwitchActiveContextInput extends ResolveActiveContextInput {
  selectedContext: ActiveContextSelection;
  now?: string | Date;
}

export interface ActiveContextSessionState {
  userId: string;
  activeOrganizationId: string;
  activeRoleCode: Phase1RoleCode;
  activeContextKey: string;
  persistedAt: string;
}

export interface ActiveContextSwitchResult {
  status: "SWITCHED";
  activeContext: ActiveOrganizationRoleContext;
  availableContexts: readonly ActiveOrganizationRoleContext[];
  sessionState: ActiveContextSessionState;
}

export interface ActiveContextActor {
  userId: string;
  roles: readonly [
    Readonly<{
      userId: string;
      organizationId: string;
      roleCode: Phase1RoleCode;
      revokedAt: null;
    }>,
  ];
}

export interface ActiveContextAttribution {
  actorUserId: string;
  actorRoleCode: Phase1RoleCode;
  actorOrganizationId: string;
  actorContext: Readonly<{
    type: "MANAGED_AUTH_ACTOR_CONTEXT";
    userId: string;
    roleCode: Phase1RoleCode;
    organizationId: string;
  }>;
}

export declare const ACTIVE_CONTEXT_RESOLUTION_STATUSES: readonly ActiveContextResolutionStatus[];

export declare class ActiveContextValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function resolveActiveOrganizationRoleContext(
  input: ResolveActiveContextInput,
): ActiveContextResolution;
export declare function switchActiveOrganizationRoleContext(
  input: SwitchActiveContextInput,
): ActiveContextSwitchResult;
export declare function buildActiveContextSessionState(
  context: ActiveOrganizationRoleContext,
  now?: string | Date,
): ActiveContextSessionState;
export declare function buildActiveContextKey(
  context: ActiveOrganizationRoleContext,
): string;
export declare function createActorFromActiveContext(
  context: ActiveOrganizationRoleContext,
): ActiveContextActor;
export declare function buildActiveContextAttribution(
  context: ActiveOrganizationRoleContext,
): ActiveContextAttribution;
export declare function activeContextMatches(
  context: ActiveOrganizationRoleContext | null | undefined,
  roleCode: Phase1RoleCode,
  organizationId?: string,
): boolean;
