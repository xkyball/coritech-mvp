import type {
  AuditLog,
  AuditRequestContext,
} from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type { SemenOrderLike } from "@coritech/domain/orders/semen-order.d.ts";
import type {
  Shipment,
  ShipmentNotificationHook,
  ShipmentProofHook,
  ShipmentRepository,
  ShipmentStatus,
  ShipmentTrackingAuditHook,
  ShipmentTrackingEvent,
} from "@coritech/domain/shipments/shipment.d.ts";

export type ShipmentManagementOperation = "CREATE" | "UPDATE";
export type ShipmentManagementViewState = "FORM" | "ERROR";

export interface ShipmentManagementActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface ShipmentManagementFormInput {
  action?: string | null;
  providerName?: string | null;
  providerTrackingId?: string | null;
  trackingUrl?: string | null;
  status?: ShipmentStatus | string | null;
  eventSource?: string | null;
  providerStatus?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface ShipmentManagementFormState {
  action: "create" | "update";
  providerName: string;
  providerTrackingId: string;
  trackingUrl: string;
  status: ShipmentStatus;
  eventSource: "MANUAL" | "LOGISTICS_PROVIDER" | "SYSTEM";
  providerStatus: string;
  location: string;
  notes: string;
}

export interface ShipmentManagementInput {
  actor: ShipmentManagementActorContext;
  organizationId?: string | null;
  organizationName?: string | null;
  order: SemenOrderLike;
  shipment?: Shipment | null;
  trackingEvents?: ShipmentTrackingEvent[];
  form?: ShipmentManagementFormInput;
  validationIssues?: string[];
  actionFeedback?: ShipmentManagementActionFeedback;
}

export interface ShipmentManagementActionFeedback {
  tone: "success" | "danger";
  title: string;
  message: string;
}

export interface ShipmentManagementNavigation {
  dashboardHref: string;
  orderManagementHref: string;
  shipmentManagementHref: string;
}

export interface ShipmentManagementViewModel {
  state: "FORM";
  actorUserId: string;
  organizationContext: {
    organizationId: string;
    organizationName: string;
    roleCode: "BREEDING_STATION";
  };
  title: string;
  summary: string;
  operation: ShipmentManagementOperation;
  order: {
    id: string | null;
    orderNumber: string;
    status: string;
    requestedDeliveryDate: string | null;
  };
  shipment: Shipment | null;
  trackingEvents: readonly ShipmentTrackingEvent[];
  form: ShipmentManagementFormState;
  validationIssues: readonly string[];
  actionFeedback: ShipmentManagementActionFeedback | null;
  navigation: ShipmentManagementNavigation;
  statuses: readonly ShipmentStatus[];
  eventSources: readonly ("MANUAL" | "LOGISTICS_PROVIDER" | "SYSTEM")[];
}

export interface ShipmentManagementErrorViewModel {
  state: "ERROR";
  title: string;
  message: string;
}

export type ShipmentManagementRenderableViewModel =
  | ShipmentManagementViewModel
  | ShipmentManagementErrorViewModel;

export type ExecuteShipmentManagementActionInput = {
  action: string | null;
  actor: ShipmentManagementActorContext;
  orderId: string | null;
  shipmentId: string | null;
  repository: ShipmentRepository;
  form: ShipmentManagementFormInput;
  auditContext?: AuditRequestContext | null;
  transaction?: <T>(
    operation: (repository?: ShipmentRepository) => Promise<T>,
  ) => Promise<T>;
};

export type ConfirmShipmentReceivedActionInput = {
  actor: ShipmentManagementActorContext;
  shipmentId: string | null;
  repository: ShipmentRepository;
  notes?: string | null;
  auditContext?: AuditRequestContext | null;
  transaction?: <T>(
    operation: (repository?: ShipmentRepository) => Promise<T>,
  ) => Promise<T>;
};

export type ExecuteShipmentManagementActionResult =
  | {
      ok: true;
      action: "create" | "update";
      shipment: Shipment;
      trackingEvent: ShipmentTrackingEvent;
      auditHook: ShipmentTrackingAuditHook;
      auditLog: AuditLog;
      proofHook: ShipmentProofHook;
      proofResult: unknown;
      notificationHook: ShipmentNotificationHook | null;
    }
  | {
      ok: false;
      action: string;
      orderId: string;
      shipmentId: string;
      issues: readonly string[];
    };

export declare const SHIPMENT_MANAGEMENT_ROUTES: Readonly<{
  dashboard: string;
  orderManagement: string;
  shipmentManagement: string;
}>;

export declare class ShipmentManagementValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class ShipmentManagementAuthorizationError extends Error {
  constructor(message: string);
}

export declare function createShipmentManagementViewModel(
  input: ShipmentManagementInput,
): ShipmentManagementViewModel;

export declare function createShipmentManagementErrorState(
  error: unknown,
): ShipmentManagementErrorViewModel;

export declare function executeShipmentManagementAction(
  input: ExecuteShipmentManagementActionInput,
): Promise<ExecuteShipmentManagementActionResult>;

export declare function confirmShipmentReceivedAction(
  input: ConfirmShipmentReceivedActionInput,
): Promise<ExecuteShipmentManagementActionResult>;
