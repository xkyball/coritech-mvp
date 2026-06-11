import { prisma as defaultPrisma } from "@coritech/database";

import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type { SemenOrder, SemenOrderStatus } from "@coritech/domain/orders/semen-order.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";
import type {
  PreparedPersistedShipmentTrackingChange,
  Shipment,
  ShipmentRepository,
  ShipmentStatus,
  ShipmentTrackingEvent,
} from "@coritech/domain/shipments/shipment.d.ts";

type PrismaShipmentClient = {
  $transaction<T>(operation: (tx: PrismaShipmentClient) => Promise<T>): Promise<T>;
  semenOrder: {
    findUnique(input: unknown): Promise<PrismaSemenOrderRow | null>;
    findMany(input?: unknown): Promise<PrismaSemenOrderRow[]>;
  };
  shipment: {
    create(input: unknown): Promise<PrismaShipmentRow>;
    update(input: unknown): Promise<PrismaShipmentRow>;
    findUnique(input: unknown): Promise<PrismaShipmentRow | null>;
    findMany(input?: unknown): Promise<PrismaShipmentRow[]>;
  };
  shipmentTrackingEvent: {
    create(input: unknown): Promise<PrismaShipmentTrackingEventRow>;
    findMany(input?: unknown): Promise<PrismaShipmentTrackingEventRow[]>;
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

type PrismaShipmentRow = {
  id: string;
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: string;
  providerName: string | null;
  providerTrackingId: string | null;
  trackingUrl: string | null;
  deliveredAt: Date | null;
  confirmedReceivedAt: Date | null;
  confirmedByUserId: string | null;
  confirmationSource: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaShipmentTrackingEventRow = {
  id: string;
  shipmentId: string;
  semenOrderId: string;
  orderNumber: string;
  fromStatus: string | null;
  toStatus: string;
  eventSource: string;
  sourceEventId: string | null;
  providerStatus: string | null;
  location: string | null;
  notes: string | null;
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  occurredAt: Date;
  recordedAt: Date;
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

export type ShipmentListFilters = {
  semenOrderId?: string;
  semenOrderIds?: string[];
  breederOrganizationId?: string;
  breedingStationOrganizationId?: string;
};

export interface PrismaShipmentRepository extends ShipmentRepository {
  listShipments(filters?: ShipmentListFilters): Promise<Shipment[]>;
  listShipmentTrackingEventsForOrders(orderIds: string[]): Promise<ShipmentTrackingEvent[]>;
}

export function createPrismaShipmentRepository(
  client: PrismaShipmentClient = defaultPrisma as unknown as PrismaShipmentClient,
): PrismaShipmentRepository {
  return {
    async findSemenOrderById(orderId) {
      const order = await client.semenOrder.findUnique({
        where: {
          id: orderId,
        },
      });

      return order ? toSemenOrder(order) : null;
    },
    async createShipmentWithTrackingEvent(shipment, trackingEvent) {
      const persistedShipment = await client.shipment.create({
        data: toShipmentCreateData(shipment),
      });
      const persistedTrackingEvent = await client.shipmentTrackingEvent.create({
        data: toShipmentTrackingEventCreateData({
          ...trackingEvent,
          shipmentId: persistedShipment.id,
        }),
      });

      return toPersistedChange(persistedShipment, persistedTrackingEvent);
    },
    async findShipmentById(shipmentId) {
      const shipment = await client.shipment.findUnique({
        where: {
          id: shipmentId,
        },
      });

      return shipment ? toShipment(shipment) : null;
    },
    async updateShipmentWithTrackingEvent(shipment, trackingEvent) {
      const persistedShipment = await client.shipment.update({
        where: {
          id: requireId(shipment.id, "shipment.id"),
        },
        data: toShipmentUpdateData(shipment),
      });
      const persistedTrackingEvent = await client.shipmentTrackingEvent.create({
        data: toShipmentTrackingEventCreateData({
          ...trackingEvent,
          shipmentId: persistedShipment.id,
        }),
      });

      return toPersistedChange(persistedShipment, persistedTrackingEvent);
    },
    async listShipmentsForOrder(orderId) {
      return this.listShipments({ semenOrderId: orderId });
    },
    async listShipmentTrackingEvents(shipmentId) {
      const events = await client.shipmentTrackingEvent.findMany({
        where: {
          shipmentId,
        },
        orderBy: [
          { occurredAt: "asc" },
          { id: "asc" },
        ],
      });

      return events.map(toShipmentTrackingEvent);
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
    async listProofEventsForShipment(shipmentId) {
      const proofEvents = await client.proofEvent.findMany({
        where: {
          shipmentId,
        },
        orderBy: [
          { occurredAt: "asc" },
          { id: "asc" },
        ],
      });

      return proofEvents.map(toProofEvent);
    },
    async listShipments(filters = {}) {
      const shipments = await client.shipment.findMany({
        where: toShipmentWhere(filters),
        orderBy: [
          { updatedAt: "desc" },
          { id: "asc" },
        ],
      });

      return shipments.map(toShipment);
    },
    async listShipmentTrackingEventsForOrders(orderIds) {
      if (orderIds.length === 0) {
        return [];
      }

      const events = await client.shipmentTrackingEvent.findMany({
        where: {
          semenOrderId: {
            in: orderIds,
          },
        },
        orderBy: [
          { occurredAt: "asc" },
          { id: "asc" },
        ],
      });

      return events.map(toShipmentTrackingEvent);
    },
  };
}

export function createPrismaShipmentTransaction(
  client: PrismaShipmentClient = defaultPrisma as unknown as PrismaShipmentClient,
) {
  return async function runPrismaShipmentTransaction<T>(
    operation: (repository?: ShipmentRepository) => Promise<T>,
  ) {
    return client.$transaction((tx) =>
      operation(createPrismaShipmentRepository(tx))
    );
  };
}

function toPersistedChange(
  shipment: PrismaShipmentRow,
  trackingEvent: PrismaShipmentTrackingEventRow,
): PreparedPersistedShipmentTrackingChange {
  return {
    shipment: toShipment(shipment),
    trackingEvent: toShipmentTrackingEvent(trackingEvent),
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

function toShipment(row: PrismaShipmentRow): Shipment {
  return {
    id: row.id,
    semenOrderId: row.semenOrderId,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    status: row.status as ShipmentStatus,
    providerName: row.providerName,
    providerTrackingId: row.providerTrackingId,
    trackingUrl: row.trackingUrl,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    confirmedReceivedAt: row.confirmedReceivedAt?.toISOString() ?? null,
    confirmedByUserId: row.confirmedByUserId,
    confirmationSource: row.confirmationSource as Shipment["confirmationSource"],
    createdByUserId: row.createdByUserId,
    updatedByUserId: row.updatedByUserId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toShipmentTrackingEvent(row: PrismaShipmentTrackingEventRow): ShipmentTrackingEvent {
  return {
    id: row.id,
    shipmentId: row.shipmentId,
    semenOrderId: row.semenOrderId,
    orderNumber: row.orderNumber,
    fromStatus: row.fromStatus as ShipmentTrackingEvent["fromStatus"],
    toStatus: row.toStatus as ShipmentTrackingEvent["toStatus"],
    eventSource: row.eventSource as ShipmentTrackingEvent["eventSource"],
    sourceEventId: row.sourceEventId,
    providerStatus: row.providerStatus,
    location: row.location,
    notes: row.notes,
    actorUserId: row.actorUserId,
    actorRoleCode: row.actorRoleCode as ShipmentTrackingEvent["actorRoleCode"],
    actorOrganizationId: row.actorOrganizationId,
    occurredAt: row.occurredAt.toISOString(),
    recordedAt: row.recordedAt.toISOString(),
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

function toShipmentCreateData(shipment: Shipment) {
  return {
    id: shipment.id ?? undefined,
    semenOrderId: requireId(shipment.semenOrderId, "shipment.semenOrderId"),
    orderNumber: shipment.orderNumber,
    breederOrganizationId: shipment.breederOrganizationId,
    breedingStationOrganizationId: shipment.breedingStationOrganizationId,
    status: shipment.status,
    ...toShipmentMutableData(shipment),
    createdByUserId: shipment.createdByUserId,
    updatedByUserId: shipment.updatedByUserId,
    createdAt: new Date(shipment.createdAt),
    updatedAt: new Date(shipment.updatedAt),
  };
}

function toShipmentUpdateData(shipment: Shipment) {
  return {
    status: shipment.status,
    ...toShipmentMutableData(shipment),
    updatedByUserId: shipment.updatedByUserId,
    updatedAt: new Date(shipment.updatedAt),
  };
}

function toShipmentMutableData(shipment: Shipment) {
  return {
    providerName: shipment.providerName,
    providerTrackingId: shipment.providerTrackingId,
    trackingUrl: shipment.trackingUrl,
    deliveredAt: shipment.deliveredAt ? new Date(shipment.deliveredAt) : null,
    confirmedReceivedAt: shipment.confirmedReceivedAt
      ? new Date(shipment.confirmedReceivedAt)
      : null,
    confirmedByUserId: shipment.confirmedByUserId,
    confirmationSource: shipment.confirmationSource,
  };
}

function toShipmentTrackingEventCreateData(event: ShipmentTrackingEvent) {
  return {
    id: event.id ?? undefined,
    shipmentId: requireId(event.shipmentId, "trackingEvent.shipmentId"),
    semenOrderId: requireId(event.semenOrderId, "trackingEvent.semenOrderId"),
    orderNumber: event.orderNumber,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    eventSource: event.eventSource,
    sourceEventId: event.sourceEventId,
    providerStatus: event.providerStatus,
    location: event.location,
    notes: event.notes,
    actorUserId: event.actorUserId,
    actorRoleCode: event.actorRoleCode,
    actorOrganizationId: event.actorOrganizationId,
    occurredAt: new Date(event.occurredAt),
    recordedAt: new Date(event.recordedAt),
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
  client: PrismaShipmentClient,
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

function toShipmentWhere(filters: ShipmentListFilters) {
  return {
    semenOrderId: filters.semenOrderIds?.length
      ? {
        in: filters.semenOrderIds,
      }
      : filters.semenOrderId,
    breederOrganizationId: filters.breederOrganizationId,
    breedingStationOrganizationId: filters.breedingStationOrganizationId,
  };
}

function dateOnlyToString(value: Date | null): string | null {
  return value ? value.toISOString().slice(0, 10) : null;
}

function requireId(value: string | null, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName} is required for persistent shipment storage.`);
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
