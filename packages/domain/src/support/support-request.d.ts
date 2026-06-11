import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";
import type { SemenOrderLike } from "../orders/semen-order.d.ts";

export type SupportRequestObjectType = "SemenOrder";

export type SupportRequestCategory =
  | "ORDER_STATUS"
  | "DOCUMENT_ACCESS"
  | "SHIPMENT"
  | "PAYMENT_REFERENCE"
  | "ACCOUNT_ACCESS"
  | "OTHER";

export type SupportRequestStatus =
  | "OPEN"
  | "IN_REVIEW"
  | "RESOLVED"
  | "CLOSED";

export type SupportRequestNotificationStatus =
  | "QUEUED"
  | "SENT"
  | "FAILED";

export interface SupportRequestActorContext {
  userId: string;
  organizationId: string;
  organizationName?: string | null;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface SupportRequest {
  id: string | null;
  objectType: SupportRequestObjectType;
  objectId: string;
  objectRef: Readonly<Record<string, unknown>>;
  category: SupportRequestCategory;
  message: string;
  status: SupportRequestStatus;
  createdByUserId: string;
  createdByOrganizationId: string;
  createdByRole: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  adminNotificationStatus: SupportRequestNotificationStatus;
  adminNotificationQueuedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SupportRequestNotificationHook {
  eventType: "SUPPORT_REQUEST_CREATED";
  channel: "ADMIN_QUEUE";
  queued: true;
  supportRequestId: string | null;
  objectType: SupportRequestObjectType;
  objectId: string;
  createdByUserId: string;
  createdByOrganizationId: string;
  category: SupportRequestCategory;
  occurredAt: string;
}

export interface SupportRequestRepository {
  createSupportRequest(request: SupportRequest): Promise<SupportRequest>;
  listSupportRequests(filters?: SupportRequestListFilters): Promise<SupportRequest[]>;
}

export interface SupportRequestListFilters {
  status?: SupportRequestStatus | string | null;
  category?: SupportRequestCategory | string | null;
  limit?: number | null;
}

export interface CreateSupportRequestInput {
  actor: SupportRequestActorContext;
  order: SemenOrderLike;
  repository: SupportRequestRepository;
  category?: SupportRequestCategory | string | null;
  message?: string | null;
  requestId?: string | null;
  now?: string | Date;
}

export interface CreateSupportRequestResult {
  supportRequest: SupportRequest;
  notificationHook: SupportRequestNotificationHook;
}

export interface ListAdminSupportRequestsInput {
  actor: SupportRequestActorContext;
  repository: SupportRequestRepository;
  filters?: SupportRequestListFilters | null;
}

export declare const SUPPORT_REQUEST_OBJECT_TYPES: readonly SupportRequestObjectType[];
export declare const SUPPORT_REQUEST_CATEGORIES: readonly SupportRequestCategory[];
export declare const SUPPORT_REQUEST_STATUSES: readonly SupportRequestStatus[];
export declare const SUPPORT_REQUEST_NOTIFICATION_STATUSES: readonly SupportRequestNotificationStatus[];
export declare class SupportRequestValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}
export declare class SupportRequestAuthorizationError extends Error {}
export declare function canCreateSupportRequest(
  actor: SupportRequestActorContext,
  order: SemenOrderLike,
): boolean;
export declare function canListAdminSupportRequests(
  actor: SupportRequestActorContext,
): boolean;
export declare function createSupportRequest(
  input: CreateSupportRequestInput,
): Promise<CreateSupportRequestResult>;
export declare function prepareSupportRequest(
  input: CreateSupportRequestInput,
): SupportRequest;
export declare function listAdminSupportRequests(
  input: ListAdminSupportRequestsInput,
): Promise<readonly SupportRequest[]>;
export declare function buildSupportRequestNotificationHook(
  supportRequest: SupportRequest,
): SupportRequestNotificationHook;
export declare function validateCreateSupportRequestInput(
  input: CreateSupportRequestInput | undefined,
): string[];
