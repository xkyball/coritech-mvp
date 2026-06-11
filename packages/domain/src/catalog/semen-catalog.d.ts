import type {
  AuditLog,
  AuditLogWriteRepository,
  AuditRequestContext,
} from "../audit/audit-log.d.ts";
import type {
  RoleCode,
  UserOrganizationRoleLike,
} from "../identity/role-model.d.ts";

export type StallionStatus = "ACTIVE" | "INACTIVE";

export type SemenAvailabilityStatus = "AVAILABLE" | "LIMITED" | "UNAVAILABLE";

export type SemenListingStatus = "ACTIVE" | "INACTIVE";

export type SemenListingAuditAction =
  | "SEMEN_LISTING_CREATED"
  | "SEMEN_LISTING_UPDATED"
  | "SEMEN_LISTING_DEACTIVATED";

export type StallionAuditAction =
  | "STALLION_CREATED"
  | "STALLION_UPDATED"
  | "STALLION_ACTIVATED"
  | "STALLION_DEACTIVATED";

export interface CatalogActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface Stallion {
  id: string | null;
  name: string;
  breed: string;
  ueln: string | null;
  microchipNumber: string | null;
  breedingStationOrganizationId: string;
  status: StallionStatus;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface StallionLike {
  id: string;
  name: string;
  breed: string;
  ueln?: string | null;
  microchipNumber?: string | null;
  breedingStationOrganizationId: string;
  status: StallionStatus;
}

export interface SemenListing {
  id: string | null;
  stallionId: string;
  breedingStationOrganizationId: string;
  availabilityStatus: SemenAvailabilityStatus;
  listingStatus: SemenListingStatus;
  termsSummary: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface SemenListingLike {
  id: string | null;
  stallionId: string;
  breedingStationOrganizationId: string;
  availabilityStatus: SemenAvailabilityStatus;
  listingStatus: SemenListingStatus;
  termsSummary: string | null;
}

export interface SemenListingRecord {
  listing: SemenListingLike;
  stallion: StallionLike;
}

export interface CreateStallionInputBody {
  stallionId?: string | null;
  name: string;
  breed: string;
  ueln?: string | null;
  microchipNumber?: string | null;
  breedingStationOrganizationId: string;
  status?: StallionStatus | string;
  changeReason?: string | null;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateStallionInput extends CreateStallionInputBody {
  actor: CatalogActorContext;
}

export interface UpdateStallionInputBody {
  name?: string;
  breed?: string;
  ueln?: string | null;
  microchipNumber?: string | null;
  status?: StallionStatus | string;
  changeReason?: string | null;
  now?: string | Date;
}

export interface UpdateStallionInput {
  existingStallion: Stallion;
  updates?: UpdateStallionInputBody;
  actor: CatalogActorContext;
  now?: string | Date;
}

export interface PreparedStallionChange {
  stallion: Stallion;
  auditHook: StallionAuditHook;
}

export interface StallionAuditValue {
  name: string;
  breed: string;
  ueln: string | null;
  microchipNumber: string | null;
  breedingStationOrganizationId: string;
  status: StallionStatus;
}

export interface StallionAuditHook {
  eventType: "STALLION_CHANGE";
  action: StallionAuditAction;
  actorUserId: string;
  actorRoleCode: "BREEDING_STATION" | "PLATFORM_ADMIN";
  actorOrganizationId: string;
  targetType: "Stallion";
  targetId: string | null;
  targetRef: {
    breedingStationOrganizationId: string;
  };
  previousValue: Readonly<StallionAuditValue> | null;
  newValue: Readonly<StallionAuditValue>;
  reason: string | null;
  occurredAt: string;
}

export interface StallionAuditHookInput {
  action: StallionAuditAction;
  actor: CatalogActorContext;
  stallion: StallionLike;
  previousStallion: StallionLike | null;
  reason: string | null;
  occurredAt: string;
}

export interface CreateSemenListingInputBody {
  listingId?: string | null;
  stallionId: string;
  breedingStationOrganizationId?: string;
  availabilityStatus?: SemenAvailabilityStatus | string;
  listingStatus?: SemenListingStatus | string;
  termsSummary?: string | null;
  changeReason?: string | null;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface CreateSemenListingInput
  extends Omit<CreateSemenListingInputBody, "stallionId"> {
  stallion: StallionLike;
  actor: CatalogActorContext;
}

export interface UpdateSemenListingInputBody {
  availabilityStatus?: SemenAvailabilityStatus | string;
  listingStatus?: SemenListingStatus | string;
  termsSummary?: string | null;
  changeReason?: string | null;
  now?: string | Date;
}

export interface UpdateSemenListingInput {
  existingListing: SemenListing;
  updates?: UpdateSemenListingInputBody;
  actor: CatalogActorContext;
  now?: string | Date;
}

export interface PreparedSemenListingChange {
  listing: SemenListing;
  auditHook: SemenListingAuditHook;
}

export interface SemenListingAuditValue {
  stallionId: string;
  breedingStationOrganizationId: string;
  availabilityStatus: SemenAvailabilityStatus;
  listingStatus: SemenListingStatus;
  termsSummary: string | null;
}

export interface SemenListingAuditHook {
  eventType: "SEMEN_LISTING_CHANGE";
  action: SemenListingAuditAction;
  actorUserId: string;
  actorRoleCode: "BREEDING_STATION" | "PLATFORM_ADMIN";
  actorOrganizationId: string;
  targetType: "SemenListing";
  targetId: string | null;
  targetRef: {
    stallionId: string;
    breedingStationOrganizationId: string;
  };
  previousValue: Readonly<SemenListingAuditValue> | null;
  newValue: Readonly<SemenListingAuditValue>;
  reason: string | null;
  occurredAt: string;
}

export interface SemenListingAuditHookInput {
  action: SemenListingAuditAction;
  actor: CatalogActorContext;
  listing: SemenListingLike;
  previousListing: SemenListingLike | null;
  reason: string | null;
  occurredAt: string;
}

export interface SemenListingSearchFilters {
  stallionId?: string | null;
  stallion?: string | null;
  breed?: string | null;
  breedingStationOrganizationId?: string | null;
  availabilityStatus?: SemenAvailabilityStatus | string | null;
  listingStatus?: SemenListingStatus | string | null;
}

export interface NormalizedSemenListingSearchFilters {
  stallionId: string | null;
  stallion: string | null;
  breed: string | null;
  breedingStationOrganizationId: string | null;
  availabilityStatus: SemenAvailabilityStatus | null;
  listingStatus: SemenListingStatus | null;
}

export interface StallionSearchFilters {
  name?: string | null;
  breed?: string | null;
  breedingStationOrganizationId?: string | null;
  status?: StallionStatus | string | null;
}

export interface SemenCatalogRepository extends AuditLogWriteRepository {
  createStallion(stallion: Stallion): Promise<Stallion>;
  updateStallion(stallion: Stallion): Promise<Stallion>;
  findStallionById(stallionId: string): Promise<Stallion | null>;
  listStallions(filters?: StallionSearchFilters): Promise<Stallion[]>;
  createSemenListing(listing: SemenListing): Promise<SemenListing>;
  updateSemenListing(listing: SemenListing): Promise<SemenListing>;
  findSemenListingById(listingId: string): Promise<SemenListing | null>;
  findSemenListingRecordById(
    listingId: string,
  ): Promise<SemenListingRecord | null>;
  listSemenListingRecords(
    filters?: SemenListingSearchFilters,
  ): Promise<SemenListingRecord[]>;
}

export interface EndpointRequest<
  TBody = Record<string, never>,
  TQuery = Record<string, never>,
> {
  actor: CatalogActorContext;
  repository: SemenCatalogRepository;
  auditContext?: AuditRequestContext | null;
  params?: Record<string, string | undefined>;
  body: TBody;
  query?: TQuery;
}

export interface EndpointResponse<TBody, TAuditHook = undefined> {
  status: number;
  body: TBody;
  auditHook?: TAuditHook;
  auditLog?: AuditLog;
}

export declare const STALLION_STATUSES: readonly StallionStatus[];
export declare const SEMEN_AVAILABILITY_STATUSES: readonly SemenAvailabilityStatus[];
export declare const SEMEN_LISTING_STATUSES: readonly SemenListingStatus[];
export declare const SEMEN_LISTING_AUDIT_ACTIONS: readonly SemenListingAuditAction[];
export declare const STALLION_AUDIT_ACTIONS: readonly StallionAuditAction[];
export declare const SEMEN_CATALOG_ROUTES: readonly {
  method: string;
  path: string;
  handler: string;
  access: string;
}[];

export declare class SemenCatalogValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class SemenCatalogAuthorizationError extends Error {
  constructor(message: string);
}

export declare class SemenCatalogNotFoundError extends Error {
  readonly entityName: string;
  readonly entityId: string;
  constructor(entityName: string, entityId: string);
}

export declare class SemenListingNotOrderableError extends Error {
  readonly reasons: readonly string[];
  constructor(reasons: string[]);
}

export declare function isStallionStatus(value: unknown): value is StallionStatus;
export declare function isSemenAvailabilityStatus(
  value: unknown,
): value is SemenAvailabilityStatus;
export declare function isSemenListingStatus(
  value: unknown,
): value is SemenListingStatus;
export declare function canManageStationCatalog(
  actor: CatalogActorContext,
  stationOrganizationId: string,
): boolean;
export declare function canViewSemenListing(
  actor: CatalogActorContext,
  listing: SemenListingLike,
): boolean;
export declare function canSearchSemenCatalog(actor: CatalogActorContext): boolean;
export declare function validateCreateStallionInput(
  input: CreateStallionInput,
): string[];
export declare function prepareCreateStallion(
  input: CreateStallionInput,
): PreparedStallionChange;
export declare function prepareUpdateStallion(
  input: UpdateStallionInput,
): PreparedStallionChange;
export declare function buildStallionAuditHook(
  input: StallionAuditHookInput,
): StallionAuditHook;
export declare function validateCreateSemenListingInput(
  input: CreateSemenListingInput,
): string[];
export declare function prepareCreateSemenListing(
  input: CreateSemenListingInput,
): PreparedSemenListingChange;
export declare function prepareUpdateSemenListing(
  input: UpdateSemenListingInput,
): PreparedSemenListingChange;
export declare function isSemenListingOrderable(listing: SemenListingLike): boolean;
export declare function ensureSemenListingCanBeOrdered(
  listing: SemenListingLike,
): void;
export declare function buildSemenListingAuditHook(
  input: SemenListingAuditHookInput,
): SemenListingAuditHook;
export declare function searchSemenListingRecords(
  records: SemenListingRecord[],
  filters: SemenListingSearchFilters | undefined,
  actor: CatalogActorContext,
): SemenListingRecord[];
export declare function validateSemenListingSearchFilters(
  filters?: SemenListingSearchFilters,
): string[];
export declare function normalizeSemenListingSearchFilters(
  filters?: SemenListingSearchFilters,
): NormalizedSemenListingSearchFilters;
export declare function createStallionEndpoint(
  request: EndpointRequest<CreateStallionInputBody>,
): Promise<EndpointResponse<{ stallion: Stallion }, StallionAuditHook>>;
export declare function updateStallionEndpoint(
  request: EndpointRequest<UpdateStallionInputBody>,
): Promise<EndpointResponse<{ stallion: Stallion }, StallionAuditHook>>;
export declare function getStallionEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ stallion: Stallion }>>;
export declare function listStallionsEndpoint(
  request: EndpointRequest<Record<string, never>, StallionSearchFilters>,
): Promise<EndpointResponse<{ stallions: Stallion[] }>>;
export declare function deleteStallionEndpoint(
  request: EndpointRequest<Partial<UpdateStallionInputBody>>,
): Promise<EndpointResponse<{ stallion: Stallion }>>;
export declare function createSemenListingEndpoint(
  request: EndpointRequest<CreateSemenListingInputBody>,
): Promise<
  EndpointResponse<{ listing: SemenListing }, SemenListingAuditHook>
>;
export declare function updateSemenListingEndpoint(
  request: EndpointRequest<UpdateSemenListingInputBody>,
): Promise<
  EndpointResponse<{ listing: SemenListing }, SemenListingAuditHook>
>;
export declare function getSemenListingEndpoint(
  request: EndpointRequest,
): Promise<EndpointResponse<{ record: SemenListingRecord }>>;
export declare function deleteSemenListingEndpoint(
  request: EndpointRequest<Partial<UpdateSemenListingInputBody>>,
): Promise<
  EndpointResponse<{ listing: SemenListing }, SemenListingAuditHook>
>;
export declare function searchSemenListingsEndpoint(
  request: EndpointRequest<Record<string, never>, SemenListingSearchFilters>,
): Promise<EndpointResponse<{ records: SemenListingRecord[] }>>;
