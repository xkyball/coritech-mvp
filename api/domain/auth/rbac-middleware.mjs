// @ts-check

import {
  canManageStationCatalog,
  canSearchSemenCatalog,
  canViewSemenListing,
} from "../catalog/semen-catalog.mjs";
import {
  canAttachEvidenceToProofEvent,
  canUploadDocument,
  canViewDocument,
  isDocumentLinkTargetType,
} from "../documents/document-evidence.mjs";
import { isActiveRoleAssignment } from "../identity/role-model.mjs";
import {
  canTransitionSemenOrderStatus,
  canViewSemenOrder,
} from "../orders/semen-order.mjs";
import {
  canViewShipment,
} from "../shipments/shipment.mjs";

export const RBAC_PERMISSION_ACTIONS = /** @type {const} */ ([
  "CREATE_SEMEN_ORDER",
  "VIEW_SEMEN_ORDER",
  "TRANSITION_SEMEN_ORDER_STATUS",
  "MANAGE_STALLION",
  "LIST_STALLIONS",
  "MANAGE_SEMEN_LISTING",
  "VIEW_SEMEN_LISTING",
  "SEARCH_SEMEN_LISTINGS",
  "CREATE_DOCUMENT",
  "VIEW_DOCUMENT",
  "LIST_ORDER_DOCUMENTS",
  "LIST_SHIPMENT_DOCUMENTS",
  "ATTACH_PROOF_EVIDENCE",
  "LIST_PROOF_EVIDENCE_ATTACHMENTS",
]);

export const RBAC_ACCESS_DECISION_OUTCOMES = /** @type {const} */ ([
  "ALLOW",
  "DENY",
]);

export const RBAC_PROTECTED_ROUTES = Object.freeze([
  Object.freeze({
    method: "POST",
    path: "/semen-orders",
    handler: "createDraftSemenOrderEndpoint",
    permission: "CREATE_SEMEN_ORDER",
    access: "BREEDER-owned organization or logged PLATFORM_ADMIN support override",
  }),
  Object.freeze({
    method: "POST",
    path: "/semen-orders/:orderId/status-transitions",
    handler: "transitionSemenOrderStatusEndpoint",
    permission: "TRANSITION_SEMEN_ORDER_STATUS",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or logged PLATFORM_ADMIN by transition",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-orders/:orderId",
    handler: "getSemenOrderEndpoint",
    permission: "VIEW_SEMEN_ORDER",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-orders/:orderId/status-history",
    handler: "listOrderStatusHistoryEndpoint",
    permission: "VIEW_SEMEN_ORDER",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "POST",
    path: "/stallions",
    handler: "createStallionEndpoint",
    permission: "MANAGE_STALLION",
    access: "Owning BREEDING_STATION or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/stallions",
    handler: "listStallionsEndpoint",
    permission: "LIST_STALLIONS",
    access: "BREEDING_STATION-visible records or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/stallions/:stallionId",
    handler: "getStallionEndpoint",
    permission: "MANAGE_STALLION",
    access: "Owning BREEDING_STATION or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "PATCH",
    path: "/stallions/:stallionId",
    handler: "updateStallionEndpoint",
    permission: "MANAGE_STALLION",
    access: "Owning BREEDING_STATION or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "DELETE",
    path: "/stallions/:stallionId",
    handler: "deleteStallionEndpoint",
    permission: "MANAGE_STALLION",
    access: "Owning BREEDING_STATION or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-listings",
    handler: "searchSemenListingsEndpoint",
    permission: "SEARCH_SEMEN_LISTINGS",
    access: "Authenticated Phase 1 BREEDER, BREEDING_STATION, or logged PLATFORM_ADMIN; no unrestricted buyer access",
  }),
  Object.freeze({
    method: "POST",
    path: "/semen-listings",
    handler: "createSemenListingEndpoint",
    permission: "MANAGE_SEMEN_LISTING",
    access: "Owning BREEDING_STATION or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-listings/:listingId",
    handler: "getSemenListingEndpoint",
    permission: "VIEW_SEMEN_LISTING",
    access: "BREEDER active listing, owning BREEDING_STATION record, or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "PATCH",
    path: "/semen-listings/:listingId",
    handler: "updateSemenListingEndpoint",
    permission: "MANAGE_SEMEN_LISTING",
    access: "Owning BREEDING_STATION or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "DELETE",
    path: "/semen-listings/:listingId",
    handler: "deleteSemenListingEndpoint",
    permission: "MANAGE_SEMEN_LISTING",
    access: "Owning BREEDING_STATION or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "POST",
    path: "/documents",
    handler: "createDocumentEndpoint",
    permission: "CREATE_DOCUMENT",
    access: "Classification-aware BREEDER, assigned BREEDING_STATION, or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/documents/:documentId",
    handler: "getDocumentEndpoint",
    permission: "VIEW_DOCUMENT",
    access: "Classification-aware participant or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/semen-orders/:orderId/documents",
    handler: "listOrderDocumentsEndpoint",
    permission: "LIST_ORDER_DOCUMENTS",
    access: "BREEDER-owned order, assigned BREEDING_STATION order, or logged PLATFORM_ADMIN; documents filtered by classification",
  }),
  Object.freeze({
    method: "GET",
    path: "/shipments/:shipmentId/documents",
    handler: "listShipmentDocumentsEndpoint",
    permission: "LIST_SHIPMENT_DOCUMENTS",
    access: "BREEDER-owned order shipment, assigned BREEDING_STATION shipment, or logged PLATFORM_ADMIN; documents filtered by classification",
  }),
  Object.freeze({
    method: "POST",
    path: "/proof-events/:proofEventId/evidence-attachments",
    handler: "createEvidenceAttachmentEndpoint",
    permission: "ATTACH_PROOF_EVIDENCE",
    access: "Classification-aware document viewer and proof-event participant or logged PLATFORM_ADMIN",
  }),
  Object.freeze({
    method: "GET",
    path: "/proof-events/:proofEventId/evidence-attachments",
    handler: "listEvidenceAttachmentsForProofEventEndpoint",
    permission: "LIST_PROOF_EVIDENCE_ATTACHMENTS",
    access: "Proof-event participant or logged PLATFORM_ADMIN",
  }),
]);

const AUTHORIZATION_ERROR_NAMES = Object.freeze([
  "AmendmentAuthorizationError",
  "AuditLogAuthorizationError",
  "DocumentEvidenceAuthorizationError",
  "SemenCatalogAuthorizationError",
  "SemenOrderAuthorizationError",
  "ShipmentAuthorizationError",
]);

const PHASE_1_ROLE_CODES = Object.freeze([
  "BREEDER",
  "BREEDING_STATION",
  "PLATFORM_ADMIN",
]);

const FORBIDDEN_RESPONSE_BODY = Object.freeze({
  error: Object.freeze({
    code: "RBAC_FORBIDDEN",
    message: "Forbidden",
  }),
});

export class RbacMiddlewareValidationError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech RBAC middleware input:\n- ${issues.join("\n- ")}`);
    this.name = "RbacMiddlewareValidationError";
    this.issues = issues;
  }
}

/**
 * @param {unknown} value
 * @returns {value is import("./rbac-middleware.d.ts").RbacPermissionAction}
 */
export function isRbacPermissionAction(value) {
  return typeof value === "string" && RBAC_PERMISSION_ACTIONS.includes(
    /** @type {import("./rbac-middleware.d.ts").RbacPermissionAction} */ (value),
  );
}

/**
 * @param {unknown} value
 * @returns {value is import("./rbac-middleware.d.ts").RbacAccessDecisionOutcome}
 */
export function isRbacAccessDecisionOutcome(value) {
  return typeof value === "string" && RBAC_ACCESS_DECISION_OUTCOMES.includes(
    /** @type {import("./rbac-middleware.d.ts").RbacAccessDecisionOutcome} */ (
      value
    ),
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext | null | undefined} actor
 * @param {import("../identity/role-model.d.ts").RoleCode} roleCode
 * @param {string | null | undefined} [organizationId]
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
export function findActiveActorRole(actor, roleCode, organizationId) {
  if (!actor || !Array.isArray(actor.roles)) {
    return undefined;
  }

  return actor.roles.find((assignment) =>
    assignment.userId === actor.userId &&
    assignment.roleCode === roleCode &&
    isActiveRoleAssignment(assignment) &&
    (organizationId == null || assignment.organizationId === organizationId),
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext | null | undefined} actor
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
export function findPlatformAdminRole(actor) {
  return findActiveActorRole(actor, "PLATFORM_ADMIN");
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext | null | undefined} actor
 * @returns {boolean}
 */
export function hasPhase1ActorRole(actor) {
  return Boolean(findPrimaryActorRole(actor, true));
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isAuthorizationError(error) {
  return error instanceof Error && AUTHORIZATION_ERROR_NAMES.includes(error.name);
}

/**
 * @template TRequest
 * @template TResponse
 * @param {(request: TRequest) => Promise<TResponse> | TResponse} handler
 * @param {import("./rbac-middleware.d.ts").RbacMiddlewareOptions<TRequest>} options
 * @returns {(request: TRequest) => Promise<TResponse | import("./rbac-middleware.d.ts").RbacForbiddenResponse>}
 */
export function withRbacPermission(handler, options) {
  validateMiddlewareOptions(handler, options);

  return async function rbacProtectedEndpoint(request) {
    let decision = await evaluateRbacPermission({
      request: /** @type {import("./rbac-middleware.d.ts").RbacEndpointRequest} */ (
        request
      ),
      action: options.action,
      handlerName: options.handlerName,
      now: options.now,
    });

    if (!decision.allowed) {
      await recordRbacAccessDecision(
        /** @type {import("./rbac-middleware.d.ts").RbacEndpointRequest} */ (
          request
        ),
        decision,
        options,
      );

      return forbiddenResponse();
    }

    try {
      const response = await handler(request);

      if (shouldLogAllowedDecision(decision, options)) {
        await recordRbacAccessDecision(
          /** @type {import("./rbac-middleware.d.ts").RbacEndpointRequest} */ (
            request
          ),
          decision,
          options,
        );
      }

      return response;
    } catch (error) {
      if (!isAuthorizationError(error)) {
        throw error;
      }

      decision = buildAccessDecision({
        action: options.action,
        allowed: false,
        actor: /** @type {import("./rbac-middleware.d.ts").RbacEndpointRequest} */ (
          request
        ).actor,
        handlerName: options.handlerName,
        reason: error.message,
        targetType: decision.targetType,
        targetId: decision.targetId,
        targetRef: decision.targetRef,
        now: options.now,
      });

      await recordRbacAccessDecision(
        /** @type {import("./rbac-middleware.d.ts").RbacEndpointRequest} */ (
          request
        ),
        decision,
        options,
      );

      return forbiddenResponse();
    }
  };
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacMiddlewareDefaultOptions} [defaultOptions]
 * @returns {<TRequest, TResponse>(handler: (request: TRequest) => Promise<TResponse> | TResponse, options: import("./rbac-middleware.d.ts").RbacMiddlewareOptions<TRequest>) => (request: TRequest) => Promise<TResponse | import("./rbac-middleware.d.ts").RbacForbiddenResponse>}
 */
export function createRbacMiddleware(defaultOptions = {}) {
  return (handler, options) =>
    withRbacPermission(handler, {
      ...defaultOptions,
      ...options,
      recordAccessDecision: options.recordAccessDecision ??
        defaultOptions.recordAccessDecision,
      now: options.now ?? defaultOptions.now,
    });
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
export async function evaluateRbacPermission(input) {
  const issues = validateEvaluateRbacPermissionInput(input);

  if (issues.length > 0) {
    throw new RbacMiddlewareValidationError(issues);
  }

  switch (input.action) {
    case "CREATE_SEMEN_ORDER":
      return evaluateCreateSemenOrder(input);
    case "VIEW_SEMEN_ORDER":
      return evaluateViewSemenOrder(input);
    case "TRANSITION_SEMEN_ORDER_STATUS":
      return evaluateTransitionSemenOrderStatus(input);
    case "MANAGE_STALLION":
      return evaluateManageStallion(input);
    case "LIST_STALLIONS":
      return evaluateListStallions(input);
    case "MANAGE_SEMEN_LISTING":
      return evaluateManageSemenListing(input);
    case "VIEW_SEMEN_LISTING":
      return evaluateViewSemenListing(input);
    case "SEARCH_SEMEN_LISTINGS":
      return evaluateSearchSemenListings(input);
    case "CREATE_DOCUMENT":
      return evaluateCreateDocument(input);
    case "VIEW_DOCUMENT":
      return evaluateViewDocument(input);
    case "LIST_ORDER_DOCUMENTS":
      return evaluateListOrderDocuments(input);
    case "LIST_SHIPMENT_DOCUMENTS":
      return evaluateListShipmentDocuments(input);
    case "ATTACH_PROOF_EVIDENCE":
      return evaluateAttachProofEvidence(input);
    case "LIST_PROOF_EVIDENCE_ATTACHMENTS":
      return evaluateListProofEvidenceAttachments(input);
    default:
      throw new RbacMiddlewareValidationError([
        `action must be one of: ${RBAC_PERMISSION_ACTIONS.join(", ")}.`,
      ]);
  }
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacEndpointRequest} request
 * @param {import("./rbac-middleware.d.ts").RbacAccessDecision} decision
 * @param {import("./rbac-middleware.d.ts").RbacAccessDecisionLoggerOptions} [options]
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision | null>}
 */
export async function recordRbacAccessDecision(request, decision, options = {}) {
  const logger = options.recordAccessDecision ??
    (
      request.repository &&
        typeof request.repository === "object" &&
        typeof request.repository.recordRbacAccessDecision === "function"
        ? request.repository.recordRbacAccessDecision.bind(request.repository)
        : null
    );

  if (!logger) {
    return null;
  }

  const persisted = await logger(decision);

  return Object.freeze(persisted ?? decision);
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacAccessDecisionBuildInput} input
 * @returns {import("./rbac-middleware.d.ts").RbacAccessDecision}
 */
export function buildAccessDecision(input) {
  const actorRole = input.matchedRole ?? findPrimaryActorRole(input.actor, false);
  const targetRef = freezeRecord(input.targetRef ?? {});
  const allowed = Boolean(input.allowed);

  return Object.freeze({
    outcome: allowed ? "ALLOW" : "DENY",
    allowed,
    status: allowed ? null : 403,
    action: input.action,
    actorUserId: normalizeOptionalString(input.actor?.userId),
    actorRoleCode: normalizeOptionalString(actorRole?.roleCode),
    actorOrganizationId: normalizeOptionalString(actorRole?.organizationId),
    targetType: normalizeOptionalString(input.targetType),
    targetId: normalizeOptionalString(input.targetId),
    targetRef,
    handlerName: normalizeOptionalString(input.handlerName),
    reason: normalizeRequiredString(input.reason) || (
      allowed
        ? "RBAC permission granted."
        : "RBAC permission denied."
    ),
    deferred: Boolean(input.deferred),
    occurredAt: toIsoTimestamp(input.now ?? new Date()),
  });
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateCreateSemenOrder(input) {
  const breederOrganizationId = bodyField(input.request, "breederOrganizationId");
  const target = {
    targetType: "SemenOrder",
    targetId: null,
    targetRef: { breederOrganizationId },
  };

  if (!breederOrganizationId) {
    return deferredDecision(input, target, "Semen order breeder organization is not available for RBAC preflight.");
  }

  const adminRole = findPlatformAdminRole(input.request.actor);
  const breederRole = findActiveActorRole(
    input.request.actor,
    "BREEDER",
    breederOrganizationId,
  );

  if (adminRole || breederRole) {
    return allowedDecision(
      input,
      target,
      adminRole ?? breederRole,
      adminRole
        ? "Platform admin support override may create a breeder order and must be logged."
        : "Breeder may create orders for their own organization.",
    );
  }

  return deniedDecision(
    input,
    target,
    "Breeder may create orders only for their own organization.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateViewSemenOrder(input) {
  const orderId = param(input.request, "orderId");
  const target = {
    targetType: "SemenOrder",
    targetId: orderId,
    targetRef: {},
  };

  if (!orderId) {
    return deferredDecision(input, target, "Semen order id is not available for RBAC preflight.");
  }

  const order = await findEntity(input.request.repository, "findSemenOrderById", orderId);

  if (!order) {
    return deferredDecision(input, target, "Semen order was not found during RBAC preflight.");
  }

  const targetRef = orderTargetRef(order);
  const matchedRole = findSemenOrderViewRole(input.request.actor, order);

  if (matchedRole && canViewSemenOrder(input.request.actor, order)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may view semen orders and must be logged."
        : "Actor may view breeder-owned or assigned-station semen orders.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may view only breeder-owned, assigned-station, or platform-admin semen orders.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateTransitionSemenOrderStatus(input) {
  const orderId = param(input.request, "orderId");
  const toStatus = bodyField(input.request, "toStatus");
  const target = {
    targetType: "SemenOrder",
    targetId: orderId,
    targetRef: { toStatus },
  };

  if (!orderId || !toStatus) {
    return deferredDecision(input, target, "Semen order transition target is not available for RBAC preflight.");
  }

  const order = await findEntity(input.request.repository, "findSemenOrderById", orderId);

  if (!order) {
    return deferredDecision(input, target, "Semen order was not found during RBAC preflight.");
  }

  const targetRef = { ...orderTargetRef(order), toStatus };
  const matchedRole = findSemenOrderTransitionRole(
    input.request.actor,
    order,
    toStatus,
  );

  if (matchedRole && canTransitionSemenOrderStatus(input.request.actor, order, toStatus)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may transition semen orders and must be logged."
        : "Actor may transition this breeder-owned or assigned-station semen order.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may transition only permitted breeder-owned or assigned-station semen orders.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateManageStallion(input) {
  const stallionId = param(input.request, "stallionId") || bodyField(input.request, "stallionId");
  const bodyStationOrganizationId = bodyField(input.request, "breedingStationOrganizationId");
  const target = {
    targetType: "Stallion",
    targetId: stallionId,
    targetRef: {
      breedingStationOrganizationId: bodyStationOrganizationId,
    },
  };
  const stationOrganizationId = bodyStationOrganizationId ||
    await findStationOrganizationIdForTarget(
      input.request.repository,
      "findStallionById",
      stallionId,
    );

  if (!stationOrganizationId) {
    return deferredDecision(input, target, "Stallion station ownership is not available for RBAC preflight.");
  }

  return manageStationDecision(input, {
    ...target,
    targetRef: { breedingStationOrganizationId: stationOrganizationId },
  }, stationOrganizationId);
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateListStallions(input) {
  const adminRole = findPlatformAdminRole(input.request.actor);
  const stationRole = findActiveActorRole(input.request.actor, "BREEDING_STATION");
  const target = {
    targetType: "Stallion",
    targetId: null,
    targetRef: {},
  };

  if (adminRole || stationRole) {
    return allowedDecision(
      input,
      target,
      adminRole ?? stationRole,
      adminRole
        ? "Platform admin may list stallion records and must be logged."
        : "Breeding station may list station-visible stallion records.",
    );
  }

  return deniedDecision(
    input,
    target,
    "Only breeding station users or platform admins may list directly managed stallion records.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateManageSemenListing(input) {
  const listingId = param(input.request, "listingId") || bodyField(input.request, "listingId");
  const stallionId = bodyField(input.request, "stallionId");
  const bodyStationOrganizationId = bodyField(input.request, "breedingStationOrganizationId");
  const target = {
    targetType: "SemenListing",
    targetId: listingId,
    targetRef: {
      stallionId,
      breedingStationOrganizationId: bodyStationOrganizationId,
    },
  };
  let stationOrganizationId = bodyStationOrganizationId;

  if (!stationOrganizationId && listingId) {
    stationOrganizationId = await findStationOrganizationIdForTarget(
      input.request.repository,
      "findSemenListingById",
      listingId,
    );
  }

  if (!stationOrganizationId && stallionId) {
    stationOrganizationId = await findStationOrganizationIdForTarget(
      input.request.repository,
      "findStallionById",
      stallionId,
    );
  }

  if (!stationOrganizationId) {
    return deferredDecision(input, target, "Semen listing station ownership is not available for RBAC preflight.");
  }

  return manageStationDecision(input, {
    ...target,
    targetRef: {
      stallionId,
      breedingStationOrganizationId: stationOrganizationId,
    },
  }, stationOrganizationId);
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateViewSemenListing(input) {
  const listingId = param(input.request, "listingId");
  const target = {
    targetType: "SemenListing",
    targetId: listingId,
    targetRef: {},
  };

  if (!listingId) {
    return deferredDecision(input, target, "Semen listing id is not available for RBAC preflight.");
  }

  const record = await findEntity(
    input.request.repository,
    "findSemenListingRecordById",
    listingId,
  );

  if (!record?.listing) {
    return deferredDecision(input, target, "Semen listing was not found during RBAC preflight.");
  }

  const matchedRole = findSemenListingViewRole(input.request.actor, record.listing);
  const targetRef = {
    stallionId: record.listing.stallionId,
    breedingStationOrganizationId: record.listing.breedingStationOrganizationId,
    listingStatus: record.listing.listingStatus,
  };

  if (matchedRole && canViewSemenListing(input.request.actor, record.listing)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may view semen listings and must be logged."
        : "Actor may view active or station-owned semen listings.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may view only active listings, station-owned listing records, or platform-admin listing records.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateSearchSemenListings(input) {
  const adminRole = findPlatformAdminRole(input.request.actor);
  const phase1Role = findPrimaryActorRole(input.request.actor, true);
  const target = {
    targetType: "SemenListing",
    targetId: null,
    targetRef: {},
  };

  if (phase1Role && canSearchSemenCatalog(input.request.actor)) {
    return allowedDecision(
      input,
      target,
      adminRole ?? phase1Role,
      adminRole
        ? "Platform admin may search semen listings and must be logged."
        : "Phase 1 participant may search semen listings within catalog visibility rules.",
    );
  }

  return deniedDecision(
    input,
    target,
    "Only authenticated Phase 1 roles may search semen listings; buyer access is not active.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateCreateDocument(input) {
  const targetType = bodyField(input.request, "targetType");
  const targetId = bodyField(input.request, "targetId");
  const accessClassification = bodyField(input.request, "accessClassification");
  const target = {
    targetType: targetType || "DocumentTarget",
    targetId,
    targetRef: { accessClassification },
  };

  if (!targetType || !targetId || !accessClassification) {
    return deferredDecision(input, target, "Document target or classification is not available for RBAC preflight.");
  }

  const linkTarget = await loadDocumentTarget(input.request.repository, targetType, targetId);

  if (!linkTarget) {
    return deferredDecision(input, target, "Document target was not found during RBAC preflight.");
  }

  const matchedRole = findDocumentUploadRole(
    input.request.actor,
    linkTarget,
    accessClassification,
  );
  const targetRef = {
    ...targetRefForParticipantTarget(linkTarget),
    accessClassification,
  };

  if (matchedRole && canUploadDocument(input.request.actor, linkTarget, accessClassification)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may upload controlled documents and must be logged."
        : "Actor may upload documents for permitted Phase 1 target and classification.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may upload documents only for permitted Phase 1 targets and classifications.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateViewDocument(input) {
  const documentId = param(input.request, "documentId");
  const target = {
    targetType: "Document",
    targetId: documentId,
    targetRef: {},
  };

  if (!documentId) {
    return deferredDecision(input, target, "Document id is not available for RBAC preflight.");
  }

  const document = await findEntity(input.request.repository, "findDocumentById", documentId);

  if (!document) {
    return deferredDecision(input, target, "Document was not found during RBAC preflight.");
  }

  const matchedRole = findDocumentViewRole(input.request.actor, document);
  const targetRef = documentTargetRef(document);

  if (matchedRole && canViewDocument(input.request.actor, document)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may view controlled documents and must be logged."
        : "Actor may view documents allowed by target ownership and classification.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may view only documents allowed by target ownership and classification.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateListOrderDocuments(input) {
  const orderId = param(input.request, "orderId");
  const target = {
    targetType: "SemenOrder",
    targetId: orderId,
    targetRef: {},
  };

  if (!orderId) {
    return deferredDecision(input, target, "Semen order id is not available for document-list RBAC preflight.");
  }

  const order = await findEntity(input.request.repository, "findSemenOrderById", orderId);

  if (!order) {
    return deferredDecision(input, target, "Semen order was not found during document-list RBAC preflight.");
  }

  const matchedRole = findSemenOrderViewRole(input.request.actor, order);
  const targetRef = orderTargetRef(order);

  if (matchedRole && canViewSemenOrder(input.request.actor, order)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may list order documents and must be logged."
        : "Actor may list documents for visible semen orders.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may list documents only for visible semen orders.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateListShipmentDocuments(input) {
  const shipmentId = param(input.request, "shipmentId");
  const target = {
    targetType: "Shipment",
    targetId: shipmentId,
    targetRef: {},
  };

  if (!shipmentId) {
    return deferredDecision(input, target, "Shipment id is not available for document-list RBAC preflight.");
  }

  const shipment = await findEntity(input.request.repository, "findShipmentById", shipmentId);

  if (!shipment) {
    return deferredDecision(input, target, "Shipment was not found during document-list RBAC preflight.");
  }

  const matchedRole = findParticipantRole(input.request.actor, shipment);
  const targetRef = targetRefForParticipantTarget(shipment);

  if (matchedRole && canViewShipment(input.request.actor, shipment)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may list shipment documents and must be logged."
        : "Actor may list documents for visible shipments.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may list documents only for visible shipments.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateAttachProofEvidence(input) {
  const proofEventId = param(input.request, "proofEventId");
  const documentId = bodyField(input.request, "documentId");
  const target = {
    targetType: "ProofEvent",
    targetId: proofEventId,
    targetRef: { documentId },
  };

  if (!proofEventId || !documentId) {
    return deferredDecision(input, target, "Proof evidence target is not available for RBAC preflight.");
  }

  const document = await findEntity(input.request.repository, "findDocumentById", documentId);
  const proofEvent = await findEntity(input.request.repository, "findProofEventById", proofEventId);

  if (!document || !proofEvent) {
    return deferredDecision(input, target, "Proof evidence document or event was not found during RBAC preflight.");
  }

  const matchedRole = findEvidenceAttachmentRole(
    input.request.actor,
    document,
    proofEvent,
  );
  const targetRef = {
    ...targetRefForParticipantTarget(proofEvent),
    documentId,
    documentAccessClassification: document.accessClassification,
  };

  if (matchedRole && canAttachEvidenceToProofEvent(input.request.actor, document, proofEvent)) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may attach proof evidence and must be logged."
        : "Actor may attach viewable documents to visible proof events.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may attach only viewable documents to visible proof events.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {Promise<import("./rbac-middleware.d.ts").RbacAccessDecision>}
 */
async function evaluateListProofEvidenceAttachments(input) {
  const proofEventId = param(input.request, "proofEventId");
  const target = {
    targetType: "ProofEvent",
    targetId: proofEventId,
    targetRef: {},
  };

  if (!proofEventId) {
    return deferredDecision(input, target, "Proof event id is not available for RBAC preflight.");
  }

  const proofEvent = await findEntity(input.request.repository, "findProofEventById", proofEventId);

  if (!proofEvent) {
    return deferredDecision(input, target, "Proof event was not found during RBAC preflight.");
  }

  const matchedRole = findParticipantRole(input.request.actor, proofEvent);
  const targetRef = targetRefForParticipantTarget(proofEvent);

  if (matchedRole) {
    return allowedDecision(
      input,
      { ...target, targetRef },
      matchedRole,
      matchedRole.roleCode === "PLATFORM_ADMIN"
        ? "Platform admin may list proof evidence attachments and must be logged."
        : "Actor may list evidence attachments for visible proof events.",
    );
  }

  return deniedDecision(
    input,
    { ...target, targetRef },
    "Actor may list evidence attachments only for visible proof events.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @param {{ targetType: string | null, targetId: string | null, targetRef: Record<string, unknown> }} target
 * @param {string} stationOrganizationId
 * @returns {import("./rbac-middleware.d.ts").RbacAccessDecision}
 */
function manageStationDecision(input, target, stationOrganizationId) {
  const adminRole = findPlatformAdminRole(input.request.actor);
  const stationRole = findActiveActorRole(
    input.request.actor,
    "BREEDING_STATION",
    stationOrganizationId,
  );

  if (
    (adminRole || stationRole) &&
    canManageStationCatalog(input.request.actor, stationOrganizationId)
  ) {
    return allowedDecision(
      input,
      target,
      adminRole ?? stationRole,
      adminRole
        ? "Platform admin may manage station records and must be logged."
        : "Breeding station may manage its own station records.",
    );
  }

  return deniedDecision(
    input,
    target,
    "Breeding station may manage only its own station records.",
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @param {{ targetType: string | null, targetId: string | null, targetRef: Record<string, unknown> }} target
 * @param {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined} matchedRole
 * @param {string} reason
 * @returns {import("./rbac-middleware.d.ts").RbacAccessDecision}
 */
function allowedDecision(input, target, matchedRole, reason) {
  return buildAccessDecision({
    action: input.action,
    allowed: true,
    actor: input.request.actor,
    handlerName: input.handlerName,
    matchedRole,
    targetType: target.targetType,
    targetId: target.targetId,
    targetRef: target.targetRef,
    reason,
    now: input.now,
  });
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @param {{ targetType: string | null, targetId: string | null, targetRef: Record<string, unknown> }} target
 * @param {string} reason
 * @returns {import("./rbac-middleware.d.ts").RbacAccessDecision}
 */
function deniedDecision(input, target, reason) {
  return buildAccessDecision({
    action: input.action,
    allowed: false,
    actor: input.request.actor,
    handlerName: input.handlerName,
    targetType: target.targetType,
    targetId: target.targetId,
    targetRef: target.targetRef,
    reason,
    now: input.now,
  });
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @param {{ targetType: string | null, targetId: string | null, targetRef: Record<string, unknown> }} target
 * @param {string} reason
 * @returns {import("./rbac-middleware.d.ts").RbacAccessDecision}
 */
function deferredDecision(input, target, reason) {
  return buildAccessDecision({
    action: input.action,
    allowed: true,
    actor: input.request.actor,
    handlerName: input.handlerName,
    targetType: target.targetType,
    targetId: target.targetId,
    targetRef: target.targetRef,
    reason,
    deferred: true,
    now: input.now,
  });
}

/**
 * @template TRequest
 * @param {unknown} handler
 * @param {import("./rbac-middleware.d.ts").RbacMiddlewareOptions<TRequest>} options
 * @returns {void}
 */
function validateMiddlewareOptions(handler, options) {
  const issues = [];

  if (typeof handler !== "function") {
    issues.push("handler must be a function.");
  }

  if (!options || typeof options !== "object") {
    issues.push("options are required.");
  } else if (!isRbacPermissionAction(options.action)) {
    issues.push(`options.action must be one of: ${RBAC_PERMISSION_ACTIONS.join(", ")}.`);
  }

  if (issues.length > 0) {
    throw new RbacMiddlewareValidationError(issues);
  }
}

/**
 * @param {import("./rbac-middleware.d.ts").EvaluateRbacPermissionInput} input
 * @returns {string[]}
 */
function validateEvaluateRbacPermissionInput(input) {
  const issues = [];

  if (!input || typeof input !== "object") {
    return ["RBAC permission input is required."];
  }

  if (!isRbacPermissionAction(input.action)) {
    issues.push(`action must be one of: ${RBAC_PERMISSION_ACTIONS.join(", ")}.`);
  }

  if (!input.request || typeof input.request !== "object") {
    issues.push("request is required.");
  } else {
    if (!input.request.actor || typeof input.request.actor !== "object") {
      issues.push("request.actor is required.");
    }

    if (!input.request.repository || typeof input.request.repository !== "object") {
      issues.push("request.repository is required.");
    }
  }

  validateOptionalTimestamp(input.now, "now", issues);

  return issues;
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacAccessDecision} decision
 * @param {import("./rbac-middleware.d.ts").RbacMiddlewareOptions<unknown>} options
 * @returns {boolean}
 */
function shouldLogAllowedDecision(decision, options) {
  if (decision.deferred || !decision.allowed) {
    return false;
  }

  return Boolean(
    options.logAllowedAccess ||
      decision.actorRoleCode === "PLATFORM_ADMIN",
  );
}

/**
 * @returns {import("./rbac-middleware.d.ts").RbacForbiddenResponse}
 */
function forbiddenResponse() {
  return Object.freeze({
    status: 403,
    body: FORBIDDEN_RESPONSE_BODY,
  });
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext | null | undefined} actor
 * @param {boolean} phase1Only
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findPrimaryActorRole(actor, phase1Only) {
  if (!actor || !Array.isArray(actor.roles)) {
    return undefined;
  }

  return actor.roles.find((assignment) =>
    assignment.userId === actor.userId &&
    isActiveRoleAssignment(assignment) &&
    (!phase1Only || PHASE_1_ROLE_CODES.includes(assignment.roleCode)),
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext} actor
 * @param {import("../orders/semen-order.d.ts").SemenOrderLike} order
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findSemenOrderViewRole(actor, order) {
  return findParticipantRole(actor, order);
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext} actor
 * @param {import("../orders/semen-order.d.ts").SemenOrderLike} order
 * @param {string} toStatus
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findSemenOrderTransitionRole(actor, order, toStatus) {
  const adminRole = findPlatformAdminRole(actor);

  if (adminRole) {
    return adminRole;
  }

  if (toStatus === "SUBMITTED") {
    return findActiveActorRole(actor, "BREEDER", order.breederOrganizationId);
  }

  if (toStatus === "CANCELLED") {
    const breederRole = findActiveActorRole(actor, "BREEDER", order.breederOrganizationId);
    const stationRole = findActiveActorRole(
      actor,
      "BREEDING_STATION",
      order.breedingStationOrganizationId,
    );

    return order.status === "DRAFT" || order.status === "SUBMITTED"
      ? breederRole
      : stationRole ?? breederRole;
  }

  if (toStatus === "COMPLETED") {
    return findActiveActorRole(
      actor,
      "BREEDING_STATION",
      order.breedingStationOrganizationId,
    ) ?? findActiveActorRole(actor, "BREEDER", order.breederOrganizationId);
  }

  return findActiveActorRole(
    actor,
    "BREEDING_STATION",
    order.breedingStationOrganizationId,
  );
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext} actor
 * @param {import("../catalog/semen-catalog.d.ts").SemenListingLike} listing
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findSemenListingViewRole(actor, listing) {
  return findPlatformAdminRole(actor) ??
    findActiveActorRole(actor, "BREEDING_STATION", listing.breedingStationOrganizationId) ??
    (
      listing.listingStatus === "ACTIVE"
        ? findActiveActorRole(actor, "BREEDER")
        : undefined
    );
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext} actor
 * @param {import("../documents/document-evidence.d.ts").DocumentLinkTargetLike} target
 * @param {string} accessClassification
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findDocumentUploadRole(actor, target, accessClassification) {
  if (accessClassification === "ADMIN_ONLY") {
    return findPlatformAdminRole(actor);
  }

  if (accessClassification === "INTERNAL") {
    return findActiveActorRole(
      actor,
      "BREEDING_STATION",
      target.breedingStationOrganizationId,
    ) ?? findPlatformAdminRole(actor);
  }

  return findParticipantRole(actor, target);
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext} actor
 * @param {import("../documents/document-evidence.d.ts").DocumentLike} document
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findDocumentViewRole(actor, document) {
  if (document.accessClassification === "ADMIN_ONLY") {
    return findPlatformAdminRole(actor);
  }

  if (document.accessClassification === "INTERNAL") {
    return findActiveActorRole(
      actor,
      "BREEDING_STATION",
      document.breedingStationOrganizationId,
    ) ?? findPlatformAdminRole(actor);
  }

  if (document.accessClassification === "RESTRICTED") {
    return findActiveActorRole(actor, "BREEDER", document.uploaderOrganizationId) ??
      findActiveActorRole(actor, "BREEDING_STATION", document.uploaderOrganizationId) ??
      findPlatformAdminRole(actor);
  }

  return findParticipantRole(actor, document);
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext} actor
 * @param {import("../documents/document-evidence.d.ts").DocumentLike} document
 * @param {import("../documents/document-evidence.d.ts").ProofEventLinkTargetLike} proofEvent
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findEvidenceAttachmentRole(actor, document, proofEvent) {
  if (!findDocumentViewRole(actor, document)) {
    return undefined;
  }

  return findParticipantRole(actor, proofEvent);
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacActorContext} actor
 * @param {{ breederOrganizationId?: string | null, breedingStationOrganizationId?: string | null }} target
 * @returns {import("../identity/role-model.d.ts").UserOrganizationRoleLike | undefined}
 */
function findParticipantRole(actor, target) {
  return findActiveActorRole(actor, "BREEDER", target.breederOrganizationId) ??
    findActiveActorRole(
      actor,
      "BREEDING_STATION",
      target.breedingStationOrganizationId,
    ) ??
    findPlatformAdminRole(actor);
}

/**
 * @param {unknown} repository
 * @param {string} methodName
 * @param {string | null} targetId
 * @returns {Promise<string | null>}
 */
async function findStationOrganizationIdForTarget(repository, methodName, targetId) {
  if (!targetId) {
    return null;
  }

  const target = await findEntity(repository, methodName, targetId);

  return normalizeOptionalString(target?.breedingStationOrganizationId);
}

/**
 * @param {unknown} repository
 * @param {string} targetType
 * @param {string} targetId
 * @returns {Promise<import("../documents/document-evidence.d.ts").DocumentLinkTargetLike | null>}
 */
async function loadDocumentTarget(repository, targetType, targetId) {
  if (!isDocumentLinkTargetType(targetType)) {
    return null;
  }

  if (targetType === "SemenOrder") {
    const order = await findEntity(repository, "findSemenOrderById", targetId);

    return order
      ? {
        ...order,
        targetType,
        targetId: order.id,
      }
      : null;
  }

  if (targetType === "Shipment") {
    const shipment = await findEntity(repository, "findShipmentById", targetId);

    return shipment
      ? {
        ...shipment,
        targetType,
        targetId: shipment.id,
      }
      : null;
  }

  const proofEvent = await findEntity(repository, "findProofEventById", targetId);

  return proofEvent
    ? {
      ...proofEvent,
      targetType,
      targetId: proofEvent.id,
    }
    : null;
}

/**
 * @param {unknown} repository
 * @param {string} methodName
 * @param {string} id
 * @returns {Promise<any>}
 */
async function findEntity(repository, methodName, id) {
  if (!repository || typeof repository !== "object") {
    throw new TypeError("request.repository is required.");
  }

  const method = /** @type {Record<string, unknown>} */ (repository)[methodName];

  if (typeof method !== "function") {
    throw new TypeError(`request.repository.${methodName} is required.`);
  }

  return method.call(repository, id);
}

/**
 * @param {import("../orders/semen-order.d.ts").SemenOrderLike} order
 * @returns {Record<string, unknown>}
 */
function orderTargetRef(order) {
  return {
    orderNumber: order.orderNumber,
    semenListingId: order.semenListingId,
    breederOrganizationId: order.breederOrganizationId,
    breedingStationOrganizationId: order.breedingStationOrganizationId,
    status: order.status,
  };
}

/**
 * @param {import("../documents/document-evidence.d.ts").DocumentLike} document
 * @returns {Record<string, unknown>}
 */
function documentTargetRef(document) {
  return {
    targetType: document.targetType,
    targetId: document.targetId,
    semenOrderId: document.semenOrderId,
    shipmentId: document.shipmentId,
    proofEventId: document.proofEventId,
    orderNumber: document.orderNumber,
    breederOrganizationId: document.breederOrganizationId,
    breedingStationOrganizationId: document.breedingStationOrganizationId,
    accessClassification: document.accessClassification,
  };
}

/**
 * @param {{ targetType?: string | null, targetId?: string | null, id?: string | null, semenOrderId?: string | null, shipmentId?: string | null, orderNumber?: string | null, breederOrganizationId?: string | null, breedingStationOrganizationId?: string | null }} target
 * @returns {Record<string, unknown>}
 */
function targetRefForParticipantTarget(target) {
  return {
    targetType: target.targetType ?? null,
    targetId: target.targetId ?? target.id ?? null,
    semenOrderId: target.semenOrderId ?? null,
    shipmentId: target.shipmentId ?? null,
    orderNumber: target.orderNumber ?? null,
    breederOrganizationId: target.breederOrganizationId ?? null,
    breedingStationOrganizationId: target.breedingStationOrganizationId ?? null,
  };
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacEndpointRequest} request
 * @param {string} paramName
 * @returns {string | null}
 */
function param(request, paramName) {
  return normalizeOptionalString(request.params?.[paramName]);
}

/**
 * @param {import("./rbac-middleware.d.ts").RbacEndpointRequest} request
 * @param {string} fieldName
 * @returns {string | null}
 */
function bodyField(request, fieldName) {
  const value = request.body && typeof request.body === "object"
    ? /** @type {Record<string, unknown>} */ (request.body)[fieldName]
    : null;

  return normalizeOptionalString(value);
}

/**
 * @param {Record<string, unknown>} value
 * @returns {Readonly<Record<string, unknown>>}
 */
function freezeRecord(value) {
  return Object.freeze({ ...value });
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
function validateOptionalTimestamp(value, fieldName, issues) {
  if (value === undefined || value === null) {
    return;
  }

  if (!(typeof value === "string" || value instanceof Date) || Number.isNaN(new Date(value).getTime())) {
    issues.push(`${fieldName} must be a valid date or ISO timestamp.`);
  }
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  return new Date(value).toISOString();
}
