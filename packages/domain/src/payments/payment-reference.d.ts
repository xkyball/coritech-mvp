import type { AuditLog, AuditRequestContext } from "../audit/audit-log.d.ts";
import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";

export type PaymentReferenceStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export interface PaymentReferenceActorContext {
  userId: string;
  roles: UserOrganizationRoleLike[];
}

export interface PaymentReferenceOrderRef {
  id: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
}

export interface PaymentReferenceLike {
  id: string | null;
  semenOrderId: string;
  orderNumber: string;
  breederOrganizationId: string;
  breedingStationOrganizationId: string;
  providerName: string | null;
  providerReferenceId: string | null;
  status: PaymentReferenceStatus;
  amount: number | null;
  currency: string | null;
  createdByUserId: string;
  updatedByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentReference = PaymentReferenceLike;

export interface CreatePaymentReferenceInput extends Record<string, unknown> {
  actor: PaymentReferenceActorContext;
  order: PaymentReferenceOrderRef;
  paymentReferenceId?: string | null;
  providerName?: string | null;
  providerReferenceId?: string | null;
  status?: PaymentReferenceStatus | string | null;
  amount?: number | null;
  currency?: string | null;
  reason?: string | null;
  createdAt?: string | Date;
  now?: string | Date;
}

export interface UpdatePaymentReferenceStatusInput extends Record<string, unknown> {
  actor: PaymentReferenceActorContext;
  existingPaymentReference: PaymentReferenceLike;
  status: PaymentReferenceStatus | string;
  providerName?: string | null;
  providerReferenceId?: string | null;
  amount?: number | null;
  currency?: string | null;
  reason?: string | null;
  now?: string | Date;
}

export interface PreparedPaymentReferenceChange {
  paymentReference: PaymentReference;
  actorRole: UserOrganizationRoleLike;
  reason: string | null;
  occurredAt: string;
}

export type PaymentReferenceAuditAction =
  | "PAYMENT_REFERENCE_CREATED"
  | "PAYMENT_REFERENCE_STATUS_UPDATED";

export interface PaymentReferenceAuditHookInput {
  action: PaymentReferenceAuditAction;
  actorRole: UserOrganizationRoleLike;
  paymentReference: PaymentReferenceLike;
  previousPaymentReference: PaymentReferenceLike | null;
  reason: string | null;
  occurredAt: string;
}

export interface PaymentReferenceAuditHook {
  eventType: "PAYMENT_REFERENCE";
  action: PaymentReferenceAuditAction;
  actorUserId: string;
  actorRoleCode: string;
  actorOrganizationId: string;
  targetType: "PaymentReference";
  targetId: string | null;
  targetRef: Readonly<Record<string, unknown>>;
  previousValue: Readonly<Record<string, unknown>> | null;
  newValue: Readonly<Record<string, unknown>>;
  reason: string | null;
  occurredAt: string;
}

export interface PaymentReferenceRepository {
  createPaymentReference(paymentReference: PaymentReference): Promise<PaymentReference>;
  findPaymentReferenceById(paymentReferenceId: string): Promise<PaymentReference | null>;
  updatePaymentReference(paymentReference: PaymentReference): Promise<PaymentReference>;
  createAuditLog(auditLog: AuditLog): Promise<AuditLog>;
}

export interface PaymentReferenceServiceOptions {
  repository: PaymentReferenceRepository;
  auditContext?: AuditRequestContext | null;
}

export interface CreatePaymentReferenceCommand extends CreatePaymentReferenceInput {}

export interface UpdatePaymentReferenceStatusCommand {
  actor: PaymentReferenceActorContext;
  paymentReferenceId: string;
  status: PaymentReferenceStatus | string;
  providerName?: string | null;
  providerReferenceId?: string | null;
  amount?: number | null;
  currency?: string | null;
  reason?: string | null;
  now?: string | Date;
}

export interface PaymentReferenceServiceResult {
  paymentReference: PaymentReference;
  auditHook: PaymentReferenceAuditHook;
  auditLog: AuditLog;
}

export declare const PAYMENT_REFERENCE_STATUSES: readonly PaymentReferenceStatus[];

export declare class PaymentReferenceValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class PaymentReferenceAuthorizationError extends Error {
  constructor(message: string);
}

export declare class PaymentReferenceService {
  constructor(options: PaymentReferenceServiceOptions);
  createPaymentReference(
    command: CreatePaymentReferenceCommand,
  ): Promise<PaymentReferenceServiceResult>;
  updatePaymentReferenceStatus(
    command: UpdatePaymentReferenceStatusCommand,
  ): Promise<PaymentReferenceServiceResult>;
}

export declare function createPaymentReferenceService(
  options: PaymentReferenceServiceOptions,
): PaymentReferenceService;
export declare function isPaymentReferenceStatus(
  value: unknown,
): value is PaymentReferenceStatus;
export declare function validateCreatePaymentReferenceInput(
  input: CreatePaymentReferenceInput,
): string[];
export declare function prepareCreatePaymentReference(
  input: CreatePaymentReferenceInput,
): PreparedPaymentReferenceChange;
export declare function validateUpdatePaymentReferenceStatusInput(
  input: UpdatePaymentReferenceStatusInput,
): string[];
export declare function prepareUpdatePaymentReferenceStatus(
  input: UpdatePaymentReferenceStatusInput,
): PreparedPaymentReferenceChange;
export declare function buildPaymentReferenceAuditHook(
  input: PaymentReferenceAuditHookInput,
): PaymentReferenceAuditHook;
