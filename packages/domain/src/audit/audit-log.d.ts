import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";

export type AuditLogAction =
  | "CREATE"
  | "UPDATE"
  | "STATUS_CHANGE"
  | "UPLOAD_DOCUMENT"
  | "VIEW_DOCUMENT"
  | "ACCESS_DECISION"
  | "CREATE_PROOF_EVENT"
  | "CHANGE_PERMISSION"
  | "ADMIN_EDIT"
  | "CREATE_AMENDMENT"
  | "LOGIN"
  | "LOGOUT";

export type AuditLogActorRoleCode =
  | "BREEDER"
  | "BREEDING_STATION"
  | "PLATFORM_ADMIN";

export interface AuditLogActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface AuditRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditLog {
  id: string | null;
  actorUserId: string;
  actorRoleCode: AuditLogActorRoleCode;
  actorOrganizationId: string;
  action: AuditLogAction;
  sourceAction: string | null;
  objectType: string;
  objectId: string;
  objectRef: Readonly<Record<string, unknown>>;
  previousValues: Readonly<Record<string, unknown>> | null;
  newValues: Readonly<Record<string, unknown>> | null;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Readonly<Record<string, unknown>>;
  occurredAt: string;
  createdAt: string;
}

export interface AuditLogInput {
  auditLogId?: string | null;
  actorUserId: string;
  actorRoleCode: AuditLogActorRoleCode | string;
  actorOrganizationId: string;
  action: AuditLogAction | string;
  sourceAction?: string | null;
  objectType: string;
  objectId: string;
  objectRef?: Record<string, unknown> | null;
  previousValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
  occurredAt?: string | Date;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface AuditHookLike {
  eventType?: string;
  action: string;
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  targetType: string;
  targetId: string | null;
  targetRef?: Record<string, unknown>;
  previousValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  documentRef?: Record<string, unknown>;
  reason?: string | null;
  occurredAt: string | Date;
  [key: string]: unknown;
}

export interface AuditLogFromHookInput {
  auditHook: AuditHookLike;
  auditLogId?: string | null;
  requestContext?: AuditRequestContext | null;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateAuditLogFromHookInput extends AuditLogFromHookInput {
  repository: AuditLogWriteRepository;
}

export interface AuditLogFromAccessDecisionInput {
  decision: import("../auth/rbac-middleware.d.ts").RbacAccessDecision;
  auditLogId?: string | null;
  requestContext?: AuditRequestContext | null;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateAuditLogFromAccessDecisionInput
  extends AuditLogFromAccessDecisionInput {
  repository: AuditLogWriteRepository;
}

export interface AuditLogObjectQueryInput {
  objectType: string;
  objectId: string;
}

export interface AuditLogObjectContext extends AuditLogObjectQueryInput {
  actorUserId?: string | null;
  organizationId?: string | null;
  breederOrganizationId?: string | null;
  breedingStationOrganizationId?: string | null;
}

export interface ListAuditLogsForObjectInput extends AuditLogObjectQueryInput {
  actor: AuditLogActorContext;
  objectContext?: AuditLogObjectContext | null;
  repository: AuditLogReadRepository;
}

export interface AuditLogListFilters {
  objectType?: string;
  objectId?: string;
  actorUserId?: string;
  actorOrganizationId?: string;
  action?: AuditLogAction;
  fromOccurredAt?: string | Date;
  toOccurredAt?: string | Date;
  limit?: number;
  page?: number;
}

export interface ListAuditLogsForAdminInput {
  actor: AuditLogActorContext;
  filters?: AuditLogListFilters | null;
  repository: AuditLogAdminReadRepository;
}

export interface AuditLogWriteRepository {
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
}

export interface AuditLogReadRepository {
  listAuditLogsForObject(objectType: string, objectId: string): Promise<AuditLog[]>;
}

export interface AuditLogAdminReadRepository {
  listAuditLogs(filters?: AuditLogListFilters): Promise<AuditLog[]>;
}

export interface AuditLogRepository
  extends AuditLogWriteRepository,
    AuditLogReadRepository,
    AuditLogAdminReadRepository {}

export declare const AUDIT_LOG_ACTIONS: readonly AuditLogAction[];
export declare const AUDIT_LOG_ROUTES: readonly {
  method: string;
  path: string;
  handler: string;
  access: string;
}[];
export declare const AUDIT_LOG_MUTATION_POLICY: Readonly<{
  appendOnly: true;
  updateSupported: false;
  deleteSupported: false;
  reason: string;
}>;

export declare class AuditLogValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class AuditLogAuthorizationError extends Error {
  constructor(message: string);
}

export declare function isAuditLogAction(value: unknown): value is AuditLogAction;
export declare function isAuditLogActorRoleCode(
  value: unknown,
): value is AuditLogActorRoleCode;
export declare function validateAuditLogInput(input: AuditLogInput): string[];
export declare function prepareAuditLogEntry(input: AuditLogInput): AuditLog;
export declare function prepareAuditLogEntryFromHook(
  input: AuditLogFromHookInput,
): AuditLog;
export declare function createAuditLogFromHook(
  input: CreateAuditLogFromHookInput,
): Promise<AuditLog>;
export declare function prepareAuditLogEntryFromAccessDecision(
  input: AuditLogFromAccessDecisionInput,
): AuditLog;
export declare function createAuditLogFromAccessDecision(
  input: CreateAuditLogFromAccessDecisionInput,
): Promise<AuditLog>;
export declare function validateAuditLogObjectQuery(
  input: AuditLogObjectQueryInput,
): string[];
export declare function canViewAuditLogsForObject(
  actor: AuditLogActorContext,
  objectContext?: AuditLogObjectContext | null,
): boolean;
export declare function canQueryAuditLogsForAdmin(
  actor: AuditLogActorContext,
): boolean;
export declare function listAuditLogsForObject(
  input: ListAuditLogsForObjectInput,
): Promise<AuditLog[]>;
export declare function validateAuditLogListFilters(
  input?: AuditLogListFilters | null,
): string[];
export declare function listAuditLogsForAdmin(
  input: ListAuditLogsForAdminInput,
): Promise<AuditLog[]>;
export declare function canUpdateAuditLog(): false;
export declare function canDeleteAuditLog(): false;
