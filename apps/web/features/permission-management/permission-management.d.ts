import type {
  AccessPermission,
  ActiveAccessPermissionScope,
  PersistedAccessPermissionChange,
} from "@coritech/domain/access/access-permission.d.ts";
import type { AuditLog, AuditRequestContext } from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";

export type PermissionSubjectType = "user" | "organization";
export type PermissionStatus = "active" | "expired" | "revoked";
export type PermissionObjectType = "SemenOrder" | "Shipment" | "Document" | "ProofEvent";

export interface PermissionManagementActorContext {
  userId: string;
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface PermissionUserOption {
  id: string;
  displayName: string;
  email: string;
}

export interface PermissionOrganizationOption {
  id: string;
  name: string;
  organizationType: string;
}

export interface PermissionManagementFilters {
  objectType: PermissionObjectType | "";
  objectId: string;
  userId: string;
  organizationId: string;
  scope: ActiveAccessPermissionScope | "";
  status: PermissionStatus | "";
  page: number;
  pageSize: number;
}

export interface PermissionManagementRow {
  id: string | null;
  subjectLabel: string;
  subjectType: "User" | "Organization";
  objectLabel: string;
  objectType: string;
  objectId: string;
  scope: ActiveAccessPermissionScope | string;
  scopeLabel: string;
  status: PermissionStatus;
  statusLabel: string;
  effectiveAt: string;
  expiresAt: string;
  grantReason: string;
  revocationReason: string;
  auditHref: string;
  canRevoke: boolean;
}

export interface PermissionManagementViewModelInput {
  actor: PermissionManagementActorContext;
  permissions: readonly AccessPermission[];
  users?: readonly PermissionUserOption[];
  organizations?: readonly PermissionOrganizationOption[];
  filters?: Record<string, unknown> | PermissionManagementFilters | null;
  now?: string | Date;
}

export interface PermissionManagementViewModel {
  state: "READY";
  routes: typeof PERMISSION_MANAGEMENT_ROUTES;
  canEdit: boolean;
  filters: PermissionManagementFilters;
  scopeOptions: readonly ActiveAccessPermissionScope[];
  objectTypeOptions: readonly PermissionObjectType[];
  subjectTypeOptions: readonly PermissionSubjectType[];
  statusOptions: readonly (PermissionStatus | "")[];
  users: readonly PermissionUserOption[];
  organizations: readonly PermissionOrganizationOption[];
  rows: readonly PermissionManagementRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    previousHref: string;
    nextHref: string;
  };
}

export interface PermissionManagementRepository {
  createAccessPermission(permission: AccessPermission): Promise<AccessPermission>;
  revokeAccessPermission(permission: AccessPermission): Promise<AccessPermission>;
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
  getAccessPermissionById(permissionId: string): Promise<AccessPermission | null>;
  listAccessPermissions(filters?: Partial<PermissionManagementFilters>): Promise<AccessPermission[]>;
  listAccessPermissionsForObject(
    objectType: string,
    objectId: string,
    scope: ActiveAccessPermissionScope,
  ): Promise<AccessPermission[]>;
  listAccessPermissionsForUser(userId: string): Promise<AccessPermission[]>;
  listAccessPermissionsForOrganization(organizationId: string): Promise<AccessPermission[]>;
}

export interface GrantManagedAccessPermissionInput {
  actor: PermissionManagementActorContext;
  repository: PermissionManagementRepository;
  requestContext?: AuditRequestContext | null;
  subjectType?: string | null;
  userId?: string | null;
  organizationId?: string | null;
  objectType?: string | null;
  objectId?: string | null;
  scope?: string | null;
  expiresAt?: string | null;
  grantReason?: string | null;
  now?: string | Date;
}

export interface RevokeManagedAccessPermissionInput {
  actor: PermissionManagementActorContext;
  repository: PermissionManagementRepository;
  requestContext?: AuditRequestContext | null;
  permissionId?: string | null;
  revocationReason?: string | null;
  now?: string | Date;
}

export declare const PERMISSION_MANAGEMENT_ROUTES: Readonly<{
  index: "/app/admin/permissions";
  audit: "/app/admin/audit";
}>;
export declare const PERMISSION_OBJECT_TYPE_OPTIONS: readonly PermissionObjectType[];
export declare const PERMISSION_SUBJECT_TYPE_OPTIONS: readonly PermissionSubjectType[];
export declare const PERMISSION_STATUS_FILTER_OPTIONS: readonly (PermissionStatus | "")[];
export declare function canManageAccessPermissions(
  actor: PermissionManagementActorContext,
): boolean;
export declare function createPermissionManagementViewModel(
  input: PermissionManagementViewModelInput,
): PermissionManagementViewModel;
export declare function grantManagedAccessPermission(
  input: GrantManagedAccessPermissionInput,
): Promise<PersistedAccessPermissionChange>;
export declare function revokeManagedAccessPermission(
  input: RevokeManagedAccessPermissionInput,
): Promise<PersistedAccessPermissionChange>;
export declare function normalizePermissionFilters(
  input: Record<string, unknown>,
): PermissionManagementFilters;
export declare function buildPermissionManagementHref(
  filters: PermissionManagementFilters,
  override?: Partial<PermissionManagementFilters>,
): string;
export declare function formatPermissionLabel(value: unknown): string;
