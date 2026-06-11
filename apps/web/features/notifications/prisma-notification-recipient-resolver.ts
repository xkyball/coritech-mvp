import { prisma as defaultPrisma } from "@coritech/database";

import type {
  NotificationOrganizationContext,
  NotificationRecipientQuery,
  NotificationRecipientResolver,
} from "@coritech/domain/notifications/notification-orchestration.d.ts";

type PrismaNotificationRecipientClient = {
  userOrganizationRole: {
    findMany(input?: unknown): Promise<PrismaUserOrganizationRoleRow[]>;
  };
  user: {
    findMany(input?: unknown): Promise<PrismaUserRow[]>;
  };
  organization: {
    findMany(input?: unknown): Promise<PrismaOrganizationRow[]>;
    findUnique(input: unknown): Promise<PrismaOrganizationRow | null>;
  };
};

type PrismaUserOrganizationRoleRow = {
  userId: string;
  organizationId: string;
  roleCode: string;
  revokedAt: Date | null;
};

type PrismaUserRow = {
  id: string;
  email: string;
  displayName: string;
  status: string;
};

type PrismaOrganizationRow = {
  id: string;
  name: string;
  status: string;
};

export function createPrismaNotificationRecipientResolver(
  client: PrismaNotificationRecipientClient = defaultPrisma as unknown as PrismaNotificationRecipientClient,
): NotificationRecipientResolver {
  return {
    async listNotificationRecipients(query) {
      const assignments = await client.userOrganizationRole.findMany({
        where: {
          organizationId: query.organizationId ?? undefined,
          roleCode: query.roleCode ?? undefined,
          revokedAt: null,
        },
        orderBy: [
          { organizationId: "asc" },
          { userId: "asc" },
        ],
      });
      const userIds = [...new Set(assignments.map((assignment) => assignment.userId))];
      const organizationIds = [...new Set(assignments.map((assignment) => assignment.organizationId))];

      if (userIds.length === 0 || organizationIds.length === 0) {
        return [];
      }

      const [users, organizations] = await Promise.all([
        client.user.findMany({
          where: {
            id: { in: userIds },
            status: "ACTIVE",
          },
        }),
        client.organization.findMany({
          where: {
            id: { in: organizationIds },
            status: "ACTIVE",
          },
        }),
      ]);
      const usersById = new Map(users.map((user) => [user.id, user]));
      const organizationsById = new Map(organizations.map((organization) => [
        organization.id,
        organization,
      ]));

      return assignments.flatMap((assignment) => {
        if (assignment.userId === query.excludeUserId) {
          return [];
        }

        const user = usersById.get(assignment.userId);
        const organization = organizationsById.get(assignment.organizationId);

        if (!user || !organization) {
          return [];
        }

        return [
          {
            email: user.email,
            name: user.displayName,
            userId: user.id,
            organizationId: assignment.organizationId,
            roleCode: assignment.roleCode,
            recipientRef: {
              recipientRule: query.recipientRule,
              organizationName: organization.name,
            },
          },
        ];
      });
    },
    async findNotificationOrganizationById(
      organizationId,
    ): Promise<NotificationOrganizationContext | null> {
      const organization = await client.organization.findUnique({
        where: {
          id: organizationId,
        },
      });

      return organization && organization.status === "ACTIVE"
        ? {
            id: organization.id,
            name: organization.name,
          }
        : null;
    },
  };
}

export type { NotificationRecipientQuery };
