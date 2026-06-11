import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type {
  SemenOrderLike as ApiSemenOrderLike,
  SemenOrderStatus,
} from "@coritech/domain/orders/semen-order.d.ts";
import type { ShipmentLike as ApiShipmentLike } from "@coritech/domain/shipments/shipment.d.ts";
import type { SupportRequest } from "@coritech/domain/support/support-request.d.ts";
import type { Amendment } from "@coritech/domain/amendments/amendment.d.ts";
import type { NotificationEmailDeliveryLog } from "@coritech/domain/notifications/email-provider.d.ts";

export type ActionRequiredRoleCode =
  | "BREEDER"
  | "BREEDING_STATION"
  | "PLATFORM_ADMIN";

export type ActionRequiredPriority = "HIGH" | "MEDIUM" | "LOW";

export type ActionRequiredActionType =
  | "SUBMIT_DRAFT_ORDER"
  | "REVIEW_CONFIRMED_ORDER"
  | "REVIEW_REJECTED_ORDER"
  | "CONFIRM_SHIPMENT_RECEIPT"
  | "RECEIVE_ORDER"
  | "CONFIRM_ORDER"
  | "REJECT_ORDER"
  | "CREATE_SHIPMENT"
  | "UPDATE_SHIPMENT"
  | "REVIEW_SUPPORT_REQUEST"
  | "REVIEW_AMENDMENT"
  | "REVIEW_FAILED_NOTIFICATION";

export type ActionRequiredObjectType =
  | "SemenOrder"
  | "Shipment"
  | "SupportRequest"
  | "Amendment"
  | "NotificationLog";

export interface ActionRequiredActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface BreederActionRequiredInput {
  actor: ActionRequiredActorContext;
  organizationId?: string | null;
  orders?: readonly SemenOrderLike[];
  shipments?: readonly ShipmentLike[];
  limit?: number | null;
}

export interface StationActionRequiredInput {
  actor: ActionRequiredActorContext;
  organizationId?: string | null;
  orders?: readonly SemenOrderLike[];
  shipments?: readonly ShipmentLike[];
  limit?: number | null;
}

export interface AdminActionRequiredInput {
  actor: ActionRequiredActorContext;
  supportRequests?: readonly SupportRequestLike[];
  amendments?: readonly AmendmentLike[];
  notificationLogs?: readonly NotificationEmailDeliveryLog[];
  limit?: number | null;
}

export interface SemenOrderLike extends ApiSemenOrderLike {
  createdAt?: string;
  updatedAt?: string;
}

export interface ShipmentLike extends ApiShipmentLike {}

export interface SupportRequestLike extends SupportRequest {}

export interface AmendmentLike extends Amendment {}

export interface BreederOrderActionCopy {
  actionType: Extract<
    ActionRequiredActionType,
    "SUBMIT_DRAFT_ORDER" | "REVIEW_CONFIRMED_ORDER" | "REVIEW_REJECTED_ORDER"
  >;
  title: string;
  description: string;
  actionLabel: string;
  priority: ActionRequiredPriority;
}

export interface ActionRequiredItemInput {
  id: string;
  actorRoleCode: ActionRequiredRoleCode;
  actionType: ActionRequiredActionType;
  objectType: ActionRequiredObjectType;
  objectId: string;
  objectLabel: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string | null;
  priority: ActionRequiredPriority;
  dueAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface ActionRequiredItem extends ActionRequiredItemInput {
  dueAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export declare const ACTION_REQUIRED_ROUTES: Readonly<{
  breederOrderDetail: "/app/orders";
  breederOrderDraft: "/app/orders/new";
  stationDashboard: "/station-dashboard";
  stationShipments: "/app/station/shipments";
  adminAudit: "/app/admin/audit";
  adminAmendments: "/app/admin/amendments";
  adminSupport: "/app/admin/support";
}>;

export declare function createBreederActionRequiredItems(
  input: BreederActionRequiredInput,
): ActionRequiredItem[];

export declare function createStationActionRequiredItems(
  input: StationActionRequiredInput,
): ActionRequiredItem[];

export declare function createAdminActionRequiredItems(
  input: AdminActionRequiredInput,
): ActionRequiredItem[];

export type { SemenOrderStatus };
