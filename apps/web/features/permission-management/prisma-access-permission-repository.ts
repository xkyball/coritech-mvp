import { prisma as defaultPrisma } from "@coritech/database";

import type {
  AccessPermission,
  AccessPermissionScope,
  ActiveAccessPermissionScope,
} from "@coritech/domain/access/access-permission.d.ts";

import { createPrismaAuditLogRepository } from "../audit-logs/prisma-audit-log-repository";
import type {
  PermissionManagementFilters,
  PermissionManagementRepository,
  PermissionOrganizationOption,
  PermissionUserOption,
} from "./permission-management.d.ts";

type PrismaAccessPermissionClient = {
  accessPermission: {
    create(input: unknown): Promise<PrismaAccessPermissionRow>;
    findMany(input?: unknown): Promise<PrismaAccessPermissionRow[]>;
    findUnique(input: unknown): Promise<PrismaAccessPermissionRow | null>;
    update(input: unknown): Promise<PrismaAccessPermissionRow>;
  };
  user: {
    findMany(input?: unknown): Promise<PrismaUserRow[]>;
  };
  organization: {
    findMany(input?: unknown): Promise<PrismaOrganizationRow[]>;
  };
};

type PrismaAccessPermissionRow = {
  id: string;
  userId: string | null;
  organizationId: string | null;
  roleCode: string | null;
  objectType: string;
  objectId: string;
  scope: string;
  grantedByUserId: string;
  grantorRoleCode: string;
  grantorOrganizationId: string;
  grantReason: string | null;
  effectiveAt: Date;
  expiresAt: Date | null;
  revokedAt: Date | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaUserRow = {
  id: string;
  displayName: string;
  email: string;
};

type PrismaOrganizationRow = {
  id: string;
  name: string;
  organizationType: string;
};

export interface PrismaAccessPermissionRepository extends PermissionManagementRepository {
  listUsers(): Promise<PermissionUserOption[]>;
  listOrganizations(): Promise<PermissionOrganizationOption[]>;
}

export function createPrismaAccessPermissionRepository(
  client: PrismaAccessPermissionClient = defaultPrisma as unknown as PrismaAccessPermissionClient,
): PrismaAccessPermissionRepository {
  const auditRepository = createPrismaAuditLogRepository(
    client as unknown as Parameters<typeof createPrismaAuditLogRepository>[0],
  );

  return {
    async createAccessPermission(permission) {
      const persisted = await client.accessPermission.create({
        data: toAccessPermissionCreateData(permission),
      });

      return toAccessPermission(persisted);
    },
    async revokeAccessPermission(permission) {
      if (!permission.id) {
        throw new Error("Persisted access permission id is required for revocation.");
      }

      const persisted = await client.accessPermission.update({
        where: { id: permission.id },
        data: toAccessPermissionRevokeData(permission),
      });

      return toAccessPermission(persisted);
    },
    async createAuditLog(auditLog) {
      return auditRepository.createAuditLog(auditLog);
    },
    async getAccessPermissionById(permissionId) {
      const permission = await client.accessPermission.findUnique({
        where: { id: permissionId },
      });

      return permission ? toAccessPermission(permission) : null;
    },
    async listAccessPermissions(filters = {}) {
      const permissions = await client.accessPermission.findMany({
        where: toAccessPermissionWhere(filters),
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
        take: filters.pageSize ?? 100,
        skip: ((filters.page ?? 1) - 1) * (filters.pageSize ?? 100),
      });

      return permissions.map(toAccessPermission);
    },
    async listAccessPermissionsForObject(objectType, objectId, scope) {
      const permissions = await client.accessPermission.findMany({
        where: {
          objectType,
          objectId,
          scope,
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
      });

      return permissions.map(toAccessPermission);
    },
    async listAccessPermissionsForUser(userId) {
      const permissions = await client.accessPermission.findMany({
        where: { userId },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
      });

      return permissions.map(toAccessPermission);
    },
    async listAccessPermissionsForOrganization(organizationId) {
      const permissions = await client.accessPermission.findMany({
        where: { organizationId },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
      });

      return permissions.map(toAccessPermission);
    },
    async listUsers() {
      const users = await client.user.findMany({
        orderBy: [
          { displayName: "asc" },
          { id: "asc" },
        ],
      });

      return users.map((user) => ({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
      }));
    },
    async listOrganizations() {
      const organizations = await client.organization.findMany({
        orderBy: [
          { name: "asc" },
          { id: "asc" },
        ],
      });

      return organizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        organizationType: organization.organizationType,
      }));
    },
  };
}

function toAccessPermissionWhere(filters: Partial<PermissionManagementFilters>) {
  return {
    ...(filters.objectType ? { objectType: filters.objectType } : {}),
    ...(filters.objectId ? { objectId: filters.objectId } : {}),
    ...(filters.userId ? { userId: filters.userId } : {}),
    ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
    ...(filters.scope ? { scope: filters.scope } : {}),
  };
}

function toAccessPermission(row: PrismaAccessPermissionRow): AccessPermission {
  return {
    id: row.id,
    userId: row.userId,
    organizationId: row.organizationId,
    roleCode: row.roleCode as AccessPermission["roleCode"],
    objectType: row.objectType,
    objectId: row.objectId,
    scope: row.scope as AccessPermissionScope,
    grantedByUserId: row.grantedByUserId,
    grantorRoleCode: "PLATFORM_ADMIN",
    grantorOrganizationId: row.grantorOrganizationId,
    grantReason: row.grantReason,
    effectiveAt: row.effectiveAt.toISOString(),
    expiresAt: row.expiresAt?.toISOString() ?? null,
    revokedAt: row.revokedAt?.toISOString() ?? null,
    revokedByUserId: row.revokedByUserId,
    revocationReason: row.revocationReason,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toAccessPermissionCreateData(permission: AccessPermission) {
  return {
    ...(permission.id ? { id: permission.id } : {}),
    userId: permission.userId,
    organizationId: permission.organizationId,
    roleCode: permission.roleCode,
    objectType: permission.objectType,
    objectId: permission.objectId,
    scope: permission.scope as ActiveAccessPermissionScope,
    grantedByUserId: permission.grantedByUserId,
    grantorRoleCode: permission.grantorRoleCode,
    grantorOrganizationId: permission.grantorOrganizationId,
    grantReason: permission.grantReason,
    effectiveAt: new Date(permission.effectiveAt),
    expiresAt: permission.expiresAt ? new Date(permission.expiresAt) : null,
    createdAt: new Date(permission.createdAt),
    updatedAt: new Date(permission.updatedAt),
  };
}

function toAccessPermissionRevokeData(permission: AccessPermission) {
  return {
    revokedAt: permission.revokedAt ? new Date(permission.revokedAt) : null,
    revokedByUserId: permission.revokedByUserId,
    revocationReason: permission.revocationReason,
    updatedAt: new Date(permission.updatedAt),
  };
}
