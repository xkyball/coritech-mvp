import type {
  AuditLog,
  AuditLogAction,
  AuditLogActorRoleCode,
  AuditLogListFilters,
} from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";

export interface AuditLogViewerActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface AuditLogViewerRow {
  id: string | null;
  occurredAt: string;
  action: AuditLogAction;
  actionLabel: string;
  sourceAction: string | null;
  actorUserId: string;
  actorRoleCode: AuditLogActorRoleCode;
  actorOrganizationId: string;
  objectType: string;
  objectId: string;
  objectLabel: string;
  outcome: string | null;
  outcomeLabel: string;
  objectRef: string;
  previousValues: string;
  newValues: string;
  metadata: string;
  reason: string | null;
  requestLabel: string;
}

export interface AuditLogViewerViewModel {
  canEdit: false;
  filters: AuditLogListFilters;
  rows: readonly AuditLogViewerRow[];
  pagination: {
    page: number;
    pageSize: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
    previousHref: string;
    nextHref: string;
  };
  summary: {
    totalCount: number;
    accessDecisionCount: number;
    deniedDecisionCount: number;
  };
}

export declare const AUDIT_LOG_ACTION_FILTER_OPTIONS: readonly (AuditLogAction | "")[];
export declare function canAccessAuditLogViewer(
  actor: AuditLogViewerActorContext,
): boolean;
export declare function createAuditLogViewerViewModel(input: {
  auditLogs: readonly AuditLog[];
  filters?: AuditLogListFilters;
}): AuditLogViewerViewModel;
export declare function normalizeAuditLogFilters(
  input: Record<string, unknown>,
): AuditLogListFilters;
export declare function buildAuditLogViewerHref(
  filters: AuditLogListFilters,
  override?: { page?: number },
): string;
export declare function formatAuditLabel(value: unknown): string;
