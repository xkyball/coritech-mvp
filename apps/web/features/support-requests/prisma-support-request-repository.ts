import { prisma as defaultPrisma } from "@coritech/database";

import type { SupportRequest } from "@coritech/domain/support/support-request.d.ts";
import type { PrismaSupportRequestRepository } from "./support-requests.d.ts";

type PrismaSupportRequestClient = {
  supportRequest: {
    create(input: unknown): Promise<PrismaSupportRequestRow>;
    findMany(input?: unknown): Promise<PrismaSupportRequestRow[]>;
  };
};

type PrismaSupportRequestRow = {
  id: string;
  objectType: string;
  objectId: string;
  objectRef: unknown;
  category: string;
  message: string;
  status: string;
  createdByUserId: string;
  createdByOrganizationId: string;
  createdByRole: string;
  adminNotificationStatus: string;
  adminNotificationQueuedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function createPrismaSupportRequestRepository(
  client: PrismaSupportRequestClient = defaultPrisma as unknown as PrismaSupportRequestClient,
): PrismaSupportRequestRepository {
  return {
    async createSupportRequest(request) {
      const persisted = await client.supportRequest.create({
        data: toSupportRequestCreateData(request),
      });

      return toSupportRequest(persisted);
    },
    async listSupportRequests(filters = {}) {
      const requests = await client.supportRequest.findMany({
        where: {
          status: filters.status || undefined,
          category: filters.category || undefined,
        },
        orderBy: [
          { updatedAt: "desc" },
          { id: "asc" },
        ],
        take: filters.limit ?? 100,
      });

      return requests.map(toSupportRequest);
    },
  };
}

function toSupportRequestCreateData(request: SupportRequest) {
  return {
    id: request.id ?? undefined,
    objectType: request.objectType,
    objectId: request.objectId,
    objectRef: request.objectRef,
    category: request.category,
    message: request.message,
    status: request.status,
    createdByUserId: request.createdByUserId,
    createdByOrganizationId: request.createdByOrganizationId,
    createdByRole: request.createdByRole,
    adminNotificationStatus: request.adminNotificationStatus,
    adminNotificationQueuedAt: request.adminNotificationQueuedAt
      ? new Date(request.adminNotificationQueuedAt)
      : null,
    createdAt: new Date(request.createdAt),
    updatedAt: new Date(request.updatedAt),
  };
}

function toSupportRequest(row: PrismaSupportRequestRow): SupportRequest {
  return {
    id: row.id,
    objectType: row.objectType as SupportRequest["objectType"],
    objectId: row.objectId,
    objectRef: toJsonObject(row.objectRef),
    category: row.category as SupportRequest["category"],
    message: row.message,
    status: row.status as SupportRequest["status"],
    createdByUserId: row.createdByUserId,
    createdByOrganizationId: row.createdByOrganizationId,
    createdByRole: row.createdByRole as SupportRequest["createdByRole"],
    adminNotificationStatus: row.adminNotificationStatus as SupportRequest["adminNotificationStatus"],
    adminNotificationQueuedAt: row.adminNotificationQueuedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toJsonObject(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
