// @ts-check

import {
  canViewSemenListing,
  isSemenListingOrderable,
} from "@coritech/domain/catalog/semen-catalog.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import {
  SemenOrderValidationError,
  createOrderService,
} from "@coritech/domain/orders/semen-order.mjs";

export const SEMEN_ORDER_CREATION_VIEW_STATES = /** @type {const} */ ([
  "LOADING",
  "FORM",
  "CONFIRMATION",
  "ERROR",
]);

export const SEMEN_ORDER_CREATION_ACTIONS = /** @type {const} */ ([
  "draft",
  "submit",
  "cancel",
]);

export const SEMEN_ORDER_CREATION_ROUTES = Object.freeze({
  catalog: "/app/catalog",
  dashboard: "/breeder-dashboard",
  newOrder: "/app/orders/new",
  orderDetail: "/app/orders",
});

const REQUIRED_SUBMIT_FIELDS = Object.freeze([
  "requestedDeliveryDate",
  "shippingContactName",
  "shippingContactPhone",
  "shippingAddressLine1",
  "shippingCity",
  "shippingPostalCode",
  "shippingCountry",
]);

export class SemenOrderCreationValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech semen order creation input:\n- ${issues.join("\n- ")}`);
    this.name = "SemenOrderCreationValidationError";
    this.issues = issues;
  }
}

export class SemenOrderCreationAuthorizationError extends Error {
  /**
   * @param {string} message
   */
  constructor(message) {
    super(message);
    this.name = "SemenOrderCreationAuthorizationError";
  }
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationInput} input
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationFormViewModel}
 */
export function createSemenOrderCreationViewModel(input) {
  const issues = validateCreationInput(input);

  if (issues.length > 0) {
    throw new SemenOrderCreationValidationError(issues);
  }

  const organizationContext = resolveBreederOrganizationContext(input);
  const draftOrder = normalizeDraftOrderForEditing(input.draftOrder, organizationContext);
  const initialForm = draftOrder ? orderToFormInput(draftOrder) : {
    semenListingId: input.selectedListingId,
  };
  const form = normalizeOrderCreationForm({
    ...initialForm,
    ...(input.form ?? {}),
  });
  const selectableListings = buildSelectableListings(input, organizationContext.organizationId);
  const selectedListing = form.semenListingId
    ? selectableListings.find((listing) => listing.id === form.semenListingId) ?? null
    : null;

  if (form.semenListingId && !selectedListing) {
    throw new SemenOrderCreationValidationError([
      "semenListingId must reference an active orderable listing visible to this breeder.",
    ]);
  }

  return Object.freeze({
    state: "FORM",
    actorUserId: input.actor.userId.trim(),
    organizationContext,
    title: draftOrder ? "Edit draft order" : "Create semen order",
    summary: draftOrder
      ? "Update the saved draft, submit it to the station or cancel it before station review."
      : "Review the selected listing, add delivery details and save a draft or submit to the station.",
    draftOrder: draftOrder
      ? Object.freeze({
        id: /** @type {string} */ (draftOrder.id),
        orderNumber: draftOrder.orderNumber,
        status: draftOrder.status,
      })
      : null,
    selectableListings: Object.freeze(selectableListings),
    selectedListing,
    form,
    validationIssues: Object.freeze(input.validationIssues ?? []),
    navigation: buildNavigation(),
    requiredSubmitFields: REQUIRED_SUBMIT_FIELDS,
  });
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationConfirmationInput} input
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationConfirmationViewModel}
 */
export function createSemenOrderCreationConfirmationViewModel(input) {
  if (!input.order) {
    throw new SemenOrderCreationValidationError(["order is required."]);
  }

  const orderId = normalizeOptionalString(input.order.id);

  return Object.freeze({
    state: "CONFIRMATION",
    title: confirmationTitle(input.order.status),
    summary: confirmationSummary(input.order.status),
    order: Object.freeze({
      id: orderId,
      orderNumber: input.order.orderNumber,
      status: input.order.status,
      requestedDeliveryDate: input.order.requestedDeliveryDate ?? null,
      shippingCity: input.order.shippingCity ?? null,
      shippingCountry: input.order.shippingCountry ?? null,
      detailHref: orderId
        ? `${SEMEN_ORDER_CREATION_ROUTES.orderDetail}/${encodeURIComponent(orderId)}`
        : null,
    }),
    statusHistory: Object.freeze(input.statusHistory ?? []),
    auditHook: input.auditHook ?? null,
    proofHook: input.proofHook ?? null,
    navigation: buildNavigation(),
  });
}

/**
 * @param {{ label?: string | null }} [input]
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationLoadingViewModel}
 */
export function createSemenOrderCreationLoadingState(input = {}) {
  const label = normalizeOptionalString(input.label) ?? "semen order";

  return Object.freeze({
    state: "LOADING",
    title: "Create semen order",
    message: `Loading ${label}.`,
  });
}

/**
 * @param {unknown} error
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationErrorViewModel}
 */
export function createSemenOrderCreationErrorState(error) {
  return Object.freeze({
    state: "ERROR",
    title: error instanceof SemenOrderCreationAuthorizationError
      ? "Order creation unavailable"
      : "Order creation could not load",
    message: error instanceof Error ? error.message : "An unknown order creation error occurred.",
  });
}

/**
 * @param {import("./semen-order-creation.d.ts").CreateSemenOrderFromFormInput} input
 * @returns {Promise<import("./semen-order-creation.d.ts").CreateSemenOrderFromFormResult>}
 */
export async function createSemenOrderFromForm(input) {
  const action = normalizeAction(input.action);
  const form = normalizeOrderCreationForm(input.form);
  const issues = validateOrderCreationForm(form, action);

  if (issues.length > 0) {
    return Object.freeze({
      ok: false,
      action,
      form,
      issues: Object.freeze(issues),
    });
  }

  try {
    const service = createOrderService({
      repository: input.repository,
      auditContext: input.auditContext,
    });
    const orderId = normalizeOptionalString(form.orderId);

    if (action === "cancel") {
      const cancelled = await service.transitionOrder({
        actor: input.actor,
        orderId: requireDraftOrderId(orderId),
        commandName: "TRANSITION_ORDER_STATUS",
        toStatus: "CANCELLED",
        body: {
          reason: "Draft cancelled from breeder order creation flow.",
          now: input.now,
        },
      });

      return Object.freeze({
        ok: true,
        action,
        form,
        order: cancelled.order,
        statusHistory: Object.freeze(compactStatusHistory([cancelled.statusHistory])),
        auditHook: cancelled.auditHook ?? null,
        auditLog: cancelled.auditLog ?? null,
        proofHook: cancelled.proofHook ?? null,
        idempotent: cancelled.idempotent,
      });
    }

    if (orderId) {
      if (action === "draft") {
        const updated = await service.updateDraftOrder({
          actor: input.actor,
          orderId,
          body: {
            ...formToServiceBody(form),
            reason: "Draft updated from breeder order creation flow.",
            now: input.now,
          },
        });

        return Object.freeze({
          ok: true,
          action,
          form,
          order: updated.order,
          statusHistory: Object.freeze([]),
          auditHook: updated.auditHook ?? null,
          auditLog: updated.auditLog ?? null,
          proofHook: updated.proofHook ?? null,
          idempotent: updated.idempotent,
        });
      }

      const existingOrder = await input.repository.findSemenOrderById(orderId);
      const updated = existingOrder?.status === "DRAFT"
        ? await service.updateDraftOrder({
          actor: input.actor,
          orderId,
          body: {
            ...formToServiceBody(form),
            reason: "Draft updated before breeder submission.",
            now: input.now,
          },
        })
        : null;
      const submitted = await service.submitOrder({
        actor: input.actor,
        orderId,
        body: {
          reason: "Submitted from breeder order creation flow.",
          now: input.now,
        },
      });

      return Object.freeze({
        ok: true,
        action,
        form,
        order: submitted.order,
        statusHistory: Object.freeze(compactStatusHistory([submitted.statusHistory])),
        auditHook: submitted.auditHook ?? null,
        auditLog: submitted.auditLog ?? null,
        proofHook: submitted.proofHook ?? null,
        draftAuditHook: updated?.auditHook ?? null,
        draftProofHook: updated?.proofHook ?? null,
        idempotent: submitted.idempotent,
      });
    }

    const created = await service.createDraftOrder({
      actor: input.actor,
      body: {
        semenListingId: form.semenListingId,
        breederOrganizationId: input.breederOrganizationId,
        ...formToServiceBody(form),
        reason: action === "submit"
          ? "Draft created from breeder order creation flow."
          : "Draft saved from breeder order creation flow.",
        now: input.now,
      },
    });

    if (action === "draft") {
      return Object.freeze({
        ok: true,
        action,
        form,
        order: created.order,
        statusHistory: Object.freeze(compactStatusHistory([created.statusHistory])),
        auditHook: created.auditHook ?? null,
        auditLog: created.auditLog ?? null,
        proofHook: created.proofHook ?? null,
        idempotent: created.idempotent,
      });
    }

    const submitted = await service.submitOrder({
      actor: input.actor,
      orderId: requireCreatedOrderId(created.order),
      body: {
        reason: "Submitted from breeder order creation flow.",
        now: input.now,
      },
    });

    return Object.freeze({
      ok: true,
      action,
      form,
      order: submitted.order,
      statusHistory: Object.freeze(compactStatusHistory([
        created.statusHistory,
        submitted.statusHistory,
      ])),
      auditHook: submitted.auditHook ?? null,
      auditLog: submitted.auditLog ?? null,
      proofHook: submitted.proofHook ?? null,
      draftAuditHook: created.auditHook ?? null,
      draftProofHook: created.proofHook ?? null,
      idempotent: submitted.idempotent,
    });
  } catch (error) {
    return Object.freeze({
      ok: false,
      action,
      form,
      issues: Object.freeze(extractIssues(error)),
    });
  }
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationRenderableViewModel} viewModel
 * @returns {string}
 */
export function renderSemenOrderCreation(viewModel) {
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
 * @param {import("./semen-order-creation.d.ts").InMemorySemenOrderRepositoryInput} input
 * @returns {import("./semen-order-creation.d.ts").InMemorySemenOrderRepository}
 */
export function createInMemorySemenOrderRepository(input) {
  const listingStore = new Map();
  const orderStore = new Map();
  const historyStore = new Map();
  const auditLogStore = new Map();
  let orderSequence = input.orderSequenceStart ?? 1;
  let historySequence = input.historySequenceStart ?? 1;
  let auditLogSequence = input.auditLogSequenceStart ?? 1;
  let orderNumberSequence = input.orderNumberSequenceStart ?? 1;

  for (const record of input.listingRecords ?? []) {
    if (record?.listing?.id) {
      listingStore.set(record.listing.id, record.listing);
    }
  }

  for (const order of input.orders ?? []) {
    if (order?.id) {
      orderStore.set(order.id, normalizePersistedOrder(order));
    }
  }

  for (const history of input.statusHistory ?? []) {
    const orderId = normalizeOptionalString(history.semenOrderId);

    if (orderId) {
      const orderHistory = historyStore.get(orderId) ?? [];
      orderHistory.push(history);
      historyStore.set(orderId, orderHistory);
    }
  }

  return {
    async findSemenListingById(listingId) {
      return listingStore.get(listingId) ?? null;
    },
    async nextSemenOrderNumberSequence() {
      return orderNumberSequence++;
    },
    async createSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = {
        ...normalizePersistedOrder(order),
        id: order.id ?? `demo-order-${orderSequence++}`,
      };
      const persistedHistory = {
        ...statusHistory,
        id: statusHistory.id ?? `demo-history-${historySequence++}`,
        semenOrderId: persistedOrder.id,
      };

      orderStore.set(persistedOrder.id, persistedOrder);
      historyStore.set(persistedOrder.id, [persistedHistory]);

      return Object.freeze({
        order: Object.freeze(persistedOrder),
        statusHistory: Object.freeze(persistedHistory),
      });
    },
    async updateSemenOrderWithStatusHistory(order, statusHistory) {
      const persistedOrder = normalizePersistedOrder(order);
      const persistedHistory = {
        ...statusHistory,
        id: statusHistory.id ?? `demo-history-${historySequence++}`,
        semenOrderId: persistedOrder.id,
      };
      const orderHistory = historyStore.get(persistedOrder.id) ?? [];

      orderStore.set(persistedOrder.id, persistedOrder);
      orderHistory.push(persistedHistory);
      historyStore.set(persistedOrder.id, orderHistory);

      return Object.freeze({
        order: Object.freeze(persistedOrder),
        statusHistory: Object.freeze(persistedHistory),
      });
    },
    async updateDraftSemenOrder(order) {
      const persistedOrder = Object.freeze(normalizePersistedOrder(order));

      orderStore.set(/** @type {string} */ (persistedOrder.id), persistedOrder);

      return persistedOrder;
    },
    async findSemenOrderById(orderId) {
      return orderStore.get(orderId) ?? null;
    },
    async listOrderStatusHistory(orderId) {
      return Object.freeze([...(historyStore.get(orderId) ?? [])]);
    },
    async createAuditLog(auditLog) {
      const persistedAuditLog = Object.freeze({
        ...auditLog,
        id: auditLog.id ?? `demo-audit-log-${auditLogSequence++}`,
      });
      const logs = auditLogStore.get(persistedAuditLog.objectId) ?? [];

      logs.push(persistedAuditLog);
      auditLogStore.set(persistedAuditLog.objectId, logs);

      return persistedAuditLog;
    },
    async listSemenOrders() {
      return Object.freeze([...orderStore.values()].sort(compareUpdatedDescending));
    },
    async listAllOrderStatusHistory() {
      return Object.freeze(
        [...historyStore.values()]
          .flat()
          .sort((left, right) => compareIsoAscending(left.changedAt, right.changedAt)),
      );
    },
    async listAuditLogs() {
      return Object.freeze([...auditLogStore.values()].flat());
    },
  };
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationInput | undefined} input
 * @returns {string[]}
 */
function validateCreationInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["order creation input is required."];
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
  validateOptionalArray(input.stationOrganizations, "stationOrganizations", issues);
  validateOptionalArray(input.validationIssues, "validationIssues", issues);

  if (
    input.draftOrder !== undefined &&
    input.draftOrder !== null &&
    typeof input.draftOrder !== "object"
  ) {
    issues.push("draftOrder must be an object when provided.");
  }

  return issues;
}

/**
 * @param {{
 *   actor: import("./semen-order-creation.d.ts").SemenOrderCreationActorContext;
 *   organizationId?: string | null;
 *   organizationName?: string | null;
 * }} input
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationOrganizationContext}
 */
function resolveBreederOrganizationContext(input) {
  const activeBreederRoles = input.actor.roles.filter((assignment) =>
    assignment.roleCode === "BREEDER" &&
    assignment.userId === input.actor.userId &&
    isActiveRoleAssignment(assignment)
  );

  if (activeBreederRoles.length === 0) {
    throw new SemenOrderCreationAuthorizationError(
      "actor must have an active BREEDER role before creating a semen order.",
    );
  }

  const requestedOrganizationId = normalizeOptionalString(input.organizationId);

  if (!requestedOrganizationId && activeBreederRoles.length > 1) {
    throw new SemenOrderCreationValidationError([
      "organizationId is required when actor has multiple active BREEDER roles.",
    ]);
  }

  const role = requestedOrganizationId
    ? activeBreederRoles.find((assignment) =>
      assignment.organizationId === requestedOrganizationId
    )
    : activeBreederRoles[0];

  if (!role) {
    throw new SemenOrderCreationAuthorizationError(
      "actor may only create semen orders for their own breeder organization.",
    );
  }

  return Object.freeze({
    organizationId: role.organizationId,
    organizationName: normalizeOptionalString(input.organizationName) ?? role.organizationId,
    roleCode: "BREEDER",
  });
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderLike | null | undefined} draftOrder
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationOrganizationContext} organizationContext
 * @returns {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderLike | null}
 */
function normalizeDraftOrderForEditing(draftOrder, organizationContext) {
  if (!draftOrder) {
    return null;
  }

  if (draftOrder.status !== "DRAFT") {
    throw new SemenOrderCreationValidationError([
      "only DRAFT semen orders can be edited in the draft order flow.",
    ]);
  }

  if (draftOrder.breederOrganizationId !== organizationContext.organizationId) {
    throw new SemenOrderCreationAuthorizationError(
      "actor may only edit draft orders for their own breeder organization.",
    );
  }

  if (!normalizeOptionalString(draftOrder.id)) {
    throw new SemenOrderCreationValidationError([
      "draftOrder.id is required before editing a saved draft.",
    ]);
  }

  return draftOrder;
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderLike} order
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationFormInput}
 */
function orderToFormInput(order) {
  return {
    orderId: normalizeOptionalString(order.id),
    semenListingId: order.semenListingId,
    requestedDeliveryDate: normalizeOptionalString(order.requestedDeliveryDate),
    shippingContactName: normalizeOptionalString(order.shippingContactName),
    shippingContactPhone: normalizeOptionalString(order.shippingContactPhone),
    shippingAddressLine1: normalizeOptionalString(order.shippingAddressLine1),
    shippingAddressLine2: normalizeOptionalString(order.shippingAddressLine2),
    shippingCity: normalizeOptionalString(order.shippingCity),
    shippingRegion: normalizeOptionalString(order.shippingRegion),
    shippingPostalCode: normalizeOptionalString(order.shippingPostalCode),
    shippingCountry: normalizeOptionalString(order.shippingCountry),
    specialInstructions: normalizeOptionalString(order.specialInstructions),
  };
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationInput} input
 * @param {string} breederOrganizationId
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationListingOption[]}
 */
function buildSelectableListings(input, breederOrganizationId) {
  const stationNameById = buildStationNameMap(input.stationOrganizations ?? []);

  return (input.listingRecords ?? [])
    .filter((record) =>
      record?.listing &&
      canViewSemenListing(input.actor, record.listing) &&
      isSemenListingOrderable(record.listing)
    )
    .map((record) => toListingOption(record, stationNameById, breederOrganizationId))
    .sort((left, right) =>
      left.stallionName.localeCompare(right.stallionName) ||
      left.stationLabel.localeCompare(right.stationLabel)
    );
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenListingRecordLike} record
 * @param {ReadonlyMap<string, string>} stationNameById
 * @param {string} breederOrganizationId
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationListingOption}
 */
function toListingOption(record, stationNameById, breederOrganizationId) {
  const listing = record.listing;
  const stationName = stationNameById.get(listing.breedingStationOrganizationId) ??
    listing.breedingStationOrganizationId;
  const listingId = /** @type {string} */ (listing.id);

  return Object.freeze({
    id: listingId,
    stallionId: record.stallion.id,
    stallionName: record.stallion.name,
    breed: record.stallion.breed,
    ueln: normalizeOptionalString(record.stallion.ueln),
    microchipNumber: normalizeOptionalString(record.stallion.microchipNumber),
    breedingStationOrganizationId: listing.breedingStationOrganizationId,
    breederOrganizationId,
    availabilityStatus: listing.availabilityStatus,
    termsSummary: normalizeOptionalString(listing.termsSummary),
    stationName,
    stationLabel: stationName === listing.breedingStationOrganizationId
      ? stationName
      : `${stationName} (${listing.breedingStationOrganizationId})`,
    catalogDetailHref: `${SEMEN_ORDER_CREATION_ROUTES.catalog}/${encodeURIComponent(listingId)}`,
  });
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationFormInput | undefined} form
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationFormState}
 */
function normalizeOrderCreationForm(form) {
  return Object.freeze({
    orderId: normalizeOptionalString(form?.orderId) ?? "",
    semenListingId: normalizeOptionalString(form?.semenListingId) ?? "",
    requestedDeliveryDate: normalizeOptionalString(form?.requestedDeliveryDate) ?? "",
    shippingContactName: normalizeOptionalString(form?.shippingContactName) ?? "",
    shippingContactPhone: normalizeOptionalString(form?.shippingContactPhone) ?? "",
    shippingAddressLine1: normalizeOptionalString(form?.shippingAddressLine1) ?? "",
    shippingAddressLine2: normalizeOptionalString(form?.shippingAddressLine2) ?? "",
    shippingCity: normalizeOptionalString(form?.shippingCity) ?? "",
    shippingRegion: normalizeOptionalString(form?.shippingRegion) ?? "",
    shippingPostalCode: normalizeOptionalString(form?.shippingPostalCode) ?? "",
    shippingCountry: normalizeOptionalString(form?.shippingCountry) ?? "",
    specialInstructions: normalizeOptionalString(form?.specialInstructions) ?? "",
  });
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationFormState} form
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationAction} action
 * @returns {string[]}
 */
function validateOrderCreationForm(form, action) {
  const issues = [];

  validateOptionalNonBlankString(form.orderId, "orderId", issues);

  if (action === "cancel" && !form.orderId) {
    issues.push("orderId is required before canceling a draft order.");
  }

  if (!form.semenListingId) {
    issues.push("semenListingId is required.");
  }

  validateOptionalDateOnly(form.requestedDeliveryDate, "requestedDeliveryDate", issues);
  validateOptionalNonBlankString(form.shippingContactName, "shippingContactName", issues);
  validateOptionalNonBlankString(form.shippingContactPhone, "shippingContactPhone", issues);
  validateOptionalNonBlankString(form.shippingAddressLine1, "shippingAddressLine1", issues);
  validateOptionalNonBlankString(form.shippingAddressLine2, "shippingAddressLine2", issues);
  validateOptionalNonBlankString(form.shippingCity, "shippingCity", issues);
  validateOptionalNonBlankString(form.shippingRegion, "shippingRegion", issues);
  validateOptionalNonBlankString(form.shippingPostalCode, "shippingPostalCode", issues);
  validateOptionalNonBlankString(form.shippingCountry, "shippingCountry", issues);
  validateOptionalNonBlankString(form.specialInstructions, "specialInstructions", issues);

  if (action === "submit") {
    for (const fieldName of REQUIRED_SUBMIT_FIELDS) {
      if (!form[fieldName]) {
        issues.push(`${fieldName} is required before submitting semen order.`);
      }
    }
  }

  return issues;
}

/**
 * @param {unknown} action
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationAction}
 */
function normalizeAction(action) {
  if (action === "submit") {
    return "submit";
  }

  if (action === "cancel") {
    return "cancel";
  }

  return "draft";
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderStatus} status
 * @returns {string}
 */
function confirmationTitle(status) {
  if (status === "SUBMITTED") {
    return "Order submitted";
  }

  if (status === "CANCELLED") {
    return "Draft cancelled";
  }

  return "Draft saved";
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderStatus} status
 * @returns {string}
 */
function confirmationSummary(status) {
  if (status === "SUBMITTED") {
    return "The breeding station can now review this semen order.";
  }

  if (status === "CANCELLED") {
    return "The draft is closed and no longer available for submission.";
  }

  return "The draft is saved for breeder review before submission.";
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationFormState} form
 * @returns {Partial<import("@coritech/domain/orders/semen-order.d.ts").CreateDraftSemenOrderInputBody>}
 */
function formToServiceBody(form) {
  return {
    requestedDeliveryDate: nullIfEmpty(form.requestedDeliveryDate),
    shippingContactName: nullIfEmpty(form.shippingContactName),
    shippingContactPhone: nullIfEmpty(form.shippingContactPhone),
    shippingAddressLine1: nullIfEmpty(form.shippingAddressLine1),
    shippingAddressLine2: nullIfEmpty(form.shippingAddressLine2),
    shippingCity: nullIfEmpty(form.shippingCity),
    shippingRegion: nullIfEmpty(form.shippingRegion),
    shippingPostalCode: nullIfEmpty(form.shippingPostalCode),
    shippingCountry: nullIfEmpty(form.shippingCountry),
    specialInstructions: nullIfEmpty(form.specialInstructions),
  };
}

/**
 * @param {string | null} orderId
 * @returns {string}
 */
function requireDraftOrderId(orderId) {
  if (!orderId) {
    throw new SemenOrderValidationError([
      "orderId is required before canceling a draft order.",
    ]);
  }

  return orderId;
}

/**
 * @param {(import("@coritech/domain/orders/semen-order.d.ts").OrderStatusHistory | null)[]} statusHistory
 * @returns {import("@coritech/domain/orders/semen-order.d.ts").OrderStatusHistory[]}
 */
function compactStatusHistory(statusHistory) {
  return statusHistory.filter(Boolean);
}

/**
 * @returns {import("./semen-order-creation.d.ts").SemenOrderCreationNavigation}
 */
function buildNavigation() {
  return Object.freeze({
    catalogHref: SEMEN_ORDER_CREATION_ROUTES.catalog,
    dashboardHref: SEMEN_ORDER_CREATION_ROUTES.dashboard,
    newOrderHref: SEMEN_ORDER_CREATION_ROUTES.newOrder,
  });
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationLoadingViewModel} viewModel
 * @returns {string}
 */
function renderLoadingState(viewModel) {
  return [
    "<section class=\"semen-order-creation semen-order-creation--loading\" aria-busy=\"true\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationErrorViewModel} viewModel
 * @returns {string}
 */
function renderErrorState(viewModel) {
  return [
    "<section class=\"semen-order-creation semen-order-creation--error\" role=\"alert\">",
    `  <h1>${escapeHtml(viewModel.title)}</h1>`,
    `  <p>${escapeHtml(viewModel.message)}</p>`,
    "</section>",
  ].join("\n");
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationFormViewModel} viewModel
 * @returns {string}
 */
function renderForm(viewModel) {
  return [
    `<main class="semen-order-creation" data-organization-id="${escapeAttribute(viewModel.organizationContext.organizationId)}">`,
    renderHeader(viewModel),
    renderListingSelector(viewModel),
    viewModel.selectedListing ? renderSelectedListing(viewModel.selectedListing) : "",
    renderValidationIssues(viewModel.validationIssues),
    renderCreationForm(viewModel),
    "</main>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationConfirmationViewModel} viewModel
 * @returns {string}
 */
function renderConfirmation(viewModel) {
  return [
    "<main class=\"semen-order-creation semen-order-creation--confirmation\">",
    "  <section class=\"semen-order-creation__confirmation\" aria-labelledby=\"order-confirmation-heading\">",
    `    <h1 id="order-confirmation-heading">${escapeHtml(viewModel.title)}</h1>`,
    `    <p>${escapeHtml(viewModel.summary)}</p>`,
    "    <dl>",
    renderDetailTerm("Order number", viewModel.order.orderNumber, 6),
    renderDetailTerm("Status", formatStatus(viewModel.order.status), 6),
    renderDetailTerm("Requested delivery", viewModel.order.requestedDeliveryDate ?? "Not set", 6),
    "    </dl>",
    "    <div class=\"semen-order-creation__confirmation-actions\">",
    `      <a href="${escapeAttribute(viewModel.navigation.dashboardHref)}">Dashboard</a>`,
    viewModel.order.detailHref
      ? `      <a href="${escapeAttribute(viewModel.order.detailHref)}">Order detail</a>`
      : "",
    "    </div>",
    "  </section>",
    "</main>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationFormViewModel} viewModel
 * @returns {string}
 */
function renderHeader(viewModel) {
  return [
    "  <header class=\"semen-order-creation__header\">",
    "    <div>",
    "      <p class=\"semen-order-creation__eyebrow\">Breeder order flow</p>",
    `      <h1>${escapeHtml(viewModel.title)}</h1>`,
    `      <p>${escapeHtml(viewModel.summary)}</p>`,
    "    </div>",
    `    <a href="${escapeAttribute(viewModel.navigation.dashboardHref)}">Dashboard</a>`,
    "  </header>",
  ].join("\n");
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationFormViewModel} viewModel
 * @returns {string}
 */
function renderListingSelector(viewModel) {
  const disabled = viewModel.draftOrder ? " disabled" : "";

  return [
    "  <section class=\"semen-order-creation__section\" aria-labelledby=\"order-listing-selector-heading\">",
    "    <h2 id=\"order-listing-selector-heading\">Listing</h2>",
    `    <form method="get" action="${escapeAttribute(viewModel.navigation.newOrderHref)}">`,
    viewModel.draftOrder?.id
      ? `      <input type="hidden" name="draftOrderId" value="${escapeAttribute(viewModel.draftOrder.id)}" />`
      : "",
    "      <label>",
    "        <span>Select listing</span>",
    `        <select name="semenListingId"${disabled}>`,
    "          <option value=\"\">Choose a listing</option>",
    viewModel.selectableListings.map((listing) => {
      const selected = listing.id === viewModel.form.semenListingId ? " selected" : "";

      return `          <option value="${escapeAttribute(listing.id)}"${selected}>${escapeHtml(`${listing.stallionName} - ${listing.stationLabel}`)}</option>`;
    }).join("\n"),
    "        </select>",
    "      </label>",
    `      <button type="submit"${disabled}>Review listing</button>`,
    "    </form>",
    "  </section>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationListingOption} listing
 * @returns {string}
 */
function renderSelectedListing(listing) {
  return [
    "  <section class=\"semen-order-creation__section\" aria-labelledby=\"order-listing-review-heading\">",
    "    <h2 id=\"order-listing-review-heading\">Review stallion and station</h2>",
    "    <dl class=\"semen-order-creation__details\">",
    renderDetailTerm("Stallion", listing.stallionName),
    renderDetailTerm("Breed", listing.breed),
    renderDetailTerm("Breeding station", listing.stationLabel),
    renderDetailTerm("Availability", formatStatus(listing.availabilityStatus)),
    renderDetailTerm("Terms", listing.termsSummary ?? "Not specified"),
    "    </dl>",
    "  </section>",
  ].join("\n");
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
    "  <section class=\"semen-order-creation__alert\" role=\"alert\">",
    "    <h2>Check order details</h2>",
    "    <ul>",
    issues.map((issue) => `      <li>${escapeHtml(issue)}</li>`).join("\n"),
    "    </ul>",
    "  </section>",
  ].join("\n");
}

/**
 * @param {import("./semen-order-creation.d.ts").SemenOrderCreationFormViewModel} viewModel
 * @returns {string}
 */
function renderCreationForm(viewModel) {
  const disabled = viewModel.selectedListing ? "" : " disabled";
  const cancelButton = viewModel.draftOrder
    ? `        <button type="submit" name="intent" value="cancel" formnovalidate${disabled}>Cancel draft</button>`
    : "";

  return [
    "  <section class=\"semen-order-creation__section\" aria-labelledby=\"order-details-heading\">",
    "    <h2 id=\"order-details-heading\">Delivery and shipping</h2>",
    viewModel.draftOrder
      ? `    <p>Draft status: ${escapeHtml(formatStatus(viewModel.draftOrder.status))}</p>`
      : "",
    `    <form method="post" action="${escapeAttribute(viewModel.navigation.newOrderHref)}">`,
    `      <input type="hidden" name="orderId" value="${escapeAttribute(viewModel.form.orderId)}" />`,
    `      <input type="hidden" name="semenListingId" value="${escapeAttribute(viewModel.form.semenListingId)}" />`,
    renderInput("requestedDeliveryDate", "Requested delivery date", "date", viewModel.form.requestedDeliveryDate, true),
    renderInput("shippingContactName", "Shipping contact", "text", viewModel.form.shippingContactName, true),
    renderInput("shippingContactPhone", "Contact phone", "tel", viewModel.form.shippingContactPhone, true),
    renderInput("shippingAddressLine1", "Address line 1", "text", viewModel.form.shippingAddressLine1, true),
    renderInput("shippingAddressLine2", "Address line 2", "text", viewModel.form.shippingAddressLine2, false),
    renderInput("shippingCity", "City", "text", viewModel.form.shippingCity, true),
    renderInput("shippingRegion", "Region", "text", viewModel.form.shippingRegion, false),
    renderInput("shippingPostalCode", "Postal code", "text", viewModel.form.shippingPostalCode, true),
    renderInput("shippingCountry", "Country", "text", viewModel.form.shippingCountry, true),
    "      <label class=\"semen-order-creation__wide\">",
    "        <span>Special instructions</span>",
    `        <textarea name="specialInstructions">${escapeHtml(viewModel.form.specialInstructions)}</textarea>`,
    "      </label>",
    "      <div class=\"semen-order-creation__actions\">",
    `        <button type="submit" name="intent" value="draft" formnovalidate${disabled}>Save draft</button>`,
    `        <button type="submit" name="intent" value="submit"${disabled}>Submit order</button>`,
    cancelButton,
    "      </div>",
    "    </form>",
    "  </section>",
  ].filter(Boolean).join("\n");
}

/**
 * @param {string} name
 * @param {string} label
 * @param {string} type
 * @param {string} value
 * @param {boolean} required
 * @returns {string}
 */
function renderInput(name, label, type, value, required) {
  return [
    "      <label>",
    `        <span>${escapeHtml(label)}</span>`,
    `        <input name="${escapeAttribute(name)}" type="${escapeAttribute(type)}" value="${escapeAttribute(value)}"${required ? " required" : ""} />`,
    "      </label>",
  ].join("\n");
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
 * @param {import("@coritech/domain/catalog/semen-catalog.d.ts").SemenCatalogStationOrganization[] | import("./semen-order-creation.d.ts").SemenOrderCreationStationOrganization[]} stations
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
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderLike} order
 * @returns {import("@coritech/domain/orders/semen-order.d.ts").SemenOrder}
 */
function normalizePersistedOrder(order) {
  return {
    ...order,
    requestedDeliveryDate: normalizeOptionalString(order.requestedDeliveryDate),
    shippingContactName: normalizeOptionalString(order.shippingContactName),
    shippingContactPhone: normalizeOptionalString(order.shippingContactPhone),
    shippingAddressLine1: normalizeOptionalString(order.shippingAddressLine1),
    shippingAddressLine2: normalizeOptionalString(order.shippingAddressLine2),
    shippingCity: normalizeOptionalString(order.shippingCity),
    shippingRegion: normalizeOptionalString(order.shippingRegion),
    shippingPostalCode: normalizeOptionalString(order.shippingPostalCode),
    shippingCountry: normalizeOptionalString(order.shippingCountry),
    specialInstructions: normalizeOptionalString(order.specialInstructions),
    createdByUserId: order.createdByUserId ?? "",
    updatedByUserId: order.updatedByUserId ?? "",
    createdAt: order.createdAt ?? new Date().toISOString(),
    updatedAt: order.updatedAt ?? new Date().toISOString(),
  };
}

/**
 * @param {import("@coritech/domain/orders/semen-order.d.ts").SemenOrderLike} order
 * @returns {string}
 */
function requireCreatedOrderId(order) {
  const orderId = normalizeOptionalString(order.id);

  if (!orderId) {
    throw new SemenOrderValidationError([
      "created semen order must have an id before submission.",
    ]);
  }

  return orderId;
}

/**
 * @param {unknown} error
 * @returns {string[]}
 */
function extractIssues(error) {
  if (error && typeof error === "object" && Array.isArray(error.issues)) {
    return error.issues.map(String);
  }

  return [error instanceof Error ? error.message : "Order creation failed."];
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
function validateOptionalDateOnly(value, fieldName, issues) {
  if (value === undefined || value === null || value === "") {
    return;
  }

  if (typeof value !== "string" || !isDateOnly(value.trim())) {
    issues.push(`${fieldName} must be a valid YYYY-MM-DD date.`);
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
  const normalized = normalizeRequiredString(value);

  return normalized || null;
}

/**
 * @param {string} value
 * @returns {string | null}
 */
function nullIfEmpty(value) {
  return value || null;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function formatStatus(value) {
  return String(value).toLowerCase().replace(/_/g, " ");
}

/**
 * @param {{ updatedAt?: string | null, createdAt?: string | null }} left
 * @param {{ updatedAt?: string | null, createdAt?: string | null }} right
 * @returns {number}
 */
function compareUpdatedDescending(left, right) {
  return compareIsoDescending(left.updatedAt ?? left.createdAt, right.updatedAt ?? right.createdAt);
}

/**
 * @param {string | null | undefined} left
 * @param {string | null | undefined} right
 * @returns {number}
 */
function compareIsoDescending(left, right) {
  return compareTimestamp(right) - compareTimestamp(left);
}

/**
 * @param {string | null | undefined} left
 * @param {string | null | undefined} right
 * @returns {number}
 */
function compareIsoAscending(left, right) {
  return compareTimestamp(left) - compareTimestamp(right);
}

/**
 * @param {string | null | undefined} value
 * @returns {number}
 */
function compareTimestamp(value) {
  const timestamp = Date.parse(value ?? "");

  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "\"":
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeAttribute(value) {
  return escapeHtml(value);
}
