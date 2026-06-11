import { prisma as defaultPrisma } from "@coritech/database";

import {
  createAuditLogFromAccessDecision,
} from "@coritech/domain/audit/audit-log.mjs";
import type {
  AuditLog,
  AuditLogListFilters,
  AuditLogRepository,
  AuditRequestContext,
} from "@coritech/domain/audit/audit-log.d.ts";
import type {
  RbacAccessDecision,
} from "@coritech/domain/auth/rbac-middleware.d.ts";

type PrismaAuditLogClient = {
  auditLog: {
    create(input: unknown): Promise<PrismaAuditLogRow>;
    findMany(input?: unknown): Promise<PrismaAuditLogRow[]>;
  };
};

type PrismaAuditLogRow = {
  id: string;
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  action: string;
  sourceAction: string | null;
  objectType: string;
  objectId: string;
  objectRef: unknown;
  previousValues: unknown;
  newValues: unknown;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: unknown;
  occurredAt: Date;
  createdAt: Date;
};

export interface PrismaAuditLogRepository extends AuditLogRepository {
  recordRbacAccessDecision(
    decision: RbacAccessDecision,
    requestContext?: AuditRequestContext | null,
  ): Promise<RbacAccessDecision | null>;
}

export function createPrismaAuditLogRepository(
  client: PrismaAuditLogClient = defaultPrisma as unknown as PrismaAuditLogClient,
): PrismaAuditLogRepository {
  const repository: PrismaAuditLogRepository = {
    async createAuditLog(auditLog) {
      const persisted = await client.auditLog.create({
        data: toAuditLogCreateData(auditLog),
      });

      return toAuditLog(persisted);
    },
    async listAuditLogsForObject(objectType, objectId) {
      const auditLogs = await client.auditLog.findMany({
        where: {
          objectType,
          objectId,
        },
        orderBy: [
          { occurredAt: "desc" },
          { id: "asc" },
        ],
      });

      return auditLogs.map(toAuditLog);
    },
    async listAuditLogs(filters = {}) {
      const auditLogs = await client.auditLog.findMany({
        where: toAuditLogWhere(filters),
        orderBy: [
          { occurredAt: "desc" },
          { id: "asc" },
        ],
        take: filters.limit ?? 50,
        skip: ((filters.page ?? 1) - 1) * (filters.limit ?? 50),
      });

      return auditLogs.map(toAuditLog);
    },
    async recordRbacAccessDecision(decision, requestContext = null) {
      if (!canPersistAccessDecision(decision)) {
        return null;
      }

      await createAuditLogFromAccessDecision({
        repository,
        decision,
        requestContext,
      });

      return decision;
    },
  };

  return repository;
}

function toAuditLogWhere(filters: AuditLogListFilters) {
  return {
    ...(filters.objectType ? { objectType: filters.objectType } : {}),
    ...(filters.objectId ? { objectId: filters.objectId } : {}),
    ...(filters.actorUserId ? { actorUserId: filters.actorUserId } : {}),
    ...(filters.actorOrganizationId
      ? { actorOrganizationId: filters.actorOrganizationId }
      : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...toOccurredAtWhere(filters),
  };
}

function toOccurredAtWhere(filters: AuditLogListFilters) {
  if (!filters.fromOccurredAt && !filters.toOccurredAt) {
    return {};
  }

  return {
    occurredAt: {
      ...(filters.fromOccurredAt
        ? { gte: new Date(filters.fromOccurredAt) }
        : {}),
      ...(filters.toOccurredAt ? { lte: new Date(filters.toOccurredAt) } : {}),
    },
  };
}

function canPersistAccessDecision(decision: RbacAccessDecision) {
  return Boolean(
    decision.actorUserId &&
      decision.actorRoleCode &&
      decision.actorOrganizationId &&
      decision.targetType &&
      decision.targetId,
  );
}

function toAuditLog(row: PrismaAuditLogRow): AuditLog {
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    actorRoleCode: row.actorRoleCode as AuditLog["actorRoleCode"],
    actorOrganizationId: row.actorOrganizationId,
    action: row.action as AuditLog["action"],
    sourceAction: row.sourceAction,
    objectType: row.objectType,
    objectId: row.objectId,
    objectRef: toJsonObject(row.objectRef),
    previousValues: row.previousValues == null ? null : toJsonObject(row.previousValues),
    newValues: row.newValues == null ? null : toJsonObject(row.newValues),
    reason: row.reason,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    metadata: toJsonObject(row.metadata),
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
  };
}

function toAuditLogCreateData(auditLog: AuditLog) {
  return {
    id: auditLog.id ?? undefined,
    actorUserId: auditLog.actorUserId,
    actorRoleCode: auditLog.actorRoleCode,
    actorOrganizationId: auditLog.actorOrganizationId,
    action: auditLog.action,
    sourceAction: auditLog.sourceAction,
    objectType: auditLog.objectType,
    objectId: auditLog.objectId,
    objectRef: auditLog.objectRef,
    previousValues: toNullableJsonObjectInput(auditLog.previousValues),
    newValues: toNullableJsonObjectInput(auditLog.newValues),
    reason: auditLog.reason,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    metadata: auditLog.metadata,
    occurredAt: new Date(auditLog.occurredAt),
    createdAt: new Date(auditLog.createdAt),
  };
}

function toJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toNullableJsonObjectInput(value: Record<string, unknown> | null) {
  return value ?? undefined;
}
