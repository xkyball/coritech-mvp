import type {
  CatalogActorContext,
  SemenAvailabilityStatus,
  SemenListingRecord,
  SemenListingLike,
} from "@coritech/domain/catalog/semen-catalog.d.ts";

export type SemenCatalogViewState = "LOADING" | "LIST" | "DETAIL" | "ERROR";

export interface SemenCatalogStationOrganization {
  organizationId: string;
  name: string;
}

export interface SemenCatalogFiltersInput {
  stallion?: string | null;
  breed?: string | null;
  station?: string | null;
  availabilityStatus?: SemenAvailabilityStatus | string | null;
}

export interface SemenCatalogNormalizedFilters {
  stallion: string | null;
  breed: string | null;
  station: string | null;
  availabilityStatus: SemenAvailabilityStatus | null;
}

export interface SemenCatalogInput {
  actor: CatalogActorContext;
  listingRecords?: SemenListingRecordLike[];
  stationOrganizations?: SemenCatalogStationOrganization[];
  filters?: SemenCatalogFiltersInput;
}

export interface SemenCatalogDetailInput {
  actor: CatalogActorContext;
  listingId: string;
  listingRecords?: SemenListingRecordLike[];
  stationOrganizations?: SemenCatalogStationOrganization[];
}

export interface SemenListingRecordLike extends SemenListingRecord {
  listing: SemenListingLike;
}

export interface SemenCatalogListViewModel {
  state: "LIST";
  actorUserId: string;
  title: string;
  summary: string;
  filters: SemenCatalogNormalizedFilters;
  filterOptions: SemenCatalogFilterOptions;
  listings: readonly SemenCatalogListingCard[];
  navigation: SemenCatalogNavigation;
  isEmpty: boolean;
}

export interface SemenCatalogDetailViewModel {
  state: "DETAIL";
  actorUserId: string;
  title: string;
  listing: SemenCatalogListingDetail;
  navigation: SemenCatalogNavigation;
}

export interface SemenCatalogFilterOptions {
  breeds: readonly SemenCatalogSelectOption[];
  stations: readonly SemenCatalogSelectOption[];
  availabilityStatuses: readonly SemenCatalogSelectOption[];
}

export interface SemenCatalogSelectOption {
  value: string;
  label: string;
}

export interface SemenCatalogNavigation {
  catalogHref: string;
  dashboardHref: string;
  newOrderHref: string;
}

export interface SemenCatalogListingCard {
  id: string | null;
  stallionId: string;
  stallionName: string;
  breed: string;
  stationOrganizationId: string;
  stationName: string;
  stationLabel: string;
  availabilityStatus: SemenAvailabilityStatus;
  termsSummary: string | null;
  detailHref: string | null;
  canCreateOrder: boolean;
  createOrderHref: string | null;
  orderActionLabel: string;
}

export interface SemenCatalogListingDetail extends SemenCatalogListingCard {
  ueln: string | null;
  microchipNumber: string | null;
  listingStatus: "ACTIVE";
}

export interface SemenCatalogLoadingViewModel {
  state: "LOADING";
  title: string;
  message: string;
}

export interface SemenCatalogErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type SemenCatalogRenderableViewModel =
  | SemenCatalogListViewModel
  | SemenCatalogDetailViewModel
  | SemenCatalogLoadingViewModel
  | SemenCatalogErrorViewModel;

export declare const SEMEN_CATALOG_VIEW_STATES: readonly SemenCatalogViewState[];

export declare const SEMEN_CATALOG_UI_ROUTES: Readonly<{
  catalog: string;
  dashboard: string;
  newOrder: string;
}>;

export declare class SemenCatalogUiValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function createSemenCatalogViewModel(
  input: SemenCatalogInput,
): SemenCatalogListViewModel;

export declare function createSemenCatalogDetailViewModel(
  input: SemenCatalogDetailInput,
): SemenCatalogDetailViewModel;

export declare function createSemenCatalogLoadingState(
  input?: { label?: string | null },
): SemenCatalogLoadingViewModel;

export declare function createSemenCatalogErrorState(
  error: unknown,
): SemenCatalogErrorViewModel;

export declare function renderSemenCatalog(
  viewModel: SemenCatalogRenderableViewModel,
): string;

export declare function renderSemenCatalogFromInput(
  input: SemenCatalogInput,
): string;
