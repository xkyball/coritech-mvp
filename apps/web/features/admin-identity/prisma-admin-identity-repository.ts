import { prisma as defaultPrisma } from "@coritech/database";

import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type {
  RoleCode,
  UserOrganizationRole,
} from "@coritech/domain/identity/role-model.d.ts";

import { createPrismaAuditLogRepository } from "../audit-logs/prisma-audit-log-repository";
import type {
  AdminIdentityOrganization,
  AdminIdentityRoleAssignment,
  AdminIdentityRepository,
  AdminIdentityRole,
  AdminIdentityUser,
  OrganizationStatus,
  OrganizationType,
  UserStatus,
} from "./admin-identity-management.d.ts";

type PrismaAdminIdentityClient = {
  user: {
    findMany(input?: unknown): Promise<PrismaUserRow[]>;
    findUnique(input: unknown): Promise<PrismaUserRow | null>;
    update(input: unknown): Promise<PrismaUserRow>;
  };
  organization: {
    create(input: unknown): Promise<PrismaOrganizationRow>;
    findMany(input?: unknown): Promise<PrismaOrganizationRow[]>;
    findUnique(input: unknown): Promise<PrismaOrganizationRow | null>;
    update(input: unknown): Promise<PrismaOrganizationRow>;
  };
  role: {
    findMany(input?: unknown): Promise<PrismaRoleRow[]>;
  };
  userOrganizationRole: {
    create(input: unknown): Promise<PrismaUserOrganizationRoleRow>;
    findMany(input?: unknown): Promise<PrismaUserOrganizationRoleRow[]>;
  };
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

type PrismaOrganizationRow = {
  id: string;
  name: string;
  organizationType: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaRoleRow = {
  code: string;
  phase: string;
  displayName: string;
  description: string;
  isAssignableInPhase1: boolean;
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

export interface PrismaAdminIdentityRepository extends AdminIdentityRepository {}

export function createPrismaAdminIdentityRepository(
  client: PrismaAdminIdentityClient = defaultPrisma as unknown as PrismaAdminIdentityClient,
): PrismaAdminIdentityRepository {
  const auditRepository = createPrismaAuditLogRepository(
    client as unknown as Parameters<typeof createPrismaAuditLogRepository>[0],
  );

  return {
    async listUsers() {
      const users = await client.user.findMany({
        orderBy: [
          { displayName: "asc" },
          { email: "asc" },
        ],
      });

      return users.map(toUser);
    },
    async listOrganizations() {
      const organizations = await client.organization.findMany({
        orderBy: [
          { name: "asc" },
          { id: "asc" },
        ],
      });

      return organizations.map(toOrganization);
    },
    async listRoles() {
      const roles = await client.role.findMany({
        orderBy: [
          { isAssignableInPhase1: "desc" },
          { code: "asc" },
        ],
      });

      return roles.map(toRole);
    },
    async listUserOrganizationRoles() {
      const assignments = await client.userOrganizationRole.findMany({
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
      });

      return assignments.map(toUserOrganizationRole);
    },
    async getUserById(userId) {
      const user = await client.user.findUnique({
        where: { id: userId },
      });

      return user ? toUser(user) : null;
    },
    async getOrganizationById(organizationId) {
      const organization = await client.organization.findUnique({
        where: { id: organizationId },
      });

      return organization ? toOrganization(organization) : null;
    },
    async createOrganization(input) {
      const organization = await client.organization.create({
        data: {
          name: input.name,
          organizationType: input.organizationType,
          status: input.status,
        },
      });

      return toOrganization(organization);
    },
    async updateOrganization(input) {
      const organization = await client.organization.update({
        where: { id: input.id },
        data: {
          name: input.name,
          organizationType: input.organizationType,
          status: input.status,
        },
      });

      return toOrganization(organization);
    },
    async updateUser(input) {
      const user = await client.user.update({
        where: { id: input.id },
        data: {
          displayName: input.displayName,
          status: input.status,
        },
      });

      return toUser(user);
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

      return toActiveUserOrganizationRole(assignment);
    },
    async createAuditLog(auditLog: AuditLog) {
      return auditRepository.createAuditLog(auditLog);
    },
  };
}

function toUser(row: PrismaUserRow): AdminIdentityUser {
  return {
    id: row.id,
    managedAuthSubject: row.managedAuthSubject,
    email: row.email,
    displayName: row.displayName,
    status: row.status as UserStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toOrganization(row: PrismaOrganizationRow): AdminIdentityOrganization {
  return {
    id: row.id,
    name: row.name,
    organizationType: row.organizationType as OrganizationType,
    status: row.status as OrganizationStatus,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toRole(row: PrismaRoleRow): AdminIdentityRole {
  return {
    code: row.code,
    phase: row.phase,
    displayName: row.displayName,
    description: row.description,
    isAssignableInPhase1: row.isAssignableInPhase1,
  };
}

function toUserOrganizationRole(row: PrismaUserOrganizationRoleRow): AdminIdentityRoleAssignment {
  return {
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    roleCode: row.roleCode as RoleCode,
    assignedByUserId: row.assignedByUserId,
    assignmentReason: row.assignmentReason,
    effectiveAt: row.effectiveAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString() ?? null,
    revokedByUserId: row.revokedByUserId,
    revocationReason: row.revocationReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toActiveUserOrganizationRole(row: PrismaUserOrganizationRoleRow): UserOrganizationRole {
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
