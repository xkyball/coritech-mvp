import { prisma as defaultPrisma } from "@coritech/database";

import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type {
  Document,
  DocumentEvidenceRepository,
  EvidenceAttachment,
  ProofEventLinkTargetLike,
  SemenOrderLinkTargetLike,
  ShipmentLinkTargetLike,
} from "@coritech/domain/documents/document-evidence.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";

type PrismaDocumentClient = {
  semenOrder: {
    findUnique(input: unknown): Promise<PrismaSemenOrderRow | null>;
  };
  shipment: {
    findUnique(input: unknown): Promise<PrismaShipmentRow | null>;
  };
  proofEvent: {
    create(input: unknown): Promise<PrismaProofEventRow>;
    findUnique(input: unknown): Promise<PrismaProofEventRow | null>;
  };
  document: {
    create(input: unknown): Promise<PrismaDocumentRow>;
    update(input: unknown): Promise<PrismaDocumentRow>;
    findUnique(input: unknown): Promise<PrismaDocumentRow | null>;
    findMany(input?: unknown): Promise<PrismaDocumentRow[]>;
  };
  evidenceAttachment: {
    create(input: unknown): Promise<PrismaEvidenceAttachmentRow>;
    findMany(input?: unknown): Promise<PrismaEvidenceAttachmentRow[]>;
  };
  auditLog: {
    create(input: unknown): Promise<PrismaAuditLogRow>;
  };
};

type PrismaSemenOrderRow = {
  id: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
};

type PrismaShipmentRow = {
  id: string;
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
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

type PrismaDocumentRow = {
  id: string;
  documentType: string;
  description: string | null;
  targetType: string;
  targetId: string;
  semenOrderId: string | null;
  shipmentId: string | null;
  proofEventId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: bigint | number;
  checksumSha256: string | null;
  storageProvider: string;
  storageBucket: string;
  storageObjectKey: string;
  storageRegion: string | null;
  storageVersionId: string | null;
  accessClassification: string;
  status: string;
  replacedByDocumentId: string | null;
  revocationReason: string | null;
  replacementReason: string | null;
  lifecycleChangedAt: Date | null;
  lifecycleChangedByUserId: string | null;
  lifecycleChangedByRoleCode: string | null;
  lifecycleChangedByOrganizationId: string | null;
  uploadedByUserId: string;
  uploaderRoleCode: string;
  uploaderOrganizationId: string;
  createdAt: Date;
  updatedAt: Date;
};

type PrismaEvidenceAttachmentRow = {
  id: string;
  proofEventId: string;
  documentId: string;
  documentTargetType: string;
  documentTargetId: string;
  attachedByUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  attachedAt: Date;
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

export interface PrismaDocumentRepository extends DocumentEvidenceRepository {
  listDocumentsForOrders(orderIds: string[]): Promise<Document[]>;
}

export function createPrismaDocumentRepository(
  client: PrismaDocumentClient = defaultPrisma as unknown as PrismaDocumentClient,
): PrismaDocumentRepository {
  return {
    async findSemenOrderById(orderId) {
      const order = await client.semenOrder.findUnique({
        where: {
          id: orderId,
        },
      });

      return order ? toSemenOrderLinkTarget(order) : null;
    },
    async findShipmentById(shipmentId) {
      const shipment = await client.shipment.findUnique({
        where: {
          id: shipmentId,
        },
      });

      return shipment ? toShipmentLinkTarget(shipment) : null;
    },
    async findProofEventById(proofEventId) {
      const proofEvent = await client.proofEvent.findUnique({
        where: {
          id: proofEventId,
        },
      });

      return proofEvent ? toProofEventLinkTarget(proofEvent) : null;
    },
    async createDocument(document) {
      const persisted = await client.document.create({
        data: toDocumentCreateData(document),
      });

      return toDocument(persisted);
    },
    async createProofEvent(proofEvent) {
      const persisted = await client.proofEvent.create({
        data: toProofEventCreateData(proofEvent),
      });

      return toProofEvent(persisted);
    },
    async updateDocument(document) {
      const persisted = await client.document.update({
        where: {
          id: requireId(document.id, "document.id"),
        },
        data: toDocumentUpdateData(document),
      });

      return toDocument(persisted);
    },
    async findDocumentById(documentId) {
      const document = await client.document.findUnique({
        where: {
          id: documentId,
        },
      });

      return document ? toDocument(document) : null;
    },
    async listDocumentsForOrder(orderId) {
      const documents = await client.document.findMany({
        where: {
          semenOrderId: orderId,
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
      });

      return documents.map(toDocument);
    },
    async listDocumentsForShipment(shipmentId) {
      const documents = await client.document.findMany({
        where: {
          shipmentId,
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
      });

      return documents.map(toDocument);
    },
    async listDocumentsForOrders(orderIds) {
      if (orderIds.length === 0) {
        return [];
      }

      const documents = await client.document.findMany({
        where: {
          semenOrderId: {
            in: orderIds,
          },
        },
        orderBy: [
          { createdAt: "desc" },
          { id: "asc" },
        ],
      });

      return documents.map(toDocument);
    },
    async createEvidenceAttachment(evidenceAttachment) {
      const persisted = await client.evidenceAttachment.create({
        data: toEvidenceAttachmentCreateData(evidenceAttachment),
      });

      return toEvidenceAttachment(persisted);
    },
    async listEvidenceAttachmentsForProofEvent(proofEventId) {
      const attachments = await client.evidenceAttachment.findMany({
        where: {
          proofEventId,
        },
        orderBy: [
          { attachedAt: "asc" },
          { id: "asc" },
        ],
      });

      return attachments.map(toEvidenceAttachment);
    },
    async createAuditLog(auditLog) {
      const persisted = await client.auditLog.create({
        data: toAuditLogCreateData(auditLog),
      });

      return toAuditLog(persisted);
    },
  };
}

function toSemenOrderLinkTarget(row: PrismaSemenOrderRow): SemenOrderLinkTargetLike {
  return {
    id: row.id,
    targetType: "SemenOrder",
    targetId: row.id,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
  };
}

function toShipmentLinkTarget(row: PrismaShipmentRow): ShipmentLinkTargetLike {
  return {
    id: row.id,
    targetType: "Shipment",
    targetId: row.id,
    semenOrderId: row.semenOrderId,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
  };
}

function toProofEventLinkTarget(row: PrismaProofEventRow): ProofEventLinkTargetLike {
  return {
    id: row.id,
    targetType: "ProofEvent",
    targetId: row.id,
    semenOrderId: row.semenOrderId,
    shipmentId: row.shipmentId,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
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

function toDocument(row: PrismaDocumentRow): Document {
  return {
    id: row.id,
    documentType: row.documentType,
    description: row.description,
    targetType: row.targetType as Document["targetType"],
    targetId: row.targetId,
    semenOrderId: row.semenOrderId,
    shipmentId: row.shipmentId,
    proofEventId: row.proofEventId,
    orderNumber: row.orderNumber,
    breederOrganizationId: row.breederOrganizationId,
    breedingStationOrganizationId: row.breedingStationOrganizationId,
    originalFileName: row.originalFileName,
    contentType: row.contentType,
    fileSizeBytes: Number(row.fileSizeBytes),
    checksumSha256: row.checksumSha256,
    storageProvider: row.storageProvider,
    storageBucket: row.storageBucket,
    storageObjectKey: row.storageObjectKey,
    storageRegion: row.storageRegion,
    storageVersionId: row.storageVersionId,
    accessClassification: row.accessClassification as Document["accessClassification"],
    status: row.status as Document["status"],
    replacedByDocumentId: row.replacedByDocumentId,
    revocationReason: row.revocationReason,
    replacementReason: row.replacementReason,
    lifecycleChangedAt: row.lifecycleChangedAt?.toISOString() ?? null,
    lifecycleChangedByUserId: row.lifecycleChangedByUserId,
    lifecycleChangedByRoleCode: row.lifecycleChangedByRoleCode as Document["lifecycleChangedByRoleCode"],
    lifecycleChangedByOrganizationId: row.lifecycleChangedByOrganizationId,
    uploadedByUserId: row.uploadedByUserId,
    uploaderRoleCode: row.uploaderRoleCode as Document["uploaderRoleCode"],
    uploaderOrganizationId: row.uploaderOrganizationId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toDocumentCreateData(document: Document) {
  return {
    id: document.id ?? undefined,
    documentType: document.documentType,
    description: document.description,
    targetType: document.targetType,
    targetId: document.targetId,
    semenOrderId: document.semenOrderId,
    shipmentId: document.shipmentId,
    proofEventId: document.proofEventId,
    orderNumber: document.orderNumber,
    breederOrganizationId: document.breederOrganizationId,
    breedingStationOrganizationId: document.breedingStationOrganizationId,
    originalFileName: document.originalFileName,
    contentType: document.contentType,
    fileSizeBytes: BigInt(document.fileSizeBytes),
    checksumSha256: document.checksumSha256,
    storageProvider: document.storageProvider,
    storageBucket: document.storageBucket,
    storageObjectKey: document.storageObjectKey,
    storageRegion: document.storageRegion,
    storageVersionId: document.storageVersionId,
    accessClassification: document.accessClassification,
    status: document.status,
    replacedByDocumentId: document.replacedByDocumentId,
    revocationReason: document.revocationReason,
    replacementReason: document.replacementReason,
    lifecycleChangedAt: document.lifecycleChangedAt ? new Date(document.lifecycleChangedAt) : null,
    lifecycleChangedByUserId: document.lifecycleChangedByUserId,
    lifecycleChangedByRoleCode: document.lifecycleChangedByRoleCode,
    lifecycleChangedByOrganizationId: document.lifecycleChangedByOrganizationId,
    uploadedByUserId: document.uploadedByUserId,
    uploaderRoleCode: document.uploaderRoleCode,
    uploaderOrganizationId: document.uploaderOrganizationId,
    createdAt: new Date(document.createdAt),
    updatedAt: new Date(document.updatedAt),
  };
}

function toDocumentUpdateData(document: Document) {
  return {
    status: document.status,
    replacedByDocumentId: document.replacedByDocumentId,
    revocationReason: document.revocationReason,
    replacementReason: document.replacementReason,
    lifecycleChangedAt: document.lifecycleChangedAt ? new Date(document.lifecycleChangedAt) : null,
    lifecycleChangedByUserId: document.lifecycleChangedByUserId,
    lifecycleChangedByRoleCode: document.lifecycleChangedByRoleCode,
    lifecycleChangedByOrganizationId: document.lifecycleChangedByOrganizationId,
    updatedAt: new Date(document.updatedAt),
  };
}

function toEvidenceAttachment(row: PrismaEvidenceAttachmentRow): EvidenceAttachment {
  return {
    id: row.id,
    proofEventId: row.proofEventId,
    documentId: row.documentId,
    documentTargetType: row.documentTargetType as EvidenceAttachment["documentTargetType"],
    documentTargetId: row.documentTargetId,
    attachedByUserId: row.attachedByUserId,
    actorRoleCode: row.actorRoleCode as EvidenceAttachment["actorRoleCode"],
    actorOrganizationId: row.actorOrganizationId,
    attachedAt: row.attachedAt.toISOString(),
  };
}

function toEvidenceAttachmentCreateData(evidenceAttachment: EvidenceAttachment) {
  return {
    id: evidenceAttachment.id ?? undefined,
    proofEventId: evidenceAttachment.proofEventId,
    documentId: evidenceAttachment.documentId,
    documentTargetType: evidenceAttachment.documentTargetType,
    documentTargetId: evidenceAttachment.documentTargetId,
    attachedByUserId: evidenceAttachment.attachedByUserId,
    actorRoleCode: evidenceAttachment.actorRoleCode,
    actorOrganizationId: evidenceAttachment.actorOrganizationId,
    attachedAt: new Date(evidenceAttachment.attachedAt),
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

function toAuditLogCreateData(auditLog: AuditLog) {
  return {
    id: auditLog.id ?? undefined,
    actorUserId: auditLog.actorUserId,
    actorRoleCode: auditLog.actorRoleCode,
    actorOrganizationId: auditLog.actorOrganizationId,
    action: auditLog.action,
    sourceAction: auditLog.sourceAction,
    objectType: auditLog.objectType,
    objectId: auditLog.objectId,
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

function toJsonObject(value: unknown): Record<string, unknown> {
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

function requireId(value: string | null | undefined, fieldName: string) {
  if (!value) {
    throw new Error(`${fieldName} is required.`);
  }

  return value;
}
