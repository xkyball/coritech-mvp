import { prisma as defaultPrisma } from "@coritech/database";

import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type {
  SemenCatalogRepository,
  SemenListing,
  SemenListingRecord,
  SemenListingSearchFilters,
  SemenListingStatus,
  SemenAvailabilityStatus,
  Stallion,
  StallionLike,
  StallionSearchFilters,
  StallionStatus,
} from "@coritech/domain/catalog/semen-catalog.d.ts";

type PrismaCatalogClient = {
  stallion: {
    create(input: unknown): Promise<PrismaStallionRow>;
    update(input: unknown): Promise<PrismaStallionRow>;
    findUnique(input: unknown): Promise<PrismaStallionRow | null>;
    findMany(input?: unknown): Promise<PrismaStallionRow[]>;
  };
  semenListing: {
    create(input: unknown): Promise<PrismaSemenListingRow>;
    update(input: unknown): Promise<PrismaSemenListingRow>;
    findUnique(input: unknown): Promise<PrismaSemenListingRow | null>;
    findMany(input?: unknown): Promise<PrismaSemenListingRow[]>;
  };
  auditLog: {
    create(input: unknown): Promise<PrismaAuditLogRow>;
  };
};

type PrismaStallionRow = {
  id: string;
  name: string;
  breed: string;
  ueln: string | null;
  microchipNumber: string | null;
  breedingStationOrganizationId: string;
  status: string;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaSemenListingRow = {
  id: string;
  stallionId: string;
  breedingStationOrganizationId: string;
  availabilityStatus: string;
  listingStatus: string;
  termsSummary: string | null;
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

export function createPrismaCatalogRepository(
  client: PrismaCatalogClient = defaultPrisma as unknown as PrismaCatalogClient,
): SemenCatalogRepository {
  return {
    async createStallion(stallion) {
      const persisted = await client.stallion.create({
        data: toStallionCreateData(stallion),
      });

      return toStallion(persisted);
    },
    async updateStallion(stallion) {
      const persisted = await client.stallion.update({
        where: {
          id: requireId(stallion.id, "stallion.id"),
        },
        data: toStallionUpdateData(stallion),
      });

      return toStallion(persisted);
    },
    async findStallionById(stallionId) {
      const stallion = await client.stallion.findUnique({
        where: {
          id: stallionId,
        },
      });

      return stallion ? toStallion(stallion) : null;
    },
    async listStallions(filters = {}) {
      const stallions = await client.stallion.findMany({
        where: toStallionWhere(filters),
        orderBy: [
          { name: "asc" },
          { id: "asc" },
        ],
      });

      return stallions
        .map(toStallion)
        .filter((stallion) => matchesStallionTextFilters(stallion, filters));
    },
    async createSemenListing(listing) {
      const persisted = await client.semenListing.create({
        data: toSemenListingCreateData(listing),
      });

      return toSemenListing(persisted);
    },
    async updateSemenListing(listing) {
      const persisted = await client.semenListing.update({
        where: {
          id: requireId(listing.id, "listing.id"),
        },
        data: toSemenListingUpdateData(listing),
      });

      return toSemenListing(persisted);
    },
    async findSemenListingById(listingId) {
      const listing = await client.semenListing.findUnique({
        where: {
          id: listingId,
        },
      });

      return listing ? toSemenListing(listing) : null;
    },
    async findSemenListingRecordById(listingId) {
      const listing = await client.semenListing.findUnique({
        where: {
          id: listingId,
        },
      });

      if (!listing) {
        return null;
      }

      const stallion = await client.stallion.findUnique({
        where: {
          id: listing.stallionId,
        },
      });

      if (!stallion) {
        return null;
      }

      return {
        listing: toSemenListing(listing),
        stallion: toStallionLike(stallion),
      };
    },
    async listSemenListingRecords(filters = {}) {
      const listings = await client.semenListing.findMany({
        where: toSemenListingWhere(filters),
        orderBy: [
          { updatedAt: "desc" },
          { id: "asc" },
        ],
      });
      const stallions = await client.stallion.findMany({
        where: {
          id: {
            in: [...new Set(listings.map((listing) => listing.stallionId))],
          },
        },
      });
      const stallionsById = new Map(stallions.map((stallion) => [stallion.id, stallion]));

      return listings.flatMap((listing) => {
        const stallion = stallionsById.get(listing.stallionId);

        if (!stallion) {
          return [];
        }

        const record = {
          listing: toSemenListing(listing),
          stallion: toStallionLike(stallion),
        };

        return matchesListingTextFilters(record, filters) ? [record] : [];
      });
    },
    async createAuditLog(auditLog) {
      const persisted = await client.auditLog.create({
        data: toAuditLogCreateData(auditLog),
      });

      return toAuditLog(persisted);
    },
  };
}

function toStallion(row: PrismaStallionRow): Stallion {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    ueln: row.ueln,
    microchipNumber: row.microchipNumber,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    status: row.status as StallionStatus,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toStallionLike(row: PrismaStallionRow): StallionLike {
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    ueln: row.ueln,
    microchipNumber: row.microchipNumber,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    status: row.status as StallionStatus,
  };
}

function toSemenListing(row: PrismaSemenListingRow): SemenListing {
  return {
    id: row.id,
    stallionId: row.stallionId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    availabilityStatus: row.availabilityStatus as SemenAvailabilityStatus,
    listingStatus: row.listingStatus as SemenListingStatus,
    termsSummary: row.termsSummary,
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
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

function toStallionCreateData(stallion: Stallion) {
  return {
    id: stallion.id ?? undefined,
    name: stallion.name,
    breed: stallion.breed,
    ueln: stallion.ueln,
    microchipNumber: stallion.microchipNumber,
    breedingStationOrganizationId: stallion.breedingStationOrganizationId,
    status: stallion.status,
    createdByUserId: stallion.createdByUserId,
    updatedByUserId: stallion.updatedByUserId,
    createdAt: new Date(stallion.createdAt),
    updatedAt: new Date(stallion.updatedAt),
  };
}

function toStallionUpdateData(stallion: Stallion) {
  return {
    name: stallion.name,
    breed: stallion.breed,
    ueln: stallion.ueln,
    microchipNumber: stallion.microchipNumber,
    status: stallion.status,
    updatedByUserId: stallion.updatedByUserId,
    updatedAt: new Date(stallion.updatedAt),
  };
}

function toSemenListingCreateData(listing: SemenListing) {
  return {
    id: listing.id ?? undefined,
    stallionId: listing.stallionId,
    breedingStationOrganizationId: listing.breedingStationOrganizationId,
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    termsSummary: listing.termsSummary,
    createdByUserId: listing.createdByUserId,
    updatedByUserId: listing.updatedByUserId,
    createdAt: new Date(listing.createdAt),
    updatedAt: new Date(listing.updatedAt),
  };
}

function toSemenListingUpdateData(listing: SemenListing) {
  return {
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    termsSummary: listing.termsSummary,
    updatedByUserId: listing.updatedByUserId,
    updatedAt: new Date(listing.updatedAt),
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

function toStallionWhere(filters: StallionSearchFilters) {
  return {
    ...(filters.breedingStationOrganizationId
      ? { breedingStationOrganizationId: filters.breedingStationOrganizationId }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
  };
}

function toSemenListingWhere(filters: SemenListingSearchFilters) {
  return {
    ...(filters.stallionId ? { stallionId: filters.stallionId } : {}),
    ...(filters.breedingStationOrganizationId
      ? { breedingStationOrganizationId: filters.breedingStationOrganizationId }
      : {}),
    ...(filters.availabilityStatus ? { availabilityStatus: filters.availabilityStatus } : {}),
    ...(filters.listingStatus ? { listingStatus: filters.listingStatus } : {}),
  };
}

function matchesStallionTextFilters(stallion: Stallion, filters: StallionSearchFilters) {
  return matchesContains(stallion.name, filters.name) &&
    matchesContains(stallion.breed, filters.breed);
}

function matchesListingTextFilters(
  record: SemenListingRecord,
  filters: SemenListingSearchFilters,
) {
  return matchesContains(record.stallion.name, filters.stallion) &&
    matchesContains(record.stallion.breed, filters.breed);
}

function matchesContains(value: string, query: string | null | undefined) {
  const normalizedQuery = query?.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return value.toLowerCase().includes(normalizedQuery);
}

function toJsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toNullableJsonObjectInput(value: Record<string, unknown> | null) {
  return value ?? undefined;
}

function requireId(value: string | null | undefined, label: string) {
  if (!value) {
    throw new Error(`${label} is required.`);
  }

  return value;
}
