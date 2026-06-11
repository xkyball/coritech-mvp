import { prisma as defaultPrisma } from "@coritech/database";

import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRole } from "@coritech/domain/identity/role-model.d.ts";
import type {
  InvitationOrganization,
  InvitationUser,
  UserInvitation,
  UserInvitationRepository,
} from "@coritech/domain/onboarding/user-invitation.d.ts";

import { createPrismaAuditLogRepository } from "../audit-logs/prisma-audit-log-repository";

type PrismaUserInvitationClient = {
  userInvitation: {
    create(input: unknown): Promise<PrismaUserInvitationRow>;
    findMany(input?: unknown): Promise<PrismaUserInvitationRow[]>;
    findUnique(input: unknown): Promise<PrismaUserInvitationRow | null>;
    update(input: unknown): Promise<PrismaUserInvitationRow>;
  };
  organization: {
    findMany(input?: unknown): Promise<PrismaOrganizationRow[]>;
    findUnique(input: unknown): Promise<PrismaOrganizationRow | null>;
  };
  user: {
    create(input: unknown): Promise<PrismaUserRow>;
    findUnique(input: unknown): Promise<PrismaUserRow | null>;
    update(input: unknown): Promise<PrismaUserRow>;
  };
  userOrganizationRole: {
    create(input: unknown): Promise<PrismaUserOrganizationRoleRow>;
  };
};

type PrismaUserInvitationRow = {
  id: string;
  email: string;
  organizationId: string;
  organizationName: string | null;
  roleCode: string;
  status: string;
  tokenHash: string;
  expiresAt: Date;
  invitedByUserId: string;
  invitedByOrganizationId: string;
  acceptedAt: Date | null;
  acceptedUserId: string | null;
  acceptedRoleAssignmentId: string | null;
  revokedAt: Date | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  emailDeliveryStatus: string;
  emailQueuedAt: Date | null;
  emailSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaOrganizationRow = {
  id: string;
  name: string;
  organizationType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaUserRow = {
  id: string;
  managedAuthSubject: string;
  email: string;
  displayName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaUserOrganizationRoleRow = {
  id: string;
  userId: string;
  organizationId: string;
  roleCode: string;
  assignedByUserId: string;
  assignmentReason: string | null;
  effectiveAt: Date;
  revokedAt: Date | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export interface PrismaUserInvitationRepository extends UserInvitationRepository {
  listInvitations(filters?: {
    status?: string | null;
    email?: string | null;
    organizationId?: string | null;
    limit?: number;
  }): Promise<UserInvitation[]>;
  listInviteOrganizations(): Promise<InvitationOrganization[]>;
}

export function createPrismaUserInvitationRepository(
  client: PrismaUserInvitationClient = defaultPrisma as unknown as PrismaUserInvitationClient,
): PrismaUserInvitationRepository {
  const auditRepository = createPrismaAuditLogRepository(
    client as unknown as Parameters<typeof createPrismaAuditLogRepository>[0],
  );

  return {
    async listInvitations(filters = {}) {
      const invitations = await client.userInvitation.findMany({
        where: {
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.email ? { email: { contains: filters.email, mode: "insensitive" } } : {}),
          ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
        take: filters.limit ?? 100,
      });

      return invitations.map(toInvitation);
    },
    async listInviteOrganizations() {
      const organizations = await client.organization.findMany({
        where: {
          status: "ACTIVE",
          organizationType: {
            in: ["BREEDER", "BREEDING_STATION"],
          },
        },
        orderBy: [
          { name: "asc" },
          { id: "asc" },
        ],
      });

      return organizations.map(toOrganization);
    },
    async getOrganizationById(organizationId) {
      const organization = await client.organization.findUnique({
        where: { id: organizationId },
      });

      return organization ? toOrganization(organization) : null;
    },
    async createInvitation(invitation) {
      const persisted = await client.userInvitation.create({
        data: toInvitationCreateData(invitation),
      });

      return toInvitation(persisted);
    },
    async updateInvitation(invitation) {
      if (!invitation.id) {
        throw new Error("Invitation ID is required.");
      }

      const persisted = await client.userInvitation.update({
        where: { id: invitation.id },
        data: toInvitationUpdateData(invitation),
      });

      return toInvitation(persisted);
    },
    async findInvitationByTokenHash(tokenHash) {
      const invitation = await client.userInvitation.findUnique({
        where: { tokenHash },
      });

      return invitation ? toInvitation(invitation) : null;
    },
    async findUserByEmail(email) {
      const user = await client.user.findUnique({
        where: { email },
      });

      return user ? toUser(user) : null;
    },
    async createUser(user) {
      const persisted = await client.user.create({
        data: {
          ...(user.id ? { id: user.id } : {}),
          managedAuthSubject: user.managedAuthSubject,
          email: user.email,
          displayName: user.displayName,
          status: user.status,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        },
      });

      return toUser(persisted);
    },
    async updateUserProfile(user) {
      const persisted = await client.user.update({
        where: { id: user.id },
        data: {
          displayName: user.displayName,
          status: user.status,
        },
      });

      return toUser(persisted);
    },
    async createUserOrganizationRole(input) {
      const assignment = await client.userOrganizationRole.create({
        data: {
          ...(input.id ? { id: input.id } : {}),
          userId: input.userId,
          organizationId: input.organizationId,
          roleCode: input.roleCode,
          assignedByUserId: input.assignedByUserId,
          assignmentReason: input.assignmentReason,
          effectiveAt: new Date(input.effectiveAt),
          revokedAt: input.revokedAt ? new Date(input.revokedAt) : null,
          revokedByUserId: input.revokedByUserId,
          revocationReason: input.revocationReason,
          createdAt: new Date(input.createdAt),
          updatedAt: new Date(input.updatedAt),
        },
      });

      return toUserOrganizationRole(assignment);
    },
    async createAuditLog(auditLog: AuditLog) {
      return auditRepository.createAuditLog(auditLog);
    },
    async queueInvitationEmail() {
      return undefined;
    },
  };
}

function toInvitation(row: PrismaUserInvitationRow): UserInvitation {
  return {
    id: row.id,
    email: row.email,
    organizationId: row.organizationId,
    organizationName: row.organizationName,
    roleCode: row.roleCode as UserInvitation["roleCode"],
    status: row.status as UserInvitation["status"],
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt.toISOString(),
    invitedByUserId: row.invitedByUserId,
    invitedByOrganizationId: row.invitedByOrganizationId,
    acceptedAt: row.acceptedAt?.toISOString() ?? null,
    acceptedUserId: row.acceptedUserId,
    acceptedRoleAssignmentId: row.acceptedRoleAssignmentId,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    revokedByUserId: row.revokedByUserId,
    revocationReason: row.revocationReason,
    emailDeliveryStatus: row.emailDeliveryStatus as UserInvitation["emailDeliveryStatus"],
    emailQueuedAt: row.emailQueuedAt?.toISOString() ?? null,
    emailSentAt: row.emailSentAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toOrganization(row: PrismaOrganizationRow): InvitationOrganization {
  return {
    id: row.id,
    name: row.name,
    organizationType: row.organizationType as InvitationOrganization["organizationType"],
    status: row.status as InvitationOrganization["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toUser(row: PrismaUserRow): InvitationUser {
  return {
    id: row.id,
    managedAuthSubject: row.managedAuthSubject,
    email: row.email,
    displayName: row.displayName,
    status: row.status as InvitationUser["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toUserOrganizationRole(row: PrismaUserOrganizationRoleRow): UserOrganizationRole {
  return {
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    roleCode: row.roleCode as UserOrganizationRole["roleCode"],
    assignedByUserId: row.assignedByUserId,
    assignmentReason: row.assignmentReason,
    effectiveAt: row.effectiveAt.toISOString(),
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toInvitationCreateData(invitation: UserInvitation) {
  return {
    ...(invitation.id ? { id: invitation.id } : {}),
    email: invitation.email,
    organizationId: invitation.organizationId,
    organizationName: invitation.organizationName,
    roleCode: invitation.roleCode,
    status: invitation.status,
    tokenHash: invitation.tokenHash,
    expiresAt: new Date(invitation.expiresAt),
    invitedByUserId: invitation.invitedByUserId,
    invitedByOrganizationId: invitation.invitedByOrganizationId,
    acceptedAt: invitation.acceptedAt ? new Date(invitation.acceptedAt) : null,
    acceptedUserId: invitation.acceptedUserId,
    acceptedRoleAssignmentId: invitation.acceptedRoleAssignmentId,
    revokedAt: invitation.revokedAt ? new Date(invitation.revokedAt) : null,
    revokedByUserId: invitation.revokedByUserId,
    revocationReason: invitation.revocationReason,
    emailDeliveryStatus: invitation.emailDeliveryStatus,
    emailQueuedAt: invitation.emailQueuedAt ? new Date(invitation.emailQueuedAt) : null,
    emailSentAt: invitation.emailSentAt ? new Date(invitation.emailSentAt) : null,
    createdAt: new Date(invitation.createdAt),
    updatedAt: new Date(invitation.updatedAt),
  };
}

function toInvitationUpdateData(invitation: UserInvitation) {
  return {
    email: invitation.email,
    organizationId: invitation.organizationId,
    organizationName: invitation.organizationName,
    roleCode: invitation.roleCode,
    status: invitation.status,
    expiresAt: new Date(invitation.expiresAt),
    acceptedAt: invitation.acceptedAt ? new Date(invitation.acceptedAt) : null,
    acceptedUserId: invitation.acceptedUserId,
    acceptedRoleAssignmentId: invitation.acceptedRoleAssignmentId,
    revokedAt: invitation.revokedAt ? new Date(invitation.revokedAt) : null,
    revokedByUserId: invitation.revokedByUserId,
    revocationReason: invitation.revocationReason,
    emailDeliveryStatus: invitation.emailDeliveryStatus,
    emailQueuedAt: invitation.emailQueuedAt ? new Date(invitation.emailQueuedAt) : null,
    emailSentAt: invitation.emailSentAt ? new Date(invitation.emailSentAt) : null,
    updatedAt: new Date(invitation.updatedAt),
  };
}
