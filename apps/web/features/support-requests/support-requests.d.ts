import type {
  CreateSupportRequestInput,
  CreateSupportRequestResult,
  SupportRequest,
  SupportRequestActorContext,
  SupportRequestCategory,
  SupportRequestListFilters,
  SupportRequestRepository,
  SupportRequestStatus,
} from "@coritech/domain/support/support-request.d.ts";
import type { SemenOrderLike } from "@coritech/domain/orders/semen-order.d.ts";

export interface SupportRequestFormInput {
  actor: SupportRequestActorContext;
  order: SemenOrderLike;
  confirmation?: string | null;
}

export interface SupportRequestFormViewModel {
  title: string;
  orderId: string;
  orderNumber: string;
  canSubmit: boolean;
  confirmation: string | null;
  categories: readonly SupportRequestCategoryOption[];
}

export interface SupportRequestCategoryOption {
  value: SupportRequestCategory;
  label: string;
}

export type SubmitSupportRequestResult =
  | {
      ok: true;
      result: CreateSupportRequestResult;
    }
  | {
      ok: false;
      issues: readonly string[];
    };

export interface SubmitSupportRequestInput
  extends Omit<CreateSupportRequestInput, "repository"> {
  repository: SupportRequestRepository;
}

export interface AdminSupportQueueInput {
  actor: SupportRequestActorContext;
  supportRequests: readonly SupportRequest[];
  filters?: SupportRequestListFilters | null;
}

export interface AdminSupportQueueViewModel {
  title: string;
  canAccess: boolean;
  filters: {
    status: string;
    category: string;
  };
  categories: readonly SupportRequestCategoryOption[];
  statuses: readonly SupportRequestStatusOption[];
  rows: readonly AdminSupportQueueRow[];
  emptyMessage: string;
}

export interface SupportRequestStatusOption {
  value: SupportRequestStatus;
  label: string;
}

export interface AdminSupportQueueRow {
  id: string | null;
  objectType: SupportRequest["objectType"];
  objectId: string;
  orderNumber: string;
  category: SupportRequestCategory;
  categoryLabel: string;
  status: SupportRequestStatus;
  statusLabel: string;
  message: string;
  createdByUserId: string;
  createdByOrganizationId: string;
  createdByRole: SupportRequest["createdByRole"];
  adminNotificationStatus: SupportRequest["adminNotificationStatus"];
  createdAt: string;
  detailHref: string;
}

export interface PrismaSupportRequestRepository extends SupportRequestRepository {}

export declare const SUPPORT_REQUEST_ROUTES: Readonly<{
  adminQueue: "/app/admin/support";
}>;
export declare function createSupportRequestFormViewModel(
  input: SupportRequestFormInput,
): SupportRequestFormViewModel;
export declare function submitSupportRequest(
  input: SubmitSupportRequestInput,
): Promise<SubmitSupportRequestResult>;
export declare function createAdminSupportQueueViewModel(
  input: AdminSupportQueueInput,
): AdminSupportQueueViewModel;
export declare function formatSupportRequestCategory(
  value: SupportRequestCategory | string,
): string;
export declare function formatSupportRequestStatus(
  value: SupportRequestStatus | string,
): string;
