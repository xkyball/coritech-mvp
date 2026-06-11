import type {
  AuditRequestContext,
} from "@coritech/domain/audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";
import type {
  CreatePaymentReferenceCommand,
  PaymentReferenceLike,
  PaymentReferenceRepository,
  PaymentReferenceServiceResult,
  PaymentReferenceStatus,
  UpdatePaymentReferenceStatusCommand,
} from "@coritech/domain/payments/payment-reference.d.ts";

export interface PaymentReferenceActorContext {
  userId: string;
  organizationId?: string;
  organizationName?: string;
  roleCode?: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface PaymentReferenceOrderContext {
  id: string | null;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
}

export interface PaymentReferencePanelFeedback {
  tone: "success" | "danger";
  title: string;
  message: string;
}

export interface PaymentReferencePanelInput {
  actor: PaymentReferenceActorContext;
  order: PaymentReferenceOrderContext;
  paymentReference?: PaymentReferenceLike | null;
  feedback?: PaymentReferencePanelFeedback;
  returnTo?: string | null;
}

export interface PaymentReferenceDisplayRow {
  label: string;
  value: string;
}

export interface PaymentReferenceMaintenanceFormViewModel {
  orderId: string;
  paymentReferenceId: string | null;
  returnTo: string | null;
  submitLabel: string;
  statusOptions: readonly {
    value: PaymentReferenceStatus;
    label: string;
  }[];
  values: {
    status: PaymentReferenceStatus;
    providerName: string;
    providerReferenceId: string;
    amount: string;
    currency: string;
    reason: string;
  };
  fieldNames: readonly string[];
}

export interface PaymentReferencePanelViewModel {
  title: string;
  summary: string;
  status: PaymentReferenceStatus;
  statusLabel: string;
  statusDescription: string | null;
  referenceOnlyNotice: string;
  settlementNotice: string;
  paymentReferenceId: string | null;
  displayRows: readonly PaymentReferenceDisplayRow[];
  feedback: PaymentReferencePanelFeedback | null;
  maintenance: {
    canMaintain: boolean;
    deniedReason: string | null;
    form: PaymentReferenceMaintenanceFormViewModel | null;
  };
}

export interface PaymentReferenceMaintenanceAccessInput {
  actor: PaymentReferenceActorContext;
  order: PaymentReferenceOrderContext;
}

export type PaymentReferenceFormValuesInput =
  | FormData
  | URLSearchParams
  | Record<string, unknown>;

export interface PaymentReferenceFormValues {
  status: PaymentReferenceStatus;
  providerName: string | null;
  providerReferenceId: string | null;
  amount: number | null;
  currency: string | null;
  reason: string | null;
}

export interface PaymentReferenceMutationInput {
  actor: PaymentReferenceActorContext;
  order: PaymentReferenceOrderContext;
  existingPaymentReference?: PaymentReferenceLike | null;
  values: PaymentReferenceFormValuesInput;
  now?: string | Date;
}

export type PaymentReferenceMutationCommand =
  | {
      kind: "create";
      command: CreatePaymentReferenceCommand;
    }
  | {
      kind: "update";
      command: UpdatePaymentReferenceStatusCommand;
    };

export interface ExecutePaymentReferenceMutationInput
  extends PaymentReferenceMutationInput {
  repository: PaymentReferenceRepository;
  auditContext?: AuditRequestContext | null;
}

export declare const PAYMENT_REFERENCE_ROUTES: Readonly<{
  stationOrders: "/app/station/orders";
  adminOrders: "/app/admin/orders";
}>;

export declare const PAYMENT_REFERENCE_SENSITIVE_FIELD_NAMES: readonly string[];

export declare class PaymentReferenceUiAuthorizationError extends Error {
  constructor(message: string);
}

export declare class PaymentReferenceUiValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function createPaymentReferencePanelViewModel(
  input: PaymentReferencePanelInput,
): PaymentReferencePanelViewModel;
export declare function canViewPaymentReference(
  input: PaymentReferenceMaintenanceAccessInput,
): boolean;
export declare function canMaintainPaymentReference(
  input: PaymentReferenceMaintenanceAccessInput,
): boolean;
export declare function authorizePaymentReferenceMaintenance(
  input: PaymentReferenceMaintenanceAccessInput,
): void;
export declare function buildPaymentReferenceMutationCommand(
  input: PaymentReferenceMutationInput,
): PaymentReferenceMutationCommand;
export declare function executePaymentReferenceMutation(
  input: ExecutePaymentReferenceMutationInput,
): Promise<PaymentReferenceServiceResult>;
export declare function normalizePaymentReferenceFormValues(
  input: PaymentReferenceFormValuesInput,
): PaymentReferenceFormValues;
export declare function validatePaymentReferencePanelInput(
  input?: PaymentReferencePanelInput,
): string[];
