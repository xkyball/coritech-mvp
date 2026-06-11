import type { AuditLog } from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type {
  OrderStatusHistory,
  SemenOrder,
  SemenOrderStatus,
} from "@coritech/domain/orders/semen-order.d.ts";
import type { OrderActivity } from "@coritech/domain/orders/order-activity.d.ts";
import type { Document } from "@coritech/domain/documents/document-evidence.d.ts";
import type { ProofTimelineViewModel } from "../proof-timeline/proof-timeline.d.ts";
import type { OrderActivityPanelViewModel } from "../order-activity/order-activity.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";
import type {
  Shipment,
  ShipmentTrackingEvent,
} from "@coritech/domain/shipments/shipment.d.ts";
import type { RbacAccessDecision } from "@coritech/domain/auth/rbac-middleware.d.ts";

export interface AdminOrderSupportActorContext {
  userId: string;
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface AdminOrderSupportOrganization {
  organizationId: string;
  name: string;
}

export interface AdminOrderSupportFilters {
  direction: "asc" | "desc";
  query: string;
  sort: string;
  status: SemenOrderStatus | string;
  page: number;
  pageSize: number;
}

export interface AdminOrderSupportSearchRow {
  id: string | null;
  orderNumber: string;
  status: SemenOrderStatus;
  breederOrganizationId: string;
  breederOrganizationName: string;
  breedingStationOrganizationId: string;
  breedingStationOrganizationName: string;
  updatedAt: string;
  detailHref: string;
}

export interface AdminOrderSupportSearchInput {
  actor: AdminOrderSupportActorContext;
  orders: readonly SemenOrder[];
  organizations?: readonly AdminOrderSupportOrganization[];
  filters?: Record<string, unknown> | AdminOrderSupportFilters | null;
}

export interface AdminOrderSupportSearchViewModel {
  state: "READY";
  routes: typeof ADMIN_ORDER_SUPPORT_ROUTES;
  organizationContext: {
    organizationId: string;
    organizationName: string;
    roleLabel: "Platform Admin";
  };
  filters: AdminOrderSupportFilters;
  rows: readonly AdminOrderSupportSearchRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    previousHref: string;
    nextHref: string;
    firstHref: string;
  };
}

export interface AdminOrderSupportDetailInput {
  actor: AdminOrderSupportActorContext;
  order: SemenOrder;
  organizations?: readonly AdminOrderSupportOrganization[];
  statusHistory: readonly OrderStatusHistory[];
  proofEvents: readonly ProofEvent[];
  documents: readonly Document[];
  shipments: readonly Shipment[];
  shipmentTrackingEvents: readonly ShipmentTrackingEvent[];
  orderActivities?: readonly OrderActivity[];
  auditLogs: readonly AuditLog[];
}

export interface AdminOrderSupportDetailViewModel {
  state: "READY";
  routes: typeof ADMIN_ORDER_SUPPORT_ROUTES;
  organizationContext: {
    organizationId: string;
    organizationName: string;
    roleLabel: "Platform Admin";
  };
  order: AdminOrderSupportSearchRow & {
    requestedDeliveryDate: string | null;
    mareName: string | null;
    mareRegistrationReference: string | null;
    mareBreed: string | null;
    mareOwnerName: string | null;
    intendedInseminationContext: string | null;
    vetOrRecipientContact: string | null;
    shippingContactName: string | null;
    shippingContactPhone: string | null;
    shippingDestination: string;
    specialInstructions: string | null;
  };
  statusHistory: readonly OrderStatusHistory[];
  proofTimeline: ProofTimelineViewModel;
  shipments: readonly Shipment[];
  shipmentTrackingEvents: readonly ShipmentTrackingEvent[];
  documents: readonly Document[];
  activity: OrderActivityPanelViewModel;
  auditLogs: readonly AuditLog[];
  auditHref: string;
  amendmentHref: string;
  canSilentlyOverwriteProofCriticalFields: false;
  notImplementedContext: {
    paymentAvailable: true;
    commentsAvailable: false;
    supportNotesAvailable: false;
  };
}

export declare const ADMIN_ORDER_SUPPORT_ROUTES: Readonly<{
  search: "/app/admin/orders";
  audit: "/app/admin/audit";
  amendmentStart: "/app/admin/amendments/new";
}>;
export declare function canAccessAdminOrderSupport(
  actor: AdminOrderSupportActorContext,
): boolean;
export declare function createAdminOrderSupportSearchViewModel(
  input: AdminOrderSupportSearchInput,
): AdminOrderSupportSearchViewModel;
export declare function createAdminOrderSupportDetailViewModel(
  input: AdminOrderSupportDetailInput,
): AdminOrderSupportDetailViewModel;
export declare function createAdminOrderSupportAccessDecision(input: {
  actor: AdminOrderSupportActorContext;
  order: SemenOrder;
  handlerName?: string;
  now?: string | Date;
}): RbacAccessDecision;
export declare function normalizeSearchFilters(
  input: Record<string, unknown>,
): AdminOrderSupportFilters;
export declare function buildAdminOrderSupportHref(
  filters: AdminOrderSupportFilters,
  override?: Partial<AdminOrderSupportFilters>,
): string;
