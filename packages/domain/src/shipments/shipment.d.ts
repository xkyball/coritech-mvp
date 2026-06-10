import type {
  AuditLog,
  AuditLogWriteRepository,
  AuditRequestContext,
} from "../audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";
import type { SemenOrderLike } from "../orders/semen-order.d.ts";
import type { ProofEvent } from "../proof/proof-event.d.ts";

export type ShipmentStatus =
  | "PREPARED"
  | "DISPATCHED"
  | "IN_TRANSIT"
  | "DELIVERED"
  | "DELAYED"
  | "FAILED"
  | "CANCELLED";

export type ShipmentTrackingEventSource =
  | "MANUAL"
  | "LOGISTICS_PROVIDER"
  | "SYSTEM";

export type ShipmentTrackingAuditAction =
  | "SHIPMENT_CREATED"
  | "SHIPMENT_STATUS_UPDATED"
  | "SHIPMENT_RECEIPT_CONFIRMED";

export type ShipmentActorRoleCode = "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";

export type ShipmentConfirmationSource =
  | "STATION_MARKED_DELIVERED"
  | "BREEDER_CONFIRMED_RECEIVED";

export type ShipmentServiceCommandName =
  | "CREATE_SHIPMENT"
  | "UPDATE_SHIPMENT_STATUS"
  | "ATTACH_TRACKING_REFERENCE"
  | "MARK_DELIVERED"
  | "MARK_DELAYED"
  | "CONFIRM_RECEIVED";

export type ShipmentNotificationEvent =
  | "SHIPMENT_CREATED"
  | "SHIPMENT_STATUS_UPDATED"
  | "SHIPMENT_TRACKING_REFERENCE_ATTACHED"
  | "SHIPMENT_DELIVERED"
  | "SHIPMENT_DELAYED"
  | "SHIPMENT_RECEIPT_CONFIRMED";

export interface ShipmentActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface ShipmentAccessTarget {
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
}

export interface Shipment {
  id: string | null;
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: ShipmentStatus;
  providerName: string | null;
  providerTrackingId: string | null;
  trackingUrl: string | null;
  deliveredAt: string | null;
  confirmedReceivedAt: string | null;
  confirmedByUserId: string | null;
  confirmationSource: ShipmentConfirmationSource | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShipmentLike extends ShipmentAccessTarget {
  id: string | null;
  semenOrderId: string;
  orderNumber: string;
  status: ShipmentStatus;
  providerName: string | null;
  providerTrackingId: string | null;
  trackingUrl: string | null;
  deliveredAt?: string | null;
  confirmedReceivedAt?: string | null;
  confirmedByUserId?: string | null;
  confirmationSource?: ShipmentConfirmationSource | string | null;
  createdByUserId?: string;
  updatedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ShipmentTrackingEvent {
  id: string | null;
  shipmentId: string | null;
  semenOrderId: string;
  orderNumber: string;
  fromStatus: ShipmentStatus | null;
  toStatus: ShipmentStatus;
  eventSource: ShipmentTrackingEventSource;
  sourceEventId: string | null;
  providerStatus: string | null;
  location: string | null;
  notes: string | null;
  actorUserId: string;
  actorRoleCode: ShipmentActorRoleCode;
  actorOrganizationId: string;
  occurredAt: string;
  recordedAt: string;
}

export interface CreateShipmentInputBody {
  status?: ShipmentStatus | string;
  providerName?: string | null;
  providerTrackingId?: string | null;
  trackingUrl?: string | null;
  eventSource?: ShipmentTrackingEventSource | string;
  sourceEventId?: string | null;
  providerStatus?: string | null;
  location?: string | null;
  notes?: string | null;
  occurredAt?: string | Date;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateShipmentInput extends CreateShipmentInputBody {
  shipmentId?: string | null;
  trackingEventId?: string | null;
  existingOrder: SemenOrderLike;
  actor: ShipmentActorContext;
}

export interface CreateShipmentTrackingEventInputBody {
  toStatus: ShipmentStatus | string;
  providerName?: string | null;
  providerTrackingId?: string | null;
  trackingUrl?: string | null;
  eventSource?: ShipmentTrackingEventSource | string;
  sourceEventId?: string | null;
  providerStatus?: string | null;
  location?: string | null;
  notes?: string | null;
  occurredAt?: string | Date;
  now?: string | Date;
}

export interface CreateShipmentTrackingEventInput
  extends CreateShipmentTrackingEventInputBody {
  trackingEventId?: string | null;
  existingShipment: Shipment;
  actor: ShipmentActorContext;
}

export interface PreparedShipmentTrackingChange {
  shipment: Shipment;
  trackingEvent: ShipmentTrackingEvent;
  auditHook: ShipmentTrackingAuditHook;
  proofHook: ShipmentProofHook;
}

export interface ShipmentAuditValue {
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: ShipmentStatus;
  providerName: string | null;
  providerTrackingId: string | null;
  trackingUrl: string | null;
  deliveredAt: string | null;
  confirmedReceivedAt: string | null;
  confirmedByUserId: string | null;
  confirmationSource: ShipmentConfirmationSource | string | null;
}

export interface ShipmentTrackingAuditHook {
  eventType: "SHIPMENT_TRACKING_EVENT";
  action: ShipmentTrackingAuditAction;
  actorUserId: string;
  actorRoleCode: ShipmentActorRoleCode;
  actorOrganizationId: string;
  targetType: "Shipment";
  targetId: string | null;
  targetRef: {
    semenOrderId: string;
    orderNumber: string;
    breederOrganizationId: string;
    breedingStationOrganizationId: string;
    providerName: string | null;
    providerTrackingId: string | null;
  };
  trackingEventId: string | null;
  previousValue: Readonly<ShipmentAuditValue> | null;
  newValue: Readonly<ShipmentAuditValue>;
  eventSource: ShipmentTrackingEventSource;
  sourceEventId: string | null;
  providerStatus: string | null;
  reason: string | null;
  occurredAt: string;
}

export interface ShipmentProofHook {
  hookType: "PROOF_EVENT_REQUEST";
  source: "SHIPMENT_TRACKING_EVENT";
  triggerType: "SHIPMENT_TRACKING_EVENT";
  triggerRef: {
    targetType: "Shipment";
    targetId: string | null;
    semenOrderId: string;
    orderNumber: string;
    breederOrganizationId: string;
    breedingStationOrganizationId: string;
    trackingEventId: string | null;
    fromStatus: ShipmentStatus | null;
    toStatus: ShipmentStatus;
    eventSource: ShipmentTrackingEventSource;
    sourceEventId: string | null;
  };
  documentationRefs: readonly [];
  actorRef: {
    userId: string;
    roleCode: ShipmentActorRoleCode;
    organizationId: string;
  };
  signatureRef: {
    type: "MANAGED_AUTH_ACTOR_CONTEXT";
    actorUserId: string;
  };
  verificationLevelRef: null;
  auditHookRef: {
    eventType: "SHIPMENT_TRACKING_EVENT";
    action: ShipmentTrackingAuditAction;
    occurredAt: string;
  };
  occurredAt: string;
}

export interface ShipmentTrackingAuditHookInput {
  action: ShipmentTrackingAuditAction;
  shipment: ShipmentLike;
  previousShipment: ShipmentLike | null;
  trackingEvent: ShipmentTrackingEvent;
}

export interface ShipmentProofHookInput {
  shipment: ShipmentLike;
  trackingEvent: ShipmentTrackingEvent;
  auditHook: ShipmentTrackingAuditHook;
}

export interface ShipmentNotificationHook {
  hookType: "SHIPMENT_NOTIFICATION_REQUEST";
  eventType: ShipmentNotificationEvent;
  commandName: ShipmentServiceCommandName;
  shipmentId: string | null;
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  fromStatus: ShipmentStatus | null;
  toStatus: ShipmentStatus;
  trackingEventId: string | null;
  actorUserId: string;
  actorRoleCode: ShipmentActorRoleCode;
  actorOrganizationId: string;
  occurredAt: string;
}

export interface ShipmentNotificationHookInput {
  commandName: ShipmentServiceCommandName;
  change: PreparedShipmentTrackingChange;
  previousShipment: ShipmentLike | null;
}

export interface ShipmentRepository extends AuditLogWriteRepository {
  findSemenOrderById(orderId: string): Promise<SemenOrderLike | null>;
  createShipmentWithTrackingEvent(
    shipment: Shipment,
    trackingEvent: ShipmentTrackingEvent,
  ): Promise<PreparedPersistedShipmentTrackingChange>;
  findShipmentById(shipmentId: string): Promise<Shipment | null>;
  updateShipmentWithTrackingEvent(
    shipment: Shipment,
    trackingEvent: ShipmentTrackingEvent,
  ): Promise<PreparedPersistedShipmentTrackingChange>;
  listShipmentsForOrder(orderId: string): Promise<Shipment[]>;
  listShipmentTrackingEvents(shipmentId: string): Promise<ShipmentTrackingEvent[]>;
  createProofEvent?(proofEvent: ProofEvent): Promise<ProofEvent>;
  listProofEventsForShipment?(shipmentId: string): Promise<ProofEvent[]>;
}

export interface PreparedPersistedShipmentTrackingChange {
  shipment: Shipment;
  trackingEvent: ShipmentTrackingEvent;
}

export interface EndpointRequest<
  TBody = Record<string, never>,
  TQuery = Record<string, never>,
> {
  actor: ShipmentActorContext;
  repository: ShipmentRepository;
  auditContext?: AuditRequestContext | null;
  params?: Record<string, string | undefined>;
  body: TBody;
  query?: TQuery;
}

export interface EndpointResponse<TBody> {
  status: number;
  body: TBody;
  auditHook?: ShipmentTrackingAuditHook;
  auditLog?: AuditLog;
  proofHook?: ShipmentProofHook;
  proofResult?: unknown;
}

export interface ShipmentServiceProofService {
  recordProofHook?(hook: ShipmentProofHook): Promise<unknown> | unknown;
  createProofEventFromHook?(hook: ShipmentProofHook): Promise<unknown> | unknown;
}

export interface ShipmentServiceNotificationService {
  recordShipmentNotificationHook?(hook: ShipmentNotificationHook): Promise<unknown> | unknown;
  enqueueShipmentNotification?(hook: ShipmentNotificationHook): Promise<unknown> | unknown;
}

export interface ShipmentServiceOptions {
  repository: ShipmentRepository;
  auditContext?: AuditRequestContext | null;
  proofService?: ShipmentServiceProofService | null;
  notificationService?: ShipmentServiceNotificationService | null;
  transaction?: <T>(
    operation: (repository?: ShipmentRepository) => Promise<T>,
  ) => Promise<T>;
}

export interface ShipmentServiceCreateCommand {
  actor: ShipmentActorContext;
  orderId: string;
  body: CreateShipmentInputBody;
}

export interface ShipmentServiceUpdateStatusCommand {
  actor: ShipmentActorContext;
  shipmentId: string;
  toStatus: ShipmentStatus | string;
  body: CreateShipmentTrackingEventInputBody;
}

export interface ShipmentServiceAttachTrackingReferenceCommand {
  actor: ShipmentActorContext;
  shipmentId: string;
  body: Partial<CreateShipmentTrackingEventInputBody>;
}

export interface ShipmentServiceNamedStatusCommand {
  actor: ShipmentActorContext;
  shipmentId: string;
  body: Omit<Partial<CreateShipmentTrackingEventInputBody>, "toStatus">;
}

export interface ShipmentServiceConfirmReceivedCommand {
  actor: ShipmentActorContext;
  shipmentId: string;
  body: Omit<Partial<CreateShipmentTrackingEventInputBody>, "toStatus">;
}

export interface ShipmentServiceCommandResult {
  status: number;
  body: {
    shipment: Shipment;
    trackingEvent: ShipmentTrackingEvent;
  };
  shipment: Shipment;
  trackingEvent: ShipmentTrackingEvent;
  auditHook: ShipmentTrackingAuditHook;
  auditLog: AuditLog;
  proofHook: ShipmentProofHook;
  proofResult: unknown;
  notificationHook: ShipmentNotificationHook | null;
  notificationResult: unknown;
  idempotent: boolean;
}

export declare const SHIPMENT_STATUSES: readonly ShipmentStatus[];
export declare const SHIPMENT_TRACKING_EVENT_SOURCES: readonly ShipmentTrackingEventSource[];
export declare const SHIPMENT_TRACKING_AUDIT_ACTIONS: readonly ShipmentTrackingAuditAction[];
export declare const SHIPMENT_SERVICE_COMMANDS: readonly ShipmentServiceCommandName[];
export declare const SHIPMENT_ROUTES: readonly {
  method: string;
  path: string;
  handler: string;
  access: string;
}[];

export declare class ShipmentValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class ShipmentAuthorizationError extends Error {
  constructor(message: string);
}

export declare class ShipmentNotFoundError extends Error {
  readonly entityName: string;
  readonly entityId: string;
  constructor(entityName: string, entityId: string);
}

export declare class ShipmentService {
  constructor(options: ShipmentServiceOptions);
  createShipment(
    command: ShipmentServiceCreateCommand,
  ): Promise<ShipmentServiceCommandResult>;
  updateShipmentStatus(
    command: ShipmentServiceUpdateStatusCommand,
  ): Promise<ShipmentServiceCommandResult>;
  attachTrackingReference(
    command: ShipmentServiceAttachTrackingReferenceCommand,
  ): Promise<ShipmentServiceCommandResult>;
  markDelivered(
    command: ShipmentServiceNamedStatusCommand,
  ): Promise<ShipmentServiceCommandResult>;
  markDelayed(
    command: ShipmentServiceNamedStatusCommand,
  ): Promise<ShipmentServiceCommandResult>;
  confirmReceived(
    command: ShipmentServiceConfirmReceivedCommand,
  ): Promise<ShipmentServiceCommandResult>;
}

export declare function createShipmentService(
  options: ShipmentServiceOptions,
): ShipmentService;

export declare function isShipmentStatus(
  value: unknown,
): value is ShipmentStatus;
export declare function isShipmentTrackingEventSource(
  value: unknown,
): value is ShipmentTrackingEventSource;
export declare function canViewShipment(
  actor: ShipmentActorContext,
  target: ShipmentAccessTarget,
): boolean;
export declare function canManageShipment(
  actor: ShipmentActorContext,
  target: ShipmentAccessTarget,
): boolean;
export declare function canConfirmShipmentReceived(
  actor: ShipmentActorContext,
  target: ShipmentAccessTarget,
): boolean;
export declare function validateCreateShipmentInput(
  input: CreateShipmentInput,
): string[];
export declare function prepareCreateShipment(
  input: CreateShipmentInput,
): PreparedShipmentTrackingChange;
export declare function validateCreateShipmentTrackingEventInput(
  input: CreateShipmentTrackingEventInput,
): string[];
export declare function prepareCreateShipmentTrackingEvent(
  input: CreateShipmentTrackingEventInput,
): PreparedShipmentTrackingChange;
export declare function validateConfirmShipmentReceivedInput(
  input: CreateShipmentTrackingEventInput,
): string[];
export declare function prepareConfirmShipmentReceived(
  input: CreateShipmentTrackingEventInput,
): PreparedShipmentTrackingChange;
export declare function buildShipmentTrackingAuditHook(
  input: ShipmentTrackingAuditHookInput,
): ShipmentTrackingAuditHook;
export declare function buildShipmentProofHook(
  input: ShipmentProofHookInput,
): ShipmentProofHook;
export declare function buildShipmentNotificationHook(
  input: ShipmentNotificationHookInput,
): ShipmentNotificationHook | null;
export declare function createShipmentEndpoint(
  request: EndpointRequest<CreateShipmentInputBody>,
): Promise<
  EndpointResponse<{
    shipment: Shipment;
    trackingEvent: ShipmentTrackingEvent;
  }>
>;
export declare function createShipmentTrackingEventEndpoint(
  request: EndpointRequest<CreateShipmentTrackingEventInputBody>,
): Promise<
  EndpointResponse<{
    shipment: Shipment;
    trackingEvent: ShipmentTrackingEvent;
  }>
>;
export declare function getShipmentEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ shipment: Shipment }>>;
export declare function listOrderShipmentsEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ shipments: Shipment[] }>>;
export declare function listShipmentTrackingEventsEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ trackingEvents: ShipmentTrackingEvent[] }>>;
