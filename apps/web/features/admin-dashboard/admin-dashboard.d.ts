import type { AuditLog, AuditRequestContext } from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type { SemenOrder } from "@coritech/domain/orders/semen-order.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";
import type { Shipment } from "@coritech/domain/shipments/shipment.d.ts";
import type { Document } from "@coritech/domain/documents/document-evidence.d.ts";
import type { SupportRequest } from "@coritech/domain/support/support-request.d.ts";
import type { Amendment } from "@coritech/domain/amendments/amendment.d.ts";
import type { NotificationEmailDeliveryLog } from "@coritech/domain/notifications/email-provider.d.ts";
import type { OrderStatusHistory } from "@coritech/domain/orders/semen-order.d.ts";
import type { ActionRequiredItem } from "../action-required/action-required.d.ts";
import type { OperationalReportingViewModel } from "../operational-reporting/operational-reporting.d.ts";

export interface AdminDashboardActorContext {
  userId: string;
  organizationId: string;
  organizationName: string;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface AdminDashboardInput {
  actor: AdminDashboardActorContext;
  orders?: readonly SemenOrder[];
  activeListingCount?: number;
  shipments?: readonly Shipment[];
  documents?: readonly Document[];
  proofEvents?: readonly ProofEvent[];
  orderStatusHistory?: readonly OrderStatusHistory[];
  supportRequests?: readonly SupportRequest[];
  amendments?: readonly Amendment[];
  notificationLogs?: readonly NotificationEmailDeliveryLog[];
  auditLogs?: readonly AuditLog[];
  actionItemsLimit?: number | null;
  generatedAt?: string | Date;
}

export interface AdminDashboardMetric {
  label: string;
  value: number;
  meta: string;
}

export interface AdminDashboardOrderStatusSummary {
  status: string;
  label: string;
  count: number;
  href: string;
}

export interface AdminDashboardRecentOrder {
  id: string | null;
  orderNumber: string;
  status: string;
  updatedAt: string;
  href: string;
}

export interface AdminDashboardNavigationArea {
  key: string;
  label: string;
  href: string;
  status: "available" | "planned";
}

export interface AdminDashboardSection<TItem> {
  title: string;
  emptyMessage: string;
  items: readonly TItem[];
}

export interface AdminDashboardViewModel {
  state: "READY";
  routes: typeof ADMIN_DASHBOARD_ROUTES;
  canAccess: boolean;
  organizationContext: {
    organizationId: string;
    organizationName: string;
    roleLabel: "Platform Admin";
  };
  metrics: readonly AdminDashboardMetric[];
  operationalReport: OperationalReportingViewModel;
  orderStatusSummary: readonly AdminDashboardOrderStatusSummary[];
  recentOrders: readonly AdminDashboardRecentOrder[];
  actionRequired: AdminDashboardSection<ActionRequiredItem>;
  navigationAreas: readonly AdminDashboardNavigationArea[];
  orderSearch: {
    action: "/app/admin/orders";
    queryParam: "query";
    statusParam: "status";
  };
  auditLogHref: "/app/admin/audit";
  amendmentCreateHref: "/app/admin/amendments/new";
  auditLogging: {
    dashboardViewsLogged: true;
    mutationActionsLoggedByWorkflow: true;
    note: string;
  };
  limitations: {
    amendmentWorkflowAvailable: boolean;
    reason: string;
  };
}

export interface AdminDashboardAuditRepository {
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
}

export declare const ADMIN_DASHBOARD_ROUTES: Readonly<{
  overview: "/app/admin";
  orders: "/app/admin/orders";
  proof: "/app/admin/proof";
  audit: "/app/admin/audit";
  support: "/app/admin/support";
  permissions: "/app/admin/permissions";
  invitations: "/app/admin/invitations";
  documents: "/app/documents/upload";
  amendments: "/app/admin/amendments";
  amendmentsNew: "/app/admin/amendments/new";
}>;
export declare const ADMIN_DASHBOARD_NAVIGATION_AREAS: readonly AdminDashboardNavigationArea[];
export declare function canAccessAdminDashboard(
  actor: AdminDashboardActorContext,
): boolean;
export declare function createAdminDashboardViewModel(
  input: AdminDashboardInput,
): AdminDashboardViewModel;
export declare function prepareAdminDashboardAuditLog(input: {
  actor: AdminDashboardActorContext;
  auditLogId?: string | null;
  requestContext?: AuditRequestContext | null;
  handlerName?: string;
  now?: string | Date;
}): AuditLog;
export declare function recordAdminDashboardAccess(input: {
  actor: AdminDashboardActorContext;
  repository: AdminDashboardAuditRepository;
  requestContext?: AuditRequestContext | null;
  handlerName?: string;
  now?: string | Date;
}): Promise<AuditLog>;
export declare function formatLabel(value: unknown): string;
