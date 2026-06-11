import { prisma as defaultPrisma } from "@coritech/database";

import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type {
  PaymentReference,
  PaymentReferenceRepository,
  PaymentReferenceStatus,
} from "@coritech/domain/payments/payment-reference.d.ts";

type PrismaPaymentReferenceClient = {
  paymentReference: {
    create(input: unknown): Promise<PrismaPaymentReferenceRow>;
    update(input: unknown): Promise<PrismaPaymentReferenceRow>;
    findUnique(input: unknown): Promise<PrismaPaymentReferenceRow | null>;
    findFirst(input: unknown): Promise<PrismaPaymentReferenceRow | null>;
    findMany(input?: unknown): Promise<PrismaPaymentReferenceRow[]>;
  };
  auditLog: {
    create(input: unknown): Promise<PrismaAuditLogRow>;
  };
};

type PrismaPaymentReferenceRow = {
  id: string;
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  providerName: string | null;
  providerReferenceId: string | null;
  status: string;
  amount: unknown;
  currency: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
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

export interface PrismaPaymentReferenceRepository extends PaymentReferenceRepository {
  findLatestPaymentReferenceForOrder(orderId: string): Promise<PaymentReference | null>;
  listLatestPaymentReferencesForOrders(orderIds: string[]): Promise<PaymentReference[]>;
}

export function createPrismaPaymentReferenceRepository(
  client: PrismaPaymentReferenceClient = defaultPrisma as unknown as PrismaPaymentReferenceClient,
): PrismaPaymentReferenceRepository {
  return {
    async createPaymentReference(paymentReference) {
      const persisted = await client.paymentReference.create({
        data: toPaymentReferenceCreateData(paymentReference),
      });

      return toPaymentReference(persisted);
    },
    async findPaymentReferenceById(paymentReferenceId) {
      const paymentReference = await client.paymentReference.findUnique({
        where: {
          id: paymentReferenceId,
        },
      });

      return paymentReference ? toPaymentReference(paymentReference) : null;
    },
    async updatePaymentReference(paymentReference) {
      const persisted = await client.paymentReference.update({
        where: {
          id: requireId(paymentReference.id, "paymentReference.id"),
        },
        data: toPaymentReferenceUpdateData(paymentReference),
      });

      return toPaymentReference(persisted);
    },
    async createAuditLog(auditLog) {
      const persisted = await client.auditLog.create({
        data: toAuditLogCreateData(auditLog),
      });

      return toAuditLog(persisted);
    },
    async findLatestPaymentReferenceForOrder(orderId) {
      const paymentReference = await client.paymentReference.findFirst({
        where: {
          semenOrderId: orderId,
        },
        orderBy: [
          { updatedAt: "desc" },
          { id: "desc" },
        ],
      });

      return paymentReference ? toPaymentReference(paymentReference) : null;
    },
    async listLatestPaymentReferencesForOrders(orderIds) {
      const uniqueOrderIds = [...new Set(orderIds)].filter(Boolean);

      if (uniqueOrderIds.length === 0) {
        return [];
      }

      const paymentReferences = await client.paymentReference.findMany({
        where: {
          semenOrderId: {
            in: uniqueOrderIds,
          },
        },
        orderBy: [
          { updatedAt: "desc" },
          { id: "desc" },
        ],
      });
      const latestByOrderId = new Map<string, PaymentReference>();

      for (const paymentReference of paymentReferences.map(toPaymentReference)) {
        if (!latestByOrderId.has(paymentReference.semenOrderId)) {
          latestByOrderId.set(paymentReference.semenOrderId, paymentReference);
        }
      }

      return [...latestByOrderId.values()];
    },
  };
}

function toPaymentReference(row: PrismaPaymentReferenceRow): PaymentReference {
  return {
    id: row.id,
    semenOrderId: row.semenOrderId,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    providerName: row.providerName,
    providerReferenceId: row.providerReferenceId,
    status: row.status as PaymentReferenceStatus,
    amount: toNumberOrNull(row.amount),
    currency: row.currency,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPaymentReferenceCreateData(paymentReference: PaymentReference) {
  return {
    id: paymentReference.id ?? undefined,
    semenOrderId: paymentReference.semenOrderId,
    orderNumber: paymentReference.orderNumber,
    breederOrganizationId: paymentReference.breederOrganizationId,
    breedingStationOrganizationId: paymentReference.breedingStationOrganizationId,
    providerName: paymentReference.providerName,
    providerReferenceId: paymentReference.providerReferenceId,
    status: paymentReference.status,
    amount: paymentReference.amount,
    currency: paymentReference.currency,
    createdByUserId: paymentReference.createdByUserId,
    updatedByUserId: paymentReference.updatedByUserId,
    createdAt: new Date(paymentReference.createdAt),
    updatedAt: new Date(paymentReference.updatedAt),
  };
}

function toPaymentReferenceUpdateData(paymentReference: PaymentReference) {
  return {
    providerName: paymentReference.providerName,
    providerReferenceId: paymentReference.providerReferenceId,
    status: paymentReference.status,
    amount: paymentReference.amount,
    currency: paymentReference.currency,
    updatedByUserId: paymentReference.updatedByUserId,
    updatedAt: new Date(paymentReference.updatedAt),
  };
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
    objectId: requireId(auditLog.objectId, "auditLog.objectId"),
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

function toNumberOrNull(value: unknown): number | null {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const numeric = Number(value);

    return Number.isFinite(numeric) ? numeric : null;
  }

  if (typeof value === "object" && "toString" in value && typeof value.toString === "function") {
    const numeric = Number(value.toString());

    return Number.isFinite(numeric) ? numeric : null;
  }

  return null;
}

function requireId(value: string | null, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required for persistent payment reference storage.`);
  }

  return value;
}

function toJsonObject(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toNullableJsonObjectInput(value: Record<string, unknown> | null) {
  return value ?? undefined;
}
