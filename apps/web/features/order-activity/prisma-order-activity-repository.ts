import { prisma as defaultPrisma } from "@coritech/database";

import type { OrderActivity } from "@coritech/domain/orders/order-activity.d.ts";
import type { OrderActivityListRepository } from "./order-activity.d.ts";

type PrismaOrderActivityClient = {
  orderActivity: {
    create(input: unknown): Promise<PrismaOrderActivityRow>;
    findMany(input?: unknown): Promise<PrismaOrderActivityRow[]>;
  };
};

type PrismaOrderActivityRow = {
  id: string;
  semenOrderId: string;
  orderNumber: string;
  type: string;
  visibility: string;
  message: string;
  createdByUserId: string | null;
  createdByOrganizationId: string | null;
  createdByRole: string | null;
  createdAt: Date;
};

export function createPrismaOrderActivityRepository(
  client: PrismaOrderActivityClient = defaultPrisma as unknown as PrismaOrderActivityClient,
): OrderActivityListRepository {
  return {
    async createOrderActivity(activity) {
      const persisted = await client.orderActivity.create({
        data: toOrderActivityCreateData(activity),
      });

      return toOrderActivity(persisted);
    },
    async listOrderActivitiesForOrder(orderId) {
      const activities = await client.orderActivity.findMany({
        where: {
          semenOrderId: orderId,
        },
        orderBy: [
          { createdAt: "asc" },
          { id: "asc" },
        ],
      });

      return activities.map(toOrderActivity);
    },
    async listOrderActivitiesForOrders(orderIds) {
      const uniqueOrderIds = [...new Set(orderIds.filter(Boolean))];

      if (uniqueOrderIds.length === 0) {
        return [];
      }

      const activities = await client.orderActivity.findMany({
        where: {
          semenOrderId: {
            in: uniqueOrderIds,
          },
        },
        orderBy: [
          { createdAt: "asc" },
          { id: "asc" },
        ],
      });

      return activities.map(toOrderActivity);
    },
  };
}

function toOrderActivityCreateData(activity: OrderActivity) {
  return {
    id: activity.id ?? undefined,
    semenOrderId: requireId(activity.semenOrderId, "activity.semenOrderId"),
    orderNumber: activity.orderNumber,
    type: activity.type,
    visibility: activity.visibility,
    message: activity.message,
    createdByUserId: activity.createdByUserId,
    createdByOrganizationId: activity.createdByOrganizationId,
    createdByRole: activity.createdByRole,
    createdAt: new Date(activity.createdAt),
  };
}

function toOrderActivity(row: PrismaOrderActivityRow): OrderActivity {
  return {
    id: row.id,
    semenOrderId: row.semenOrderId,
    orderNumber: row.orderNumber,
    type: row.type as OrderActivity["type"],
    visibility: row.visibility as OrderActivity["visibility"],
    message: row.message,
    createdByUserId: row.createdByUserId,
    createdByOrganizationId: row.createdByOrganizationId,
    createdByRole: row.createdByRole as OrderActivity["createdByRole"],
    createdAt: row.createdAt.toISOString(),
  };
}

function requireId(value: string | null, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required for persistent order activity storage.`);
  }

  return value;
}
