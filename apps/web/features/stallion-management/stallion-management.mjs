// @ts-check

import {
  STALLION_STATUSES,
  SemenCatalogAuthorizationError,
  SemenCatalogValidationError,
  canManageStationCatalog,
  createStallionEndpoint,
  updateStallionEndpoint,
} from "@coritech/domain/catalog/semen-catalog.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";

export const STALLION_MANAGEMENT_VIEW_STATES = /** @type {const} */ ([
  "LOADING",
  "FORM",
  "CONFIRMATION",
  "ERROR",
]);

export const STALLION_MANAGEMENT_ROUTES = Object.freeze({
  dashboard: "/station-dashboard",
  stallionManagement: "/app/station/stallions",
  listingManagement: "/app/station/listings",
});

export class StallionManagementValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech stallion management input:\n- ${issues.join("\n- ")}`);
    this.name = "StallionManagementValidationError";
    this.issues = issues;
  }
}

export class StallionManagementAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "StallionManagementAuthorizationError";
  }
}

/**
 * @param {import("./stallion-management.d.ts").StallionManagementInput} input
 * @returns {import("./stallion-management.d.ts").StallionManagementFormViewModel}
 */
export function createStallionManagementViewModel(input) {
  const issues = validateStallionManagementInput(input);

  if (issues.length > 0) {
    throw new StallionManagementValidationError(issues);
  }

  const organizationContext = resolveStationOrganizationContext(input);
  const stationOrganizationId = organizationContext.organizationId;
  const searchQuery = normalizeOptionalString(input.searchQuery) ?? "";
  const ownStationStallions = (input.stallions ?? [])
    .filter((stallion) =>
      stallion?.breedingStationOrganizationId === stationOrganizationId &&
      canManageStationCatalog(input.actor, stallion.breedingStationOrganizationId)
    );
  const ownStallions = ownStationStallions
    .filter((stallion) => matchesSearch(stallion, searchQuery))
    .sort(compareStallions);
  const rows = ownStallions.map(toStallionRow);
  const selectedStallionId = normalizeOptionalString(input.selectedStallionId);
  const selectedStallion = selectedStallionId
    ? ownStationStallions.find((stallion) => stallion.id === selectedStallionId)
    : null;

  if (selectedStallionId && !selectedStallion) {
    throw new StallionManagementAuthorizationError(
      "actor may only edit stallions owned by their breeding station organization.",
    );
  }

  return Object.freeze({
    state: "FORM",
    actorUserId: input.actor.userId.trim(),
    organizationContext,
    title: "Stallion management",
    summary: "Create, edit, activate and inactivate station-owned stallion records.",
    mode: selectedStallion ? "EDIT" : "CREATE",
    stallions: Object.freeze(rows),
    selectedStallion: selectedStallion ? toStallionRow(selectedStallion) : null,
    form: normalizeStallionForm(input.form, selectedStallion),
    searchQuery,
    validationIssues: Object.freeze(input.validationIssues ?? []),
    navigation: buildNavigation(),
    statuses: STALLION_STATUSES,
    isEmpty: rows.length === 0,
  });
}

/**
 * @param {import("./stallion-management.d.ts").StallionManagementConfirmationInput} input
 * @returns {import("./stallion-management.d.ts").StallionManagementConfirmationViewModel}
 */
export function createStallionManagementConfirmationViewModel(input) {
  if (!input.stallion) {
    throw new StallionManagementValidationError(["stallion is required."]);
  }

  const isCreate = input.operation === "CREATE";

  return Object.freeze({
    state: "CONFIRMATION",
    title: isCreate ? "Stallion created" : "Stallion updated",
    summary: isCreate
      ? "The station-owned stallion profile is saved and audit logged."
      : "The stallion change is saved and audit logged.",
    stallion: toStallionRow(input.stallion),
    operation: input.operation,
    auditHook: input.auditHook ?? null,
    auditLog: input.auditLog ?? null,
    navigation: buildNavigation(),
  });
}

/**
 * @param {{ organizationName?: string | null }} [input]
 * @returns {import("./stallion-management.d.ts").StallionManagementLoadingViewModel}
 */
export function createStallionManagementLoadingState(input = {}) {
  return Object.freeze({
    state: "LOADING",
    title: "Stallion management",
    message: input.organizationName
      ? `Loading ${input.organizationName} stallions.`
      : "Loading station stallions.",
  });
}

/**
 * @param {unknown} error
 * @returns {import("./stallion-management.d.ts").StallionManagementErrorViewModel}
 */
export function createStallionManagementErrorState(error) {
  return Object.freeze({
    state: "ERROR",
    title: error instanceof StallionManagementAuthorizationError ||
        error instanceof SemenCatalogAuthorizationError
      ? "Stallion management unavailable"
      : "Stallion management could not load",
    message: error instanceof Error
      ? error.message
      : "An unknown stallion management error occurred.",
  });
}

/**
 * @param {import("./stallion-management.d.ts").SaveStallionFromFormInput} input
 * @returns {Promise<import("./stallion-management.d.ts").SaveStallionFromFormResult>}
 */
export async function saveStallionFromForm(input) {
  const form = normalizeStallionForm({
    ...input.form,
    status: input.statusOverride ?? input.form.status,
  });
  const operation = form.stallionId ? "UPDATE" : "CREATE";
  const issues = validateStallionForm(form, operation);

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
      ? await createStallionEndpoint({
        actor: input.actor,
        repository: input.repository,
        auditContext: input.auditContext,
        body: {
          name: form.name,
          breed: form.breed,
          ueln: nullIfEmpty(form.ueln),
          microchipNumber: nullIfEmpty(form.microchipNumber),
          breedingStationOrganizationId: input.organizationId,
          status: form.status,
          changeReason: form.changeReason,
          now: input.now,
        },
      })
      : await updateStallionEndpoint({
        actor: input.actor,
        repository: input.repository,
        auditContext: input.auditContext,
        params: {
          stallionId: form.stallionId,
        },
        body: {
          name: form.name,
          breed: form.breed,
          ueln: nullIfEmpty(form.ueln),
          microchipNumber: nullIfEmpty(form.microchipNumber),
          status: form.status,
          changeReason: form.changeReason,
          now: input.now,
        },
      });

    return Object.freeze({
      ok: true,
      operation,
      form,
      stallion: response.body.stallion,
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
 * @param {import("./stallion-management.d.ts").StallionManagementRenderableViewModel} viewModel
 * @returns {string}
 */
export function renderStallionManagement(viewModel) {
  if (viewModel.state === "LOADING") {
    return `<main><h1>${escapeHtml(viewModel.title)}</h1><p>${escapeHtml(viewModel.message)}</p></main>`;
  }

  if (viewModel.state === "ERROR") {
    return `<main><h1>${escapeHtml(viewModel.title)}</h1><p>${escapeHtml(viewModel.message)}</p></main>`;
  }

  if (viewModel.state === "CONFIRMATION") {
    return `<main><h1>${escapeHtml(viewModel.title)}</h1><p data-audit-action="${escapeAttribute(viewModel.auditHook?.action ?? "")}">${escapeHtml(viewModel.summary)}</p></main>`;
  }

  return [
    "<main>",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.summary)}</p>`,
    "  <table>",
    "    <thead><tr><th>Name</th><th>UELN</th><th>Chip</th><th>Status</th></tr></thead>",
    "    <tbody>",
    ...viewModel.stallions.map((stallion) =>
      `      <tr><td>${escapeHtml(stallion.name)}</td><td>${escapeHtml(stallion.ueln ?? "")}</td><td>${escapeHtml(stallion.microchipNumber ?? "")}</td><td>${escapeHtml(formatStatus(stallion.status))}</td></tr>`
    ),
    "    </tbody>",
    "  </table>",
    "</main>",
  ].join("\n");
}

/**
 * @param {import("./stallion-management.d.ts").StallionManagementInput | undefined} input
 * @returns {string[]}
 */
function validateStallionManagementInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["input is required."];
  }

  if (!input.actor || typeof input.actor.userId !== "string" || !input.actor.userId.trim()) {
    issues.push("actor.userId is required.");
  }

  if (!Array.isArray(input.actor?.roles)) {
    issues.push("actor.roles must be an array.");
  }

  if (input.stallions !== undefined && !Array.isArray(input.stallions)) {
    issues.push("stallions must be an array when provided.");
  }

  return issues;
}

/**
 * @param {import("./stallion-management.d.ts").StallionManagementInput} input
 * @returns {import("./stallion-management.d.ts").StallionManagementOrganizationContext}
 */
function resolveStationOrganizationContext(input) {
  const requestedOrganizationId = normalizeOptionalString(input.organizationId);
  const stationRoles = input.actor.roles.filter((assignment) =>
    assignment.userId === input.actor.userId &&
    assignment.roleCode === "BREEDING_STATION" &&
    isActiveRoleAssignment(assignment)
  );
  const role = requestedOrganizationId
    ? stationRoles.find((assignment) => assignment.organizationId === requestedOrganizationId)
    : stationRoles.length === 1
      ? stationRoles[0]
      : null;

  if (!role) {
    throw new StallionManagementAuthorizationError(
      "stallion management requires an active breeding station role for the selected organization.",
    );
  }

  return Object.freeze({
    organizationId: role.organizationId,
    organizationName: normalizeOptionalString(input.organizationName) ?? role.organizationId,
    roleCode: "BREEDING_STATION",
  });
}

function buildNavigation() {
  return Object.freeze({
    dashboardHref: STALLION_MANAGEMENT_ROUTES.dashboard,
    stallionManagementHref: STALLION_MANAGEMENT_ROUTES.stallionManagement,
    listingManagementHref: STALLION_MANAGEMENT_ROUTES.listingManagement,
  });
}

/**
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").Stallion | import("@coritech/domain/catalog/semen-catalog.d.ts").StallionLike} stallion
 * @returns {import("./stallion-management.d.ts").StallionManagementStallionRow}
 */
function toStallionRow(stallion) {
  const id = normalizeOptionalString(stallion.id) ?? "";

  return Object.freeze({
    id,
    name: stallion.name,
    breed: stallion.breed,
    ueln: normalizeOptionalString(stallion.ueln),
    microchipNumber: normalizeOptionalString(stallion.microchipNumber),
    status: stallion.status,
    editHref: `${STALLION_MANAGEMENT_ROUTES.stallionManagement}?stallionId=${encodeURIComponent(id)}`,
    createListingHref: stallion.status === "ACTIVE"
      ? `${STALLION_MANAGEMENT_ROUTES.listingManagement}?stallionId=${encodeURIComponent(id)}`
      : null,
    canActivate: stallion.status === "INACTIVE",
    canDeactivate: stallion.status === "ACTIVE",
  });
}

/**
 * @param {import("./stallion-management.d.ts").StallionManagementFormInput | undefined} form
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").StallionLike | null} [selectedStallion]
 * @returns {import("./stallion-management.d.ts").StallionManagementFormState}
 */
function normalizeStallionForm(form, selectedStallion = null) {
  const hasForm = Boolean(form);

  return Object.freeze({
    stallionId: hasForm && hasOwn(form, "stallionId")
      ? normalizeRequiredString(form?.stallionId)
      : selectedStallion?.id ?? "",
    name: hasForm && hasOwn(form, "name")
      ? normalizeRequiredString(form?.name)
      : selectedStallion?.name ?? "",
    breed: hasForm && hasOwn(form, "breed")
      ? normalizeRequiredString(form?.breed)
      : selectedStallion?.breed ?? "",
    ueln: hasForm && hasOwn(form, "ueln")
      ? normalizeRequiredString(form?.ueln)
      : selectedStallion?.ueln ?? "",
    microchipNumber: hasForm && hasOwn(form, "microchipNumber")
      ? normalizeRequiredString(form?.microchipNumber)
      : selectedStallion?.microchipNumber ?? "",
    status: hasForm && hasOwn(form, "status")
      ? normalizeRequiredString(form?.status)
      : selectedStallion?.status ?? "ACTIVE",
    changeReason: hasForm && hasOwn(form, "changeReason")
      ? normalizeRequiredString(form?.changeReason)
      : "",
  });
}

/**
 * @param {import("./stallion-management.d.ts").StallionManagementFormState} form
 * @param {import("./stallion-management.d.ts").StallionManagementOperation} operation
 * @returns {string[]}
 */
function validateStallionForm(form, operation) {
  const issues = [];

  if (operation === "UPDATE" && !form.stallionId) {
    issues.push("stallionId is required.");
  }

  if (!form.name) {
    issues.push("name is required.");
  }

  if (!form.breed) {
    issues.push("breed is required.");
  }

  if (!STALLION_STATUSES.includes(
    /** @type {import("@coritech/domain/catalog/semen-catalog.d.ts").StallionStatus} */ (
      form.status
    ),
  )) {
    issues.push(`status must be one of: ${STALLION_STATUSES.join(", ")}.`);
  }

  if (!form.changeReason) {
    issues.push("changeReason is required for the stallion audit trail.");
  }

  return issues;
}

/**
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").StallionLike} stallion
 * @param {string} searchQuery
 * @returns {boolean}
 */
function matchesSearch(stallion, searchQuery) {
  if (!searchQuery) {
    return true;
  }

  return containsCaseInsensitive(stallion.name, searchQuery) ||
    containsCaseInsensitive(stallion.ueln ?? "", searchQuery) ||
    containsCaseInsensitive(stallion.microchipNumber ?? "", searchQuery);
}

/**
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").StallionLike} left
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").StallionLike} right
 * @returns {number}
 */
function compareStallions(left, right) {
  return compareStatus(left.status, right.status) ||
    left.name.localeCompare(right.name) ||
    left.breed.localeCompare(right.breed);
}

function compareStatus(left, right) {
  if (left === right) {
    return 0;
  }

  return left === "ACTIVE" ? -1 : 1;
}

function extractIssues(error) {
  if (
    error instanceof SemenCatalogValidationError ||
    error instanceof StallionManagementValidationError
  ) {
    return error.issues;
  }

  if (error instanceof Error) {
    return [error.message];
  }

  return ["An unknown stallion management error occurred."];
}

function normalizeRequiredString(value) {
  return typeof value === "string" ? value.trim() : "";
}

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

function nullIfEmpty(value) {
  return normalizeOptionalString(value);
}

function hasOwn(source, key) {
  return Boolean(source) && Object.prototype.hasOwnProperty.call(source, key);
}

function containsCaseInsensitive(value, query) {
  return value.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

function formatStatus(value) {
  return String(value).toLowerCase().replace(/_/g, " ");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/'/g, "&#039;");
}
