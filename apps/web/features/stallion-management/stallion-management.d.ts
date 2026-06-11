import type {
  AuditLog,
  AuditRequestContext,
} from "@coritech/domain/audit/audit-log.d.ts";
import type {
  SemenCatalogRepository,
  Stallion,
  StallionAuditHook,
  StallionLike,
  StallionStatus,
} from "@coritech/domain/catalog/semen-catalog.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";

export type StallionManagementViewState =
  | "LOADING"
  | "FORM"
  | "CONFIRMATION"
  | "ERROR";

export type StallionManagementOperation = "CREATE" | "UPDATE";

export interface StallionManagementActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface StallionManagementInput {
  actor: StallionManagementActorContext;
  organizationId?: string | null;
  organizationName?: string | null;
  selectedStallionId?: string | null;
  searchQuery?: string | null;
  stallions?: StallionLike[];
  form?: StallionManagementFormInput;
  validationIssues?: string[];
}

export interface StallionManagementFormInput {
  stallionId?: string | null;
  name?: string | null;
  breed?: string | null;
  ueln?: string | null;
  microchipNumber?: string | null;
  status?: StallionStatus | string | null;
  changeReason?: string | null;
}

export interface StallionManagementFormState {
  stallionId: string;
  name: string;
  breed: string;
  ueln: string;
  microchipNumber: string;
  status: string;
  changeReason: string;
}

export interface StallionManagementOrganizationContext {
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDING_STATION";
}

export interface StallionManagementNavigation {
  dashboardHref: string;
  stallionManagementHref: string;
  listingManagementHref: string;
}

export interface StallionManagementStallionRow {
  id: string;
  name: string;
  breed: string;
  ueln: string | null;
  microchipNumber: string | null;
  status: StallionStatus;
  editHref: string;
  createListingHref: string | null;
  canActivate: boolean;
  canDeactivate: boolean;
}

export interface StallionManagementFormViewModel {
  state: "FORM";
  actorUserId: string;
  organizationContext: StallionManagementOrganizationContext;
  title: string;
  summary: string;
  mode: "CREATE" | "EDIT";
  stallions: readonly StallionManagementStallionRow[];
  selectedStallion: StallionManagementStallionRow | null;
  form: StallionManagementFormState;
  searchQuery: string;
  validationIssues: readonly string[];
  navigation: StallionManagementNavigation;
  statuses: readonly StallionStatus[];
  isEmpty: boolean;
}

export interface StallionManagementConfirmationInput {
  stallion: Stallion | StallionLike;
  operation: StallionManagementOperation;
  auditHook?: StallionAuditHook | null;
  auditLog?: AuditLog | null;
}

export interface StallionManagementConfirmationViewModel {
  state: "CONFIRMATION";
  title: string;
  summary: string;
  stallion: StallionManagementStallionRow;
  operation: StallionManagementOperation;
  auditHook: StallionAuditHook | null;
  auditLog: AuditLog | null;
  navigation: StallionManagementNavigation;
}

export interface StallionManagementLoadingViewModel {
  state: "LOADING";
  title: string;
  message: string;
}

export interface StallionManagementErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type StallionManagementRenderableViewModel =
  | StallionManagementFormViewModel
  | StallionManagementConfirmationViewModel
  | StallionManagementLoadingViewModel
  | StallionManagementErrorViewModel;

export interface SaveStallionFromFormInput {
  actor: StallionManagementActorContext;
  organizationId: string;
  repository: SemenCatalogRepository;
  form: StallionManagementFormInput;
  statusOverride?: StallionStatus | string | null;
  auditContext?: AuditRequestContext | null;
  now?: string | Date;
}

export type SaveStallionFromFormResult =
  | {
      ok: true;
      operation: StallionManagementOperation;
      form: StallionManagementFormState;
      stallion: Stallion;
      auditHook: StallionAuditHook | null;
      auditLog: AuditLog | null;
    }
  | {
      ok: false;
      operation: StallionManagementOperation;
      form: StallionManagementFormState;
      issues: readonly string[];
    };

export declare const STALLION_MANAGEMENT_VIEW_STATES: readonly StallionManagementViewState[];
export declare const STALLION_MANAGEMENT_ROUTES: Readonly<{
  dashboard: string;
  stallionManagement: string;
  listingManagement: string;
}>;

export declare class StallionManagementValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class StallionManagementAuthorizationError extends Error {
  constructor(message: string);
}

export declare function createStallionManagementViewModel(
  input: StallionManagementInput,
): StallionManagementFormViewModel;

export declare function createStallionManagementConfirmationViewModel(
  input: StallionManagementConfirmationInput,
): StallionManagementConfirmationViewModel;

export declare function createStallionManagementLoadingState(
  input?: { organizationName?: string | null },
): StallionManagementLoadingViewModel;

export declare function createStallionManagementErrorState(
  error: unknown,
): StallionManagementErrorViewModel;

export declare function saveStallionFromForm(
  input: SaveStallionFromFormInput,
): Promise<SaveStallionFromFormResult>;

export declare function renderStallionManagement(
  viewModel: StallionManagementRenderableViewModel,
): string;
