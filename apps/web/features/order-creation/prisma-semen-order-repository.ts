import { prisma as defaultPrisma } from "@coritech/database";

import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type {
  SemenListingLike,
  SemenListingRecord,
  StallionLike,
} from "@coritech/domain/catalog/semen-catalog.d.ts";
import type {
  OrderStatusHistory,
  PreparedPersistedSemenOrderStatusChange,
  SemenOrder,
  SemenOrderRepository,
  SemenOrderStatus,
} from "@coritech/domain/orders/semen-order.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";

type PrismaOrderClient = {
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
  $transaction<T>(operation: (tx: PrismaOrderClient) => Promise<T>): Promise<T>;
  semenListing: {
    findUnique(input: unknown): Promise<PrismaSemenListingRow | null>;
    findMany(input?: unknown): Promise<PrismaSemenListingRow[]>;
  };
  stallion: {
    findMany(input?: unknown): Promise<PrismaStallionRow[]>;
  };
  organization: {
    findMany(input?: unknown): Promise<PrismaOrganizationRow[]>;
  };
  semenOrder: {
    create(input: unknown): Promise<PrismaSemenOrderRow>;
    update(input: unknown): Promise<PrismaSemenOrderRow>;
    findUnique(input: unknown): Promise<PrismaSemenOrderRow | null>;
    findMany(input?: unknown): Promise<PrismaSemenOrderRow[]>;
  };
  orderStatusHistory: {
    create(input: unknown): Promise<PrismaOrderStatusHistoryRow>;
    findMany(input?: unknown): Promise<PrismaOrderStatusHistoryRow[]>;
  };
  auditLog: {
    create(input: unknown): Promise<PrismaAuditLogRow>;
  };
  proofEvent: {
    create(input: unknown): Promise<PrismaProofEventRow>;
    findFirst(input: unknown): Promise<PrismaProofEventRow | null>;
    findMany(input?: unknown): Promise<PrismaProofEventRow[]>;
  };
};

type PrismaSemenListingRow = {
  id: string;
  stallionId: string;
  breedingStationOrganizationId: string;
  availabilityStatus: string;
  listingStatus: string;
  termsSummary: string | null;
};

type PrismaStallionRow = {
  id: string;
  name: string;
  breed: string;
  ueln: string | null;
  microchipNumber: string | null;
  breedingStationOrganizationId: string;
  status: string;
};

type PrismaOrganizationRow = {
  id: string;
  name: string;
};

type PrismaSemenOrderRow = {
  id: string;
  orderNumber: string;
  semenListingId: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: string;
  requestedDeliveryDate: Date | null;
  mareName: string | null;
  mareRegistrationReference: string | null;
  mareBreed: string | null;
  mareOwnerName: string | null;
  intendedInseminationContext: string | null;
  vetOrRecipientContact: string | null;
  shippingContactName: string | null;
  shippingContactPhone: string | null;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingRegion: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  specialInstructions: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaOrderStatusHistoryRow = {
  id: string;
  semenOrderId: string;
  orderNumber: string;
  fromStatus: string | null;
  toStatus: string;
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  reason: string | null;
  changedAt: Date;
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

type PrismaProofEventRow = {
  id: string;
  eventType: string;
  source: string;
  triggerType: string;
  triggerRef: unknown;
  semenOrderId: string | null;
  shipmentId: string | null;
  horseId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
  lifecycleStage: string;
  verificationLevel: string;
  status: string;
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  documentationRefs: unknown;
  signatureRef: unknown;
  attestationRefs: unknown;
  auditLogId: string | null;
  auditHookRef: unknown;
  occurredAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SemenOrderListFilters = {
  breederOrganizationId?: string;
  breedingStationOrganizationId?: string;
  statuses?: SemenOrderStatus[];
};

export type ProofEventListFilters = {
  semenOrderId?: string;
  limit?: number | null;
};

export interface PrismaSemenOrderRepository extends SemenOrderRepository {
  listSemenOrders(filters?: SemenOrderListFilters): Promise<SemenOrder[]>;
  listAllOrderStatusHistory(filters?: SemenOrderListFilters): Promise<OrderStatusHistory[]>;
  listProofEventsForOrder(orderId: string): Promise<ProofEvent[]>;
  listProofEvents(filters?: ProofEventListFilters): Promise<ProofEvent[]>;
  listOrderableSemenListingRecords(): Promise<SemenListingRecord[]>;
  listOrganizationsByIds(organizationIds: string[]): Promise<{ organizationId: string; name: string }[]>;
  listStationOrganizations(): Promise<{ organizationId: string; name: string }[]>;
}

export function createPrismaSemenOrderRepository(
  client: PrismaOrderClient = defaultPrisma as unknown as PrismaOrderClient,
): PrismaSemenOrderRepository {
  return {
    async findSemenListingById(listingId) {
      const listing = await client.semenListing.findUnique({
        where: {
          id: listingId,
        },
      });

      return listing ? toSemenListing(listing) : null;
    },
    async nextSemenOrderNumberSequence() {
      const rows = await client.$queryRawUnsafe<{ sequence: bigint | number | string }[]>(
        "SELECT nextval('semen_order_number_sequence') AS sequence",
      );
      const sequence = Number(rows[0]?.sequence);

      if (!Number.isInteger(sequence) || sequence <= 0) {
        throw new Error("Could not allocate a semen order number sequence.");
      }

      return sequence;
    },
    async createSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = await client.semenOrder.create({
        data: toSemenOrderCreateData(order),
      });
      const persistedStatusHistory = await client.orderStatusHistory.create({
        data: toOrderStatusHistoryCreateData({
          ...statusHistory,
          semenOrderId: persistedOrder.id,
        }),
      });

      return toPersistedChange(persistedOrder, persistedStatusHistory);
    },
    async updateSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = await client.semenOrder.update({
        where: {
          id: requireId(order.id, "order.id"),
        },
        data: toSemenOrderUpdateData(order),
      });
      const persistedStatusHistory = await client.orderStatusHistory.create({
        data: toOrderStatusHistoryCreateData({
          ...statusHistory,
          semenOrderId: persistedOrder.id,
        }),
      });

      return toPersistedChange(persistedOrder, persistedStatusHistory);
    },
    async updateDraftSemenOrder(order) {
      const persistedOrder = await client.semenOrder.update({
        where: {
          id: requireId(order.id, "order.id"),
        },
        data: toSemenOrderUpdateData(order),
      });

      return toSemenOrder(persistedOrder);
    },
    async findSemenOrderById(orderId) {
      const order = await client.semenOrder.findUnique({
        where: {
          id: orderId,
        },
      });

      return order ? toSemenOrder(order) : null;
    },
    async listOrderStatusHistory(orderId) {
      const statusHistory = await client.orderStatusHistory.findMany({
        where: {
          semenOrderId: orderId,
        },
        orderBy: [
          { changedAt: "asc" },
          { id: "asc" },
        ],
      });

      return statusHistory.map(toOrderStatusHistory);
    },
    async createAuditLog(auditLog) {
      const persisted = await client.auditLog.create({
        data: toAuditLogCreateData(auditLog),
      });

      return toAuditLog(persisted);
    },
    async createProofEvent(proofEvent) {
      const existing = await findExistingProofEvent(client, proofEvent);

      if (existing) {
        return toProofEvent(existing);
      }

      const persisted = await client.proofEvent.create({
        data: toProofEventCreateData(proofEvent),
      });

      return toProofEvent(persisted);
    },
    async listProofEventsForOrder(orderId) {
      const proofEvents = await client.proofEvent.findMany({
        where: {
          semenOrderId: orderId,
        },
        orderBy: [
          { occurredAt: "asc" },
          { id: "asc" },
        ],
      });

      return proofEvents.map(toProofEvent);
    },
    async listProofEvents(filters = {}) {
      const proofEvents = await client.proofEvent.findMany({
        where: {
          ...(filters.semenOrderId ? { semenOrderId: filters.semenOrderId } : {}),
        },
        orderBy: [
          { occurredAt: "desc" },
          { id: "asc" },
        ],
        take: filters.limit === null ? undefined : filters.limit ?? 100,
      });

      return proofEvents.map(toProofEvent);
    },
    async listSemenOrders(filters = {}) {
      const orders = await client.semenOrder.findMany({
        where: toSemenOrderWhere(filters),
        orderBy: [
          { updatedAt: "desc" },
          { id: "asc" },
        ],
      });

      return orders.map(toSemenOrder);
    },
    async listAllOrderStatusHistory(filters = {}) {
      const orders = await client.semenOrder.findMany({
        where: toSemenOrderWhere(filters),
      });
      const orderIds = orders.map((order) => order.id);

      if (orderIds.length === 0) {
        return [];
      }

      const history = await client.orderStatusHistory.findMany({
        where: {
          semenOrderId: {
            in: orderIds,
          },
        },
        orderBy: [
          { changedAt: "asc" },
          { id: "asc" },
        ],
      });

      return history.map(toOrderStatusHistory);
    },
    async listOrderableSemenListingRecords() {
      const listings = await client.semenListing.findMany({
        where: {
          listingStatus: "ACTIVE",
          availabilityStatus: {
            in: ["AVAILABLE", "LIMITED"],
          },
        },
        orderBy: [
          { updatedAt: "desc" },
          { id: "asc" },
        ],
      });
      const stallionIds = [...new Set(listings.map((listing) => listing.stallionId))];
      const stallions = await client.stallion.findMany({
        where: {
          id: {
            in: stallionIds,
          },
        },
      });
      const stallionsById = new Map(stallions.map((stallion) => [stallion.id, stallion]));

      return listings.flatMap((listing) => {
        const stallion = stallionsById.get(listing.stallionId);

        if (!stallion) {
          return [];
        }

        return [{
          listing: toSemenListing(listing),
          stallion: toStallion(stallion),
        }];
      });
    },
    async listOrganizationsByIds(organizationIds) {
      const uniqueOrganizationIds = [...new Set(organizationIds)].filter(Boolean);

      if (uniqueOrganizationIds.length === 0) {
        return [];
      }

      const organizations = await client.organization.findMany({
        where: {
          id: {
            in: uniqueOrganizationIds,
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      return organizations.map((organization) => ({
        organizationId: organization.id,
        name: organization.name,
      }));
    },
    async listStationOrganizations() {
      const organizations = await client.organization.findMany({
        where: {
          organizationType: "BREEDING_STATION",
          status: "ACTIVE",
        },
        orderBy: {
          name: "asc",
        },
      });

      return organizations.map((organization) => ({
        organizationId: organization.id,
        name: organization.name,
      }));
    },
  };
}

export function createPrismaSemenOrderTransaction(
  client: PrismaOrderClient = defaultPrisma as unknown as PrismaOrderClient,
) {
  return async function runPrismaSemenOrderTransaction<T>(
    operation: (repository?: SemenOrderRepository) => Promise<T>,
  ) {
    return client.$transaction((tx) =>
      operation(createPrismaSemenOrderRepository(tx))
    );
  };
}

function toPersistedChange(
  order: PrismaSemenOrderRow,
  statusHistory: PrismaOrderStatusHistoryRow,
): PreparedPersistedSemenOrderStatusChange {
  return {
    order: toSemenOrder(order),
    statusHistory: toOrderStatusHistory(statusHistory),
  };
}

function toSemenListing(listing: PrismaSemenListingRow): SemenListingLike {
  return {
    id: listing.id,
    stallionId: listing.stallionId,
    breedingStationOrganizationId: listing.breedingStationOrganizationId,
    availabilityStatus: listing.availabilityStatus as SemenListingLike["availabilityStatus"],
    listingStatus: listing.listingStatus as SemenListingLike["listingStatus"],
    termsSummary: listing.termsSummary,
  };
}

function toStallion(stallion: PrismaStallionRow): StallionLike {
  return {
    id: stallion.id,
    name: stallion.name,
    breed: stallion.breed,
    ueln: stallion.ueln,
    microchipNumber: stallion.microchipNumber,
    breedingStationOrganizationId: stallion.breedingStationOrganizationId,
    status: stallion.status as StallionLike["status"],
  };
}

function toSemenOrder(order: PrismaSemenOrderRow): SemenOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    semenListingId: order.semenListingId,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    status: order.status as SemenOrderStatus,
    requestedDeliveryDate: dateOnlyToString(order.requestedDeliveryDate),
    mareName: order.mareName,
    mareRegistrationReference: order.mareRegistrationReference,
    mareBreed: order.mareBreed,
    mareOwnerName: order.mareOwnerName,
    intendedInseminationContext: order.intendedInseminationContext,
    vetOrRecipientContact: order.vetOrRecipientContact,
    shippingContactName: order.shippingContactName,
    shippingContactPhone: order.shippingContactPhone,
    shippingAddressLine1: order.shippingAddressLine1,
    shippingAddressLine2: order.shippingAddressLine2,
    shippingCity: order.shippingCity,
    shippingRegion: order.shippingRegion,
    shippingPostalCode: order.shippingPostalCode,
    shippingCountry: order.shippingCountry,
    specialInstructions: order.specialInstructions,
    createdByUserId: order.createdByUserId,
    updatedByUserId: order.updatedByUserId,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function toOrderStatusHistory(row: PrismaOrderStatusHistoryRow): OrderStatusHistory {
  return {
    id: row.id,
    semenOrderId: row.semenOrderId,
    orderNumber: row.orderNumber,
    fromStatus: row.fromStatus as SemenOrderStatus | null,
    toStatus: row.toStatus as SemenOrderStatus,
    actorUserId: row.actorUserId,
    actorRoleCode: row.actorRoleCode as OrderStatusHistory["actorRoleCode"],
    actorOrganizationId: row.actorOrganizationId,
    reason: row.reason,
    changedAt: row.changedAt.toISOString(),
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

function toProofEvent(row: PrismaProofEventRow): ProofEvent {
  return {
    id: row.id,
    eventType: row.eventType as ProofEvent["eventType"],
    source: row.source as ProofEvent["source"],
    triggerType: row.triggerType,
    triggerRef: toJsonObject(row.triggerRef),
    semenOrderId: row.semenOrderId,
    shipmentId: row.shipmentId,
    horseId: row.horseId,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    lifecycleStage: row.lifecycleStage as ProofEvent["lifecycleStage"],
    verificationLevel: row.verificationLevel as ProofEvent["verificationLevel"],
    status: row.status as ProofEvent["status"],
    actorUserId: row.actorUserId,
    actorRoleCode: row.actorRoleCode as ProofEvent["actorRoleCode"],
    actorOrganizationId: row.actorOrganizationId,
    documentationRefs: toJsonArray(row.documentationRefs),
    signatureRef: row.signatureRef == null ? null : toJsonObject(row.signatureRef),
    attestationRefs: toJsonArray(row.attestationRefs),
    auditLogId: row.auditLogId,
    auditHookRef: toJsonObject(row.auditHookRef),
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toSemenOrderCreateData(order: SemenOrder) {
  return {
    id: order.id ?? undefined,
    orderNumber: order.orderNumber,
    semenListingId: order.semenListingId,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    status: order.status,
    ...toSemenOrderMutableData(order),
    createdByUserId: order.createdByUserId,
    updatedByUserId: order.updatedByUserId,
    createdAt: new Date(order.createdAt),
    updatedAt: new Date(order.updatedAt),
  };
}

function toSemenOrderUpdateData(order: SemenOrder) {
  return {
    status: order.status,
    ...toSemenOrderMutableData(order),
    updatedByUserId: order.updatedByUserId,
    updatedAt: new Date(order.updatedAt),
  };
}

function toSemenOrderMutableData(order: SemenOrder) {
  return {
    requestedDeliveryDate: dateOnlyToDate(order.requestedDeliveryDate),
    mareName: order.mareName,
    mareRegistrationReference: order.mareRegistrationReference,
    mareBreed: order.mareBreed,
    mareOwnerName: order.mareOwnerName,
    intendedInseminationContext: order.intendedInseminationContext,
    vetOrRecipientContact: order.vetOrRecipientContact,
    shippingContactName: order.shippingContactName,
    shippingContactPhone: order.shippingContactPhone,
    shippingAddressLine1: order.shippingAddressLine1,
    shippingAddressLine2: order.shippingAddressLine2,
    shippingCity: order.shippingCity,
    shippingRegion: order.shippingRegion,
    shippingPostalCode: order.shippingPostalCode,
    shippingCountry: order.shippingCountry,
    specialInstructions: order.specialInstructions,
  };
}

function toOrderStatusHistoryCreateData(history: OrderStatusHistory) {
  return {
    id: history.id ?? undefined,
    semenOrderId: requireId(history.semenOrderId, "statusHistory.semenOrderId"),
    orderNumber: history.orderNumber,
    fromStatus: history.fromStatus,
    toStatus: history.toStatus,
    actorUserId: history.actorUserId,
    actorRoleCode: history.actorRoleCode,
    actorOrganizationId: history.actorOrganizationId,
    reason: history.reason,
    changedAt: new Date(history.changedAt),
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
    previousValues: auditLog.previousValues,
    newValues: auditLog.newValues,
    reason: auditLog.reason,
    ipAddress: auditLog.ipAddress,
    userAgent: auditLog.userAgent,
    metadata: auditLog.metadata,
    occurredAt: new Date(auditLog.occurredAt),
    createdAt: new Date(auditLog.createdAt),
  };
}

function toProofEventCreateData(proofEvent: ProofEvent) {
  return {
    id: proofEvent.id ?? undefined,
    eventType: proofEvent.eventType,
    source: proofEvent.source,
    triggerType: proofEvent.triggerType,
    triggerRef: proofEvent.triggerRef,
    semenOrderId: proofEvent.semenOrderId,
    shipmentId: proofEvent.shipmentId,
    horseId: proofEvent.horseId,
    orderNumber: proofEvent.orderNumber,
    breederOrganizationId: proofEvent.breederOrganizationId,
    breedingStationOrganizationId: proofEvent.breedingStationOrganizationId,
    lifecycleStage: proofEvent.lifecycleStage,
    verificationLevel: proofEvent.verificationLevel,
    status: proofEvent.status,
    actorUserId: proofEvent.actorUserId,
    actorRoleCode: proofEvent.actorRoleCode,
    actorOrganizationId: proofEvent.actorOrganizationId,
    documentationRefs: [...proofEvent.documentationRefs],
    signatureRef: proofEvent.signatureRef,
    attestationRefs: [...proofEvent.attestationRefs],
    auditLogId: proofEvent.auditLogId,
    auditHookRef: proofEvent.auditHookRef,
    occurredAt: new Date(proofEvent.occurredAt),
    createdAt: new Date(proofEvent.createdAt),
    updatedAt: new Date(proofEvent.updatedAt),
  };
}

async function findExistingProofEvent(
  client: PrismaOrderClient,
  proofEvent: ProofEvent,
): Promise<PrismaProofEventRow | null> {
  const existing = await client.proofEvent.findFirst({
    where: {
      eventType: proofEvent.eventType,
      source: proofEvent.source,
      triggerType: proofEvent.triggerType,
      semenOrderId: proofEvent.semenOrderId,
      shipmentId: proofEvent.shipmentId,
      orderNumber: proofEvent.orderNumber,
      status: "RECORDED",
    },
    orderBy: [
      { occurredAt: "asc" },
      { id: "asc" },
    ],
  });

  if (!existing) {
    return null;
  }

  return stableJson(existing.triggerRef) === stableJson(proofEvent.triggerRef)
    ? existing
    : null;
}

function toSemenOrderWhere(filters: SemenOrderListFilters) {
  return {
    breederOrganizationId: filters.breederOrganizationId,
    breedingStationOrganizationId: filters.breedingStationOrganizationId,
    status: filters.statuses?.length
      ? {
        in: filters.statuses,
      }
      : undefined,
  };
}

function dateOnlyToDate(value: string | null): Date | null {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

function dateOnlyToString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function requireId(value: string | null, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required for persistent semen order storage.`);
  }

  return value;
}

function toJsonObject(value: unknown): Readonly<Record<string, unknown>> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function toJsonArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

function stableJson(value: unknown): string {
  return JSON.stringify(sortJson(value));
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, item]) => [key, sortJson(item)]),
    );
  }

  return value;
}
