import type { AuditLog, AuditLogWriteRepository, AuditRequestContext } from "../audit/audit-log.d.ts";
import type { Document } from "../documents/document-evidence.d.ts";
import type { SemenOrder, SemenOrderStatus } from "../orders/semen-order.d.ts";
import type { ProofEvent } from "../proof/proof-event.d.ts";
import type { Shipment } from "../shipments/shipment.d.ts";

export type DataQualityEntityType =
  | "SemenOrder"
  | "Shipment"
  | "Document"
  | "ProofEvent";

export type DataQualitySeverity = "ERROR" | "WARNING";

export interface DataQualityRule {
  id: string;
  entityType: DataQualityEntityType;
  severity: DataQualitySeverity;
  description: string;
}

export interface DataQualityFinding {
  ruleId: string;
  entityType: DataQualityEntityType;
  severity: DataQualitySeverity;
  objectId: string | null;
  field: string;
  message: string;
}

export interface DataQualityReport {
  checkedAt: string;
  findingCount: number;
  hasFailures: boolean;
  findings: readonly DataQualityFinding[];
}

export interface DataQualityActorContext {
  userId: string;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN" | string;
  organizationId: string;
}

export type SemenOrderDataQualityInput = Partial<SemenOrder> & Record<string, unknown>;
export type ShipmentDataQualityInput = Partial<Shipment> & Record<string, unknown>;
export type DocumentDataQualityInput = Partial<Document> & Record<string, unknown>;
export type ProofEventDataQualityInput = Partial<ProofEvent> & Record<string, unknown>;

export interface SemenOrderQualityOptions {
  previousStatus?: SemenOrderStatus | string | null;
}

export interface SemenOrderStatusTransitionQualityInput {
  objectId?: string | null;
  fromStatus?: SemenOrderStatus | string | null;
  toStatus?: SemenOrderStatus | string | null;
}

export interface ValidateDataQualityRecordsInput {
  orders?: readonly SemenOrderDataQualityInput[];
  orderStatusTransitions?: readonly SemenOrderStatusTransitionQualityInput[];
  shipments?: readonly ShipmentDataQualityInput[];
  documents?: readonly DocumentDataQualityInput[];
  proofEvents?: readonly ProofEventDataQualityInput[];
  checkedAt?: string | Date;
}

export interface BuildDataQualityFailureAuditHookInput {
  actor: DataQualityActorContext;
  findings: readonly DataQualityFinding[];
  targetType?: string | null;
  targetId?: string | null;
  targetRef?: Record<string, unknown> | null;
  occurredAt?: string | Date;
}

export interface DataQualityFailureAuditHook {
  eventType: "DATA_QUALITY";
  action: "DATA_QUALITY_VALIDATION_FAILED";
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  targetType: string;
  targetId: string;
  targetRef: Readonly<Record<string, unknown>>;
  previousValue: null;
  newValue: Readonly<{
    findingCount: number;
    findings: readonly Readonly<{
      ruleId: string;
      entityType: DataQualityEntityType;
      severity: DataQualitySeverity;
      objectId: string | null;
      field: string;
      message: string;
    }>[];
  }>;
  reason: string;
  occurredAt: string;
}

export interface RecordDataQualityFailuresInput
  extends BuildDataQualityFailureAuditHookInput {
  repository: AuditLogWriteRepository;
  auditContext?: AuditRequestContext | null;
  now?: string | Date;
}

export declare const DATA_QUALITY_ENTITY_TYPES: readonly DataQualityEntityType[];
export declare const DATA_QUALITY_SEVERITIES: readonly DataQualitySeverity[];
export declare const DATA_QUALITY_RULES: readonly DataQualityRule[];

export declare function validateSemenOrderDataQuality(
  order: SemenOrderDataQualityInput,
  options?: SemenOrderQualityOptions,
): DataQualityFinding[];
export declare function validateSemenOrderStatusTransitionDataQuality(
  input: SemenOrderStatusTransitionQualityInput,
): DataQualityFinding[];
export declare function validateShipmentDataQuality(
  shipment: ShipmentDataQualityInput,
): DataQualityFinding[];
export declare function validateDocumentDataQuality(
  document: DocumentDataQualityInput,
): DataQualityFinding[];
export declare function validateProofEventDataQuality(
  proofEvent: ProofEventDataQualityInput,
): DataQualityFinding[];
export declare function validateDataQualityRecords(
  input?: ValidateDataQualityRecordsInput,
): DataQualityReport;
export declare function buildDataQualityFailureAuditHook(
  input: BuildDataQualityFailureAuditHookInput,
): DataQualityFailureAuditHook;
export declare function recordDataQualityFailures(
  input: RecordDataQualityFailuresInput,
): Promise<AuditLog | null>;
export declare function dataQualityRuleById(id: string): DataQualityRule | null;
