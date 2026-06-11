import type {
  AuditLog,
  AuditRequestContext,
} from "@coritech/domain/audit/audit-log.d.ts";
import type {
  SemenAvailabilityStatus,
  SemenListingRecord,
  SemenListingLike,
} from "@coritech/domain/catalog/semen-catalog.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type {
  OrderStatusHistory,
  OrderServiceOptions,
  OrderNotificationHook,
  SemenOrder,
  SemenOrderLike,
  SemenOrderProofHook,
  SemenOrderRepository,
  SemenOrderStatus,
  SemenOrderStatusAuditHook,
} from "@coritech/domain/orders/semen-order.d.ts";

export type SemenOrderCreationViewState =
  | "LOADING"
  | "FORM"
  | "CONFIRMATION"
  | "ERROR";

export type SemenOrderCreationAction = "draft" | "submit" | "cancel";

export interface SemenOrderCreationActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface SemenOrderCreationInput {
  actor: SemenOrderCreationActorContext;
  organizationId?: string | null;
  organizationName?: string | null;
  draftOrder?: SemenOrderLike | null;
  selectedListingId?: string | null;
  listingRecords?: SemenListingRecordLike[];
  stationOrganizations?: SemenOrderCreationStationOrganization[];
  form?: SemenOrderCreationFormInput;
  validationIssues?: string[];
}

export interface SemenListingRecordLike extends SemenListingRecord {
  listing: SemenListingLike;
}

export interface SemenOrderCreationStationOrganization {
  organizationId: string;
  name: string;
}

export interface SemenOrderCreationFormInput {
  orderId?: string | null;
  semenListingId?: string | null;
  requestedDeliveryDate?: string | null;
  mareName?: string | null;
  mareRegistrationReference?: string | null;
  mareBreed?: string | null;
  mareOwnerName?: string | null;
  intendedInseminationContext?: string | null;
  vetOrRecipientContact?: string | null;
  shippingContactName?: string | null;
  shippingContactPhone?: string | null;
  shippingAddressLine1?: string | null;
  shippingAddressLine2?: string | null;
  shippingCity?: string | null;
  shippingRegion?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string | null;
  specialInstructions?: string | null;
  cancellationReason?: string | null;
}

export interface SemenOrderCreationFormState {
  orderId: string;
  semenListingId: string;
  requestedDeliveryDate: string;
  mareName: string;
  mareRegistrationReference: string;
  mareBreed: string;
  mareOwnerName: string;
  intendedInseminationContext: string;
  vetOrRecipientContact: string;
  shippingContactName: string;
  shippingContactPhone: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingRegion: string;
  shippingPostalCode: string;
  shippingCountry: string;
  specialInstructions: string;
  cancellationReason: string;
}

export interface SemenOrderCreationOrganizationContext {
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER";
}

export interface SemenOrderCreationListingOption {
  id: string;
  stallionId: string;
  stallionName: string;
  breed: string;
  ueln: string | null;
  microchipNumber: string | null;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  availabilityStatus: SemenAvailabilityStatus;
  termsSummary: string | null;
  stationName: string;
  stationLabel: string;
  catalogDetailHref: string;
}

export interface SemenOrderCreationNavigation {
  catalogHref: string;
  dashboardHref: string;
  newOrderHref: string;
}

export interface SemenOrderCreationFormViewModel {
  state: "FORM";
  actorUserId: string;
  organizationContext: SemenOrderCreationOrganizationContext;
  draftOrder: {
    id: string;
    orderNumber: string;
    status: "DRAFT";
  } | null;
  title: string;
  summary: string;
  selectableListings: readonly SemenOrderCreationListingOption[];
  selectedListing: SemenOrderCreationListingOption | null;
  form: SemenOrderCreationFormState;
  validationIssues: readonly string[];
  navigation: SemenOrderCreationNavigation;
  requiredSubmitFields: readonly string[];
}

export interface SemenOrderCreationConfirmationInput {
  order: SemenOrder;
  statusHistory?: OrderStatusHistory[];
  auditHook?: SemenOrderStatusAuditHook | null;
  proofHook?: SemenOrderProofHook | null;
}

export interface SemenOrderCreationConfirmationViewModel {
  state: "CONFIRMATION";
  title: string;
  summary: string;
  order: {
    id: string | null;
    orderNumber: string;
    status: SemenOrderStatus;
    requestedDeliveryDate: string | null;
    mareName: string | null;
    mareRegistrationReference: string | null;
    mareBreed: string | null;
    shippingCity: string | null;
    shippingCountry: string | null;
    detailHref: string | null;
  };
  statusHistory: readonly OrderStatusHistory[];
  auditHook: SemenOrderStatusAuditHook | null;
  proofHook: SemenOrderProofHook | null;
  navigation: SemenOrderCreationNavigation;
}

export interface SemenOrderCreationLoadingViewModel {
  state: "LOADING";
  title: string;
  message: string;
}

export interface SemenOrderCreationErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type SemenOrderCreationRenderableViewModel =
  | SemenOrderCreationFormViewModel
  | SemenOrderCreationConfirmationViewModel
  | SemenOrderCreationLoadingViewModel
  | SemenOrderCreationErrorViewModel;

export interface CreateSemenOrderFromFormInput {
  action: SemenOrderCreationAction | string;
  actor: SemenOrderCreationActorContext;
  breederOrganizationId: string;
  repository: SemenOrderRepository;
  form: SemenOrderCreationFormInput;
  auditContext?: AuditRequestContext | null;
  notificationService?: OrderServiceOptions["notificationService"] | null;
  transaction?: OrderServiceOptions["transaction"] | null;
  now?: string | Date;
}

export type CreateSemenOrderFromFormResult =
  | {
      ok: true;
      action: SemenOrderCreationAction;
      form: SemenOrderCreationFormState;
      order: SemenOrder;
      statusHistory: readonly OrderStatusHistory[];
      auditHook: SemenOrderStatusAuditHook | null;
      auditLog: AuditLog | null;
      proofHook: SemenOrderProofHook | null;
      notificationHook?: OrderNotificationHook | null;
      draftAuditHook?: SemenOrderStatusAuditHook | null;
      draftProofHook?: SemenOrderProofHook | null;
      idempotent?: boolean;
    }
  | {
      ok: false;
      action: SemenOrderCreationAction;
      form: SemenOrderCreationFormState;
      issues: readonly string[];
    };

export interface InMemorySemenOrderRepositoryInput {
  listingRecords?: SemenListingRecordLike[];
  orders?: SemenOrderLike[];
  statusHistory?: OrderStatusHistory[];
  orderSequenceStart?: number;
  historySequenceStart?: number;
  auditLogSequenceStart?: number;
  orderNumberSequenceStart?: number;
}

export interface InMemorySemenOrderRepository extends SemenOrderRepository {
  listSemenOrders(): Promise<SemenOrder[]>;
  listAllOrderStatusHistory(): Promise<OrderStatusHistory[]>;
  listAuditLogs(): Promise<AuditLog[]>;
}

export declare const SEMEN_ORDER_CREATION_VIEW_STATES: readonly SemenOrderCreationViewState[];
export declare const SEMEN_ORDER_CREATION_ACTIONS: readonly SemenOrderCreationAction[];
export declare const SEMEN_ORDER_CREATION_ROUTES: Readonly<{
  catalog: string;
  dashboard: string;
  newOrder: string;
  orderDetail: string;
}>;

export declare class SemenOrderCreationValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class SemenOrderCreationAuthorizationError extends Error {
  constructor(message: string);
}

export declare function createSemenOrderCreationViewModel(
  input: SemenOrderCreationInput,
): SemenOrderCreationFormViewModel;

export declare function createSemenOrderCreationConfirmationViewModel(
  input: SemenOrderCreationConfirmationInput,
): SemenOrderCreationConfirmationViewModel;

export declare function createSemenOrderCreationLoadingState(
  input?: { label?: string | null },
): SemenOrderCreationLoadingViewModel;

export declare function createSemenOrderCreationErrorState(
  error: unknown,
): SemenOrderCreationErrorViewModel;

export declare function createSemenOrderFromForm(
  input: CreateSemenOrderFromFormInput,
): Promise<CreateSemenOrderFromFormResult>;

export declare function renderSemenOrderCreation(
  viewModel: SemenOrderCreationRenderableViewModel,
): string;

export declare function createInMemorySemenOrderRepository(
  input: InMemorySemenOrderRepositoryInput,
): InMemorySemenOrderRepository;
