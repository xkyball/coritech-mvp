// @ts-check

import { createAuditLogFromHook } from "../audit/audit-log.mjs";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";

export const STALLION_STATUSES = /** @type {const} */ ([
  "ACTIVE",
  "INACTIVE",
]);

export const SEMEN_AVAILABILITY_STATUSES = /** @type {const} */ ([
  "AVAILABLE",
  "LIMITED",
  "UNAVAILABLE",
]);

export const SEMEN_LISTING_STATUSES = /** @type {const} */ ([
  "ACTIVE",
  "INACTIVE",
]);

export const SEMEN_LISTING_AUDIT_ACTIONS = /** @type {const} */ ([
  "SEMEN_LISTING_CREATED",
  "SEMEN_LISTING_UPDATED",
  "SEMEN_LISTING_DEACTIVATED",
]);

export const SEMEN_CATALOG_ROUTES = Object.freeze([
  Object.freeze({
    method: "GET",
    path: "/stallions",
    handler: "listStallionsEndpoint",
    access: "PLATFORM_ADMIN or BREEDING_STATION-owned records",
  }),
  Object.freeze({
    method: "POST",
    path: "/stallions",
    handler: "createStallionEndpoint",
    access: "PLATFORM_ADMIN or owning BREEDING_STATION",
  }),
  Object.freeze({
    method: "GET",
    path: "/stallions/:stallionId",
    handler: "getStallionEndpoint",
    access: "PLATFORM_ADMIN or owning BREEDING_STATION",
  }),
  Object.freeze({
    method: "PATCH",
    path: "/stallions/:stallionId",
    handler: "updateStallionEndpoint",
    access: "PLATFORM_ADMIN or owning BREEDING_STATION",
  }),
  Object.freeze({
    method: "DELETE",
    path: "/stallions/:stallionId",
    handler: "deleteStallionEndpoint",
    access: "PLATFORM_ADMIN or owning BREEDING_STATION; soft-inactivates",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-listings",
    handler: "searchSemenListingsEndpoint",
    access: "BREEDER active listings, owning BREEDING_STATION records, or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "POST",
    path: "/semen-listings",
    handler: "createSemenListingEndpoint",
    access: "PLATFORM_ADMIN or owning BREEDING_STATION",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-listings/:listingId",
    handler: "getSemenListingEndpoint",
    access: "BREEDER active listing, owning BREEDING_STATION record, or PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "PATCH",
    path: "/semen-listings/:listingId",
    handler: "updateSemenListingEndpoint",
    access: "PLATFORM_ADMIN or owning BREEDING_STATION",
  }),
  Object.freeze({
    method: "DELETE",
    path: "/semen-listings/:listingId",
    handler: "deleteSemenListingEndpoint",
    access: "PLATFORM_ADMIN or owning BREEDING_STATION; soft-inactivates",
  }),
]);

export class SemenCatalogValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech semen catalog input:\n- ${issues.join("\n- ")}`);
    this.name = "SemenCatalogValidationError";
    this.issues = issues;
  }
}

export class SemenCatalogAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "SemenCatalogAuthorizationError";
  }
}

export class SemenCatalogNotFoundError extends Error {
  /**
   * @param {string} entityName
   * @param {string} entityId
   */
  constructor(entityName, entityId) {
    super(`${entityName} was not found: ${entityId}`);
    this.name = "SemenCatalogNotFoundError";
    this.entityName = entityName;
    this.entityId = entityId;
  }
}

export class SemenListingNotOrderableError extends Error {
  /**
   * @param {string[]} reasons
   */
  constructor(reasons) {
    super(`Semen listing cannot be ordered:\n- ${reasons.join("\n- ")}`);
    this.name = "SemenListingNotOrderableError";
    this.reasons = reasons;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./semen-catalog.d.ts").StallionStatus}
 */
export function isStallionStatus(value) {
  return typeof value === "string" && STALLION_STATUSES.includes(
    /** @type {import("./semen-catalog.d.ts").StallionStatus} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./semen-catalog.d.ts").SemenAvailabilityStatus}
 */
export function isSemenAvailabilityStatus(value) {
  return typeof value === "string" && SEMEN_AVAILABILITY_STATUSES.includes(
    /** @type {import("./semen-catalog.d.ts").SemenAvailabilityStatus} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./semen-catalog.d.ts").SemenListingStatus}
 */
export function isSemenListingStatus(value) {
  return typeof value === "string" && SEMEN_LISTING_STATUSES.includes(
    /** @type {import("./semen-catalog.d.ts").SemenListingStatus} */ (value),
  );
}

/**
 * @param {import("./semen-catalog.d.ts").CatalogActorContext} actor
 * @param {string} stationOrganizationId
 * @returns {boolean}
 */
export function canManageStationCatalog(actor, stationOrganizationId) {
  return Boolean(
    findCatalogManagementRole(actor, stationOrganizationId),
  );
}

/**
 * @param {import("./semen-catalog.d.ts").CatalogActorContext} actor
 * @param {import("./semen-catalog.d.ts").SemenListingLike} listing
 * @returns {boolean}
 */
export function canViewSemenListing(actor, listing) {
  if (findActorRole(actor, "PLATFORM_ADMIN")) {
    return true;
  }

  if (findActorRole(actor, "BREEDING_STATION", listing.breedingStationOrganizationId)) {
    return true;
  }

  return listing.listingStatus === "ACTIVE" && Boolean(findActorRole(actor, "BREEDER"));
}

/**
 * @param {import("./semen-catalog.d.ts").CatalogActorContext} actor
 * @returns {boolean}
 */
export function canSearchSemenCatalog(actor) {
  return Boolean(
    findActorRole(actor, "PLATFORM_ADMIN") ||
    findActorRole(actor, "BREEDING_STATION") ||
    findActorRole(actor, "BREEDER"),
  );
}

/**
 * @param {import("./semen-catalog.d.ts").CreateStallionInput} input
 * @returns {string[]}
 */
export function validateCreateStallionInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);

  issues.push(...actorIssues);

  const name = normalizeRequiredString(input.name);
  const breed = normalizeRequiredString(input.breed);
  const breedingStationOrganizationId = normalizeRequiredString(
    input.breedingStationOrganizationId,
  );
  const status = input.status === undefined
    ? "ACTIVE"
    : normalizeRequiredString(input.status);

  if (!name) {
    issues.push("name is required.");
  }

  if (!breed) {
    issues.push("breed is required.");
  }

  if (!breedingStationOrganizationId) {
    issues.push("breedingStationOrganizationId is required.");
  } else if (
    input.actor &&
    actorIssues.length === 0 &&
    !canManageStationCatalog(input.actor, breedingStationOrganizationId)
  ) {
    issues.push(
      "actor must be an active PLATFORM_ADMIN or BREEDING_STATION user for the breeding station.",
    );
  }

  if (!isStallionStatus(status)) {
    issues.push(`status must be one of: ${STALLION_STATUSES.join(", ")}.`);
  }

  validateOptionalNonBlankString(input.ueln, "ueln", issues);
  validateOptionalNonBlankString(input.microchipNumber, "microchipNumber", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  return issues;
}

/**
 * @param {import("./semen-catalog.d.ts").CreateStallionInput} input
 * @returns {import("./semen-catalog.d.ts").PreparedStallionChange}
 */
export function prepareCreateStallion(input) {
  const issues = validateCreateStallionInput(input);

  if (issues.length > 0) {
    throw new SemenCatalogValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.createdAt ?? input.now ?? new Date());

  return Object.freeze({
    stallion: Object.freeze({
      id: normalizeOptionalString(input.stallionId),
      name: input.name.trim(),
      breed: input.breed.trim(),
      ueln: normalizeOptionalString(input.ueln),
      microchipNumber: normalizeOptionalString(input.microchipNumber),
      breedingStationOrganizationId: input.breedingStationOrganizationId.trim(),
      status: /** @type {import("./semen-catalog.d.ts").StallionStatus} */ (
        input.status?.trim() ?? "ACTIVE"
      ),
      createdByUserId: input.actor.userId.trim(),
      updatedByUserId: input.actor.userId.trim(),
      createdAt: occurredAt,
      updatedAt: occurredAt,
    }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").UpdateStallionInput} input
 * @returns {import("./semen-catalog.d.ts").PreparedStallionChange}
 */
export function prepareUpdateStallion(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const updates = input.updates ?? {};
  const requestedStatus = hasOwn(updates, "status")
    ? normalizeRequiredString(updates.status)
    : "";

  issues.push(...actorIssues);

  if (!input.existingStallion) {
    issues.push("existingStallion is required.");
  } else if (
    actorIssues.length === 0 &&
    !canManageStationCatalog(input.actor, input.existingStallion.breedingStationOrganizationId)
  ) {
    issues.push(
      "actor must be an active PLATFORM_ADMIN or BREEDING_STATION user for the breeding station.",
    );
  }

  validateOptionalTimestamp(input.now ?? updates.now, "now", issues);

  if (hasOwn(updates, "name") && !normalizeRequiredString(updates.name)) {
    issues.push("name cannot be blank when provided.");
  }

  if (hasOwn(updates, "breed") && !normalizeRequiredString(updates.breed)) {
    issues.push("breed cannot be blank when provided.");
  }

  if (hasOwn(updates, "status") && !isStallionStatus(requestedStatus)) {
    issues.push(`status must be one of: ${STALLION_STATUSES.join(", ")}.`);
  }

  validateOptionalNonBlankString(updates.ueln, "ueln", issues);
  validateOptionalNonBlankString(updates.microchipNumber, "microchipNumber", issues);

  if (issues.length > 0) {
    throw new SemenCatalogValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.now ?? updates.now ?? new Date());

  return Object.freeze({
    stallion: Object.freeze({
      ...input.existingStallion,
      name: hasOwn(updates, "name") ? updates.name.trim() : input.existingStallion.name,
      breed: hasOwn(updates, "breed") ? updates.breed.trim() : input.existingStallion.breed,
      ueln: hasOwn(updates, "ueln")
        ? normalizeOptionalString(updates.ueln)
        : input.existingStallion.ueln,
      microchipNumber: hasOwn(updates, "microchipNumber")
        ? normalizeOptionalString(updates.microchipNumber)
        : input.existingStallion.microchipNumber,
      status: hasOwn(updates, "status")
        ? /** @type {import("./semen-catalog.d.ts").StallionStatus} */ (requestedStatus)
        : input.existingStallion.status,
      updatedByUserId: input.actor.userId.trim(),
      updatedAt: occurredAt,
    }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").CreateSemenListingInput} input
 * @returns {string[]}
 */
export function validateCreateSemenListingInput(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);

  issues.push(...actorIssues);

  if (!input.stallion) {
    issues.push("stallion is required.");
  } else if (!normalizeRequiredString(input.stallion.id)) {
    issues.push("stallion.id is required.");
  }

  const breedingStationOrganizationId = normalizeRequiredString(
    input.breedingStationOrganizationId ??
    input.stallion?.breedingStationOrganizationId,
  );

  if (!breedingStationOrganizationId) {
    issues.push("breedingStationOrganizationId is required.");
  } else if (
    input.stallion &&
    input.stallion.breedingStationOrganizationId !== breedingStationOrganizationId
  ) {
    issues.push("breedingStationOrganizationId must match the stallion breeding station.");
  } else if (
    actorIssues.length === 0 &&
    !canManageStationCatalog(input.actor, breedingStationOrganizationId)
  ) {
    issues.push(
      "actor must be an active PLATFORM_ADMIN or BREEDING_STATION user for the breeding station.",
    );
  }

  if (input.stallion && input.stallion.status !== "ACTIVE") {
    issues.push("stallion must be ACTIVE before a semen listing can be created.");
  }

  const availabilityStatus = input.availabilityStatus === undefined
    ? "AVAILABLE"
    : normalizeRequiredString(input.availabilityStatus);
  const listingStatus = input.listingStatus === undefined
    ? "ACTIVE"
    : normalizeRequiredString(input.listingStatus);

  if (!isSemenAvailabilityStatus(availabilityStatus)) {
    issues.push(
      `availabilityStatus must be one of: ${SEMEN_AVAILABILITY_STATUSES.join(", ")}.`,
    );
  }

  if (!isSemenListingStatus(listingStatus)) {
    issues.push(`listingStatus must be one of: ${SEMEN_LISTING_STATUSES.join(", ")}.`);
  }

  validateOptionalNonBlankString(input.termsSummary, "termsSummary", issues);
  validateOptionalNonBlankString(input.changeReason, "changeReason", issues);
  validateOptionalTimestamp(input.createdAt, "createdAt", issues);
  validateOptionalTimestamp(input.now, "now", issues);

  return issues;
}

/**
 * @param {import("./semen-catalog.d.ts").CreateSemenListingInput} input
 * @returns {import("./semen-catalog.d.ts").PreparedSemenListingChange}
 */
export function prepareCreateSemenListing(input) {
  const issues = validateCreateSemenListingInput(input);

  if (issues.length > 0) {
    throw new SemenCatalogValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.createdAt ?? input.now ?? new Date());
  const breedingStationOrganizationId = (
    input.breedingStationOrganizationId ??
    input.stallion.breedingStationOrganizationId
  ).trim();
  const listing = Object.freeze({
    id: normalizeOptionalString(input.listingId),
    stallionId: input.stallion.id,
    breedingStationOrganizationId,
    availabilityStatus: /** @type {import("./semen-catalog.d.ts").SemenAvailabilityStatus} */ (
      input.availabilityStatus?.trim() ?? "AVAILABLE"
    ),
    listingStatus: /** @type {import("./semen-catalog.d.ts").SemenListingStatus} */ (
      input.listingStatus?.trim() ?? "ACTIVE"
    ),
    termsSummary: normalizeOptionalString(input.termsSummary),
    createdByUserId: input.actor.userId.trim(),
    updatedByUserId: input.actor.userId.trim(),
    createdAt: occurredAt,
    updatedAt: occurredAt,
  });

  return Object.freeze({
    listing,
    auditHook: buildSemenListingAuditHook({
      action: "SEMEN_LISTING_CREATED",
      actor: input.actor,
      listing,
      previousListing: null,
      reason: normalizeOptionalString(input.changeReason),
      occurredAt,
    }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").UpdateSemenListingInput} input
 * @returns {import("./semen-catalog.d.ts").PreparedSemenListingChange}
 */
export function prepareUpdateSemenListing(input) {
  const issues = [];
  const actorIssues = validateActor(input.actor);
  const updates = input.updates ?? {};
  const requestedAvailabilityStatus = hasOwn(updates, "availabilityStatus")
    ? normalizeRequiredString(updates.availabilityStatus)
    : "";
  const requestedListingStatus = hasOwn(updates, "listingStatus")
    ? normalizeRequiredString(updates.listingStatus)
    : "";

  issues.push(...actorIssues);

  if (!input.existingListing) {
    issues.push("existingListing is required.");
  } else if (
    actorIssues.length === 0 &&
    !canManageStationCatalog(input.actor, input.existingListing.breedingStationOrganizationId)
  ) {
    issues.push(
      "actor must be an active PLATFORM_ADMIN or BREEDING_STATION user for the breeding station.",
    );
  }

  validateOptionalTimestamp(input.now ?? updates.now, "now", issues);

  if (
    hasOwn(updates, "availabilityStatus") &&
    !isSemenAvailabilityStatus(requestedAvailabilityStatus)
  ) {
    issues.push(
      `availabilityStatus must be one of: ${SEMEN_AVAILABILITY_STATUSES.join(", ")}.`,
    );
  }

  if (
    hasOwn(updates, "listingStatus") &&
    !isSemenListingStatus(requestedListingStatus)
  ) {
    issues.push(`listingStatus must be one of: ${SEMEN_LISTING_STATUSES.join(", ")}.`);
  }

  validateOptionalNonBlankString(updates.termsSummary, "termsSummary", issues);
  validateOptionalNonBlankString(updates.changeReason, "changeReason", issues);

  if (issues.length > 0) {
    throw new SemenCatalogValidationError(issues);
  }

  const occurredAt = toIsoTimestamp(input.now ?? updates.now ?? new Date());
  const nextListingStatus = hasOwn(updates, "listingStatus")
    ? /** @type {import("./semen-catalog.d.ts").SemenListingStatus} */ (
      requestedListingStatus
    )
    : input.existingListing.listingStatus;
  const listing = Object.freeze({
    ...input.existingListing,
    availabilityStatus: hasOwn(updates, "availabilityStatus")
      ? /** @type {import("./semen-catalog.d.ts").SemenAvailabilityStatus} */ (
        requestedAvailabilityStatus
      )
      : input.existingListing.availabilityStatus,
    listingStatus: nextListingStatus,
    termsSummary: hasOwn(updates, "termsSummary")
      ? normalizeOptionalString(updates.termsSummary)
      : input.existingListing.termsSummary,
    updatedByUserId: input.actor.userId.trim(),
    updatedAt: occurredAt,
  });

  return Object.freeze({
    listing,
    auditHook: buildSemenListingAuditHook({
      action: nextListingStatus === "INACTIVE" &&
        input.existingListing.listingStatus !== "INACTIVE"
        ? "SEMEN_LISTING_DEACTIVATED"
        : "SEMEN_LISTING_UPDATED",
      actor: input.actor,
      listing,
      previousListing: input.existingListing,
      reason: normalizeOptionalString(updates.changeReason),
      occurredAt,
    }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingLike} listing
 * @returns {boolean}
 */
export function isSemenListingOrderable(listing) {
  return listing.listingStatus === "ACTIVE" &&
    listing.availabilityStatus !== "UNAVAILABLE";
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingLike} listing
 * @returns {void}
 */
export function ensureSemenListingCanBeOrdered(listing) {
  const reasons = [];

  if (listing.listingStatus !== "ACTIVE") {
    reasons.push("listingStatus must be ACTIVE.");
  }

  if (listing.availabilityStatus === "UNAVAILABLE") {
    reasons.push("availabilityStatus must not be UNAVAILABLE.");
  }

  if (reasons.length > 0) {
    throw new SemenListingNotOrderableError(reasons);
  }
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingAuditHookInput} input
 * @returns {import("./semen-catalog.d.ts").SemenListingAuditHook}
 */
export function buildSemenListingAuditHook(input) {
  const managementRole = findCatalogManagementRole(
    input.actor,
    input.listing.breedingStationOrganizationId,
  );

  if (!managementRole) {
    throw new SemenCatalogAuthorizationError(
      "actor must be authorized before building a semen listing audit hook.",
    );
  }

  return Object.freeze({
    eventType: "SEMEN_LISTING_CHANGE",
    action: input.action,
    actorUserId: input.actor.userId.trim(),
    actorRoleCode: /** @type {"BREEDING_STATION" | "PLATFORM_ADMIN"} */ (
      managementRole.roleCode
    ),
    actorOrganizationId: managementRole.organizationId,
    targetType: "SemenListing",
    targetId: input.listing.id,
    targetRef: Object.freeze({
      stallionId: input.listing.stallionId,
      breedingStationOrganizationId: input.listing.breedingStationOrganizationId,
    }),
    previousValue: input.previousListing
      ? listingAuditValue(input.previousListing)
      : null,
    newValue: listingAuditValue(input.listing),
    reason: input.reason,
    occurredAt: input.occurredAt,
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingRecord[]} records
 * @param {import("./semen-catalog.d.ts").SemenListingSearchFilters} filters
 * @param {import("./semen-catalog.d.ts").CatalogActorContext} actor
 * @returns {import("./semen-catalog.d.ts").SemenListingRecord[]}
 */
export function searchSemenListingRecords(records, filters = {}, actor) {
  const issues = validateSemenListingSearchFilters(filters);

  if (issues.length > 0) {
    throw new SemenCatalogValidationError(issues);
  }

  if (!canSearchSemenCatalog(actor)) {
    throw new SemenCatalogAuthorizationError(
      "actor must have an active Phase 1 role before searching semen listings.",
    );
  }

  const normalizedFilters = normalizeSemenListingSearchFilters(filters);

  return records.filter((record) => {
    if (!record?.listing || !record?.stallion) {
      return false;
    }

    if (!canViewSemenListing(actor, record.listing)) {
      return false;
    }

    if (
      normalizedFilters.stallionId &&
      record.listing.stallionId !== normalizedFilters.stallionId &&
      record.stallion.id !== normalizedFilters.stallionId
    ) {
      return false;
    }

    if (
      normalizedFilters.stallion &&
      !containsCaseInsensitive(record.stallion.name, normalizedFilters.stallion)
    ) {
      return false;
    }

    if (
      normalizedFilters.breed &&
      !containsCaseInsensitive(record.stallion.breed, normalizedFilters.breed)
    ) {
      return false;
    }

    if (
      normalizedFilters.breedingStationOrganizationId &&
      record.listing.breedingStationOrganizationId !==
        normalizedFilters.breedingStationOrganizationId
    ) {
      return false;
    }

    if (
      normalizedFilters.availabilityStatus &&
      record.listing.availabilityStatus !== normalizedFilters.availabilityStatus
    ) {
      return false;
    }

    if (
      normalizedFilters.listingStatus &&
      record.listing.listingStatus !== normalizedFilters.listingStatus
    ) {
      return false;
    }

    return true;
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingSearchFilters} filters
 * @returns {string[]}
 */
export function validateSemenListingSearchFilters(filters = {}) {
  const issues = [];

  validateOptionalNonBlankString(filters.stallionId, "stallionId", issues);
  validateOptionalNonBlankString(filters.stallion, "stallion", issues);
  validateOptionalNonBlankString(filters.breed, "breed", issues);
  validateOptionalNonBlankString(
    filters.breedingStationOrganizationId,
    "breedingStationOrganizationId",
    issues,
  );

  if (
    filters.availabilityStatus !== undefined &&
    !isSemenAvailabilityStatus(filters.availabilityStatus)
  ) {
    issues.push(
      `availabilityStatus must be one of: ${SEMEN_AVAILABILITY_STATUSES.join(", ")}.`,
    );
  }

  if (
    filters.listingStatus !== undefined &&
    !isSemenListingStatus(filters.listingStatus)
  ) {
    issues.push(`listingStatus must be one of: ${SEMEN_LISTING_STATUSES.join(", ")}.`);
  }

  return issues;
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingSearchFilters} filters
 * @returns {import("./semen-catalog.d.ts").NormalizedSemenListingSearchFilters}
 */
export function normalizeSemenListingSearchFilters(filters = {}) {
  return Object.freeze({
    stallionId: normalizeOptionalString(filters.stallionId),
    stallion: normalizeOptionalString(filters.stallion),
    breed: normalizeOptionalString(filters.breed),
    breedingStationOrganizationId: normalizeOptionalString(
      filters.breedingStationOrganizationId,
    ),
    availabilityStatus: filters.availabilityStatus ?? null,
    listingStatus: filters.listingStatus ?? null,
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<import("./semen-catalog.d.ts").CreateStallionInputBody>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ stallion: import("./semen-catalog.d.ts").Stallion }>>}
 */
export async function createStallionEndpoint(request) {
  const createStallion = requireRepositoryMethod(request.repository, "createStallion");
  const prepared = prepareCreateStallion({
    ...request.body,
    actor: request.actor,
  });
  const stallion = await createStallion(prepared.stallion);

  return Object.freeze({
    status: 201,
    body: Object.freeze({ stallion }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<import("./semen-catalog.d.ts").UpdateStallionInputBody>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ stallion: import("./semen-catalog.d.ts").Stallion }>>}
 */
export async function updateStallionEndpoint(request) {
  const findStallionById = requireRepositoryMethod(request.repository, "findStallionById");
  const updateStallion = requireRepositoryMethod(request.repository, "updateStallion");
  const stallionId = requireParam(request.params, "stallionId");
  const existingStallion = await findRequiredEntity(
    () => findStallionById(stallionId),
    "Stallion",
    stallionId,
  );
  const prepared = prepareUpdateStallion({
    existingStallion,
    updates: request.body,
    actor: request.actor,
  });
  const stallion = await updateStallion(prepared.stallion);

  return Object.freeze({
    status: 200,
    body: Object.freeze({ stallion }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ stallion: import("./semen-catalog.d.ts").Stallion }>>}
 */
export async function getStallionEndpoint(request) {
  const findStallionById = requireRepositoryMethod(request.repository, "findStallionById");
  const stallionId = requireParam(request.params, "stallionId");
  const stallion = await findRequiredEntity(
    () => findStallionById(stallionId),
    "Stallion",
    stallionId,
  );

  if (!canManageStationCatalog(request.actor, stallion.breedingStationOrganizationId)) {
    throw new SemenCatalogAuthorizationError(
      "actor may only view directly managed stallion records for this endpoint.",
    );
  }

  return Object.freeze({
    status: 200,
    body: Object.freeze({ stallion }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<import("./semen-catalog.d.ts").StallionSearchFilters>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ stallions: import("./semen-catalog.d.ts").Stallion[] }>>}
 */
export async function listStallionsEndpoint(request) {
  const listStallions = requireRepositoryMethod(request.repository, "listStallions");
  const stallions = await listStallions(request.query ?? {});

  if (!findActorRole(request.actor, "PLATFORM_ADMIN") && !findActorRole(request.actor, "BREEDING_STATION")) {
    throw new SemenCatalogAuthorizationError(
      "actor must be PLATFORM_ADMIN or BREEDING_STATION to list directly managed stallion records.",
    );
  }

  const visibleStallions = findActorRole(request.actor, "PLATFORM_ADMIN")
    ? stallions
    : stallions.filter((stallion) =>
      canManageStationCatalog(request.actor, stallion.breedingStationOrganizationId)
    );

  return Object.freeze({
    status: 200,
    body: Object.freeze({ stallions: visibleStallions }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<Partial<import("./semen-catalog.d.ts").UpdateStallionInputBody>>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ stallion: import("./semen-catalog.d.ts").Stallion }>>}
 */
export async function deleteStallionEndpoint(request) {
  return updateStallionEndpoint({
    ...request,
    body: {
      ...request.body,
      status: "INACTIVE",
    },
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<import("./semen-catalog.d.ts").CreateSemenListingInputBody>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ listing: import("./semen-catalog.d.ts").SemenListing }, import("./semen-catalog.d.ts").SemenListingAuditHook>>}
 */
export async function createSemenListingEndpoint(request) {
  const findStallionById = requireRepositoryMethod(request.repository, "findStallionById");
  const createSemenListing = requireRepositoryMethod(
    request.repository,
    "createSemenListing",
  );
  const stallion = await findRequiredEntity(
    () => findStallionById(request.body.stallionId),
    "Stallion",
    request.body.stallionId,
  );
  const prepared = prepareCreateSemenListing({
    ...request.body,
    stallion,
    actor: request.actor,
  });
  const listing = await createSemenListing(prepared.listing);
  const auditHook = buildSemenListingAuditHook({
    action: "SEMEN_LISTING_CREATED",
    actor: request.actor,
    listing,
    previousListing: null,
    reason: prepared.auditHook.reason,
    occurredAt: listing.createdAt,
  });
  const auditLog = await createAuditLogFromHook({
    repository: request.repository,
    auditHook,
    requestContext: request.auditContext,
  });

  return Object.freeze({
    status: 201,
    body: Object.freeze({ listing }),
    auditHook,
    auditLog,
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<import("./semen-catalog.d.ts").UpdateSemenListingInputBody>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ listing: import("./semen-catalog.d.ts").SemenListing }, import("./semen-catalog.d.ts").SemenListingAuditHook>>}
 */
export async function updateSemenListingEndpoint(request) {
  const findSemenListingById = requireRepositoryMethod(
    request.repository,
    "findSemenListingById",
  );
  const updateSemenListing = requireRepositoryMethod(
    request.repository,
    "updateSemenListing",
  );
  const listingId = requireParam(request.params, "listingId");
  const existingListing = await findRequiredEntity(
    () => findSemenListingById(listingId),
    "SemenListing",
    listingId,
  );
  const prepared = prepareUpdateSemenListing({
    existingListing,
    updates: request.body,
    actor: request.actor,
  });
  const listing = await updateSemenListing(prepared.listing);
  const auditHook = buildSemenListingAuditHook({
    action: prepared.auditHook.action,
    actor: request.actor,
    listing,
    previousListing: existingListing,
    reason: prepared.auditHook.reason,
    occurredAt: listing.updatedAt,
  });
  const auditLog = await createAuditLogFromHook({
    repository: request.repository,
    auditHook,
    requestContext: request.auditContext,
  });

  return Object.freeze({
    status: 200,
    body: Object.freeze({ listing }),
    auditHook,
    auditLog,
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<Record<string, never>>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ record: import("./semen-catalog.d.ts").SemenListingRecord }>>}
 */
export async function getSemenListingEndpoint(request) {
  const findSemenListingRecordById = requireRepositoryMethod(
    request.repository,
    "findSemenListingRecordById",
  );
  const listingId = requireParam(request.params, "listingId");
  const record = await findRequiredEntity(
    () => findSemenListingRecordById(listingId),
    "SemenListing",
    listingId,
  );

  if (!canViewSemenListing(request.actor, record.listing)) {
    throw new SemenCatalogAuthorizationError(
      "actor may only view active semen listings or station-owned listing records.",
    );
  }

  return Object.freeze({
    status: 200,
    body: Object.freeze({ record }),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<Partial<import("./semen-catalog.d.ts").UpdateSemenListingInputBody>>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ listing: import("./semen-catalog.d.ts").SemenListing }, import("./semen-catalog.d.ts").SemenListingAuditHook>>}
 */
export async function deleteSemenListingEndpoint(request) {
  return updateSemenListingEndpoint({
    ...request,
    body: {
      ...request.body,
      listingStatus: "INACTIVE",
    },
  });
}

/**
 * @param {import("./semen-catalog.d.ts").EndpointRequest<import("./semen-catalog.d.ts").SemenListingSearchFilters>} request
 * @returns {Promise<import("./semen-catalog.d.ts").EndpointResponse<{ records: import("./semen-catalog.d.ts").SemenListingRecord[] }>>}
 */
export async function searchSemenListingsEndpoint(request) {
  const listSemenListingRecords = requireRepositoryMethod(
    request.repository,
    "listSemenListingRecords",
  );
  const records = await listSemenListingRecords(request.query ?? {});
  const visibleRecords = searchSemenListingRecords(
    records,
    request.query ?? {},
    request.actor,
  );

  return Object.freeze({
    status: 200,
    body: Object.freeze({ records: visibleRecords }),
  });
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function validateActor(value) {
  const issues = [];

  if (!value || typeof value !== "object") {
    return ["actor is required."];
  }

  const actor = /** @type {Partial<import("./semen-catalog.d.ts").CatalogActorContext>} */ (value);

  if (!normalizeRequiredString(actor.userId)) {
    issues.push("actor.userId is required.");
  }

  if (!Array.isArray(actor.roles)) {
    issues.push("actor.roles must list the actor's active role context.");
  }

  return issues;
}

/**
 * @param {import("./semen-catalog.d.ts").CatalogActorContext} actor
 * @param {string} stationOrganizationId
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findCatalogManagementRole(actor, stationOrganizationId) {
  return findActorRole(actor, "BREEDING_STATION", stationOrganizationId) ??
    findActorRole(actor, "PLATFORM_ADMIN");
}

/**
 * @param {import("./semen-catalog.d.ts").CatalogActorContext} actor
 * @param {import("../identity/role-model.d.ts").RoleCode} roleCode
 * @param {string} [organizationId]
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findActorRole(actor, roleCode, organizationId) {
  if (!actor || !Array.isArray(actor.roles)) {
    return undefined;
  }

  return actor.roles.find((assignment) =>
    assignment.userId === actor.userId &&
    assignment.roleCode === roleCode &&
    isActiveRoleAssignment(assignment) &&
    (organizationId === undefined || assignment.organizationId === organizationId),
  );
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingLike} listing
 * @returns {Readonly<import("./semen-catalog.d.ts").SemenListingAuditValue>}
 */
function listingAuditValue(listing) {
  return Object.freeze({
    stallionId: listing.stallionId,
    breedingStationOrganizationId: listing.breedingStationOrganizationId,
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    termsSummary: listing.termsSummary,
  });
}

/**
 * @param {unknown} repository
 * @param {string} methodName
 * @returns {Function}
 */
function requireRepositoryMethod(repository, methodName) {
  if (!repository || typeof repository !== "object") {
    throw new TypeError("repository is required.");
  }

  const method = /** @type {Record<string, unknown>} */ (repository)[methodName];

  if (typeof method !== "function") {
    throw new TypeError(`repository.${methodName} is required.`);
  }

  return method.bind(repository);
}

/**
 * @template T
 * @param {() => Promise<T | null | undefined>} lookup
 * @param {string} entityName
 * @param {string} entityId
 * @returns {Promise<T>}
 */
async function findRequiredEntity(lookup, entityName, entityId) {
  const entity = await lookup();

  if (!entity) {
    throw new SemenCatalogNotFoundError(entityName, entityId);
  }

  return entity;
}

/**
 * @param {Record<string, string | undefined> | undefined} params
 * @param {string} paramName
 * @returns {string}
 */
function requireParam(params, paramName) {
  const value = normalizeRequiredString(params?.[paramName]);

  if (!value) {
    throw new SemenCatalogValidationError([`${paramName} route parameter is required.`]);
  }

  return value;
}

/**
 * @param {unknown} source
 * @param {string} key
 * @returns {boolean}
 */
function hasOwn(source, key) {
  return Boolean(source) && Object.prototype.hasOwnProperty.call(source, key);
}

/**
 * @param {string} value
 * @param {string} query
 * @returns {boolean}
 */
function containsCaseInsensitive(value, query) {
  return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(`${fieldName} cannot be blank when provided.`);
  }
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalTimestamp(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (!isValidTimestamp(value)) {
    issues.push(`${fieldName} must be a valid date or ISO timestamp.`);
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isValidTimestamp(value) {
  if (!(typeof value === "string" || value instanceof Date)) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}
