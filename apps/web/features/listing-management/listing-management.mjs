// @ts-check

import {
  SEMEN_AVAILABILITY_STATUSES,
  SEMEN_LISTING_STATUSES,
  SemenCatalogAuthorizationError,
  SemenCatalogValidationError,
  canManageStationCatalog,
  canViewSemenListing,
  createSemenListingEndpoint,
  isSemenAvailabilityStatus,
  isSemenListingStatus,
  updateSemenListingEndpoint,
} from "@coritech/domain/catalog/semen-catalog.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";

export const LISTING_MANAGEMENT_VIEW_STATES = /** @type {const} */ ([
  "LOADING",
  "FORM",
  "CONFIRMATION",
  "ERROR",
]);

export const LISTING_MANAGEMENT_ROUTES = Object.freeze({
  dashboard: "/station-dashboard",
  listingManagement: "/app/station/listings",
  catalog: "/app/catalog",
});

const demoTimestamp = "2026-06-09T09:00:00.000Z";

export class ListingManagementValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech listing management input:\n- ${issues.join("\n- ")}`);
    this.name = "ListingManagementValidationError";
    this.issues = issues;
  }
}

export class ListingManagementAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "ListingManagementAuthorizationError";
  }
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementInput} input
 * @returns {import("./listing-management.d.ts").ListingManagementFormViewModel}
 */
export function createListingManagementViewModel(input) {
  const issues = validateListingManagementInput(input);

  if (issues.length > 0) {
    throw new ListingManagementValidationError(issues);
  }

  const organizationContext = resolveStationOrganizationContext(input);
  const stationOrganizationId = organizationContext.organizationId;
  const listingRecords = input.listingRecords ?? [];
  const ownRecords = listingRecords
    .filter((record) =>
      record?.listing?.breedingStationOrganizationId === stationOrganizationId &&
      canViewSemenListing(input.actor, record.listing)
    )
    .sort(compareListingRecords);
  const listings = ownRecords.map(toListingRow);
  const selectedListingId = normalizeOptionalString(input.selectedListingId);
  const selectedRecord = selectedListingId
    ? ownRecords.find((record) => record.listing.id === selectedListingId)
    : null;

  if (selectedListingId && !selectedRecord) {
    throw new ListingManagementAuthorizationError(
      "actor may only edit semen listings owned by their breeding station organization.",
    );
  }

  const selectedListing = selectedRecord ? toListingRow(selectedRecord) : null;
  const form = normalizeListingForm(input.form, selectedRecord);

  return Object.freeze({
    state: "FORM",
    actorUserId: input.actor.userId.trim(),
    organizationContext,
    title: "Listing management",
    summary: "Create, edit, activate and deactivate station-owned semen listings.",
    mode: selectedListing ? "EDIT" : "CREATE",
    listings: Object.freeze(listings),
    stallionOptions: Object.freeze(buildStallionOptions({
      actor: input.actor,
      records: listingRecords,
      stallions: input.stallions ?? [],
      stationOrganizationId,
    })),
    selectedListing,
    form,
    validationIssues: Object.freeze(input.validationIssues ?? []),
    navigation: buildNavigation(),
    availabilityStatuses: SEMEN_AVAILABILITY_STATUSES,
    listingStatuses: SEMEN_LISTING_STATUSES,
    isEmpty: listings.length === 0,
  });
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementConfirmationInput} input
 * @returns {import("./listing-management.d.ts").ListingManagementConfirmationViewModel}
 */
export function createListingManagementConfirmationViewModel(input) {
  if (!input.record?.listing || !input.record?.stallion) {
    throw new ListingManagementValidationError(["record is required."]);
  }

  const isCreate = input.operation === "CREATE";

  return Object.freeze({
    state: "CONFIRMATION",
    title: isCreate ? "Listing created" : "Listing updated",
    summary: isCreate
      ? "The station-owned listing is saved and audit logged."
      : "The listing change is saved and audit logged.",
    listing: toListingRow(input.record),
    operation: input.operation,
    auditHook: input.auditHook ?? null,
    auditLog: input.auditLog ?? null,
    navigation: buildNavigation(),
  });
}

/**
 * @param {{ organizationName?: string | null }} [input]
 * @returns {import("./listing-management.d.ts").ListingManagementLoadingViewModel}
 */
export function createListingManagementLoadingState(input = {}) {
  return Object.freeze({
    state: "LOADING",
    title: "Listing management",
    message: input.organizationName
      ? `Loading ${input.organizationName} listings.`
      : "Loading station listings.",
  });
}

/**
 * @param {unknown} error
 * @returns {import("./listing-management.d.ts").ListingManagementErrorViewModel}
 */
export function createListingManagementErrorState(error) {
  return Object.freeze({
    state: "ERROR",
    title: error instanceof ListingManagementAuthorizationError ||
        error instanceof SemenCatalogAuthorizationError
      ? "Listing management unavailable"
      : "Listing management could not load",
    message: error instanceof Error
      ? error.message
      : "An unknown listing management error occurred.",
  });
}

/**
 * @param {import("./listing-management.d.ts").SaveSemenListingFromFormInput} input
 * @returns {Promise<import("./listing-management.d.ts").SaveSemenListingFromFormResult>}
 */
export async function saveSemenListingFromForm(input) {
  const form = normalizeListingForm({
    ...input.form,
    listingStatus: input.listingStatusOverride ?? input.form.listingStatus,
  });
  const operation = form.listingId ? "UPDATE" : "CREATE";
  const issues = validateListingForm(form, operation);

  if (!normalizeRequiredString(input.organizationId)) {
    issues.push("organizationId is required.");
  }

  if (issues.length > 0) {
    return Object.freeze({
      ok: false,
      operation,
      form,
      issues: Object.freeze(issues),
    });
  }

  try {
    const response = operation === "CREATE"
      ? await createSemenListingEndpoint({
        actor: input.actor,
        repository: input.repository,
        auditContext: input.auditContext,
        body: {
          stallionId: form.stallionId,
          breedingStationOrganizationId: input.organizationId,
          availabilityStatus: form.availabilityStatus,
          listingStatus: form.listingStatus,
          termsSummary: nullIfEmpty(form.termsSummary),
          changeReason: form.changeReason,
          now: input.now,
        },
      })
      : await updateSemenListingEndpoint({
        actor: input.actor,
        repository: input.repository,
        auditContext: input.auditContext,
        params: {
          listingId: form.listingId,
        },
        body: {
          availabilityStatus: form.availabilityStatus,
          listingStatus: form.listingStatus,
          termsSummary: nullIfEmpty(form.termsSummary),
          changeReason: form.changeReason,
          now: input.now,
        },
      });

    return Object.freeze({
      ok: true,
      operation,
      form,
      listing: response.body.listing,
      auditHook: response.auditHook ?? null,
      auditLog: response.auditLog ?? null,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      operation,
      form,
      issues: Object.freeze(extractIssues(error)),
    });
  }
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementRenderableViewModel} viewModel
 * @returns {string}
 */
export function renderListingManagement(viewModel) {
  if (viewModel.state === "LOADING") {
    return renderLoadingState(viewModel);
  }

  if (viewModel.state === "ERROR") {
    return renderErrorState(viewModel);
  }

  if (viewModel.state === "CONFIRMATION") {
    return renderConfirmation(viewModel);
  }

  return renderForm(viewModel);
}

/**
 * @param {import("./listing-management.d.ts").InMemoryListingManagementRepositoryInput} input
 * @returns {import("./listing-management.d.ts").InMemoryListingManagementRepository}
 */
export function createInMemoryListingManagementRepository(input) {
  const stallionStore = new Map();
  const listingStore = new Map();
  const auditLogStore = new Map();
  let listingSequence = input.listingSequenceStart ?? 1;
  let stallionSequence = input.stallionSequenceStart ?? 1;
  let auditLogSequence = input.auditLogSequenceStart ?? 1;

  for (const record of input.listingRecords ?? []) {
    if (record?.stallion?.id) {
      stallionStore.set(record.stallion.id, normalizePersistedStallion(record.stallion));
    }

    if (record?.listing?.id) {
      listingStore.set(record.listing.id, normalizePersistedListing(record.listing));
    }
  }

  for (const stallion of input.stallions ?? []) {
    if (stallion?.id) {
      stallionStore.set(stallion.id, normalizePersistedStallion(stallion));
    }
  }

  return {
    async createStallion(stallion) {
      const persisted = normalizePersistedStallion({
        ...stallion,
        id: stallion.id ?? `demo-stallion-${stallionSequence++}`,
      });

      stallionStore.set(persisted.id, persisted);
      return Object.freeze(persisted);
    },
    async updateStallion(stallion) {
      const persisted = normalizePersistedStallion(stallion);

      stallionStore.set(persisted.id, persisted);
      return Object.freeze(persisted);
    },
    async findStallionById(stallionId) {
      return stallionStore.get(stallionId) ?? null;
    },
    async listStallions(filters = {}) {
      return Object.freeze(
        [...stallionStore.values()].filter((stallion) =>
          matchesStallionFilters(stallion, filters)
        ),
      );
    },
    async createSemenListing(listing) {
      const persisted = normalizePersistedListing({
        ...listing,
        id: listing.id ?? `demo-listing-${listingSequence++}`,
      });

      listingStore.set(persisted.id, persisted);
      return Object.freeze(persisted);
    },
    async updateSemenListing(listing) {
      const persisted = normalizePersistedListing(listing);

      listingStore.set(persisted.id, persisted);
      return Object.freeze(persisted);
    },
    async findSemenListingById(listingId) {
      return listingStore.get(listingId) ?? null;
    },
    async findSemenListingRecordById(listingId) {
      const listing = listingStore.get(listingId);

      if (!listing) {
        return null;
      }

      const stallion = stallionStore.get(listing.stallionId);

      if (!stallion) {
        return null;
      }

      return Object.freeze({
        listing: Object.freeze(listing),
        stallion: Object.freeze(stallion),
      });
    },
    async listSemenListingRecords(filters = {}) {
      const records = [];

      for (const listing of listingStore.values()) {
        const stallion = stallionStore.get(listing.stallionId);

        if (stallion && matchesListingFilters(listing, stallion, filters)) {
          records.push(Object.freeze({
            listing: Object.freeze(listing),
            stallion: Object.freeze(stallion),
          }));
        }
      }

      return Object.freeze(records.sort(compareListingRecords));
    },
    async createAuditLog(auditLog) {
      const persistedAuditLog = Object.freeze({
        ...auditLog,
        id: auditLog.id ?? `demo-listing-audit-${auditLogSequence++}`,
      });
      const logs = auditLogStore.get(persistedAuditLog.objectId) ?? [];

      logs.push(persistedAuditLog);
      auditLogStore.set(persistedAuditLog.objectId, logs);

      return persistedAuditLog;
    },
    async listAuditLogs() {
      return Object.freeze([...auditLogStore.values()].flat());
    },
  };
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementInput | undefined} input
 * @returns {string[]}
 */
function validateListingManagementInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["listing management input is required."];
  }

  if (!input.actor || typeof input.actor !== "object") {
    issues.push("actor is required.");
  } else {
    if (!normalizeRequiredString(input.actor.userId)) {
      issues.push("actor.userId is required.");
    }

    if (!Array.isArray(input.actor.roles)) {
      issues.push("actor.roles must list the signed-in user's active role context.");
    }
  }

  validateOptionalNonBlankString(input.organizationId, "organizationId", issues);
  validateOptionalNonBlankString(input.organizationName, "organizationName", issues);
  validateOptionalNonBlankString(input.selectedListingId, "selectedListingId", issues);
  validateOptionalArray(input.listingRecords, "listingRecords", issues);
  validateOptionalArray(input.stallions, "stallions", issues);
  validateOptionalArray(input.validationIssues, "validationIssues", issues);

  return issues;
}

/**
 * @param {{
 *   actor: import("./listing-management.d.ts").ListingManagementActorContext;
 *   organizationId?: string | null;
 *   organizationName?: string | null;
 * }} input
 * @returns {import("./listing-management.d.ts").ListingManagementOrganizationContext}
 */
function resolveStationOrganizationContext(input) {
  const activeStationRoles = input.actor.roles.filter((assignment) =>
    assignment.roleCode === "BREEDING_STATION" &&
    assignment.userId === input.actor.userId &&
    isActiveRoleAssignment(assignment)
  );

  if (activeStationRoles.length === 0) {
    throw new ListingManagementAuthorizationError(
      "actor must have an active BREEDING_STATION role before managing semen listings.",
    );
  }

  const requestedOrganizationId = normalizeOptionalString(input.organizationId);

  if (!requestedOrganizationId && activeStationRoles.length > 1) {
    throw new ListingManagementValidationError([
      "organizationId is required when actor has multiple active BREEDING_STATION roles.",
    ]);
  }

  const role = requestedOrganizationId
    ? activeStationRoles.find((assignment) =>
      assignment.organizationId === requestedOrganizationId
    )
    : activeStationRoles[0];

  if (!role) {
    throw new ListingManagementAuthorizationError(
      "actor may only manage listings for their own breeding station organization.",
    );
  }

  return Object.freeze({
    organizationId: role.organizationId,
    organizationName: normalizeOptionalString(input.organizationName) ?? role.organizationId,
    roleCode: "BREEDING_STATION",
  });
}

/**
 * @param {{
 *   actor: import("./listing-management.d.ts").ListingManagementActorContext;
 *   stationOrganizationId: string;
 *   records: import("./listing-management.d.ts").SemenListingRecordLike[];
 *   stallions: import("@coritech/domain/catalog/semen-catalog.d.ts").StallionLike[];
 * }} input
 * @returns {import("./listing-management.d.ts").ListingManagementStallionOption[]}
 */
function buildStallionOptions(input) {
  const stallionsById = new Map();

  for (const record of input.records) {
    if (record?.stallion?.id) {
      stallionsById.set(record.stallion.id, record.stallion);
    }
  }

  for (const stallion of input.stallions) {
    if (stallion?.id) {
      stallionsById.set(stallion.id, stallion);
    }
  }

  return [...stallionsById.values()]
    .filter((stallion) =>
      stallion.status === "ACTIVE" &&
      stallion.breedingStationOrganizationId === input.stationOrganizationId &&
      canManageStationCatalog(input.actor, stallion.breedingStationOrganizationId)
    )
    .map((stallion) => Object.freeze({
      id: stallion.id,
      name: stallion.name,
      breed: stallion.breed,
      label: `${stallion.name} - ${stallion.breed}`,
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * @param {import("./listing-management.d.ts").SemenListingRecordLike} record
 * @returns {import("./listing-management.d.ts").ListingManagementListingRow}
 */
function toListingRow(record) {
  const listing = record.listing;
  const listingId = normalizeOptionalString(listing.id);

  return Object.freeze({
    id: listingId,
    stallionId: record.stallion.id,
    stallionName: record.stallion.name,
    breed: record.stallion.breed,
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    termsSummary: normalizeOptionalString(listing.termsSummary),
    editHref: listingId
      ? `${LISTING_MANAGEMENT_ROUTES.listingManagement}?listingId=${encodeURIComponent(listingId)}`
      : null,
    catalogHref: listingId && listing.listingStatus === "ACTIVE"
      ? `${LISTING_MANAGEMENT_ROUTES.catalog}/${encodeURIComponent(listingId)}`
      : null,
    canActivate: Boolean(listingId) && listing.listingStatus === "INACTIVE",
    canDeactivate: Boolean(listingId) && listing.listingStatus === "ACTIVE",
  });
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementFormInput | undefined} form
 * @param {import("./listing-management.d.ts").SemenListingRecordLike | null} [selectedRecord]
 * @returns {import("./listing-management.d.ts").ListingManagementFormState}
 */
function normalizeListingForm(form, selectedRecord = null) {
  const hasForm = Boolean(form && typeof form === "object");

  return Object.freeze({
    listingId: hasForm && hasOwn(form, "listingId")
      ? normalizeRequiredString(form?.listingId)
      : normalizeOptionalString(selectedRecord?.listing.id) ?? "",
    stallionId: hasForm && hasOwn(form, "stallionId")
      ? normalizeRequiredString(form?.stallionId)
      : normalizeOptionalString(selectedRecord?.listing.stallionId) ?? "",
    availabilityStatus: hasForm && hasOwn(form, "availabilityStatus")
      ? normalizeRequiredString(form?.availabilityStatus)
      : selectedRecord?.listing.availabilityStatus ?? "AVAILABLE",
    listingStatus: hasForm && hasOwn(form, "listingStatus")
      ? normalizeRequiredString(form?.listingStatus)
      : selectedRecord?.listing.listingStatus ?? "ACTIVE",
    termsSummary: hasForm && hasOwn(form, "termsSummary")
      ? normalizeRequiredString(form?.termsSummary)
      : normalizeOptionalString(selectedRecord?.listing.termsSummary) ?? "",
    changeReason: hasForm && hasOwn(form, "changeReason")
      ? normalizeRequiredString(form?.changeReason)
      : "",
  });
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementFormState} form
 * @param {import("./listing-management.d.ts").ListingManagementOperation} operation
 * @returns {string[]}
 */
function validateListingForm(form, operation) {
  const issues = [];

  if (operation === "UPDATE" && !form.listingId) {
    issues.push("listingId is required when editing a semen listing.");
  }

  if (!form.stallionId) {
    issues.push("stallionId is required.");
  }

  if (!form.availabilityStatus) {
    issues.push("availabilityStatus is required.");
  } else if (!isSemenAvailabilityStatus(form.availabilityStatus)) {
    issues.push(
      `availabilityStatus must be one of: ${SEMEN_AVAILABILITY_STATUSES.join(", ")}.`,
    );
  }

  if (!form.listingStatus) {
    issues.push("listingStatus is required.");
  } else if (!isSemenListingStatus(form.listingStatus)) {
    issues.push(`listingStatus must be one of: ${SEMEN_LISTING_STATUSES.join(", ")}.`);
  }

  validateOptionalNonBlankString(form.termsSummary, "termsSummary", issues);

  if (!form.changeReason) {
    issues.push("changeReason is required for the listing audit trail.");
  }

  return issues;
}

/**
 * @param {unknown} error
 * @returns {string[]}
 */
function extractIssues(error) {
  if (
    error instanceof ListingManagementValidationError ||
    error instanceof SemenCatalogValidationError
  ) {
    return [...error.issues];
  }

  if (error instanceof Error) {
    return [error.message];
  }

  return ["An unknown listing management error occurred."];
}

/**
 * @returns {import("./listing-management.d.ts").ListingManagementNavigation}
 */
function buildNavigation() {
  return Object.freeze({
    dashboardHref: LISTING_MANAGEMENT_ROUTES.dashboard,
    listingManagementHref: LISTING_MANAGEMENT_ROUTES.listingManagement,
    catalogHref: LISTING_MANAGEMENT_ROUTES.catalog,
  });
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementLoadingViewModel} viewModel
 * @returns {string}
 */
function renderLoadingState(viewModel) {
  return [
    "<section class=\"listing-management listing-management--loading\" aria-busy=\"true\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementErrorViewModel} viewModel
 * @returns {string}
 */
function renderErrorState(viewModel) {
  return [
    "<section class=\"listing-management listing-management--error\" role=\"alert\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementConfirmationViewModel} viewModel
 * @returns {string}
 */
function renderConfirmation(viewModel) {
  return [
    "<main class=\"listing-management listing-management--confirmation\">",
    "  <section class=\"listing-management__section\" aria-labelledby=\"listing-confirmation-heading\">",
    `    <h1 id="listing-confirmation-heading">${escapeHtml(viewModel.title)}</h1>`,
    `    <p>${escapeHtml(viewModel.summary)}</p>`,
    "    <dl>",
    renderDetailTerm("Stallion", viewModel.listing.stallionName, 6),
    renderDetailTerm("Availability", formatStatus(viewModel.listing.availabilityStatus), 6),
    renderDetailTerm("Listing status", formatStatus(viewModel.listing.listingStatus), 6),
    "    </dl>",
    viewModel.auditHook
      ? `    <p data-audit-action="${escapeAttribute(viewModel.auditHook.action)}">Audit action: ${escapeHtml(formatStatus(viewModel.auditHook.action))}</p>`
      : "",
    "  </section>",
    "</main>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementFormViewModel} viewModel
 * @returns {string}
 */
function renderForm(viewModel) {
  return [
    `<main class="listing-management" data-organization-id="${escapeAttribute(viewModel.organizationContext.organizationId)}">`,
    "  <header class=\"listing-management__header\">",
    "    <div>",
    "      <p class=\"listing-management__eyebrow\">Station catalog control</p>",
    `      <h1>${escapeHtml(viewModel.title)}</h1>`,
    `      <p>${escapeHtml(viewModel.summary)}</p>`,
    "    </div>",
    `    <a href="${escapeAttribute(viewModel.navigation.dashboardHref)}">Dashboard</a>`,
    "  </header>",
    renderValidationIssues(viewModel.validationIssues),
    renderListingEditor(viewModel),
    renderListingTable(viewModel),
    "</main>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {readonly string[]} issues
 * @returns {string}
 */
function renderValidationIssues(issues) {
  if (issues.length === 0) {
    return "";
  }

  return [
    "  <section class=\"listing-management__alert\" role=\"alert\">",
    "    <h2>Check listing details</h2>",
    "    <ul>",
    issues.map((issue) => `      <li>${escapeHtml(issue)}</li>`).join("\n"),
    "    </ul>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementFormViewModel} viewModel
 * @returns {string}
 */
function renderListingEditor(viewModel) {
  const isEdit = viewModel.mode === "EDIT";

  return [
    "  <section class=\"listing-management__section\" aria-labelledby=\"listing-editor-heading\">",
    `    <h2 id="listing-editor-heading">${isEdit ? "Edit listing" : "Create listing"}</h2>`,
    "    <form method=\"post\">",
    `      <input type="hidden" name="listingId" value="${escapeAttribute(viewModel.form.listingId)}" />`,
    isEdit
      ? `      <input type="hidden" name="stallionId" value="${escapeAttribute(viewModel.form.stallionId)}" />`
      : renderStallionSelect(viewModel),
    renderStatusSelect(
      "availabilityStatus",
      "Availability",
      viewModel.form.availabilityStatus,
      viewModel.availabilityStatuses,
    ),
    renderStatusSelect(
      "listingStatus",
      "Listing status",
      viewModel.form.listingStatus,
      viewModel.listingStatuses,
    ),
    "      <label>",
    "        <span>Terms summary</span>",
    `        <textarea name="termsSummary">${escapeHtml(viewModel.form.termsSummary)}</textarea>`,
    "      </label>",
    "      <label>",
    "        <span>Change reason</span>",
    `        <input name="changeReason" required value="${escapeAttribute(viewModel.form.changeReason)}" />`,
    "      </label>",
    "      <button type=\"submit\">Save listing</button>",
    isEdit
      ? `      <a href="${escapeAttribute(viewModel.navigation.listingManagementHref)}">Create another listing</a>`
      : "",
    "    </form>",
    "  </section>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementFormViewModel} viewModel
 * @returns {string}
 */
function renderStallionSelect(viewModel) {
  return [
    "      <label>",
    "        <span>Linked stallion</span>",
    "        <select name=\"stallionId\" required>",
    "          <option value=\"\">Choose a stallion</option>",
    viewModel.stallionOptions.map((stallion) => {
      const selected = stallion.id === viewModel.form.stallionId ? " selected" : "";

      return `          <option value="${escapeAttribute(stallion.id)}"${selected}>${escapeHtml(stallion.label)}</option>`;
    }).join("\n"),
    "        </select>",
    "      </label>",
  ].join("\n");
}

/**
 * @param {string} name
 * @param {string} label
 * @param {string} value
 * @param {readonly string[]} options
 * @returns {string}
 */
function renderStatusSelect(name, label, value, options) {
  return [
    "      <label>",
    `        <span>${escapeHtml(label)}</span>`,
    `        <select name="${escapeAttribute(name)}" required>`,
    options.map((option) => {
      const selected = option === value ? " selected" : "";

      return `          <option value="${escapeAttribute(option)}"${selected}>${escapeHtml(formatStatus(option))}</option>`;
    }).join("\n"),
    "        </select>",
    "      </label>",
  ].join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementFormViewModel} viewModel
 * @returns {string}
 */
function renderListingTable(viewModel) {
  if (viewModel.listings.length === 0) {
    return [
      "  <section class=\"listing-management__section\" aria-labelledby=\"station-listings-heading\">",
      "    <h2 id=\"station-listings-heading\">Station listings</h2>",
      "    <p>No station-owned semen listings are available yet.</p>",
      "  </section>",
    ].join("\n");
  }

  return [
    "  <section class=\"listing-management__section\" aria-labelledby=\"station-listings-heading\">",
    "    <h2 id=\"station-listings-heading\">Station listings</h2>",
    "    <table>",
    "      <thead>",
    "        <tr><th>Stallion</th><th>Availability</th><th>Status</th><th>Terms</th><th>Actions</th></tr>",
    "      </thead>",
    "      <tbody>",
    viewModel.listings.map(renderListingRow).join("\n"),
    "      </tbody>",
    "    </table>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementListingRow} listing
 * @returns {string}
 */
function renderListingRow(listing) {
  return [
    "        <tr>",
    `          <td>${escapeHtml(listing.stallionName)}</td>`,
    `          <td>${escapeHtml(formatStatus(listing.availabilityStatus))}</td>`,
    `          <td>${escapeHtml(formatStatus(listing.listingStatus))}</td>`,
    `          <td>${escapeHtml(listing.termsSummary ?? "Not specified")}</td>`,
    "          <td>",
    listing.editHref ? `            <a href="${escapeAttribute(listing.editHref)}">Edit</a>` : "",
    listing.canDeactivate ? renderActivationForm(listing, "INACTIVE", "Deactivate") : "",
    listing.canActivate ? renderActivationForm(listing, "ACTIVE", "Activate") : "",
    "          </td>",
    "        </tr>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {import("./listing-management.d.ts").ListingManagementListingRow} listing
 * @param {"ACTIVE" | "INACTIVE"} status
 * @param {string} label
 * @returns {string}
 */
function renderActivationForm(listing, status, label) {
  return [
    "            <form method=\"post\">",
    `              <input type="hidden" name="listingId" value="${escapeAttribute(listing.id ?? "")}" />`,
    `              <input type="hidden" name="stallionId" value="${escapeAttribute(listing.stallionId)}" />`,
    `              <input type="hidden" name="availabilityStatus" value="${escapeAttribute(listing.availabilityStatus)}" />`,
    `              <input type="hidden" name="listingStatus" value="${escapeAttribute(status)}" />`,
    `              <input type="hidden" name="termsSummary" value="${escapeAttribute(listing.termsSummary ?? "")}" />`,
    `              <input type="hidden" name="changeReason" value="${escapeAttribute(`${label}d from station listing management.`)}" />`,
    `              <button type="submit">${escapeHtml(label)}</button>`,
    "            </form>",
  ].join("\n");
}

/**
 * @param {string} term
 * @param {string} value
 * @param {number} [indent]
 * @returns {string}
 */
function renderDetailTerm(term, value, indent = 4) {
  const space = " ".repeat(indent);

  return [
    `${space}<div>`,
    `${space}  <dt>${escapeHtml(term)}</dt>`,
    `${space}  <dd>${escapeHtml(value)}</dd>`,
    `${space}</div>`,
  ].join("\n");
}

/**
 * @param {import("./listing-management.d.ts").SemenListingRecordLike} left
 * @param {import("./listing-management.d.ts").SemenListingRecordLike} right
 * @returns {number}
 */
function compareListingRecords(left, right) {
  return compareListingStatus(left.listing.listingStatus, right.listing.listingStatus) ||
    left.stallion.name.localeCompare(right.stallion.name) ||
    left.listing.availabilityStatus.localeCompare(right.listing.availabilityStatus);
}

/**
 * @param {string} left
 * @param {string} right
 * @returns {number}
 */
function compareListingStatus(left, right) {
  if (left === right) {
    return 0;
  }

  return left === "ACTIVE" ? -1 : 1;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
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
 * @returns {string | null}
 */
function nullIfEmpty(value) {
  return normalizeOptionalString(value);
}

/**
 * @param {unknown} value
 * @param {string} fieldName
 * @param {string[]} issues
 * @returns {void}
 */
function validateOptionalNonBlankString(value, fieldName, issues) {
  if (value === undefined || value === null || value === "") {
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
function validateOptionalArray(value, fieldName, issues) {
  if (value !== undefined && !Array.isArray(value)) {
    issues.push(`${fieldName} must be an array when provided.`);
  }
}

/**
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").StallionLike | import("@coritech/domain/catalog/semen-catalog.d.ts").Stallion} stallion
 * @returns {import("@coritech/domain/catalog/semen-catalog.d.ts").Stallion}
 */
function normalizePersistedStallion(stallion) {
  return {
    id: normalizeOptionalString(stallion.id) ?? "",
    name: stallion.name,
    breed: stallion.breed,
    ueln: normalizeOptionalString(stallion.ueln),
    microchipNumber: normalizeOptionalString(stallion.microchipNumber),
    breedingStationOrganizationId: stallion.breedingStationOrganizationId,
    status: stallion.status,
    createdByUserId: "createdByUserId" in stallion
      ? stallion.createdByUserId
      : "demo-seed",
    updatedByUserId: "updatedByUserId" in stallion
      ? stallion.updatedByUserId
      : "demo-seed",
    createdAt: "createdAt" in stallion ? stallion.createdAt : demoTimestamp,
    updatedAt: "updatedAt" in stallion ? stallion.updatedAt : demoTimestamp,
  };
}

/**
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").SemenListingLike | import("@coritech/domain/catalog/semen-catalog.d.ts").SemenListing} listing
 * @returns {import("@coritech/domain/catalog/semen-catalog.d.ts").SemenListing}
 */
function normalizePersistedListing(listing) {
  return {
    id: normalizeOptionalString(listing.id) ?? "",
    stallionId: listing.stallionId,
    breedingStationOrganizationId: listing.breedingStationOrganizationId,
    availabilityStatus: listing.availabilityStatus,
    listingStatus: listing.listingStatus,
    termsSummary: normalizeOptionalString(listing.termsSummary),
    createdByUserId: "createdByUserId" in listing
      ? listing.createdByUserId
      : "demo-seed",
    updatedByUserId: "updatedByUserId" in listing
      ? listing.updatedByUserId
      : "demo-seed",
    createdAt: "createdAt" in listing ? listing.createdAt : demoTimestamp,
    updatedAt: "updatedAt" in listing ? listing.updatedAt : demoTimestamp,
  };
}

/**
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").Stallion} stallion
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").StallionSearchFilters} filters
 * @returns {boolean}
 */
function matchesStallionFilters(stallion, filters) {
  if (
    filters.breedingStationOrganizationId &&
    stallion.breedingStationOrganizationId !== filters.breedingStationOrganizationId
  ) {
    return false;
  }

  if (filters.status && stallion.status !== filters.status) {
    return false;
  }

  if (filters.name && !containsCaseInsensitive(stallion.name, filters.name)) {
    return false;
  }

  if (filters.breed && !containsCaseInsensitive(stallion.breed, filters.breed)) {
    return false;
  }

  return true;
}

/**
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").SemenListing} listing
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").Stallion} stallion
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").SemenListingSearchFilters} filters
 * @returns {boolean}
 */
function matchesListingFilters(listing, stallion, filters) {
  if (filters.stallionId && listing.stallionId !== filters.stallionId) {
    return false;
  }

  if (
    filters.breedingStationOrganizationId &&
    listing.breedingStationOrganizationId !== filters.breedingStationOrganizationId
  ) {
    return false;
  }

  if (filters.availabilityStatus && listing.availabilityStatus !== filters.availabilityStatus) {
    return false;
  }

  if (filters.listingStatus && listing.listingStatus !== filters.listingStatus) {
    return false;
  }

  if (filters.stallion && !containsCaseInsensitive(stallion.name, filters.stallion)) {
    return false;
  }

  if (filters.breed && !containsCaseInsensitive(stallion.breed, filters.breed)) {
    return false;
  }

  return true;
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
function formatStatus(value) {
  return String(value).toLowerCase().replace(/_/g, " ");
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeAttribute(value) {
  return escapeHtml(value);
}
