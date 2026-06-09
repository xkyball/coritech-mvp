import type { AuditLog, AuditRequestContext } from "../audit/audit-log.d.ts";
import type {
  RoleCode,
  UserOrganizationRoleLike,
} from "../identity/role-model.d.ts";

export type ActiveAccessPermissionScope =
  | "VIEW"
  | "CREATE"
  | "UPDATE"
  | "CONFIRM"
  | "UPLOAD_DOCUMENT"
  | "VIEW_DOCUMENT"
  | "ADMIN_SUPPORT";

export type PreparedFutureAccessPermissionScope = "BUYER_VIEW";

export type AccessPermissionScope =
  | ActiveAccessPermissionScope
  | PreparedFutureAccessPermissionScope;

export type AccessPermissionAuditAction =
  | "ACCESS_PERMISSION_GRANTED"
  | "ACCESS_PERMISSION_REVOKED";

export interface AccessPermissionActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface AccessPermission {
  id: string | null;
  userId: string | null;
  organizationId: string | null;
  roleCode: RoleCode | null;
  objectType: string;
  objectId: string;
  scope: AccessPermissionScope;
  grantedByUserId: string;
  grantorRoleCode: "PLATFORM_ADMIN";
  grantorOrganizationId: string;
  grantReason: string | null;
  effectiveAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccessPermissionInput {
  userId?: string | null;
  organizationId?: string | null;
  roleCode?: RoleCode | string | null;
  objectType: string;
  objectId: string;
  scope: AccessPermissionScope | string;
  grantedByUserId: string;
  grantorRoles: UserOrganizationRoleLike[];
  permissionId?: string | null;
  grantReason?: string | null;
  effectiveAt?: string | Date;
  expiresAt?: string | Date | null;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface RevokeAccessPermissionInput {
  existingPermission: AccessPermission;
  revokedByUserId: string;
  revokerRoles: UserOrganizationRoleLike[];
  revocationReason: string;
  revokedAt?: string | Date;
  now?: string | Date;
}

export interface AccessPermissionAuditHook {
  eventType: "ACCESS_PERMISSION_CHANGE";
  action: AccessPermissionAuditAction;
  actorUserId: string;
  actorRoleCode: "PLATFORM_ADMIN";
  actorOrganizationId: string;
  targetType: "AccessPermission";
  targetId: string | null;
  targetRef: {
    userId: string | null;
    organizationId: string | null;
    roleCode: RoleCode | null;
    objectType: string;
    objectId: string;
    scope: AccessPermissionScope;
    expiresAt: string | null;
  };
  previousValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  reason: string | null;
  occurredAt: string;
}

export interface PreparedAccessPermissionChange {
  permission: AccessPermission;
  auditHook: AccessPermissionAuditHook;
}

export interface AccessPermissionDecision {
  allowed: boolean;
  permission: AccessPermission | null;
  reason: string;
  occurredAt: string;
}

export interface AccessPermissionQuery {
  objectType: string;
  objectId: string;
  scope: AccessPermissionScope | string;
  now?: string | Date;
}

export interface CheckAccessPermissionInput extends AccessPermissionQuery {
  actor: AccessPermissionActorContext;
  repository: AccessPermissionReadRepository;
}

export interface CreateAccessPermissionServiceInput
  extends CreateAccessPermissionInput {
  repository: AccessPermissionWriteRepository & AccessPermissionAuditRepository;
  requestContext?: AuditRequestContext | null;
}

export interface RevokeAccessPermissionServiceInput
  extends RevokeAccessPermissionInput {
  repository: AccessPermissionWriteRepository & AccessPermissionAuditRepository;
  requestContext?: AuditRequestContext | null;
}

export interface PersistedAccessPermissionChange
  extends PreparedAccessPermissionChange {
  auditLog: AuditLog;
}

export interface AccessPermissionReadRepository {
  listAccessPermissionsForObject(
    objectType: string,
    objectId: string,
    scope: AccessPermissionScope,
  ): Promise<AccessPermission[]>;
}

export interface AccessPermissionWriteRepository {
  createAccessPermission(
    permission: AccessPermission,
  ): Promise<AccessPermission>;
  revokeAccessPermission(
    permission: AccessPermission,
  ): Promise<AccessPermission>;
}

export interface AccessPermissionAuditRepository {
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
}

export interface AccessPermissionRepository
  extends AccessPermissionReadRepository,
    AccessPermissionWriteRepository,
    AccessPermissionAuditRepository {}

export declare const ACTIVE_ACCESS_PERMISSION_SCOPES: readonly ActiveAccessPermissionScope[];
export declare const PREPARED_FUTURE_ACCESS_PERMISSION_SCOPES: readonly PreparedFutureAccessPermissionScope[];
export declare const ACCESS_PERMISSION_SCOPES: readonly AccessPermissionScope[];
export declare const ACCESS_PERMISSION_AUDIT_ACTIONS: readonly AccessPermissionAuditAction[];

export declare class AccessPermissionValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function isAccessPermissionScope(
  value: unknown,
): value is AccessPermissionScope;
export declare function isActiveAccessPermissionScope(
  value: unknown,
): value is ActiveAccessPermissionScope;
export declare function isPreparedFutureAccessPermissionScope(
  value: unknown,
): value is PreparedFutureAccessPermissionScope;
export declare function validateCreateAccessPermissionInput(
  input: CreateAccessPermissionInput,
): string[];
export declare function prepareCreateAccessPermission(
  input: CreateAccessPermissionInput,
): PreparedAccessPermissionChange;
export declare function validateRevokeAccessPermissionInput(
  input: RevokeAccessPermissionInput,
): string[];
export declare function prepareRevokeAccessPermission(
  input: RevokeAccessPermissionInput,
): PreparedAccessPermissionChange;
export declare function buildAccessPermissionAuditHook(options: {
  action: AccessPermissionAuditAction;
  permission: AccessPermission;
  previousPermission?: AccessPermission | null;
  actorOrganizationId?: string | null;
  reason?: string | null;
  occurredAt?: string | Date;
}): AccessPermissionAuditHook;
export declare function isAccessPermissionCurrentlyUsable(
  permission: AccessPermission,
  now?: string | Date,
): boolean;
export declare function canUseAccessPermission(
  actor: AccessPermissionActorContext,
  permission: AccessPermission,
  query: AccessPermissionQuery,
): boolean;
export declare function checkAccessPermission(
  input: CheckAccessPermissionInput,
): Promise<AccessPermissionDecision>;
export declare function createAccessPermission(
  input: CreateAccessPermissionServiceInput,
): Promise<PersistedAccessPermissionChange>;
export declare function revokeAccessPermission(
  input: RevokeAccessPermissionServiceInput,
): Promise<PersistedAccessPermissionChange>;
