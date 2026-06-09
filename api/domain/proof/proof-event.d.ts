import type { SemenOrderProofHook, SemenOrderStatus } from "../orders/semen-order.d.ts";
import type { ShipmentProofHook, ShipmentStatus } from "../shipments/shipment.d.ts";
import type {
  ActivePhase1VerificationLevel,
  VerificationLevel,
} from "./verification-level.d.ts";

export type {
  ActivePhase1VerificationLevel,
  FutureVerificationLevel,
  VerificationLevel,
  VerificationLevelBadgeTone,
  VerificationLevelMetadata,
} from "./verification-level.d.ts";

export {
  ACTIVE_PHASE_1_VERIFICATION_LEVELS,
  FUTURE_VERIFICATION_LEVELS,
  VERIFICATION_LEVEL_METADATA,
  VERIFICATION_LEVELS,
  deriveVerificationLevel,
  isActivePhase1VerificationLevel,
  isVerificationLevel,
  verificationLevelMetadataFor,
} from "./verification-level.d.ts";

export type ProofEventType =
  | "SEMEN_ORDER_CREATED"
  | "SUBMITTED"
  | "CONFIRMED"
  | "REJECTED"
  | "SHIPMENT_CREATED"
  | "SHIPMENT_STATUS_UPDATED"
  | "SHIPMENT_CONFIRMED"
  | "DOCUMENT_UPLOADED"
  | "ORDER_COMPLETED"
  | "ADMIN_CORRECTION_CREATED";

export type ProofEventSource =
  | "ORDER_STATUS_CHANGE"
  | "SHIPMENT_TRACKING_EVENT"
  | "DOCUMENT_UPLOAD"
  | "ADMIN_CORRECTION";

export type ProofEventStatus = "RECORDED" | "VOIDED";

export type ProofEventActorRoleCode =
  | "BREEDER"
  | "BREEDING_STATION"
  | "PLATFORM_ADMIN";

export type ProofEventLifecycleStage =
  | "ORDER_CREATED"
  | "ORDER_SUBMITTED"
  | "ORDER_CONFIRMED"
  | "ORDER_REJECTED"
  | "ORDER_COMPLETED"
  | "SHIPMENT_CREATED"
  | "SHIPMENT_UPDATED"
  | "SHIPMENT_CONFIRMED"
  | "DOCUMENTATION"
  | "ADMIN_CORRECTION";

export type ProofEventRequestHook = SemenOrderProofHook | ShipmentProofHook;

export interface ProofEventActorRef {
  userId: string;
  roleCode: ProofEventActorRoleCode | string;
  organizationId: string;
}

export interface ProofEvent {
  id: string | null;
  eventType: ProofEventType;
  source: ProofEventSource;
  triggerType: string;
  triggerRef: Readonly<Record<string, unknown>>;
  semenOrderId: string | null;
  shipmentId: string | null;
  horseId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
  lifecycleStage: ProofEventLifecycleStage;
  verificationLevel: ActivePhase1VerificationLevel;
  status: ProofEventStatus;
  actorUserId: string;
  actorRoleCode: ProofEventActorRoleCode;
  actorOrganizationId: string;
  documentationRefs: readonly unknown[];
  signatureRef: Readonly<Record<string, unknown>> | null;
  attestationRefs: readonly unknown[];
  auditLogId: string | null;
  auditHookRef: Readonly<Record<string, unknown>>;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProofEventInput {
  proofEventId?: string | null;
  eventType: ProofEventType | string;
  source: ProofEventSource | string;
  triggerType: string;
  triggerRef: Record<string, unknown>;
  semenOrderId?: string | null;
  shipmentId?: string | null;
  horseId?: string | null;
  orderNumber?: string | null;
  breederOrganizationId?: string | null;
  breedingStationOrganizationId?: string | null;
  lifecycleStage: ProofEventLifecycleStage | string;
  verificationLevel?: VerificationLevel | string | null;
  status?: ProofEventStatus | string;
  actor: ProofEventActorRef;
  documentationRefs?: readonly unknown[];
  signatureRef?: Record<string, unknown> | null;
  attestationRefs?: readonly unknown[];
  auditLogId?: string | null;
  auditHookRef: Record<string, unknown>;
  occurredAt?: string | Date;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateProofEventFromHookInput {
  proofHook: ProofEventRequestHook;
  proofEventId?: string | null;
  verificationLevel?: VerificationLevel | string | null;
  horseId?: string | null;
  auditLogId?: string | null;
  attestationRefs?: readonly unknown[];
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateProofEventFromHookServiceInput
  extends CreateProofEventFromHookInput {
  repository: ProofEventRepository;
}

export interface PreparedProofEventChange {
  proofEvent: ProofEvent;
  auditHook: ProofEventCreationAuditHook;
}

export interface ProofEventCreationAuditHook {
  eventType: "PROOF_EVENT";
  action: "PROOF_EVENT_CREATED";
  actorUserId: string;
  actorRoleCode: ProofEventActorRoleCode;
  actorOrganizationId: string;
  targetType: "ProofEvent";
  targetId: string | null;
  targetRef: {
    proofEventId: string | null;
    proofEventType: ProofEventType;
    source: ProofEventSource;
    semenOrderId: string | null;
    shipmentId: string | null;
    horseId: string | null;
    verificationLevel: ActivePhase1VerificationLevel;
    status: ProofEventStatus;
  };
  reason: null;
  occurredAt: string;
}

export interface ProofEventRepository {
  createProofEvent(proofEvent: ProofEvent): Promise<ProofEvent>;
  findProofEventById?(proofEventId: string): Promise<ProofEvent | null>;
  listProofEventsForOrder?(orderId: string): Promise<ProofEvent[]>;
  listProofEventsForShipment?(shipmentId: string): Promise<ProofEvent[]>;
}

export interface PersistedProofEventChange {
  proofEvent: ProofEvent;
  auditHook: ProofEventCreationAuditHook;
}

export declare const PROOF_EVENT_TYPES: readonly ProofEventType[];
export declare const PROOF_EVENT_SOURCES: readonly ProofEventSource[];
export declare const PROOF_EVENT_STATUSES: readonly ProofEventStatus[];
export declare const PROOF_EVENT_DELETION_POLICY: Readonly<{
  supported: false;
  reason: string;
}>;

export declare class ProofEventValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function isProofEventType(
  value: unknown,
): value is ProofEventType;
export declare function isProofEventSource(
  value: unknown,
): value is ProofEventSource;
export declare function isProofEventStatus(
  value: unknown,
): value is ProofEventStatus;
export declare function canDeleteProofEvent(
  actor: { userId: string },
  proofEvent: ProofEvent,
): false;
export declare function validateCreateProofEventInput(
  input: CreateProofEventInput,
): string[];
export declare function prepareCreateProofEvent(
  input: CreateProofEventInput,
): PreparedProofEventChange;
export declare function validateCreateProofEventFromHookInput(
  input: CreateProofEventFromHookInput,
): string[];
export declare function prepareProofEventFromHook(
  input: CreateProofEventFromHookInput,
): PreparedProofEventChange;
export declare function createProofEventFromHook(
  input: CreateProofEventFromHookServiceInput,
): Promise<PersistedProofEventChange>;
export declare function buildProofEventCreationAuditHook(
  input: { proofEvent: ProofEvent },
): ProofEventCreationAuditHook;
export declare function proofEventTypeForOrderStatus(
  toStatus: SemenOrderStatus,
): ProofEventType | null;
export declare function proofEventTypeForShipmentStatus(
  action: "SHIPMENT_CREATED" | "SHIPMENT_STATUS_UPDATED",
  toStatus: ShipmentStatus,
): ProofEventType;
