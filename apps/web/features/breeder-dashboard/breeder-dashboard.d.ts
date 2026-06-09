import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type {
  SemenListingRecord,
  SemenListingLike,
  SemenAvailabilityStatus,
} from "@coritech/domain/catalog/semen-catalog.d.ts";
import type {
  OrderStatusHistory,
  SemenOrderLike as ApiSemenOrderLike,
  SemenOrderStatus,
} from "@coritech/domain/orders/semen-order.d.ts";
import type {
  DocumentAccessClassification,
  DocumentLike as ApiDocumentLike,
  DocumentLinkTargetType,
} from "@coritech/domain/documents/document-evidence.d.ts";

export type BreederDashboardViewState = "LOADING" | "READY" | "ERROR";

export interface BreederDashboardActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface BreederDashboardInput {
  actor: BreederDashboardActorContext;
  organizationId?: string | null;
  organizationName?: string | null;
  listingRecords?: SemenListingRecordLike[];
  orders?: SemenOrderLike[];
  statusHistory?: OrderStatusHistoryLike[];
  documents?: DocumentLike[];
  recentDocumentsLimit?: number;
  actionItemsLimit?: number;
}

export interface SemenListingRecordLike extends SemenListingRecord {
  listing: SemenListingLike;
}

export interface SemenOrderLike extends ApiSemenOrderLike {
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderStatusHistoryLike extends OrderStatusHistory {}

export interface DocumentLike extends ApiDocumentLike {}

export interface BreederOrganizationContext {
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER";
}

export interface BreederDashboardViewModel {
  state: "READY";
  actorUserId: string;
  organizationContext: BreederOrganizationContext;
  navigation: {
    catalogHref: string;
  };
  sections: {
    activeListings: BreederDashboardSection<BreederDashboardListingCard>;
    myOrders: BreederDashboardSection<BreederDashboardOrderRow>;
    orderStatusSummary: BreederDashboardSection<BreederDashboardStatusSummaryItem>;
    recentDocuments: BreederDashboardSection<BreederDashboardDocumentRow>;
    actionRequired: BreederDashboardSection<BreederDashboardActionItem>;
  };
  isEmpty: boolean;
}

export interface BreederDashboardLoadingViewModel {
  state: "LOADING";
  title: string;
  message: string;
}

export interface BreederDashboardErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type BreederDashboardRenderableViewModel =
  | BreederDashboardViewModel
  | BreederDashboardLoadingViewModel
  | BreederDashboardErrorViewModel;

export interface BreederDashboardSection<TItem> {
  title: string;
  emptyMessage: string;
  items: readonly TItem[];
}

export interface BreederDashboardListingCard {
  id: string | null;
  stallionId: string;
  stallionName: string;
  breed: string;
  breedingStationOrganizationId: string;
  availabilityStatus: SemenAvailabilityStatus;
  termsSummary: string | null;
  canCreateOrder: boolean;
  createOrderHref: string | null;
}

export interface BreederDashboardOrderRow {
  id: string | null;
  orderNumber: string;
  semenListingId: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  status: SemenOrderStatus;
  createdAt: string | null;
  updatedAt: string | null;
  detailHref: string | null;
  statusHistoryHref: string | null;
  statusHistory: readonly BreederDashboardStatusHistoryRow[];
}

export interface BreederDashboardStatusHistoryRow {
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

export interface BreederDashboardStatusSummaryItem {
  status: SemenOrderStatus;
  count: number;
}

export interface BreederDashboardDocumentRow {
  id: string | null;
  documentType: string;
  originalFileName: string;
  targetType: DocumentLinkTargetType;
  targetId: string;
  orderNumber: string | null;
  accessClassification: DocumentAccessClassification;
  createdAt: string;
  detailHref: string | null;
}

export interface BreederDashboardActionItem {
  id: string;
  orderNumber: string;
  status: SemenOrderStatus;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string | null;
}

export declare const BREEDER_DASHBOARD_VIEW_STATES: readonly BreederDashboardViewState[];

export declare const BREEDER_DASHBOARD_ROUTES: Readonly<{
  catalog: string;
  newOrder: string;
  orderDetail: string;
  documentDetail: string;
}>;

export declare class BreederDashboardValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class BreederDashboardAuthorizationError extends Error {
  constructor(message: string);
}

export declare function createBreederDashboardViewModel(
  input: BreederDashboardInput,
): BreederDashboardViewModel;

export declare function createBreederDashboardLoadingState(
  input?: { organizationName?: string | null },
): BreederDashboardLoadingViewModel;

export declare function createBreederDashboardErrorState(
  error: unknown,
): BreederDashboardErrorViewModel;

export declare function renderBreederDashboard(
  viewModel: BreederDashboardRenderableViewModel,
): string;

export declare function renderBreederDashboardFromInput(
  input: BreederDashboardInput,
): string;

export declare function validateDashboardInput(
  input: BreederDashboardInput | undefined,
): string[];
