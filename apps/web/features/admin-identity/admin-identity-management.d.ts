import type { AuditLog, AuditRequestContext } from "@coritech/domain/audit/audit-log.d.ts";
import type {
  RoleCode,
  Phase1RoleCode,
  UserOrganizationRole,
  UserOrganizationRoleLike,
} from "@coritech/domain/identity/role-model.d.ts";

export type UserStatus = "ACTIVE" | "DISABLED";
export type OrganizationStatus = "ACTIVE" | "DISABLED";
export type OrganizationType = "BREEDER" | "BREEDING_STATION" | "PLATFORM";

export interface AdminIdentityActorContext {
  userId: string;
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface AdminIdentityUser {
  id: string;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminIdentityOrganization {
  id: string;
  name: string;
  organizationType: OrganizationType;
  status: OrganizationStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminIdentityRole {
  code: string;
  displayName: string;
  description: string;
  phase: string;
  isAssignableInPhase1: boolean;
}

export interface AdminIdentityRoleAssignment extends UserOrganizationRoleLike {
  id: string | null;
  roleCode: RoleCode;
  assignedByUserId: string;
  assignmentReason: string | null;
  effectiveAt: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIdentityViewModelInput {
  actor: AdminIdentityActorContext;
  users?: readonly AdminIdentityUser[];
  organizations?: readonly AdminIdentityOrganization[];
  roles?: readonly AdminIdentityRole[];
  assignments?: readonly AdminIdentityRoleAssignment[];
}

export interface AdminIdentityUserRow extends AdminIdentityUser {
  activeRoles: readonly {
    id: string | null;
    organizationId: string;
    organizationName: string;
    roleCode: string;
    roleLabel: string;
  }[];
  canDisable: boolean;
}

export interface AdminIdentityOrganizationRow extends AdminIdentityOrganization {
  activeRoleCount: number;
  canDisable: boolean;
}

export interface AdminIdentityRoleRow extends AdminIdentityRole {
  displayLabel: string;
  assignmentCount: number;
}

export interface AdminIdentityViewModel {
  state: "READY";
  routes: typeof ADMIN_IDENTITY_ROUTES;
  canEdit: boolean;
  users: readonly AdminIdentityUserRow[];
  organizations: readonly AdminIdentityOrganizationRow[];
  roles: readonly AdminIdentityRoleRow[];
  assignableRoles: readonly Phase1RoleCode[];
  organizationTypes: readonly OrganizationType[];
  organizationStatuses: readonly OrganizationStatus[];
  userStatuses: readonly UserStatus[];
  mutationPolicy: {
    deleteSupported: false;
    reason: string;
  };
  invitationBoundary: {
    implementedHere: boolean;
    route: "/app/admin/invitations";
    reason: string;
  };
}

export interface AdminIdentityRepository {
  listUsers(): Promise<AdminIdentityUser[]>;
  listOrganizations(): Promise<AdminIdentityOrganization[]>;
  listRoles(): Promise<AdminIdentityRole[]>;
  listUserOrganizationRoles(): Promise<AdminIdentityRoleAssignment[]>;
  getUserById(userId: string): Promise<AdminIdentityUser | null>;
  getOrganizationById(organizationId: string): Promise<AdminIdentityOrganization | null>;
  createOrganization(input: {
    name: string;
    organizationType: OrganizationType;
    status: OrganizationStatus;
  }): Promise<AdminIdentityOrganization>;
  updateOrganization(input: AdminIdentityOrganization): Promise<AdminIdentityOrganization>;
  updateUser(input: AdminIdentityUser): Promise<AdminIdentityUser>;
  createUserOrganizationRole(input: UserOrganizationRole): Promise<UserOrganizationRole>;
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
}

interface BaseAdminIdentityActionInput {
  actor: AdminIdentityActorContext;
  repository: AdminIdentityRepository;
  requestContext?: AuditRequestContext | null;
  now?: string | Date;
}

export interface CreateOrganizationForAdminInput extends BaseAdminIdentityActionInput {
  name?: string | null;
  organizationType?: string | null;
  reason?: string | null;
}

export interface UpdateOrganizationForAdminInput extends BaseAdminIdentityActionInput {
  organizationId?: string | null;
  name?: string | null;
  organizationType?: string | null;
  reason?: string | null;
}

export interface DisableOrganizationForAdminInput extends BaseAdminIdentityActionInput {
  organizationId?: string | null;
  reason?: string | null;
}

export interface DisableUserForAdminInput extends BaseAdminIdentityActionInput {
  userId?: string | null;
  reason?: string | null;
}

export interface AssignRoleForAdminInput extends BaseAdminIdentityActionInput {
  userId?: string | null;
  organizationId?: string | null;
  roleCode?: string | null;
  reason?: string | null;
}

export declare const ADMIN_IDENTITY_ROUTES: Readonly<{
  users: "/app/admin/users";
  organizations: "/app/admin/organizations";
  roles: "/app/admin/roles";
  invitations: "/app/admin/invitations";
  audit: "/app/admin/audit";
}>;
export declare function canManageAdminIdentity(
  actor: AdminIdentityActorContext,
): boolean;
export declare function createAdminIdentityViewModel(
  input: AdminIdentityViewModelInput,
): AdminIdentityViewModel;
export declare function createOrganizationForAdmin(
  input: CreateOrganizationForAdminInput,
): Promise<{ organization: AdminIdentityOrganization; auditLog: AuditLog }>;
export declare function updateOrganizationForAdmin(
  input: UpdateOrganizationForAdminInput,
): Promise<{ organization: AdminIdentityOrganization; auditLog: AuditLog }>;
export declare function disableOrganizationForAdmin(
  input: DisableOrganizationForAdminInput,
): Promise<{ organization: AdminIdentityOrganization; auditLog: AuditLog }>;
export declare function disableUserForAdmin(
  input: DisableUserForAdminInput,
): Promise<{ user: AdminIdentityUser; auditLog: AuditLog }>;
export declare function assignRoleForAdmin(
  input: AssignRoleForAdminInput,
): Promise<{
  assignment: UserOrganizationRole;
  auditHook: Record<string, unknown>;
  auditLog: AuditLog;
}>;
export declare function formatLabel(value: unknown): string;
