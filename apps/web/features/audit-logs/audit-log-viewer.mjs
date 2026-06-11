// @ts-check

import { AUDIT_LOG_ACTIONS } from "@coritech/domain/audit/audit-log.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";

export const AUDIT_LOG_ACTION_FILTER_OPTIONS = Object.freeze([
  "",
  ...AUDIT_LOG_ACTIONS,
]);

const DEFAULT_LIMIT = 50;
const DEFAULT_PAGE = 1;

/**
 * @param {import("./audit-log-viewer.d.ts").AuditLogViewerActorContext} actor
 * @returns {boolean}
 */
export function canAccessAuditLogViewer(actor) {
  return Boolean(actor?.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {{
 *   auditLogs: readonly import("@coritech/domain/audit/audit-log.d.ts").AuditLog[],
 *   filters?: import("@coritech/domain/audit/audit-log.d.ts").AuditLogListFilters,
 * }} input
 * @returns {import("./audit-log-viewer.d.ts").AuditLogViewerViewModel}
 */
export function createAuditLogViewerViewModel(input) {
  const filters = normalizeAuditLogFilters(input.filters ?? {});
  const rows = input.auditLogs.map(toAuditLogRow);
  const accessDecisionRows = rows.filter((row) => row.action === "ACCESS_DECISION");
  const deniedDecisionRows = rows.filter((row) => row.outcome === "DENY");
  const pageSize = filters.limit ?? DEFAULT_LIMIT;

  return Object.freeze({
    canEdit: false,
    filters,
    rows: Object.freeze(rows),
    pagination: Object.freeze({
      page: filters.page ?? DEFAULT_PAGE,
      pageSize,
      hasPreviousPage: (filters.page ?? DEFAULT_PAGE) > 1,
      hasNextPage: rows.length === pageSize,
      previousHref: buildAuditLogViewerHref(filters, {
        page: Math.max(1, (filters.page ?? DEFAULT_PAGE) - 1),
      }),
      nextHref: buildAuditLogViewerHref(filters, {
        page: (filters.page ?? DEFAULT_PAGE) + 1,
      }),
    }),
    summary: Object.freeze({
      totalCount: rows.length,
      accessDecisionCount: accessDecisionRows.length,
      deniedDecisionCount: deniedDecisionRows.length,
    }),
  });
}

/**
 * @param {Record<string, unknown>} input
 * @returns {import("@coritech/domain/audit/audit-log.d.ts").AuditLogListFilters}
 */
export function normalizeAuditLogFilters(input) {
  const action = normalizeOptionalString(input.action);
  const limit = normalizeLimit(input.limit);

  return Object.freeze({
    objectType: normalizeOptionalString(input.objectType) ?? undefined,
    objectId: normalizeOptionalString(input.objectId) ?? undefined,
    actorUserId: normalizeOptionalString(input.actorUserId) ?? undefined,
    actorOrganizationId: normalizeOptionalString(input.actorOrganizationId) ??
      undefined,
    fromOccurredAt: normalizeOptionalString(input.fromOccurredAt) ?? undefined,
    toOccurredAt: normalizeOptionalString(input.toOccurredAt) ?? undefined,
    action: AUDIT_LOG_ACTIONS.includes(
      /** @type {import("@coritech/domain/audit/audit-log.d.ts").AuditLogAction} */ (
        action
      ),
    )
      ? /** @type {import("@coritech/domain/audit/audit-log.d.ts").AuditLogAction} */ (
        action
      )
      : undefined,
    limit,
    page: normalizePage(input.page),
  });
}

/**
 * @param {import("@coritech/domain/audit/audit-log.d.ts").AuditLogListFilters} filters
 * @param {{ page?: number }} [override]
 * @returns {string}
 */
export function buildAuditLogViewerHref(filters, override = {}) {
  const normalized = normalizeAuditLogFilters({
    ...filters,
    page: override.page ?? filters.page,
  });
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(normalized)) {
    if (value === undefined || value === "" || value === null) {
      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();

  return query ? `/app/admin/audit?${query}` : "/app/admin/audit";
}

/**
 * @param {import("@coritech/domain/audit/audit-log.d.ts").AuditLog} auditLog
 * @returns {import("./audit-log-viewer.d.ts").AuditLogViewerRow}
 */
function toAuditLogRow(auditLog) {
  const outcome = normalizeOptionalString(auditLog.metadata.accessOutcome);

  return Object.freeze({
    id: auditLog.id,
    occurredAt: auditLog.occurredAt,
    action: auditLog.action,
    actionLabel: formatAuditLabel(auditLog.action),
    sourceAction: auditLog.sourceAction,
    actorUserId: auditLog.actorUserId,
    actorRoleCode: auditLog.actorRoleCode,
    actorOrganizationId: auditLog.actorOrganizationId,
    objectType: auditLog.objectType,
    objectId: auditLog.objectId,
    objectLabel: `${auditLog.objectType} ${auditLog.objectId}`,
    outcome,
    outcomeLabel: outcome ? formatAuditLabel(outcome) : "Recorded",
    objectRef: formatJsonBlock(auditLog.objectRef),
    previousValues: formatJsonBlock(auditLog.previousValues),
    newValues: formatJsonBlock(auditLog.newValues),
    metadata: formatJsonBlock(auditLog.metadata),
    reason: auditLog.reason,
    requestLabel: formatRequestLabel(auditLog),
  });
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatAuditLabel(value) {
  return String(value ?? "unknown")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * @param {import("@coritech/domain/audit/audit-log.d.ts").AuditLog} auditLog
 * @returns {string}
 */
function formatRequestLabel(auditLog) {
  const requestParts = [auditLog.ipAddress, auditLog.userAgent]
    .map(normalizeOptionalString)
    .filter(Boolean);

  return requestParts.length > 0 ? requestParts.join(" / ") : "Not recorded";
}

/**
 * @param {unknown} value
 * @returns {string | null}
 */
function normalizeOptionalString(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizeLimit(value) {
  const limit = typeof value === "number" ? value : Number(value);

  return Number.isInteger(limit) && limit >= 1 && limit <= 200
    ? limit
    : DEFAULT_LIMIT;
}

/**
 * @param {unknown} value
 * @returns {number}
 */
function normalizePage(value) {
  const page = typeof value === "number" ? value : Number(value);

  return Number.isInteger(page) && page >= 1 ? page : DEFAULT_PAGE;
}

/**
 * @param {Readonly<Record<string, unknown>> | null} value
 * @returns {string}
 */
function formatJsonBlock(value) {
  if (!value || Object.keys(value).length === 0) {
    return "{}";
  }

  return JSON.stringify(value, null, 2);
}
