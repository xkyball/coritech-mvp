export type Phase1RoleCode =
  | "BREEDER"
  | "BREEDING_STATION"
  | "PLATFORM_ADMIN";

export type PreparedFutureRoleCode =
  | "VET"
  | "FEDERATION"
  | "SALES_VENUE"
  | "BUYER"
  | "TECH_SUPPORT";

export type RoleCode = Phase1RoleCode | PreparedFutureRoleCode;

export type RolePhase = "PHASE_1" | "FUTURE_PREPARED";

export type OrganizationType = "BREEDER" | "BREEDING_STATION" | "PLATFORM";

export type UserStatus = "ACTIVE" | "DISABLED";

export type OrganizationStatus = "ACTIVE" | "DISABLED";

export interface User {
  id: string;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  organizationType: OrganizationType;
  status: OrganizationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  code: RoleCode;
  phase: RolePhase;
  displayName: string;
  assignableInPhase1: boolean;
}

export interface UserOrganizationRoleLike {
  userId: string;
  organizationId: string;
  roleCode: RoleCode;
  revokedAt?: string | null;
}

export interface UserOrganizationRole extends UserOrganizationRoleLike {
  id: string | null;
  roleCode: Phase1RoleCode;
  assignedByUserId: string;
  assignmentReason: string | null;
  effectiveAt: string;
  revokedAt: null;
  revokedByUserId: null;
  revocationReason: null;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationRoleMembership {
  organizationId: string;
  roles: RoleCode[];
}

export interface RoleAssignmentInput {
  userId: string;
  organizationId: string;
  roleCode: RoleCode | string;
  assignedByUserId: string;
  assignerRoles: UserOrganizationRoleLike[];
  assignmentId?: string | null;
  assignmentReason?: string | null;
  assignedAt?: string | Date;
  effectiveAt?: string | Date;
  now?: string | Date;
}

export interface RoleAssignmentAuditHook {
  eventType: "ROLE_ASSIGNMENT";
  action: "ROLE_ASSIGNED";
  actorUserId: string;
  actorRoleCode: "PLATFORM_ADMIN";
  actorOrganizationId: string | null;
  targetType: "UserOrganizationRole";
  targetId: string | null;
  targetRef: {
    userId: string;
    organizationId: string;
    roleCode: Phase1RoleCode;
  };
  previousValue: null;
  newValue: {
    userId: string;
    organizationId: string;
    roleCode: Phase1RoleCode;
    effectiveAt: string;
  };
  reason: string | null;
  occurredAt: string;
}

export interface PreparedRoleAssignment {
  assignment: UserOrganizationRole;
  auditHook: RoleAssignmentAuditHook;
}

export declare const PHASE_1_ROLE_CODES: readonly Phase1RoleCode[];
export declare const PREPARED_FUTURE_ROLE_CODES: readonly PreparedFutureRoleCode[];
export declare const ROLE_CODES: readonly RoleCode[];
export declare const ORGANIZATION_TYPES: readonly OrganizationType[];
export declare const USER_STATUSES: readonly UserStatus[];
export declare const ORGANIZATION_STATUSES: readonly OrganizationStatus[];
export declare const ROLE_METADATA: Readonly<Record<RoleCode, Role>>;

export declare class RoleModelValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function isSupportedRoleCode(value: unknown): value is RoleCode;
export declare function isPhase1RoleCode(value: unknown): value is Phase1RoleCode;
export declare function isPreparedFutureRoleCode(
  value: unknown,
): value is PreparedFutureRoleCode;
export declare function isActiveRoleAssignment(
  assignment: UserOrganizationRoleLike,
): boolean;
export declare function hasActiveRole(
  assignments: UserOrganizationRoleLike[],
  roleCode: RoleCode,
  organizationId?: string,
): boolean;
export declare function groupActiveRolesByOrganization(
  assignments: UserOrganizationRoleLike[],
): OrganizationRoleMembership[];
export declare function validateRoleAssignmentInput(
  input: RoleAssignmentInput,
): string[];
export declare function assignUserOrganizationRole(
  input: RoleAssignmentInput,
): PreparedRoleAssignment;
export declare function buildRoleAssignmentAuditHook(options: {
  assignment: UserOrganizationRole;
  actorOrganizationId: string | null;
}): RoleAssignmentAuditHook;
