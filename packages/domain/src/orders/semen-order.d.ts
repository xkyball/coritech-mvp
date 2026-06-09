import type {
  AuditLog,
  AuditLogWriteRepository,
  AuditRequestContext,
} from "../audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";
import type { SemenListingLike } from "../catalog/semen-catalog.d.ts";

export type SemenOrderStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "RECEIVED"
  | "CONFIRMED"
  | "REJECTED"
  | "IN_FULFILMENT"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export type SemenOrderStatusActorRoleCode =
  | "BREEDER"
  | "BREEDING_STATION"
  | "PLATFORM_ADMIN";

export type SemenOrderStatusAuditAction =
  | "SEMEN_ORDER_DRAFT_CREATED"
  | "SEMEN_ORDER_SUBMITTED"
  | "SEMEN_ORDER_RECEIVED"
  | "SEMEN_ORDER_CONFIRMED"
  | "SEMEN_ORDER_REJECTED"
  | "SEMEN_ORDER_IN_FULFILMENT"
  | "SEMEN_ORDER_SHIPPED"
  | "SEMEN_ORDER_DELIVERED"
  | "SEMEN_ORDER_COMPLETED"
  | "SEMEN_ORDER_CANCELLED";

export interface SemenOrderActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface SemenOrder {
  id: string | null;
  orderNumber: string;
  semenListingId: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: SemenOrderStatus;
  requestedDeliveryDate: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface SemenOrderLike {
  id: string | null;
  orderNumber: string;
  semenListingId: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: SemenOrderStatus;
  requestedDeliveryDate?: string | null;
  shippingContactName?: string | null;
  shippingContactPhone?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingRegion?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  specialInstructions?: string | null;
  createdByUserId?: string;
  updatedByUserId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStatusHistory {
  id: string | null;
  semenOrderId: string | null;
  orderNumber: string;
  fromStatus: SemenOrderStatus | null;
  toStatus: SemenOrderStatus;
  actorUserId: string;
  actorRoleCode: SemenOrderStatusActorRoleCode;
  actorOrganizationId: string;
  reason: string | null;
  changedAt: string;
}

export interface CreateDraftSemenOrderInputBody {
  semenListingId: string;
  breederOrganizationId: string;
  requestedDeliveryDate?: string | null;
  shippingContactName?: string | null;
  shippingContactPhone?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingRegion?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  specialInstructions?: string | null;
  reason?: string | null;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateDraftSemenOrderInput
  extends Omit<CreateDraftSemenOrderInputBody, "semenListingId"> {
  orderId?: string | null;
  orderNumber?: string | null;
  orderNumberSequence?: number;
  statusHistoryId?: string | null;
  listing: SemenListingLike;
  actor: SemenOrderActorContext;
}

export interface TransitionSemenOrderStatusInputBody {
  toStatus: SemenOrderStatus | string;
  reason?: string | null;
  now?: string | Date;
}

export interface TransitionSemenOrderStatusInput
  extends TransitionSemenOrderStatusInputBody {
  existingOrder: SemenOrder;
  statusHistoryId?: string | null;
  actor: SemenOrderActorContext;
}

export interface PreparedSemenOrderStatusChange {
  order: SemenOrder;
  statusHistory: OrderStatusHistory;
  auditHook: SemenOrderStatusAuditHook;
  proofHook: SemenOrderProofHook;
}

export interface SemenOrderAuditValue {
  orderNumber: string;
  semenListingId: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: SemenOrderStatus;
  requestedDeliveryDate: string | null;
  shippingContactName: string | null;
  shippingContactPhone: string | null;
  shippingAddressLine1: string | null;
  shippingAddressLine2: string | null;
  shippingCity: string | null;
  shippingRegion: string | null;
  shippingPostalCode: string | null;
  shippingCountry: string | null;
  specialInstructions: string | null;
}

export interface SemenOrderStatusAuditHook {
  eventType: "SEMEN_ORDER_STATUS_CHANGE";
  action: SemenOrderStatusAuditAction;
  actorUserId: string;
  actorRoleCode: SemenOrderStatusActorRoleCode;
  actorOrganizationId: string;
  targetType: "SemenOrder";
  targetId: string | null;
  targetRef: {
    orderNumber: string;
    semenListingId: string;
    breederOrganizationId: string;
    breedingStationOrganizationId: string;
  };
  statusHistoryId: string | null;
  previousValue: Readonly<SemenOrderAuditValue> | null;
  newValue: Readonly<SemenOrderAuditValue>;
  reason: string | null;
  occurredAt: string;
}

export interface SemenOrderProofHook {
  hookType: "PROOF_EVENT_REQUEST";
  source: "ORDER_STATUS_CHANGE";
  triggerType: "SEMEN_ORDER_STATUS_CHANGE";
  triggerRef: {
    targetType: "SemenOrder";
    targetId: string | null;
    semenOrderId: string | null;
    orderNumber: string;
    breederOrganizationId: string;
    breedingStationOrganizationId: string;
    statusHistoryId: string | null;
    fromStatus: SemenOrderStatus | null;
    toStatus: SemenOrderStatus;
  };
  documentationRefs: readonly [];
  actorRef: {
    userId: string;
    roleCode: SemenOrderStatusActorRoleCode;
    organizationId: string;
  };
  signatureRef: {
    type: "MANAGED_AUTH_ACTOR_CONTEXT";
    actorUserId: string;
  };
  verificationLevelRef: null;
  auditHookRef: {
    eventType: "SEMEN_ORDER_STATUS_CHANGE";
    action: SemenOrderStatusAuditAction;
    occurredAt: string;
  };
  occurredAt: string;
}

export interface SemenOrderNumberInput {
  sequence: number;
  occurredAt?: string | Date;
}

export interface SemenOrderStatusAuditHookInput {
  action: SemenOrderStatusAuditAction;
  order: SemenOrderLike;
  previousOrder: SemenOrderLike | null;
  statusHistory: OrderStatusHistory;
}

export interface SemenOrderProofHookInput {
  order: SemenOrderLike;
  statusHistory: OrderStatusHistory;
  auditHook: SemenOrderStatusAuditHook;
}

export interface SemenOrderRepository extends AuditLogWriteRepository {
  findSemenListingById(listingId: string): Promise<SemenListingLike | null>;
  nextSemenOrderNumberSequence(): Promise<number>;
  createSemenOrderWithStatusHistory(
    order: SemenOrder,
    statusHistory: OrderStatusHistory,
  ): Promise<PreparedPersistedSemenOrderStatusChange>;
  updateSemenOrderWithStatusHistory(
    order: SemenOrder,
    statusHistory: OrderStatusHistory,
  ): Promise<PreparedPersistedSemenOrderStatusChange>;
  findSemenOrderById(orderId: string): Promise<SemenOrder | null>;
  listOrderStatusHistory(orderId: string): Promise<OrderStatusHistory[]>;
}

export interface PreparedPersistedSemenOrderStatusChange {
  order: SemenOrder;
  statusHistory: OrderStatusHistory;
}

export interface EndpointRequest<
  TBody = Record<string, never>,
  TQuery = Record<string, never>,
> {
  actor: SemenOrderActorContext;
  repository: SemenOrderRepository;
  auditContext?: AuditRequestContext | null;
  params?: Record<string, string | undefined>;
  body: TBody;
  query?: TQuery;
}

export interface EndpointResponse<TBody> {
  status: number;
  body: TBody;
  auditHook?: SemenOrderStatusAuditHook;
  auditLog?: AuditLog;
  proofHook?: SemenOrderProofHook;
}

export declare const SEMEN_ORDER_STATUSES: readonly SemenOrderStatus[];
export declare const SEMEN_ORDER_STATUS_AUDIT_ACTIONS: readonly SemenOrderStatusAuditAction[];
export declare const SEMEN_ORDER_STATUS_TRANSITIONS: Readonly<
  Record<SemenOrderStatus, readonly SemenOrderStatus[]>
>;
export declare const SEMEN_ORDER_ROUTES: readonly {
  method: string;
  path: string;
  handler: string;
  access: string;
}[];

export declare class SemenOrderValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class SemenOrderAuthorizationError extends Error {
  constructor(message: string);
}

export declare class SemenOrderNotFoundError extends Error {
  readonly entityName: string;
  readonly entityId: string;
  constructor(entityName: string, entityId: string);
}

export declare function isSemenOrderStatus(
  value: unknown,
): value is SemenOrderStatus;
export declare function canViewSemenOrder(
  actor: SemenOrderActorContext,
  order: SemenOrderLike,
): boolean;
export declare function canTransitionSemenOrderStatus(
  actor: SemenOrderActorContext,
  order: SemenOrderLike,
  toStatus: SemenOrderStatus,
): boolean;
export declare function generateSemenOrderNumber(
  input: SemenOrderNumberInput,
): string;
export declare function validateCreateDraftSemenOrderInput(
  input: CreateDraftSemenOrderInput,
): string[];
export declare function validateSemenOrderSubmissionDetails(
  order: SemenOrderLike,
): string[];
export declare function prepareCreateDraftSemenOrder(
  input: CreateDraftSemenOrderInput,
): PreparedSemenOrderStatusChange;
export declare function validateTransitionSemenOrderStatusInput(
  input: TransitionSemenOrderStatusInput,
): string[];
export declare function prepareTransitionSemenOrderStatus(
  input: TransitionSemenOrderStatusInput,
): PreparedSemenOrderStatusChange;
export declare function buildSemenOrderStatusAuditHook(
  input: SemenOrderStatusAuditHookInput,
): SemenOrderStatusAuditHook;
export declare function buildSemenOrderProofHook(
  input: SemenOrderProofHookInput,
): SemenOrderProofHook;
export declare function createDraftSemenOrderEndpoint(
  request: EndpointRequest<CreateDraftSemenOrderInputBody>,
): Promise<
  EndpointResponse<{
    order: SemenOrder;
    statusHistory: OrderStatusHistory;
  }>
>;
export declare function transitionSemenOrderStatusEndpoint(
  request: EndpointRequest<TransitionSemenOrderStatusInputBody>,
): Promise<
  EndpointResponse<{
    order: SemenOrder;
    statusHistory: OrderStatusHistory;
  }>
>;
export declare function getSemenOrderEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ order: SemenOrder }>>;
export declare function listOrderStatusHistoryEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ statusHistory: OrderStatusHistory[] }>>;
