import { prisma as defaultPrisma } from "@coritech/database";

import type {
  Amendment,
  AmendmentRepository,
  AmendmentTargetSnapshot,
  AmendmentTargetType,
} from "@coritech/domain/amendments/amendment.d.ts";
import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";

import { createPrismaAuditLogRepository } from "../audit-logs/prisma-audit-log-repository";

type PrismaAmendmentClient = {
  amendment: {
    create(input: unknown): Promise<PrismaAmendmentRow>;
    findMany(input?: unknown): Promise<PrismaAmendmentRow[]>;
  };
  semenOrder: {
    findUnique(input: unknown): Promise<Record<string, unknown> | null>;
  };
  orderStatusHistory: {
    findUnique(input: unknown): Promise<Record<string, unknown> | null>;
  };
  shipment: {
    findUnique(input: unknown): Promise<Record<string, unknown> | null>;
  };
  shipmentTrackingEvent: {
    findUnique(input: unknown): Promise<Record<string, unknown> | null>;
  };
  document: {
    findUnique(input: unknown): Promise<Record<string, unknown> | null>;
  };
  evidenceAttachment: {
    findUnique(input: unknown): Promise<Record<string, unknown> | null>;
  };
  proofEvent: {
    findUnique(input: unknown): Promise<Record<string, unknown> | null>;
  };
};

type PrismaAmendmentRow = {
  id: string;
  targetType: string;
  targetId: string;
  targetField: string | null;
  targetRef: unknown;
  originalValue: unknown;
  amendedValue: unknown;
  reason: string;
  status: string;
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  approverUserId: string | null;
  approverRoleCode: string | null;
  approverOrganizationId: string | null;
  decidedAt: Date | null;
  auditLogId: string | null;
  proofEventId: string | null;
  semenOrderId: string | null;
  shipmentId: string | null;
  horseId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export interface PrismaAmendmentRepository extends AmendmentRepository {
  listAmendments(filters?: {
    targetType?: string | null;
    targetId?: string | null;
    limit?: number;
  }): Promise<Amendment[]>;
}

export function createPrismaAmendmentRepository(
  client: PrismaAmendmentClient = defaultPrisma as unknown as PrismaAmendmentClient,
): PrismaAmendmentRepository {
  const auditRepository = createPrismaAuditLogRepository(
    client as unknown as Parameters<typeof createPrismaAuditLogRepository>[0],
  );

  return {
    async createAmendment(amendment) {
      const persisted = await client.amendment.create({
        data: toAmendmentCreateData(amendment),
      });

      return toAmendment(persisted);
    },
    async createAuditLog(auditLog: AuditLog) {
      return auditRepository.createAuditLog(auditLog);
    },
    async findAmendmentTargetSnapshot(targetType, targetId, targetField = null) {
      return findTargetSnapshot(client, targetType, targetId, targetField);
    },
    async listAmendments(filters = {}) {
      const amendments = await client.amendment.findMany({
        where: {
          ...(filters.targetType ? { targetType: filters.targetType } : {}),
          ...(filters.targetId ? { targetId: filters.targetId } : {}),
        },
        orderBy: [
          { occurredAt: "desc" },
          { id: "asc" },
        ],
        take: filters.limit ?? 100,
      });

      return amendments.map(toAmendment);
    },
  };
}

async function findTargetSnapshot(
  client: PrismaAmendmentClient,
  targetType: string,
  targetId: string,
  targetField?: string | null,
): Promise<AmendmentTargetSnapshot | null> {
  const row = await findTargetRow(client, targetType, targetId);

  if (!row) {
    return null;
  }

  const snapshot = toPlainJsonObject(row);
  const field = targetField?.trim() || null;
  const originalValue = field ? { [field]: snapshot[field] ?? null } : snapshot;
  const orderContext = buildOrderContext(targetType, targetId, snapshot);

  return {
    targetType,
    targetId,
    targetField: field,
    targetRef: buildTargetRef(targetType, snapshot),
    originalValue,
    ...orderContext,
    shipmentId: orderContext.semenOrderId
      ? targetType === "Shipment"
        ? targetId
        : stringValue(snapshot.shipmentId)
      : null,
    horseId: stringValue(snapshot.horseId),
  };
}

function findTargetRow(
  client: PrismaAmendmentClient,
  targetType: string,
  targetId: string,
) {
  const query = { where: { id: targetId } };

  switch (targetType) {
    case "SemenOrder":
      return client.semenOrder.findUnique(query);
    case "OrderStatusHistory":
      return client.orderStatusHistory.findUnique(query);
    case "Shipment":
      return client.shipment.findUnique(query);
    case "ShipmentTrackingEvent":
      return client.shipmentTrackingEvent.findUnique(query);
    case "Document":
      return client.document.findUnique(query);
    case "EvidenceAttachment":
      return client.evidenceAttachment.findUnique(query);
    case "ProofEvent":
      return client.proofEvent.findUnique(query);
    default:
      return Promise.resolve(null);
  }
}

function buildTargetRef(targetType: string, snapshot: Record<string, unknown>) {
  return {
    targetType,
    id: snapshot.id,
    orderNumber: snapshot.orderNumber,
    status: snapshot.status,
    documentType: snapshot.documentType,
    eventType: snapshot.eventType,
    targetField: snapshot.targetField,
  };
}

function buildOrderContext(
  targetType: string,
  targetId: string,
  snapshot: Record<string, unknown>,
) {
  const semenOrderId = targetType === "SemenOrder"
    ? targetId
    : stringValue(snapshot.semenOrderId);
  const orderNumber = stringValue(snapshot.orderNumber);
  const breederOrganizationId = stringValue(snapshot.breederOrganizationId);
  const breedingStationOrganizationId = stringValue(
    snapshot.breedingStationOrganizationId,
  );

  if (
    semenOrderId &&
    orderNumber &&
    breederOrganizationId &&
    breedingStationOrganizationId
  ) {
    return {
      semenOrderId,
      orderNumber,
      breederOrganizationId,
      breedingStationOrganizationId,
    };
  }

  return {
    semenOrderId: null,
    orderNumber: null,
    breederOrganizationId: null,
    breedingStationOrganizationId: null,
  };
}

function toAmendment(row: PrismaAmendmentRow): Amendment {
  return {
    id: row.id,
    targetType: row.targetType as AmendmentTargetType,
    targetId: row.targetId,
    targetField: row.targetField,
    targetRef: toJsonObject(row.targetRef),
    originalValue: row.originalValue,
    amendedValue: row.amendedValue,
    reason: row.reason,
    status: row.status as Amendment["status"],
    actorUserId: row.actorUserId,
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: row.actorOrganizationId,
    approverUserId: row.approverUserId,
    approverRoleCode: row.approverRoleCode as Amendment["approverRoleCode"],
    approverOrganizationId: row.approverOrganizationId,
    decidedAt: row.decidedAt?.toISOString() ?? null,
    auditLogId: row.auditLogId,
    proofEventId: row.proofEventId,
    semenOrderId: row.semenOrderId,
    shipmentId: row.shipmentId,
    horseId: row.horseId,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAmendmentCreateData(amendment: Amendment) {
  return {
    ...(amendment.id ? { id: amendment.id } : {}),
    targetType: amendment.targetType,
    targetId: amendment.targetId,
    targetField: amendment.targetField,
    targetRef: amendment.targetRef,
    originalValue: amendment.originalValue,
    amendedValue: amendment.amendedValue,
    reason: amendment.reason,
    status: amendment.status,
    actorUserId: amendment.actorUserId,
    actorRoleCode: amendment.actorRoleCode,
    actorOrganizationId: amendment.actorOrganizationId,
    approverUserId: amendment.approverUserId,
    approverRoleCode: amendment.approverRoleCode,
    approverOrganizationId: amendment.approverOrganizationId,
    decidedAt: amendment.decidedAt ? new Date(amendment.decidedAt) : null,
    auditLogId: amendment.auditLogId,
    proofEventId: amendment.proofEventId,
    semenOrderId: amendment.semenOrderId,
    shipmentId: amendment.shipmentId,
    horseId: amendment.horseId,
    orderNumber: amendment.orderNumber,
    breederOrganizationId: amendment.breederOrganizationId,
    breedingStationOrganizationId: amendment.breedingStationOrganizationId,
    occurredAt: new Date(amendment.occurredAt),
    createdAt: new Date(amendment.createdAt),
    updatedAt: new Date(amendment.updatedAt),
  };
}

function toPlainJsonObject(row: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, toJsonValue(value)]),
  );
}

function toJsonValue(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(toJsonValue);
  }

  if (value && typeof value === "object") {
    return toPlainJsonObject(value as Record<string, unknown>);
  }

  return value;
}

function toJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}
