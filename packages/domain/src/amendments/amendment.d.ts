import type {
  AuditLog,
  AuditLogWriteRepository,
  AuditRequestContext,
} from "../audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";

export type AmendmentStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

export type AmendmentTargetType =
  | "SemenOrder"
  | "OrderStatusHistory"
  | "Shipment"
  | "ShipmentTrackingEvent"
  | "Document"
  | "EvidenceAttachment"
  | "ProofEvent";

export type AmendmentActorRoleCode = "PLATFORM_ADMIN";

export interface AmendmentActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface Amendment {
  id: string | null;
  targetType: AmendmentTargetType;
  targetId: string;
  targetField: string | null;
  targetRef: Readonly<Record<string, unknown>>;
  originalValue: unknown;
  amendedValue: unknown;
  reason: string;
  status: AmendmentStatus;
  actorUserId: string;
  actorRoleCode: AmendmentActorRoleCode;
  actorOrganizationId: string;
  approverUserId: string | null;
  approverRoleCode: AmendmentActorRoleCode | null;
  approverOrganizationId: string | null;
  decidedAt: string | null;
  auditLogId: string | null;
  proofEventId: string | null;
  semenOrderId: string | null;
  shipmentId: string | null;
  horseId: string | null;
  orderNumber: string | null;
  breederOrganizationId: string | null;
  breedingStationOrganizationId: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAmendmentInputBody {
  amendmentId?: string | null;
  targetType: AmendmentTargetType | string;
  targetId: string;
  targetField?: string | null;
  targetRef?: Record<string, unknown> | null;
  originalValue?: unknown;
  amendedValue?: unknown;
  reason: string;
  status?: AmendmentStatus | string;
  auditLogId?: string | null;
  proofEventId?: string | null;
  semenOrderId?: string | null;
  shipmentId?: string | null;
  horseId?: string | null;
  orderNumber?: string | null;
  breederOrganizationId?: string | null;
  breedingStationOrganizationId?: string | null;
  occurredAt?: string | Date;
  createdAt?: string | Date;
  decidedAt?: string | Date;
  now?: string | Date;
}

export interface CreateAmendmentInput extends CreateAmendmentInputBody {
  actor: AmendmentActorContext;
  approver?: AmendmentActorContext | null;
}

export interface CreateAmendmentServiceInput extends CreateAmendmentInput {
  repository: AmendmentRepository;
  auditContext?: AuditRequestContext | null;
}

export interface AmendmentTargetSnapshot {
  targetType: AmendmentTargetType | string;
  targetId: string;
  targetField?: string | null;
  targetRef?: Record<string, unknown> | null;
  originalValue: unknown;
  semenOrderId?: string | null;
  shipmentId?: string | null;
  horseId?: string | null;
  orderNumber?: string | null;
  breederOrganizationId?: string | null;
  breedingStationOrganizationId?: string | null;
}

export interface PreparedAmendmentChange {
  amendment: Amendment;
  auditHook: AmendmentAuditHook;
  proofHook: AmendmentProofHook | null;
}

export interface PersistedAmendmentChange extends PreparedAmendmentChange {
  auditLog: AuditLog;
}

export interface AmendmentAuditHook {
  eventType: "AMENDMENT";
  action: "AMENDMENT_CREATED";
  actorUserId: string;
  actorRoleCode: AmendmentActorRoleCode;
  actorOrganizationId: string;
  targetType: AmendmentTargetType;
  targetId: string;
  targetRef: {
    amendmentId: string | null;
    targetField: string | null;
    targetRef: Readonly<Record<string, unknown>>;
    amendmentStatus: AmendmentStatus;
    proofEventId: string | null;
    semenOrderId: string | null;
    shipmentId: string | null;
    horseId: string | null;
    orderNumber: string | null;
    breederOrganizationId: string | null;
    breedingStationOrganizationId: string | null;
  };
  amendmentId: string | null;
  previousValue: {
    originalValue: unknown;
  };
  newValue: {
    amendedValue: unknown;
    amendmentStatus: AmendmentStatus;
  };
  reason: string;
  occurredAt: string;
}

export interface AmendmentProofHook {
  hookType: "PROOF_EVENT_REQUEST";
  source: "ADMIN_CORRECTION";
  triggerType: "AMENDMENT_CREATED";
  triggerRef: {
    targetType: "Amendment";
    targetId: string | null;
    amendmentTargetType: AmendmentTargetType;
    amendmentTargetId: string;
    targetField: string | null;
    amendmentStatus: AmendmentStatus;
    proofEventId: string | null;
    semenOrderId: string | null;
    shipmentId: string | null;
    horseId: string | null;
    orderNumber: string | null;
    breederOrganizationId: string | null;
    breedingStationOrganizationId: string | null;
  };
  documentationRefs: readonly [];
  actorRef: {
    userId: string;
    roleCode: AmendmentActorRoleCode;
    organizationId: string;
  };
  signatureRef: {
    type: "MANAGED_AUTH_ACTOR_CONTEXT";
    actorUserId: string;
  };
  verificationLevelRef: null;
  auditHookRef: {
    eventType: "AMENDMENT";
    action: "AMENDMENT_CREATED";
    occurredAt: string;
  };
  occurredAt: string;
}

export interface AmendmentRepository extends AuditLogWriteRepository {
  createAmendment(amendment: Amendment): Promise<Amendment>;
  findAmendmentTargetSnapshot?(
    targetType: string,
    targetId: string,
    targetField?: string | null,
  ): Promise<AmendmentTargetSnapshot | null>;
  listAmendmentsForTarget?(
    targetType: string,
    targetId: string,
  ): Promise<Amendment[]>;
}

export interface EndpointRequest<TBody> {
  params?: Record<string, string | undefined>;
  body?: Partial<TBody> & Record<string, unknown>;
  actor: AmendmentActorContext;
  approver?: AmendmentActorContext | null;
  repository: AmendmentRepository;
  auditContext?: AuditRequestContext | null;
}

export interface EndpointResponse<TBody> {
  status: number;
  body: Readonly<TBody>;
  auditHook?: AmendmentAuditHook;
  auditLog?: AuditLog;
  proofHook?: AmendmentProofHook | null;
}

export declare const AMENDMENT_STATUSES: readonly AmendmentStatus[];
export declare const AMENDMENT_TARGET_TYPES: readonly AmendmentTargetType[];
export declare const AMENDMENT_ROUTES: readonly {
  method: string;
  path: string;
  handler: string;
  access: string;
}[];
export declare const AMENDMENT_TARGET_MUTATION_POLICY: Readonly<{
  silentlyOverwriteTarget: false;
  createTargetUpdate: false;
  requiresReason: true;
  requiresAuditLog: true;
  reason: string;
}>;

export declare class AmendmentValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class AmendmentAuthorizationError extends Error {
  constructor(message: string);
}

export declare class AmendmentNotFoundError extends Error {
  readonly entityName: string;
  readonly entityId: string;
  constructor(entityName: string, entityId: string);
}

export declare function isAmendmentStatus(
  value: unknown,
): value is AmendmentStatus;
export declare function isAmendmentTargetType(
  value: unknown,
): value is AmendmentTargetType;
export declare function canCreateAmendment(
  actor: AmendmentActorContext,
): boolean;
export declare function canSilentlyOverwriteAmendmentTarget(): false;
export declare function validateCreateAmendmentInput(
  input: CreateAmendmentInput,
): string[];
export declare function prepareCreateAmendment(
  input: CreateAmendmentInput,
): PreparedAmendmentChange;
export declare function buildAmendmentAuditHook(
  input: { amendment: Amendment },
): AmendmentAuditHook;
export declare function buildAmendmentProofHook(
  input: { amendment: Amendment; auditHook: AmendmentAuditHook },
): AmendmentProofHook;
export declare function createAmendment(
  input: CreateAmendmentServiceInput,
): Promise<PersistedAmendmentChange>;
export declare function createAmendmentEndpoint(
  request: EndpointRequest<CreateAmendmentInputBody>,
): Promise<EndpointResponse<{ amendment: Amendment }>>;
