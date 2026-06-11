import { prisma as defaultPrisma } from "@coritech/database";

import type {
  NotificationEmailDeliveryLog,
  NotificationEmailLogRepository,
} from "@coritech/domain/notifications/email-provider.d.ts";

type PrismaNotificationLogClient = {
  notificationLog: {
    create(input: unknown): Promise<PrismaNotificationLogRow>;
  };
};

type PrismaNotificationLogRow = {
  id: string;
  eventType: string;
  templateId: string;
  channel: string;
  recipientRule: string;
  recipientUserId: string | null;
  recipientOrganizationId: string | null;
  recipientRole: string | null;
  recipientRef: unknown;
  payload: unknown;
  status: string;
  providerMessageId: string | null;
  attemptCount: number;
  nextRetryAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function createPrismaNotificationLogRepository(
  client: PrismaNotificationLogClient = defaultPrisma as unknown as PrismaNotificationLogClient,
): NotificationEmailLogRepository {
  return {
    async createNotificationLog(log) {
      const persisted = await client.notificationLog.create({
        data: toNotificationLogCreateData(log),
      });

      return toNotificationDeliveryLog(persisted);
    },
  };
}

function toNotificationLogCreateData(log: NotificationEmailDeliveryLog) {
  return {
    id: log.id ?? undefined,
    eventType: log.eventType,
    templateId: log.templateId,
    channel: log.channel,
    recipientRule: log.recipientRule,
    recipientUserId: log.recipientUserId,
    recipientOrganizationId: log.recipientOrganizationId,
    recipientRole: log.recipientRole,
    recipientRef: log.recipientRef,
    payload: log.payload,
    status: log.status,
    providerMessageId: log.providerMessageId,
    attemptCount: log.attemptCount,
    nextRetryAt: log.nextRetryAt ? new Date(log.nextRetryAt) : null,
    lastError: log.lastError,
    createdAt: new Date(log.createdAt),
    updatedAt: new Date(log.updatedAt),
  };
}

function toNotificationDeliveryLog(
  row: PrismaNotificationLogRow,
): NotificationEmailDeliveryLog {
  return {
    id: row.id,
    eventType: row.eventType,
    templateId: row.templateId,
    channel: row.channel as NotificationEmailDeliveryLog["channel"],
    recipientRule: row.recipientRule,
    recipientUserId: row.recipientUserId,
    recipientOrganizationId: row.recipientOrganizationId,
    recipientRole: row.recipientRole,
    recipientRef: toJsonObject(row.recipientRef),
    payload: toJsonObject(row.payload),
    status: row.status as NotificationEmailDeliveryLog["status"],
    providerMessageId: row.providerMessageId,
    attemptCount: row.attemptCount,
    nextRetryAt: row.nextRetryAt?.toISOString() ?? null,
    lastError: row.lastError,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toJsonObject(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
