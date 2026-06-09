import type {
  AuditLog,
  AuditRequestContext,
} from "@coritech/domain/audit/audit-log.d.ts";
import type {
  SemenAvailabilityStatus,
  SemenCatalogRepository,
  SemenListing,
  SemenListingAuditHook,
  SemenListingLike,
  SemenListingRecord,
  SemenListingStatus,
  Stallion,
  StallionLike,
} from "@coritech/domain/catalog/semen-catalog.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";

export type ListingManagementViewState =
  | "LOADING"
  | "FORM"
  | "CONFIRMATION"
  | "ERROR";

export type ListingManagementOperation = "CREATE" | "UPDATE";

export interface ListingManagementActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface ListingManagementInput {
  actor: ListingManagementActorContext;
  organizationId?: string | null;
  organizationName?: string | null;
  selectedListingId?: string | null;
  listingRecords?: SemenListingRecordLike[];
  stallions?: StallionLike[];
  form?: ListingManagementFormInput;
  validationIssues?: string[];
}

export interface SemenListingRecordLike extends SemenListingRecord {
  listing: SemenListingLike;
  stallion: StallionLike;
}

export interface ListingManagementFormInput {
  listingId?: string | null;
  stallionId?: string | null;
  availabilityStatus?: SemenAvailabilityStatus | string | null;
  listingStatus?: SemenListingStatus | string | null;
  termsSummary?: string | null;
  changeReason?: string | null;
}

export interface ListingManagementFormState {
  listingId: string;
  stallionId: string;
  availabilityStatus: string;
  listingStatus: string;
  termsSummary: string;
  changeReason: string;
}

export interface ListingManagementOrganizationContext {
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDING_STATION";
}

export interface ListingManagementNavigation {
  dashboardHref: string;
  listingManagementHref: string;
  catalogHref: string;
}

export interface ListingManagementListingRow {
  id: string | null;
  stallionId: string;
  stallionName: string;
  breed: string;
  availabilityStatus: SemenAvailabilityStatus;
  listingStatus: SemenListingStatus;
  termsSummary: string | null;
  editHref: string | null;
  catalogHref: string | null;
  canActivate: boolean;
  canDeactivate: boolean;
}

export interface ListingManagementStallionOption {
  id: string;
  name: string;
  breed: string;
  label: string;
}

export interface ListingManagementFormViewModel {
  state: "FORM";
  actorUserId: string;
  organizationContext: ListingManagementOrganizationContext;
  title: string;
  summary: string;
  mode: "CREATE" | "EDIT";
  listings: readonly ListingManagementListingRow[];
  stallionOptions: readonly ListingManagementStallionOption[];
  selectedListing: ListingManagementListingRow | null;
  form: ListingManagementFormState;
  validationIssues: readonly string[];
  navigation: ListingManagementNavigation;
  availabilityStatuses: readonly SemenAvailabilityStatus[];
  listingStatuses: readonly SemenListingStatus[];
  isEmpty: boolean;
}

export interface ListingManagementConfirmationInput {
  record: SemenListingRecordLike;
  operation: ListingManagementOperation;
  auditHook?: SemenListingAuditHook | null;
  auditLog?: AuditLog | null;
}

export interface ListingManagementConfirmationViewModel {
  state: "CONFIRMATION";
  title: string;
  summary: string;
  listing: ListingManagementListingRow;
  operation: ListingManagementOperation;
  auditHook: SemenListingAuditHook | null;
  auditLog: AuditLog | null;
  navigation: ListingManagementNavigation;
}

export interface ListingManagementLoadingViewModel {
  state: "LOADING";
  title: string;
  message: string;
}

export interface ListingManagementErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type ListingManagementRenderableViewModel =
  | ListingManagementFormViewModel
  | ListingManagementConfirmationViewModel
  | ListingManagementLoadingViewModel
  | ListingManagementErrorViewModel;

export interface SaveSemenListingFromFormInput {
  actor: ListingManagementActorContext;
  organizationId: string;
  repository: SemenCatalogRepository;
  form: ListingManagementFormInput;
  listingStatusOverride?: SemenListingStatus | string | null;
  auditContext?: AuditRequestContext | null;
  now?: string | Date;
}

export type SaveSemenListingFromFormResult =
  | {
      ok: true;
      operation: ListingManagementOperation;
      form: ListingManagementFormState;
      listing: SemenListing;
      auditHook: SemenListingAuditHook | null;
      auditLog: AuditLog | null;
    }
  | {
      ok: false;
      operation: ListingManagementOperation;
      form: ListingManagementFormState;
      issues: readonly string[];
    };

export interface InMemoryListingManagementRepositoryInput {
  listingRecords?: SemenListingRecordLike[];
  stallions?: StallionLike[];
  listingSequenceStart?: number;
  stallionSequenceStart?: number;
  auditLogSequenceStart?: number;
}

export interface InMemoryListingManagementRepository
  extends SemenCatalogRepository {
  listAuditLogs(): Promise<AuditLog[]>;
}

export declare const LISTING_MANAGEMENT_VIEW_STATES: readonly ListingManagementViewState[];
export declare const LISTING_MANAGEMENT_ROUTES: Readonly<{
  dashboard: string;
  listingManagement: string;
  catalog: string;
}>;

export declare class ListingManagementValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class ListingManagementAuthorizationError extends Error {
  constructor(message: string);
}

export declare function createListingManagementViewModel(
  input: ListingManagementInput,
): ListingManagementFormViewModel;

export declare function createListingManagementConfirmationViewModel(
  input: ListingManagementConfirmationInput,
): ListingManagementConfirmationViewModel;

export declare function createListingManagementLoadingState(
  input?: { organizationName?: string | null },
): ListingManagementLoadingViewModel;

export declare function createListingManagementErrorState(
  error: unknown,
): ListingManagementErrorViewModel;

export declare function saveSemenListingFromForm(
  input: SaveSemenListingFromFormInput,
): Promise<SaveSemenListingFromFormResult>;

export declare function renderListingManagement(
  viewModel: ListingManagementRenderableViewModel,
): string;

export declare function createInMemoryListingManagementRepository(
  input: InMemoryListingManagementRepositoryInput,
): InMemoryListingManagementRepository;
