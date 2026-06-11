// @ts-check

import { prepareAuditLogEntry } from "@coritech/domain/audit/audit-log.mjs";
import { isActiveRoleAssignment } from "@coritech/domain/identity/role-model.mjs";
import { createAdminActionRequiredItems } from "../action-required/action-required.mjs";
import { createOperationalReportingViewModel } from "../operational-reporting/operational-reporting.mjs";

export const ADMIN_DASHBOARD_ROUTES = Object.freeze({
  overview: "/app/admin",
  orders: "/app/admin/orders",
  proof: "/app/admin/proof",
  audit: "/app/admin/audit",
  support: "/app/admin/support",
  permissions: "/app/admin/permissions",
  invitations: "/app/admin/invitations",
  documents: "/app/documents/upload",
  amendments: "/app/admin/amendments",
  amendmentsNew: "/app/admin/amendments/new",
});

export const ADMIN_DASHBOARD_NAVIGATION_AREAS = Object.freeze([
  Object.freeze({
    key: "users",
    label: "Users",
    href: "/app/admin/users",
    status: "available",
  }),
  Object.freeze({
    key: "invitations",
    label: "Invitations",
    href: ADMIN_DASHBOARD_ROUTES.invitations,
    status: "available",
  }),
  Object.freeze({
    key: "organizations",
    label: "Organizations",
    href: "/app/admin/organizations",
    status: "available",
  }),
  Object.freeze({
    key: "roles",
    label: "Roles",
    href: "/app/admin/roles",
    status: "available",
  }),
  Object.freeze({
    key: "listings",
    label: "Listings",
    href: "/app/admin/listings",
    status: "planned",
  }),
  Object.freeze({
    key: "orders",
    label: "Orders",
    href: ADMIN_DASHBOARD_ROUTES.orders,
    status: "available",
  }),
  Object.freeze({
    key: "support",
    label: "Support requests",
    href: ADMIN_DASHBOARD_ROUTES.support,
    status: "available",
  }),
  Object.freeze({
    key: "shipments",
    label: "Shipments",
    href: "/app/admin/shipments",
    status: "planned",
  }),
  Object.freeze({
    key: "documents",
    label: "Documents",
    href: ADMIN_DASHBOARD_ROUTES.documents,
    status: "available",
  }),
  Object.freeze({
    key: "proof",
    label: "Proof events",
    href: ADMIN_DASHBOARD_ROUTES.proof,
    status: "available",
  }),
  Object.freeze({
    key: "audit",
    label: "Audit logs",
    href: ADMIN_DASHBOARD_ROUTES.audit,
    status: "available",
  }),
  Object.freeze({
    key: "amendments",
    label: "Amendments",
    href: ADMIN_DASHBOARD_ROUTES.amendments,
    status: "available",
  }),
]);

/**
 * @param {import("./admin-dashboard.d.ts").AdminDashboardActorContext} actor
 * @returns {boolean}
 */
export function canAccessAdminDashboard(actor) {
  return Boolean(actor?.roles?.some((role) =>
    role.userId === actor.userId &&
    role.roleCode === "PLATFORM_ADMIN" &&
    isActiveRoleAssignment(role)
  ));
}

/**
 * @param {import("./admin-dashboard.d.ts").AdminDashboardInput} input
 * @returns {import("./admin-dashboard.d.ts").AdminDashboardViewModel}
 */
export function createAdminDashboardViewModel(input) {
  const orders = input.orders ?? [];
  const orderCounts = countOrdersByStatus(orders);
  const actionRequired = createAdminActionRequiredItems({
    actor: input.actor,
    supportRequests: input.supportRequests ?? [],
    amendments: input.amendments ?? [],
    notificationLogs: input.notificationLogs ?? [],
    limit: input.actionItemsLimit ?? 8,
  });
  const operationalReport = createOperationalReportingViewModel({
    activeListingCount: input.activeListingCount ?? 0,
    orders,
    orderStatusHistory: input.orderStatusHistory ?? [],
    shipments: input.shipments ?? [],
    documents: input.documents ?? [],
    proofEvents: input.proofEvents ?? [],
    generatedAt: input.generatedAt,
  });

  return Object.freeze({
    state: "READY",
    routes: ADMIN_DASHBOARD_ROUTES,
    canAccess: canAccessAdminDashboard(input.actor),
    organizationContext: Object.freeze({
      organizationId: input.actor.organizationId,
      organizationName: input.actor.organizationName,
      roleLabel: "Platform Admin",
    }),
    metrics: Object.freeze([
      metric("Orders", orders.length, "All semen orders visible to Platform Admin support."),
      metric(
        "Active listings",
        input.activeListingCount ?? 0,
        "Orderable active or limited listings.",
      ),
      metric("Shipments", input.shipments?.length ?? 0, "Shipment records in the workflow."),
      metric("Documents", input.documents?.length ?? 0, "Controlled uploaded evidence records."),
      metric("Proof events", input.proofEvents?.length ?? 0, "Recorded proof-chain events."),
      metric("Support requests", input.supportRequests?.length ?? 0, "Open and recent admin support queue items."),
      metric("Audit logs", input.auditLogs?.length ?? 0, "Recent audit evidence rows."),
    ]),
    operationalReport,
    orderStatusSummary: Object.freeze(
      Object.entries(orderCounts).map(([status, count]) =>
        Object.freeze({
          status,
          label: formatLabel(status),
          count,
          href: `${ADMIN_DASHBOARD_ROUTES.orders}?status=${encodeURIComponent(status)}`,
        })
      ),
    ),
    recentOrders: Object.freeze(
      [...orders]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)
        .map((order) =>
          Object.freeze({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            updatedAt: order.updatedAt,
            href: `${ADMIN_DASHBOARD_ROUTES.orders}/${order.id ?? ""}`,
          })
        ),
    ),
    actionRequired: Object.freeze({
      title: "Action required",
      emptyMessage: "No admin action is currently required.",
      items: Object.freeze(actionRequired),
    }),
    navigationAreas: ADMIN_DASHBOARD_NAVIGATION_AREAS,
    orderSearch: Object.freeze({
      action: ADMIN_DASHBOARD_ROUTES.orders,
      queryParam: "query",
      statusParam: "status",
    }),
    auditLogHref: ADMIN_DASHBOARD_ROUTES.audit,
    amendmentCreateHref: ADMIN_DASHBOARD_ROUTES.amendmentsNew,
    auditLogging: Object.freeze({
      dashboardViewsLogged: true,
      mutationActionsLoggedByWorkflow: true,
      note:
        "Dashboard views are logged as access decisions; grant, revoke and amendment mutations are logged by their workflow services.",
    }),
    limitations: Object.freeze({
      amendmentWorkflowAvailable: true,
      reason:
        "Platform admins create controlled correction evidence from the amendment workspace.",
    }),
  });
}

/**
 * @param {{
 *   actor: import("./admin-dashboard.d.ts").AdminDashboardActorContext,
 *   handlerName?: string,
 *   now?: string | Date,
 * }} input
 * @returns {import("@coritech/domain/audit/audit-log.d.ts").AuditLog}
 */
export function prepareAdminDashboardAuditLog(input) {
  return prepareAuditLogEntry({
    auditLogId: input.auditLogId,
    actorUserId: input.actor.userId,
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: input.actor.organizationId,
    action: "ACCESS_DECISION",
    sourceAction: "ADMIN_DASHBOARD_VIEW",
    objectType: "AdminDashboard",
    objectId: input.actor.organizationId,
    objectRef: {
      organizationName: input.actor.organizationName,
      route: ADMIN_DASHBOARD_ROUTES.overview,
    },
    previousValues: null,
    newValues: {
      outcome: "ALLOW",
      allowed: true,
      status: null,
    },
    reason: "Platform admin opened the operational overview.",
    ipAddress: input.requestContext?.ipAddress,
    userAgent: input.requestContext?.userAgent,
    metadata: {
      handlerName: input.handlerName ?? "adminDashboard",
      source: "ADMIN_DASHBOARD",
      deferred: false,
    },
    occurredAt: toIsoTimestamp(input.now ?? new Date()),
  });
}

/**
 * @param {{
 *   actor: import("./admin-dashboard.d.ts").AdminDashboardActorContext,
 *   repository: import("./admin-dashboard.d.ts").AdminDashboardAuditRepository,
 *   requestContext?: import("@coritech/domain/audit/audit-log.d.ts").AuditRequestContext | null,
 *   handlerName?: string,
 *   now?: string | Date,
 * }} input
 * @returns {Promise<import("@coritech/domain/audit/audit-log.d.ts").AuditLog>}
 */
export async function recordAdminDashboardAccess(input) {
  const auditLog = prepareAdminDashboardAuditLog(input);

  return input.repository.createAuditLog(auditLog);
}

/**
 * @param {unknown} value
 * @returns {string}
 */
export function formatLabel(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

/**
 * @param {string} label
 * @param {number} value
 * @param {string} meta
 */
function metric(label, value, meta) {
  return Object.freeze({
    label,
    value,
    meta,
  });
}

/**
 * @param {readonly import("@coritech/domain/orders/semen-order.d.ts").SemenOrder[]} orders
 */
function countOrdersByStatus(orders) {
  /** @type {Record<string, number>} */
  const counts = {};

  for (const order of orders) {
    counts[order.status] = (counts[order.status] ?? 0) + 1;
  }

  return counts;
}

/**
 * @param {string | Date} value
 * @returns {string}
 */
function toIsoTimestamp(value) {
  const date = value instanceof Date ? value : new Date(value);

  return date.toISOString();
}
