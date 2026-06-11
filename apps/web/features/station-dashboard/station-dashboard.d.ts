import type {
  SemenListingRecord,
  SemenListingLike,
  SemenAvailabilityStatus,
} from "@coritech/domain/catalog/semen-catalog.d.ts";
import type {
  DocumentAccessClassification,
  DocumentLike as ApiDocumentLike,
  DocumentLinkTargetType,
} from "@coritech/domain/documents/document-evidence.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type {
  OrderStatusHistory,
  SemenOrderLike as ApiSemenOrderLike,
  SemenOrderStatus,
} from "@coritech/domain/orders/semen-order.d.ts";
import type {
  ShipmentLike as ApiShipmentLike,
  ShipmentStatus,
  ShipmentTrackingEvent,
} from "@coritech/domain/shipments/shipment.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";
import type { ProofTimelineViewModel } from "../proof-timeline/proof-timeline.d.ts";
import type { ActionRequiredItem } from "../action-required/action-required.d.ts";

export type StationDashboardViewState = "LOADING" | "READY" | "ERROR";

export type StationDashboardActionKind =
  | "OPEN_ORDER"
  | "RECEIVE_ORDER"
  | "CONFIRM_ORDER"
  | "REJECT_ORDER"
  | "CREATE_SHIPMENT"
  | "UPDATE_SHIPMENT"
  | "UPLOAD_DOCUMENT";

export interface StationDashboardActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface StationDashboardInput {
  actor: StationDashboardActorContext;
  organizationId?: string | null;
  organizationName?: string | null;
  selectedOrderId?: string | null;
  listingRecords?: SemenListingRecordLike[];
  orders?: SemenOrderLike[];
  statusHistory?: OrderStatusHistoryLike[];
  shipments?: ShipmentLike[];
  shipmentTrackingEvents?: ShipmentTrackingEventLike[];
  documents?: DocumentLike[];
  proofEvents?: ProofEventLike[];
  recentDocumentsLimit?: number;
  actionItemsLimit?: number;
  shipmentsToUpdateLimit?: number;
  notificationsLimit?: number;
}

export interface SemenListingRecordLike extends SemenListingRecord {
  listing: SemenListingLike;
}

export interface SemenOrderLike extends ApiSemenOrderLike {
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStatusHistoryLike extends OrderStatusHistory {}

export interface ShipmentLike extends ApiShipmentLike {}

export interface ShipmentTrackingEventLike extends ShipmentTrackingEvent {}

export interface DocumentLike extends ApiDocumentLike {}

export interface ProofEventLike extends ProofEvent {}

export interface StationOrganizationContext {
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDING_STATION";
}

export interface StationDashboardViewModel {
  state: "READY";
  actorUserId: string;
  organizationContext: StationOrganizationContext;
  navigation: StationDashboardNavigation;
  selectedOrder: StationDashboardSelectedOrder | null;
  sections: {
    activeListings: StationDashboardSection<StationDashboardListingCard>;
    incomingOrders: StationDashboardSection<StationDashboardOrderRow>;
    orderStatusSummary: StationDashboardSection<StationDashboardStatusSummaryItem>;
    actionRequired: StationDashboardSection<ActionRequiredItem>;
    ordersNeedingAction: StationDashboardSection<StationDashboardActionItem>;
    shipmentsToUpdate: StationDashboardSection<StationDashboardShipmentAction>;
    recentDocuments: StationDashboardSection<StationDashboardDocumentRow>;
    notifications: StationDashboardSection<StationDashboardNotification>;
  };
  isEmpty: boolean;
}

export interface StationDashboardNavigation {
  dashboardHref: string;
  listingManagementHref: string;
  orderManagementHref: string;
}

export interface StationDashboardLoadingViewModel {
  state: "LOADING";
  title: string;
  message: string;
}

export interface StationDashboardErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type StationDashboardRenderableViewModel =
  | StationDashboardViewModel
  | StationDashboardLoadingViewModel
  | StationDashboardErrorViewModel;

export interface StationDashboardSection<TItem> {
  title: string;
  emptyMessage: string;
  items: readonly TItem[];
}

export interface StationDashboardListingCard {
  id: string | null;
  stallionId: string;
  stallionName: string;
  breed: string;
  availabilityStatus: SemenAvailabilityStatus;
  listingStatus: "ACTIVE" | "INACTIVE";
  termsSummary: string | null;
  managementHref: string | null;
}

export interface StationDashboardOrderRow {
  id: string | null;
  orderNumber: string;
  semenListingId: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: SemenOrderStatus;
  requestedDeliveryDate: string | null;
  updatedAt: string | null;
  detailHref: string | null;
  latestStatusChange: StationDashboardStatusHistoryRow | null;
  actions: readonly StationDashboardActionItem[];
}

export interface StationDashboardSelectedOrder extends StationDashboardOrderRow {
  mareName: string | null;
  mareRegistrationReference: string | null;
  mareBreed: string | null;
  mareOwnerName: string | null;
  intendedInseminationContext: string | null;
  vetOrRecipientContact: string | null;
  shippingContactName: string | null;
  shippingContactPhone: string | null;
  shippingDestination: string | null;
  specialInstructions: string | null;
  statusHistory: readonly StationDashboardStatusHistoryRow[];
  shipments: readonly StationDashboardShipmentRow[];
  documents: readonly StationDashboardDocumentRow[];
  proofTimeline: ProofTimelineViewModel;
}

export interface StationDashboardStatusHistoryRow {
  id: string | null;
  semenOrderId: string | null;
  orderNumber: string;
  fromStatus: SemenOrderStatus | null;
  toStatus: SemenOrderStatus;
  actorRoleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  actorOrganizationId: string;
  reason: string | null;
  changedAt: string;
}

export interface StationDashboardStatusSummaryItem {
  status: SemenOrderStatus;
  count: number;
}

export interface StationDashboardShipmentRow {
  id: string | null;
  semenOrderId: string;
  orderNumber: string;
  status: ShipmentStatus;
  providerName: string | null;
  providerTrackingId: string | null;
  trackingUrl: string | null;
  updatedAt: string | null;
  latestTrackingEvent: StationDashboardShipmentTrackingEventRow | null;
  updateHref: string | null;
  uploadDocumentHref: string | null;
  auditProofReady: boolean;
}

export interface StationDashboardShipmentTrackingEventRow {
  id: string | null;
  shipmentId: string | null;
  fromStatus: ShipmentStatus | null;
  toStatus: ShipmentStatus;
  eventSource: "MANUAL" | "LOGISTICS_PROVIDER" | "SYSTEM";
  providerStatus: string | null;
  location: string | null;
  notes: string | null;
  occurredAt: string;
}

export interface StationDashboardShipmentAction {
  id: string;
  orderNumber: string;
  shipmentId: string | null;
  status: ShipmentStatus | "NOT_CREATED";
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string | null;
  actionKind: "CREATE_SHIPMENT" | "UPDATE_SHIPMENT";
  auditAction: "SHIPMENT_CREATED" | "SHIPMENT_STATUS_UPDATED";
  proofSource: "SHIPMENT_TRACKING_EVENT";
  auditProofReady: boolean;
}

export interface StationDashboardDocumentRow {
  id: string | null;
  documentType: string;
  originalFileName: string;
  targetType: DocumentLinkTargetType;
  targetId: string;
  orderNumber: string | null;
  accessClassification: DocumentAccessClassification;
  status: string;
  createdAt: string;
  detailHref: string | null;
}

export interface StationDashboardActionItem {
  id: string;
  orderNumber: string;
  status: SemenOrderStatus;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string | null;
  actionKind: StationDashboardActionKind;
  auditAction:
    | "SEMEN_ORDER_RECEIVED"
    | "SEMEN_ORDER_CONFIRMED"
    | "SEMEN_ORDER_REJECTED"
    | "SHIPMENT_CREATED"
    | "SHIPMENT_STATUS_UPDATED"
    | "DOCUMENT_UPLOADED"
    | null;
  proofSource:
    | "ORDER_STATUS_CHANGE"
    | "SHIPMENT_TRACKING_EVENT"
    | "DOCUMENT_ACCESS"
    | null;
  auditProofReady: boolean;
}

export interface StationDashboardNotification {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning";
  href: string | null;
}

export declare const STATION_DASHBOARD_VIEW_STATES: readonly StationDashboardViewState[];

export declare const STATION_DASHBOARD_ROUTES: Readonly<{
  dashboard: string;
  listingManagement: string;
  orderManagement: string;
  shipmentManagement: string;
  documentDetail: string;
  documentUpload: string;
}>;

export declare class StationDashboardValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class StationDashboardAuthorizationError extends Error {
  constructor(message: string);
}

export declare function createStationDashboardViewModel(
  input: StationDashboardInput,
): StationDashboardViewModel;

export declare function createStationDashboardLoadingState(
  input?: { organizationName?: string | null },
): StationDashboardLoadingViewModel;

export declare function createStationDashboardErrorState(
  error: unknown,
): StationDashboardErrorViewModel;

export declare function renderStationDashboard(
  viewModel: StationDashboardRenderableViewModel,
): string;

export declare function renderStationDashboardFromInput(
  input: StationDashboardInput,
): string;

export declare function validateStationDashboardInput(
  input: StationDashboardInput | undefined,
): string[];
