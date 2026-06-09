import type {
  AuditLog,
  AuditLogWriteRepository,
  AuditRequestContext,
} from "../audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";
import type { SemenOrderLike } from "../orders/semen-order.d.ts";

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
  | "SHIPMENT_STATUS_UPDATED";

export type ShipmentActorRoleCode = "BREEDING_STATION" | "PLATFORM_ADMIN";

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
}

export declare const SHIPMENT_STATUSES: readonly ShipmentStatus[];
export declare const SHIPMENT_TRACKING_EVENT_SOURCES: readonly ShipmentTrackingEventSource[];
export declare const SHIPMENT_TRACKING_AUDIT_ACTIONS: readonly ShipmentTrackingAuditAction[];
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
export declare function buildShipmentTrackingAuditHook(
  input: ShipmentTrackingAuditHookInput,
): ShipmentTrackingAuditHook;
export declare function buildShipmentProofHook(
  input: ShipmentProofHookInput,
): ShipmentProofHook;
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
