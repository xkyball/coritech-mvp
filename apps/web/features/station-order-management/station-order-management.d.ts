import type {
  AuditLog,
  AuditRequestContext,
} from "@coritech/domain/audit/audit-log.d.ts";
import type {
  OrderNotificationHook,
  OrderStatusHistory,
  OrderServiceOptions,
  OrderServiceNotificationService,
  OrderServiceProofService,
  SemenOrder,
  SemenOrderProofHook,
  SemenOrderRepository,
  SemenOrderStatusAuditHook,
} from "@coritech/domain/orders/semen-order.d.ts";
import type {
  StationDashboardActionItem,
  StationDashboardActorContext,
  StationDashboardInput,
  StationDashboardNavigation,
  StationDashboardOrderRow,
  StationDashboardSelectedOrder,
} from "../station-dashboard/station-dashboard.d.ts";

export type StationOrderManagementAction =
  | "receive"
  | "confirm"
  | "reject"
  | "move_to_fulfilment";

export interface StationOrderActionFeedback {
  tone: "success" | "danger";
  title: string;
  message: string;
}

export interface StationOrderManagementInput extends StationDashboardInput {
  actionFeedback?: StationOrderActionFeedback;
}

export interface StationOrderCommandAction {
  id: string;
  action: StationOrderManagementAction;
  title: string;
  description: string;
  buttonLabel: string;
  tone: "primary" | "danger";
}

export interface StationOrderManagementSelectedOrder
  extends StationDashboardSelectedOrder {
  commandActions: readonly StationOrderCommandAction[];
  workflowActions: readonly StationDashboardActionItem[];
}

export interface StationOrderManagementViewModel {
  state: "READY";
  actorUserId: string;
  organizationContext: {
    organizationId: string;
    organizationName: string;
    roleCode: "BREEDING_STATION";
  };
  navigation: StationDashboardNavigation;
  orders: readonly StationDashboardOrderRow[];
  selectedOrder: StationOrderManagementSelectedOrder | StationDashboardOrderRow | null;
  actionFeedback: StationOrderActionFeedback | null;
  isEmpty: boolean;
}

export interface StationOrderActionInput {
  action: StationOrderManagementAction | string;
  actor: StationDashboardActorContext;
  orderId?: string | null;
  reason?: string | null;
  repository: SemenOrderRepository;
  auditContext?: AuditRequestContext | null;
  proofService?: OrderServiceProofService | null;
  notificationService?: OrderServiceNotificationService | null;
  transaction?: OrderServiceOptions["transaction"] | null;
  now?: string | Date;
}

export type StationOrderActionResult =
  | {
      ok: true;
      action: StationOrderManagementAction;
      order: SemenOrder;
      statusHistory: OrderStatusHistory | null;
      auditHook: SemenOrderStatusAuditHook | null;
      auditLog: AuditLog | null;
      proofHook: SemenOrderProofHook | null;
      notificationHook: OrderNotificationHook | null;
      idempotent: boolean;
    }
  | {
      ok: false;
      action: StationOrderManagementAction | "unknown";
      orderId: string;
      issues: readonly string[];
    };

export declare const STATION_ORDER_MANAGEMENT_ACTIONS: readonly StationOrderManagementAction[];
export declare const STATION_ORDER_MANAGEMENT_ROUTES: Readonly<{
  dashboard: string;
  listingManagement: string;
  orderManagement: string;
}>;

export declare function createStationOrderManagementViewModel(
  input: StationOrderManagementInput,
): StationOrderManagementViewModel;

export declare function executeStationOrderAction(
  input: StationOrderActionInput,
): Promise<StationOrderActionResult>;
