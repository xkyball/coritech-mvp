import type {
  AuditLog,
  AuditLogWriteRepository,
  AuditRequestContext,
} from "../audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";

export type DocumentAccessClassification =
  | "INTERNAL"
  | "ORDER_PARTICIPANTS"
  | "RESTRICTED"
  | "BUYER_VIEW_ELIGIBLE"
  | "ADMIN_ONLY";

export type DocumentLinkTargetType =
  | "SemenOrder"
  | "Shipment"
  | "ProofEvent";

export type DocumentAuditAction =
  | "DOCUMENT_UPLOADED"
  | "DOCUMENT_VIEWED";

export type EvidenceAttachmentAuditAction = "EVIDENCE_ATTACHMENT_CREATED";

export type DocumentActorRoleCode =
  | "BREEDER"
  | "BREEDING_STATION"
  | "PLATFORM_ADMIN";

export interface DocumentActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface SemenOrderLinkTargetLike {
  id?: string | null;
  targetType?: "SemenOrder";
  targetId?: string | null;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
}

export interface ShipmentLinkTargetLike {
  id?: string | null;
  targetType?: "Shipment";
  targetId?: string | null;
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
}

export interface ProofEventLinkTargetLike {
  id: string;
  targetType?: "ProofEvent";
  targetId?: string | null;
  semenOrderId?: string | null;
  shipmentId?: string | null;
  orderNumber?: string | null;
  breederOrganizationId?: string | null;
  breedingStationOrganizationId?: string | null;
}

export type DocumentLinkTargetLike =
  | SemenOrderLinkTargetLike
  | ShipmentLinkTargetLike
  | ProofEventLinkTargetLike;

export interface NormalizedDocumentLinkTarget {
  targetType: DocumentLinkTargetType;
  targetId: string;
  semenOrderId: string | null;
  shipmentId: string | null;
  proofEventId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
}

export interface Document {
  id: string | null;
  documentType: string;
  description: string | null;
  targetType: DocumentLinkTargetType;
  targetId: string;
  semenOrderId: string | null;
  shipmentId: string | null;
  proofEventId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  checksumSha256: string | null;
  storageProvider: string;
  storageBucket: string;
  storageObjectKey: string;
  storageRegion: string | null;
  storageVersionId: string | null;
  accessClassification: DocumentAccessClassification;
  uploadedByUserId: string;
  uploaderRoleCode: DocumentActorRoleCode;
  uploaderOrganizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentLike extends Document {}

export interface EvidenceAttachment {
  id: string | null;
  proofEventId: string;
  documentId: string;
  documentTargetType: DocumentLinkTargetType;
  documentTargetId: string;
  attachedByUserId: string;
  actorRoleCode: DocumentActorRoleCode;
  actorOrganizationId: string;
  attachedAt: string;
}

export interface CreateDocumentInputBody {
  targetType: DocumentLinkTargetType | string;
  targetId: string;
  documentType: string;
  description?: string | null;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  checksumSha256?: string | null;
  storageProvider: string;
  storageBucket: string;
  storageObjectKey: string;
  storageRegion?: string | null;
  storageVersionId?: string | null;
  accessClassification: DocumentAccessClassification | string;
  uploadedAt?: string | Date;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateDocumentInput
  extends Omit<CreateDocumentInputBody, "targetType" | "targetId"> {
  documentId?: string | null;
  linkTarget: DocumentLinkTargetLike;
  actor: DocumentActorContext;
}

export interface CreateEvidenceAttachmentInputBody {
  documentId: string;
  attachmentId?: string | null;
  attachedAt?: string | Date;
  now?: string | Date;
}

export interface CreateEvidenceAttachmentInput {
  attachmentId?: string | null;
  document: Document;
  proofEvent: ProofEventLinkTargetLike;
  actor: DocumentActorContext;
  attachedAt?: string | Date;
  now?: string | Date;
}

export interface PreparedDocumentChange {
  document: Document;
  auditHook: DocumentAuditHook;
}

export interface PreparedEvidenceAttachmentChange {
  evidenceAttachment: EvidenceAttachment;
  auditHook: EvidenceAttachmentAuditHook;
}

export interface DocumentTargetRef {
  targetType: DocumentLinkTargetType;
  targetId: string;
  semenOrderId: string | null;
  shipmentId: string | null;
  proofEventId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
}

export interface DocumentAuditValue {
  documentType: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  checksumSha256: string | null;
  storageProvider: string;
  storageBucket: string;
  storageObjectKey: string;
  storageRegion: string | null;
  storageVersionId: string | null;
  accessClassification: DocumentAccessClassification;
}

export interface DocumentAuditHook {
  eventType: "DOCUMENT_ACCESS";
  action: DocumentAuditAction;
  actorUserId: string;
  actorRoleCode: DocumentActorRoleCode;
  actorOrganizationId: string;
  targetType: "Document";
  targetId: string | null;
  targetRef: Readonly<DocumentTargetRef>;
  documentRef: Readonly<DocumentAuditValue>;
  reason: string | null;
  occurredAt: string;
}

export interface EvidenceAttachmentAuditHook {
  eventType: "DOCUMENT_ACCESS";
  action: EvidenceAttachmentAuditAction;
  actorUserId: string;
  actorRoleCode: DocumentActorRoleCode;
  actorOrganizationId: string;
  targetType: "ProofEvent";
  targetId: string;
  targetRef: {
    proofEventId: string;
    documentId: string;
    documentTargetType: DocumentLinkTargetType;
    documentTargetId: string;
  };
  evidenceAttachmentId: string | null;
  documentRef: Readonly<DocumentAuditValue>;
  reason: null;
  occurredAt: string;
}

export interface DocumentUploadAuditHookInput {
  document: DocumentLike;
  actorRole: UserOrganizationRoleLike;
  occurredAt: string;
}

export interface DocumentViewAuditHookInput {
  actor: DocumentActorContext;
  actorRole: UserOrganizationRoleLike;
  document: DocumentLike;
  occurredAt: string;
}

export interface EvidenceAttachmentAuditHookInput {
  evidenceAttachment: EvidenceAttachment;
  document: DocumentLike;
  proofEvent: ProofEventLinkTargetLike;
  actorRole: UserOrganizationRoleLike;
}

export interface DocumentEvidenceRepository extends AuditLogWriteRepository {
  findSemenOrderById(orderId: string): Promise<SemenOrderLinkTargetLike | null>;
  findShipmentById(shipmentId: string): Promise<ShipmentLinkTargetLike | null>;
  findProofEventById(proofEventId: string): Promise<ProofEventLinkTargetLike | null>;
  createDocument(document: Document): Promise<Document>;
  findDocumentById(documentId: string): Promise<Document | null>;
  listDocumentsForOrder(orderId: string): Promise<Document[]>;
  listDocumentsForShipment(shipmentId: string): Promise<Document[]>;
  createEvidenceAttachment(
    evidenceAttachment: EvidenceAttachment,
  ): Promise<EvidenceAttachment>;
  listEvidenceAttachmentsForProofEvent(
    proofEventId: string,
  ): Promise<EvidenceAttachment[]>;
}

export interface EndpointRequest<
  TBody = Record<string, never>,
  TQuery = Record<string, never>,
> {
  actor: DocumentActorContext;
  repository: DocumentEvidenceRepository;
  auditContext?: AuditRequestContext | null;
  params?: Record<string, string | undefined>;
  body: TBody;
  query?: TQuery;
}

export interface EndpointResponse<TBody, THook = never> {
  status: number;
  body: TBody;
  auditHook?: THook;
  auditLog?: AuditLog;
}

export declare const DOCUMENT_ACCESS_CLASSIFICATIONS: readonly DocumentAccessClassification[];
export declare const DOCUMENT_LINK_TARGET_TYPES: readonly DocumentLinkTargetType[];
export declare const DOCUMENT_AUDIT_ACTIONS: readonly (
  | DocumentAuditAction
  | EvidenceAttachmentAuditAction
)[];
export declare const DOCUMENT_EVIDENCE_ROUTES: readonly {
  method: string;
  path: string;
  handler: string;
  access: string;
}[];

export declare class DocumentEvidenceValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class DocumentEvidenceAuthorizationError extends Error {
  constructor(message: string);
}

export declare class DocumentEvidenceNotFoundError extends Error {
  readonly entityName: string;
  readonly entityId: string;
  constructor(entityName: string, entityId: string);
}

export declare function isDocumentAccessClassification(
  value: unknown,
): value is DocumentAccessClassification;
export declare function isDocumentLinkTargetType(
  value: unknown,
): value is DocumentLinkTargetType;
export declare function canUploadDocument(
  actor: DocumentActorContext,
  target: DocumentLinkTargetLike,
  accessClassification: DocumentAccessClassification | string,
): boolean;
export declare function canViewDocument(
  actor: DocumentActorContext,
  document: DocumentLike,
): boolean;
export declare function canAttachEvidenceToProofEvent(
  actor: DocumentActorContext,
  document: DocumentLike,
  proofEvent: ProofEventLinkTargetLike,
): boolean;
export declare function validateCreateDocumentInput(
  input: CreateDocumentInput,
): string[];
export declare function prepareCreateDocument(
  input: CreateDocumentInput,
): PreparedDocumentChange;
export declare function validateCreateEvidenceAttachmentInput(
  input: CreateEvidenceAttachmentInput,
): string[];
export declare function prepareCreateEvidenceAttachment(
  input: CreateEvidenceAttachmentInput,
): PreparedEvidenceAttachmentChange;
export declare function buildDocumentUploadAuditHook(
  input: DocumentUploadAuditHookInput,
): DocumentAuditHook;
export declare function buildDocumentViewAuditHook(
  input: DocumentViewAuditHookInput,
): DocumentAuditHook;
export declare function buildEvidenceAttachmentAuditHook(
  input: EvidenceAttachmentAuditHookInput,
): EvidenceAttachmentAuditHook;
export declare function createDocumentEndpoint(
  request: EndpointRequest<CreateDocumentInputBody>,
): Promise<EndpointResponse<{ document: Document }, DocumentAuditHook>>;
export declare function getDocumentEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ document: Document }, DocumentAuditHook>>;
export declare function listOrderDocumentsEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ documents: Document[] }>>;
export declare function listShipmentDocumentsEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ documents: Document[] }>>;
export declare function createEvidenceAttachmentEndpoint(
  request: EndpointRequest<CreateEvidenceAttachmentInputBody>,
): Promise<
  EndpointResponse<
    { evidenceAttachment: EvidenceAttachment },
    EvidenceAttachmentAuditHook
  >
>;
export declare function listEvidenceAttachmentsForProofEventEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ evidenceAttachments: EvidenceAttachment[] }>>;
