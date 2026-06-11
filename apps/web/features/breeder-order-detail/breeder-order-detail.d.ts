import type { DocumentLike as ApiDocumentLike } from "@coritech/domain/documents/document-evidence.d.ts";
import type {
  DocumentAccessClassification,
  DocumentLinkTargetType,
} from "@coritech/domain/documents/document-evidence.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type {
  OrderStatusHistory,
  SemenOrderLike as ApiSemenOrderLike,
  SemenOrderStatus,
} from "@coritech/domain/orders/semen-order.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";
import type {
  ShipmentLike as ApiShipmentLike,
  ShipmentConfirmationSource,
  ShipmentStatus,
  ShipmentTrackingEvent,
  ShipmentTrackingEventSource,
} from "@coritech/domain/shipments/shipment.d.ts";
import type { OrderActivity } from "@coritech/domain/orders/order-activity.d.ts";
import type { PaymentReferenceLike } from "@coritech/domain/payments/payment-reference.d.ts";
import type { OrderActivityPanelViewModel } from "../order-activity/order-activity.d.ts";
import type { PaymentReferencePanelViewModel } from "../payment-references/payment-reference-ui.d.ts";
import type { ProofTimelineItem } from "../proof-timeline/proof-timeline.d.ts";
import type { SupportRequestFormViewModel } from "../support-requests/support-requests.d.ts";

export type BreederOrderDetailViewState = "LOADING" | "READY" | "ERROR";

export interface BreederOrderDetailActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface BreederOrderDetailInput {
  actor: BreederOrderDetailActorContext;
  orderId: string;
  organizationId?: string | null;
  organizationName?: string | null;
  orders?: SemenOrderLike[];
  statusHistory?: OrderStatusHistoryLike[];
  shipments?: ShipmentLike[];
  shipmentTrackingEvents?: ShipmentTrackingEventLike[];
  documents?: DocumentLike[];
  proofEvents?: ProofEventLike[];
  orderActivities?: OrderActivityLike[];
  paymentReference?: PaymentReferenceLike | null;
  supportEmail?: string | null;
  supportConfirmation?: string | null;
}

export interface SemenOrderLike extends ApiSemenOrderLike {}
export interface OrderStatusHistoryLike extends OrderStatusHistory {}
export interface ShipmentLike extends ApiShipmentLike {}
export interface ShipmentTrackingEventLike extends ShipmentTrackingEvent {}
export interface DocumentLike extends ApiDocumentLike {}
export interface ProofEventLike extends ProofEvent {}
export interface OrderActivityLike extends OrderActivity {}

export interface BreederOrderDetailOrganizationContext {
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER";
}

export interface BreederOrderDetailNavigation {
  dashboardHref: string;
  ordersHref: string;
}

export interface BreederOrderDetailSupportAction {
  label: string;
  href: string;
  orderNumber: string;
}

export interface BreederOrderCancellationAction {
  orderId: string;
  title: string;
  description: string;
  reasonLabel: string;
  buttonLabel: string;
}

export interface BreederOrderDetailViewModel {
  state: "READY";
  actorUserId: string;
  title: string;
  summary: string;
  organizationContext: BreederOrderDetailOrganizationContext;
  navigation: BreederOrderDetailNavigation;
  supportAction: BreederOrderDetailSupportAction;
  supportRequest: SupportRequestFormViewModel;
  cancellationAction: BreederOrderCancellationAction | null;
  order: BreederOrderSummary;
  currentStatus: BreederOrderCurrentStatus;
  paymentReference: PaymentReferencePanelViewModel;
  sections: {
    orderSummary: BreederOrderDetailSection<BreederOrderSummaryItem>;
    statusHistory: BreederOrderDetailSection<BreederOrderStatusHistoryRow>;
    shipments: BreederOrderDetailSection<BreederOrderShipmentRow>;
    documents: BreederOrderDetailSection<BreederOrderDocumentRow>;
    proofEvents: BreederOrderDetailSection<BreederOrderProofEventRow>;
    activity: OrderActivityPanelViewModel;
  };
}

export interface BreederOrderSummary {
  id: string | null;
  orderNumber: string;
  semenListingId: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: SemenOrderStatus;
  requestedDeliveryDate: string | null;
  mareName: string | null;
  mareRegistrationReference: string | null;
  mareBreed: string | null;
  mareOwnerName: string | null;
  intendedInseminationContext: string | null;
  vetOrRecipientContact: string | null;
  shippingContactName: string | null;
  shippingContactPhone: string | null;
  shippingAddressLines: readonly string[];
  specialInstructions: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BreederOrderCurrentStatus {
  status: SemenOrderStatus;
  latestChange: BreederOrderStatusHistoryRow | null;
}

export interface BreederOrderDetailSection<TItem> {
  title: string;
  emptyMessage: string;
  items: readonly TItem[];
}

export interface BreederOrderSummaryItem {
  term: string;
  value: string;
}

export interface BreederOrderStatusHistoryRow {
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

export interface BreederOrderShipmentRow {
  id: string | null;
  semenOrderId: string;
  orderNumber: string;
  status: ShipmentStatus;
  providerName: string | null;
  providerTrackingId: string | null;
  trackingUrl: string | null;
  deliveredAt: string | null;
  confirmedReceivedAt: string | null;
  confirmedByUserId: string | null;
  confirmationSource: ShipmentConfirmationSource | string | null;
  canConfirmReceived: boolean;
  confirmationSummary: string;
  createdAt: string | null;
  updatedAt: string | null;
  trackingEvents: readonly BreederOrderShipmentTrackingEventRow[];
}

export interface BreederOrderShipmentTrackingEventRow {
  id: string | null;
  shipmentId: string | null;
  fromStatus: ShipmentStatus | null;
  toStatus: ShipmentStatus;
  eventSource: ShipmentTrackingEventSource;
  providerStatus: string | null;
  location: string | null;
  notes: string | null;
  actorRoleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  actorOrganizationId: string;
  occurredAt: string;
}

export interface BreederOrderDocumentRow {
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

export interface BreederOrderProofEventRow extends ProofTimelineItem {}

export interface BreederOrderDetailLoadingViewModel {
  state: "LOADING";
  title: string;
  message: string;
}

export interface BreederOrderDetailErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type BreederOrderDetailRenderableViewModel =
  | BreederOrderDetailViewModel
  | BreederOrderDetailLoadingViewModel
  | BreederOrderDetailErrorViewModel;

export declare const BREEDER_ORDER_DETAIL_VIEW_STATES: readonly BreederOrderDetailViewState[];

export declare const BREEDER_ORDER_DETAIL_ROUTES: Readonly<{
  dashboard: string;
  orders: string;
  documentDetail: string;
}>;

export declare class BreederOrderDetailValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class BreederOrderDetailAuthorizationError extends Error {
  constructor(message: string);
}

export declare class BreederOrderDetailNotFoundError extends Error {
  readonly entityName: string;
  readonly entityId: string;
  constructor(entityName: string, entityId: string);
}

export declare function createBreederOrderDetailViewModel(
  input: BreederOrderDetailInput,
): BreederOrderDetailViewModel;

export declare function createBreederOrderDetailLoadingState(
  input?: { orderLabel?: string | null },
): BreederOrderDetailLoadingViewModel;

export declare function createBreederOrderDetailErrorState(
  error: unknown,
): BreederOrderDetailErrorViewModel;

export declare function renderBreederOrderDetail(
  viewModel: BreederOrderDetailRenderableViewModel,
): string;

export declare function renderBreederOrderDetailFromInput(
  input: BreederOrderDetailInput,
): string;

export declare function validateBreederOrderDetailInput(
  input: BreederOrderDetailInput | undefined,
): string[];
