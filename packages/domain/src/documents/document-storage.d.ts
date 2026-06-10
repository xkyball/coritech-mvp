import type { AuditLog, AuditRequestContext } from "../audit/audit-log.d.ts";
import type {
  Document,
  DocumentAccessClassification,
  DocumentActorContext,
  DocumentAuditHook,
  DocumentEvidenceRepository,
  DocumentLinkTargetType,
} from "./document-evidence.d.ts";
import type {
  ObjectStorageProvider,
  ObjectStorageReference,
} from "../storage/object-storage.d.ts";
import type { ProofEvent } from "../proof/proof-event.d.ts";

export type DocumentMalwareScanStatus =
  | "NOT_SCANNED_PLACEHOLDER"
  | "CLEAN"
  | "BLOCKED";

export interface DocumentMalwareScanResult {
  status: DocumentMalwareScanStatus;
  provider: string;
  checkedAt: string;
  reference: string | null;
  details: string | null;
}

export interface DocumentMalwareScanner {
  scan(input: {
    body: unknown;
    originalFileName: string;
    contentType: string;
    fileSizeBytes: number;
  }): Promise<DocumentMalwareScanResult>;
}

export interface UploadDocumentFileInput {
  actor: DocumentActorContext;
  repository: DocumentEvidenceRepository;
  storageProvider: ObjectStorageProvider;
  auditContext?: AuditRequestContext | null;
  targetType: DocumentLinkTargetType | string;
  targetId: string;
  documentType: string;
  description?: string | null;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  checksumSha256?: string | null;
  accessClassification: DocumentAccessClassification | string;
  body: unknown;
  malwareScanner?: DocumentMalwareScanner | null;
  objectKey?: string | null;
  now?: string | Date;
}

export interface UploadDocumentFileResult {
  status: 201;
  body: {
    document: Document;
    storageReference: Readonly<ObjectStorageReference>;
    malwareScan: Readonly<DocumentMalwareScanResult>;
    proofResult: DocumentUploadProofResult | null;
  };
  auditHook?: DocumentAuditHook;
  auditLog?: AuditLog;
}

export interface DocumentUploadProofResult {
  proofEvent: ProofEvent;
  evidenceAttachment: {
    id: string | null;
    proofEventId: string;
    documentId: string;
    documentTargetType: DocumentLinkTargetType;
    documentTargetId: string;
    attachedByUserId: string;
    actorRoleCode: string;
    actorOrganizationId: string;
    attachedAt: string;
  };
  proofAuditLog: AuditLog | null;
  evidenceAttachmentAuditLog: AuditLog | null;
}

export interface ControlledDocumentAccessUrlInput {
  actor: DocumentActorContext;
  repository: DocumentEvidenceRepository;
  storageProvider: ObjectStorageProvider;
  auditContext?: AuditRequestContext | null;
  documentId: string;
  expiresInSeconds?: number | string | null;
  now?: string | Date;
}

export interface ControlledDocumentAccessUrlResult {
  status: 200;
  body: {
    document: Document;
    accessUrl: string;
    expiresInSeconds: number;
    expiresAt: string;
  };
  auditHook?: DocumentAuditHook;
  auditLog?: AuditLog;
}

export interface RevokeDocumentFileInput {
  actor: DocumentActorContext;
  repository: DocumentEvidenceRepository;
  auditContext?: AuditRequestContext | null;
  documentId: string;
  reason: string;
  now?: string | Date;
}

export interface ReplaceDocumentFileInput
  extends Omit<
    UploadDocumentFileInput,
    "targetType" | "targetId" | "accessClassification"
  > {
  documentId: string;
  reason: string;
}

export interface DocumentLifecycleResult {
  status: 200;
  body: {
    document: Document;
  };
  auditHook?: DocumentAuditHook;
  auditLog?: AuditLog;
}

export interface ReplaceDocumentFileResult {
  status: 201;
  body: {
    originalDocument: Document;
    replacementDocument: Document;
    storageReference: Readonly<ObjectStorageReference>;
    malwareScan: Readonly<DocumentMalwareScanResult>;
  };
  auditHook?: DocumentAuditHook;
  auditLog?: AuditLog;
}

export declare const DOCUMENT_STORAGE_ALLOWED_CONTENT_TYPES: readonly string[];
export declare const DOCUMENT_STORAGE_MAX_FILE_SIZE_BYTES: number;
export declare const DOCUMENT_STORAGE_DEFAULT_ACCESS_URL_TTL_SECONDS: 300;
export declare const DOCUMENT_STORAGE_MAX_ACCESS_URL_TTL_SECONDS: 900;

export declare class DocumentStorageValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function uploadDocumentFile(
  input: UploadDocumentFileInput,
): Promise<Readonly<UploadDocumentFileResult>>;

export declare function createControlledDocumentAccessUrl(
  input: ControlledDocumentAccessUrlInput,
): Promise<Readonly<ControlledDocumentAccessUrlResult>>;

export declare function revokeDocumentFile(
  input: RevokeDocumentFileInput,
): Promise<Readonly<DocumentLifecycleResult>>;

export declare function replaceDocumentFile(
  input: ReplaceDocumentFileInput,
): Promise<Readonly<ReplaceDocumentFileResult>>;
