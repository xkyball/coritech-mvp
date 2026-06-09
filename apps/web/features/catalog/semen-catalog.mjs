// @ts-check

import {
  SEMEN_AVAILABILITY_STATUSES,
  SemenCatalogAuthorizationError,
  SemenCatalogNotFoundError,
  isSemenAvailabilityStatus,
  isSemenListingOrderable,
  searchSemenListingRecords,
} from "@coritech/domain/catalog/semen-catalog.mjs";

export const SEMEN_CATALOG_VIEW_STATES = /** @type {const} */ ([
  "LOADING",
  "LIST",
  "DETAIL",
  "ERROR",
]);

export const SEMEN_CATALOG_UI_ROUTES = Object.freeze({
  catalog: "/app/catalog",
  dashboard: "/breeder-dashboard",
  newOrder: "/app/orders/new",
});

export class SemenCatalogUiValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech semen catalog UI input:\n- ${issues.join("\n- ")}`);
    this.name = "SemenCatalogUiValidationError";
    this.issues = issues;
  }
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogInput} input
 * @returns {import("./semen-catalog.d.ts").SemenCatalogListViewModel}
 */
export function createSemenCatalogViewModel(input) {
  const issues = validateCatalogInput(input);

  if (issues.length > 0) {
    throw new SemenCatalogUiValidationError(issues);
  }

  const actor = input.actor;
  const stationNameById = buildStationNameMap(input.stationOrganizations ?? []);
  const records = input.listingRecords ?? [];
  const filters = normalizeCatalogFilters(input.filters ?? {});
  const baseActiveRecords = searchActiveRecords(records, {}, actor);
  const filteredRecords = searchActiveRecords(
    records,
    {
      stallion: filters.stallion ?? undefined,
      breed: filters.breed ?? undefined,
      breedingStationOrganizationId: filters.station ?? undefined,
      availabilityStatus: filters.availabilityStatus ?? undefined,
    },
    actor,
  );
  const listings = filteredRecords
    .map((record) => toListingCard(record, stationNameById))
    .sort(compareListingCards);

  return Object.freeze({
    state: "LIST",
    actorUserId: actor.userId.trim(),
    title: "Semen catalog",
    summary: "Active breeder-visible semen listings.",
    filters,
    filterOptions: buildFilterOptions(baseActiveRecords, stationNameById),
    listings: Object.freeze(listings),
    navigation: buildNavigation(),
    isEmpty: listings.length === 0,
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogDetailInput} input
 * @returns {import("./semen-catalog.d.ts").SemenCatalogDetailViewModel}
 */
export function createSemenCatalogDetailViewModel(input) {
  const issues = validateCatalogDetailInput(input);

  if (issues.length > 0) {
    throw new SemenCatalogUiValidationError(issues);
  }

  const listingId = input.listingId.trim();
  const stationNameById = buildStationNameMap(input.stationOrganizations ?? []);
  const activeRecords = searchActiveRecords(input.listingRecords ?? [], {}, input.actor);
  const record = activeRecords.find((item) =>
    normalizeOptionalString(item.listing.id) === listingId
  );

  if (!record) {
    throw new SemenCatalogNotFoundError("SemenListing", listingId);
  }

  return Object.freeze({
    state: "DETAIL",
    actorUserId: input.actor.userId.trim(),
    title: record.stallion.name,
    listing: toListingDetail(record, stationNameById),
    navigation: buildNavigation(),
  });
}

/**
 * @param {{ label?: string | null }} [input]
 * @returns {import("./semen-catalog.d.ts").SemenCatalogLoadingViewModel}
 */
export function createSemenCatalogLoadingState(input = {}) {
  const label = normalizeOptionalString(input.label) ?? "semen catalog";

  return Object.freeze({
    state: "LOADING",
    title: "Semen catalog",
    message: `Loading ${label}.`,
  });
}

/**
 * @param {unknown} error
 * @returns {import("./semen-catalog.d.ts").SemenCatalogErrorViewModel}
 */
export function createSemenCatalogErrorState(error) {
  return Object.freeze({
    state: "ERROR",
    title: error instanceof SemenCatalogAuthorizationError
      ? "Catalog unavailable"
      : "Catalog could not load",
    message: error instanceof Error ? error.message : "An unknown catalog error occurred.",
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogRenderableViewModel} viewModel
 * @returns {string}
 */
export function renderSemenCatalog(viewModel) {
  if (viewModel.state === "LOADING") {
    return renderLoadingState(viewModel);
  }

  if (viewModel.state === "ERROR") {
    return renderErrorState(viewModel);
  }

  if (viewModel.state === "DETAIL") {
    return renderDetail(viewModel);
  }

  return renderList(viewModel);
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogInput} input
 * @returns {string}
 */
export function renderSemenCatalogFromInput(input) {
  return renderSemenCatalog(createSemenCatalogViewModel(input));
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogInput | undefined} input
 * @returns {string[]}
 */
function validateCatalogInput(input) {
  const issues = validateCatalogCommonInput(input);

  if (input && typeof input === "object") {
    validateOptionalArray(input.listingRecords, "listingRecords", issues);
    validateOptionalArray(input.stationOrganizations, "stationOrganizations", issues);
  }

  return issues;
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogDetailInput | undefined} input
 * @returns {string[]}
 */
function validateCatalogDetailInput(input) {
  const issues = validateCatalogCommonInput(input);

  if (input && typeof input === "object") {
    if (!normalizeRequiredString(input.listingId)) {
      issues.push("listingId is required.");
    }

    validateOptionalArray(input.listingRecords, "listingRecords", issues);
    validateOptionalArray(input.stationOrganizations, "stationOrganizations", issues);
  }

  return issues;
}

/**
 * @param {Partial<import("./semen-catalog.d.ts").SemenCatalogInput> | undefined} input
 * @returns {string[]}
 */
function validateCatalogCommonInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["catalog input is required."];
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

  return issues;
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogFiltersInput} filters
 * @returns {import("./semen-catalog.d.ts").SemenCatalogNormalizedFilters}
 */
function normalizeCatalogFilters(filters) {
  const availabilityStatus = normalizeOptionalString(filters.availabilityStatus);

  if (availabilityStatus && !isSemenAvailabilityStatus(availabilityStatus)) {
    throw new SemenCatalogUiValidationError([
      `availabilityStatus must be one of: ${SEMEN_AVAILABILITY_STATUSES.join(", ")}.`,
    ]);
  }

  return Object.freeze({
    stallion: normalizeOptionalString(filters.stallion),
    breed: normalizeOptionalString(filters.breed),
    station: normalizeOptionalString(filters.station),
    availabilityStatus: /** @type {import("./semen-catalog.d.ts").SemenCatalogNormalizedFilters["availabilityStatus"]} */ (
      availabilityStatus
    ),
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingRecordLike[]} records
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").SemenListingSearchFilters} filters
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").CatalogActorContext} actor
 * @returns {import("./semen-catalog.d.ts").SemenListingRecordLike[]}
 */
function searchActiveRecords(records, filters, actor) {
  return searchSemenListingRecords(
    records,
    {
      ...filters,
      listingStatus: "ACTIVE",
    },
    actor,
  );
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingRecordLike} record
 * @param {ReadonlyMap<string, string>} stationNameById
 * @returns {import("./semen-catalog.d.ts").SemenCatalogListingCard}
 */
function toListingCard(record, stationNameById) {
  const listing = record.listing;
  const listingId = normalizeOptionalString(listing.id);
  const stationName = stationNameById.get(listing.breedingStationOrganizationId) ??
    listing.breedingStationOrganizationId;
  const canCreateOrder = Boolean(listingId) && isSemenListingOrderable(listing);

  return Object.freeze({
    id: listingId,
    stallionId: record.stallion.id,
    stallionName: record.stallion.name,
    breed: record.stallion.breed,
    stationOrganizationId: listing.breedingStationOrganizationId,
    stationName,
    stationLabel: stationName === listing.breedingStationOrganizationId
      ? stationName
      : `${stationName} (${listing.breedingStationOrganizationId})`,
    availabilityStatus: listing.availabilityStatus,
    termsSummary: normalizeOptionalString(listing.termsSummary),
    detailHref: listingId
      ? `${SEMEN_CATALOG_UI_ROUTES.catalog}/${encodeURIComponent(listingId)}`
      : null,
    canCreateOrder,
    createOrderHref: canCreateOrder
      ? `${SEMEN_CATALOG_UI_ROUTES.newOrder}?semenListingId=${encodeURIComponent(
        /** @type {string} */ (listingId),
      )}`
      : null,
    orderActionLabel: canCreateOrder ? "Create Order" : "Unavailable",
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingRecordLike} record
 * @param {ReadonlyMap<string, string>} stationNameById
 * @returns {import("./semen-catalog.d.ts").SemenCatalogListingDetail}
 */
function toListingDetail(record, stationNameById) {
  return Object.freeze({
    ...toListingCard(record, stationNameById),
    ueln: normalizeOptionalString(record.stallion.ueln),
    microchipNumber: normalizeOptionalString(record.stallion.microchipNumber),
    listingStatus: "ACTIVE",
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenListingRecordLike[]} records
 * @param {ReadonlyMap<string, string>} stationNameById
 * @returns {import("./semen-catalog.d.ts").SemenCatalogFilterOptions}
 */
function buildFilterOptions(records, stationNameById) {
  return Object.freeze({
    breeds: Object.freeze(uniqueOptions(records.map((record) => ({
      value: record.stallion.breed,
      label: record.stallion.breed,
    })))),
    stations: Object.freeze(uniqueOptions(records.map((record) => {
      const stationId = record.listing.breedingStationOrganizationId;
      const stationName = stationNameById.get(stationId) ?? stationId;

      return {
        value: stationId,
        label: stationName === stationId ? stationId : `${stationName} (${stationId})`,
      };
    }))),
    availabilityStatuses: Object.freeze(SEMEN_AVAILABILITY_STATUSES.map((status) => ({
      value: status,
      label: formatStatus(status),
    }))),
  });
}

/**
 * @param {{ value: string, label: string }[]} options
 * @returns {import("./semen-catalog.d.ts").SemenCatalogSelectOption[]}
 */
function uniqueOptions(options) {
  const byValue = new Map();

  for (const option of options) {
    const value = normalizeOptionalString(option.value);

    if (value && !byValue.has(value)) {
      byValue.set(value, {
        value,
        label: normalizeOptionalString(option.label) ?? value,
      });
    }
  }

  return Array.from(byValue.values()).sort((left, right) =>
    left.label.localeCompare(right.label)
  );
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogStationOrganization[]} stations
 * @returns {ReadonlyMap<string, string>}
 */
function buildStationNameMap(stations) {
  const map = new Map();

  for (const station of stations) {
    const stationId = normalizeOptionalString(station.organizationId);
    const name = normalizeOptionalString(station.name);

    if (stationId && name) {
      map.set(stationId, name);
    }
  }

  return map;
}

/**
 * @returns {import("./semen-catalog.d.ts").SemenCatalogNavigation}
 */
function buildNavigation() {
  return Object.freeze({
    catalogHref: SEMEN_CATALOG_UI_ROUTES.catalog,
    dashboardHref: SEMEN_CATALOG_UI_ROUTES.dashboard,
    newOrderHref: SEMEN_CATALOG_UI_ROUTES.newOrder,
  });
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogLoadingViewModel} viewModel
 * @returns {string}
 */
function renderLoadingState(viewModel) {
  return [
    "<section class=\"semen-catalog semen-catalog--loading\" aria-busy=\"true\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "  <div class=\"semen-catalog__skeleton-grid\" aria-hidden=\"true\">",
    "    <span></span><span></span><span></span>",
    "  </div>",
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogErrorViewModel} viewModel
 * @returns {string}
 */
function renderErrorState(viewModel) {
  return [
    "<section class=\"semen-catalog semen-catalog--error\" role=\"alert\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogListViewModel} viewModel
 * @returns {string}
 */
function renderList(viewModel) {
  return [
    `<main class="semen-catalog${viewModel.isEmpty ? " is-empty" : ""}" data-actor-user-id="${escapeAttribute(viewModel.actorUserId)}">`,
    renderHeader({
      eyebrow: "Breeder catalog",
      title: viewModel.title,
      summary: viewModel.summary,
      actionHref: viewModel.navigation.dashboardHref,
      actionLabel: "Dashboard",
    }),
    renderFilterForm(viewModel),
    renderListings(viewModel),
    "</main>",
  ].join("\n");
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogDetailViewModel} viewModel
 * @returns {string}
 */
function renderDetail(viewModel) {
  const listing = viewModel.listing;

  return [
    `<main class="semen-catalog semen-catalog--detail" data-actor-user-id="${escapeAttribute(viewModel.actorUserId)}">`,
    renderHeader({
      eyebrow: "Listing detail",
      title: listing.stallionName,
      summary: `${listing.breed} at ${listing.stationLabel}`,
      actionHref: viewModel.navigation.catalogHref,
      actionLabel: "Back to catalog",
    }),
    "  <section class=\"semen-catalog__detail-panel\" aria-labelledby=\"listing-detail-heading\">",
    "    <div class=\"semen-catalog__detail-heading\">",
    `      <p>${escapeHtml(formatStatus(listing.availabilityStatus))}</p>`,
    "      <h2 id=\"listing-detail-heading\">Listing details</h2>",
    "    </div>",
    "    <dl class=\"semen-catalog__details\">",
    renderDetailTerm("Breeding station", listing.stationLabel),
    renderDetailTerm("Breed", listing.breed),
    renderDetailTerm("Availability", formatStatus(listing.availabilityStatus)),
    renderDetailTerm("Terms", listing.termsSummary ?? "Not specified"),
    renderDetailTerm("UELN", listing.ueln ?? "Not provided"),
    renderDetailTerm("Microchip", listing.microchipNumber ?? "Not provided"),
    "    </dl>",
    "    <div class=\"semen-catalog__detail-action\">",
    listing.canCreateOrder && listing.createOrderHref
      ? `      <a class="semen-catalog__button" href="${escapeAttribute(listing.createOrderHref)}">${escapeHtml(listing.orderActionLabel)}</a>`
      : "      <button class=\"semen-catalog__button\" type=\"button\" disabled>Unavailable</button>",
    !listing.canCreateOrder
      ? "      <p>Unavailable listings cannot be ordered.</p>"
      : "",
    "    </div>",
    "  </section>",
    "</main>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {{
 *   eyebrow: string,
 *   title: string,
 *   summary: string,
 *   actionHref: string,
 *   actionLabel: string,
 * }} input
 * @returns {string}
 */
function renderHeader(input) {
  return [
    "  <header class=\"semen-catalog__header\">",
    "    <div>",
    `      <p class="semen-catalog__eyebrow">${escapeHtml(input.eyebrow)}</p>`,
    `      <h1>${escapeHtml(input.title)}</h1>`,
    `      <p>${escapeHtml(input.summary)}</p>`,
    "    </div>",
    `    <a class="semen-catalog__secondary-link" href="${escapeAttribute(input.actionHref)}">${escapeHtml(input.actionLabel)}</a>`,
    "  </header>",
  ].join("\n");
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogListViewModel} viewModel
 * @returns {string}
 */
function renderFilterForm(viewModel) {
  return [
    "  <section class=\"semen-catalog__filters\" aria-labelledby=\"catalog-filters-heading\">",
    "    <h2 id=\"catalog-filters-heading\">Search and filters</h2>",
    `    <form method="get" action="${escapeAttribute(viewModel.navigation.catalogHref)}">`,
    "      <label>",
    "        <span>Stallion</span>",
    `        <input name="stallion" value="${escapeAttribute(viewModel.filters.stallion ?? "")}" placeholder="Search by stallion name" />`,
    "      </label>",
    renderSelect("breed", "Breed", "All breeds", viewModel.filters.breed, viewModel.filterOptions.breeds),
    renderSelect("station", "Station", "All stations", viewModel.filters.station, viewModel.filterOptions.stations),
    renderSelect(
      "availabilityStatus",
      "Availability",
      "All availability",
      viewModel.filters.availabilityStatus,
      viewModel.filterOptions.availabilityStatuses,
    ),
    "      <div class=\"semen-catalog__filter-actions\">",
    "        <button type=\"submit\">Apply filters</button>",
    `        <a href="${escapeAttribute(viewModel.navigation.catalogHref)}">Clear</a>`,
    "      </div>",
    "    </form>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {string} name
 * @param {string} label
 * @param {string} emptyLabel
 * @param {string | null} value
 * @param {readonly import("./semen-catalog.d.ts").SemenCatalogSelectOption[]} options
 * @returns {string}
 */
function renderSelect(name, label, emptyLabel, value, options) {
  return [
    "      <label>",
    `        <span>${escapeHtml(label)}</span>`,
    `        <select name="${escapeAttribute(name)}">`,
    `          <option value="">${escapeHtml(emptyLabel)}</option>`,
    options.map((option) => {
      const selected = option.value === value ? " selected" : "";

      return `          <option value="${escapeAttribute(option.value)}"${selected}>${escapeHtml(option.label)}</option>`;
    }).join("\n"),
    "        </select>",
    "      </label>",
  ].join("\n");
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogListViewModel} viewModel
 * @returns {string}
 */
function renderListings(viewModel) {
  const body = viewModel.listings.length === 0
    ? "    <p class=\"semen-catalog__empty\">No active semen listings match these filters.</p>"
    : [
      "    <div class=\"semen-catalog__grid\">",
      viewModel.listings.map(renderListingCard).join("\n"),
      "    </div>",
    ].join("\n");

  return [
    "  <section class=\"semen-catalog__results\" aria-labelledby=\"catalog-listings-heading\">",
    "    <div class=\"semen-catalog__section-heading\">",
    "      <h2 id=\"catalog-listings-heading\">Active semen listings</h2>",
    `      <span>${viewModel.listings.length} shown</span>`,
    "    </div>",
    body,
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogListingCard} listing
 * @returns {string}
 */
function renderListingCard(listing) {
  return [
    "      <article class=\"semen-catalog__listing\">",
    "        <div class=\"semen-catalog__listing-heading\">",
    listing.detailHref
      ? `          <h3><a href="${escapeAttribute(listing.detailHref)}">${escapeHtml(listing.stallionName)}</a></h3>`
      : `          <h3>${escapeHtml(listing.stallionName)}</h3>`,
    `          <span>${escapeHtml(formatStatus(listing.availabilityStatus))}</span>`,
    "        </div>",
    "        <dl>",
    renderDetailTerm("Breed", listing.breed, 10),
    renderDetailTerm("Station", listing.stationLabel, 10),
    renderDetailTerm("Terms", listing.termsSummary ?? "Not specified", 10),
    "        </dl>",
    "        <div class=\"semen-catalog__listing-actions\">",
    listing.detailHref
      ? `          <a href="${escapeAttribute(listing.detailHref)}">Details</a>`
      : "",
    listing.canCreateOrder && listing.createOrderHref
      ? `          <a class="semen-catalog__button" href="${escapeAttribute(listing.createOrderHref)}">${escapeHtml(listing.orderActionLabel)}</a>`
      : "          <button class=\"semen-catalog__button\" type=\"button\" disabled>Unavailable</button>",
    "        </div>",
    "      </article>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {string} term
 * @param {string} value
 * @param {number} [indent]
 * @returns {string}
 */
function renderDetailTerm(term, value, indent = 6) {
  const space = " ".repeat(indent);

  return [
    `${space}<div>`,
    `${space}  <dt>${escapeHtml(term)}</dt>`,
    `${space}  <dd>${escapeHtml(value)}</dd>`,
    `${space}</div>`,
  ].join("\n");
}

/**
 * @param {import("./semen-catalog.d.ts").SemenCatalogListingCard} left
 * @param {import("./semen-catalog.d.ts").SemenCatalogListingCard} right
 * @returns {number}
 */
function compareListingCards(left, right) {
  return left.stallionName.localeCompare(right.stallionName) ||
    left.stationLabel.localeCompare(right.stationLabel);
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
  if (value == null) {
    return null;
  }

  const normalized = typeof value === "string" ? value.trim() : "";

  return normalized || null;
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
