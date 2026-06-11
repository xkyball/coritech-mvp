import type { AuditRequestContext } from "../audit/audit-log.d.ts";
import type {
  CreatePaymentReferenceCommand,
  PaymentReferenceRepository,
  PaymentReferenceServiceResult,
  UpdatePaymentReferenceStatusCommand,
} from "./payment-reference.d.ts";

export type PaymentProviderAdapterKind =
  | "manual_reference"
  | "provider_placeholder";

export interface PaymentProviderAdapterRuntimeConfig {
  provider: PaymentProviderAdapterKind | string;
  providerName?: string | null;
}

export interface CreatePaymentProviderAdapterOptions {
  repository?: PaymentReferenceRepository | null;
  auditContext?: AuditRequestContext | null;
}

export interface CreateManualPaymentProviderAdapterInput {
  repository?: PaymentReferenceRepository | null;
  auditContext?: AuditRequestContext | null;
  providerName?: string | null;
}

export interface CreatePlaceholderPaymentProviderAdapterInput {
  providerName?: string | null;
}

export interface PaymentProviderAdapter {
  providerKind: PaymentProviderAdapterKind;
  providerName: string;
  supportsRealProcessing: false;
  storesSensitivePaymentData: false;
  createPaymentReference(
    command: CreatePaymentReferenceCommand,
  ): Promise<PaymentReferenceServiceResult>;
  updatePaymentReferenceStatus(
    command: UpdatePaymentReferenceStatusCommand,
  ): Promise<PaymentReferenceServiceResult>;
}

export declare const PAYMENT_PROVIDER_ADAPTER_KINDS: readonly PaymentProviderAdapterKind[];

export declare class PaymentProviderAdapterConfigError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class PaymentProviderAdapterUnavailableError extends Error {
  readonly providerName: string;
  constructor(providerName: string);
}

export declare function createPaymentProviderAdapter(
  config: PaymentProviderAdapterRuntimeConfig,
  options?: CreatePaymentProviderAdapterOptions,
): PaymentProviderAdapter;
export declare function createManualPaymentProviderAdapter(
  input: CreateManualPaymentProviderAdapterInput,
): PaymentProviderAdapter;
export declare function createPlaceholderPaymentProviderAdapter(
  input?: CreatePlaceholderPaymentProviderAdapterInput,
): PaymentProviderAdapter;
export declare function validatePaymentProviderAdapterRuntimeConfig(
  config?: PaymentProviderAdapterRuntimeConfig,
): string[];
