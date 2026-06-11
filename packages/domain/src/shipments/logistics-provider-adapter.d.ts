import type {
  AuditRequestContext,
} from "../audit/audit-log.d.ts";
import type {
  CreateShipmentTrackingEventInputBody,
  ShipmentRepository,
  ShipmentServiceAttachTrackingReferenceCommand,
  ShipmentServiceCommandResult,
  ShipmentServiceCreateCommand,
  ShipmentServiceNotificationService,
  ShipmentServiceOptions,
  ShipmentServiceProofService,
  ShipmentTrackingEventSource,
} from "./shipment.d.ts";

export type LogisticsProviderAdapterKind =
  | "manual"
  | "external_placeholder";

export interface LogisticsProviderAdapterRuntimeConfig {
  provider: LogisticsProviderAdapterKind | string;
  providerName?: string | null;
}

export interface CreateLogisticsProviderAdapterOptions {
  repository?: ShipmentRepository | null;
  auditContext?: AuditRequestContext | null;
  proofService?: ShipmentServiceProofService | null;
  notificationService?: ShipmentServiceNotificationService | null;
  transaction?: ShipmentServiceOptions["transaction"] | null;
}

export interface CreateManualLogisticsAdapterInput
  extends CreateLogisticsProviderAdapterOptions {
  providerName?: string | null;
}

export interface CreateExternalProviderAdapterInput {
  providerName?: string | null;
}

export interface LogisticsTrackingEventInput {
  toStatus?: string | null;
  providerName?: string | null;
  providerTrackingId?: string | null;
  trackingUrl?: string | null;
  eventSource?: ShipmentTrackingEventSource | string;
  sourceEventId?: string | null;
  providerStatus?: string | null;
  location?: string | null;
  notes?: string | null;
  occurredAt?: string | Date;
  now?: string | Date;
}

export interface NormalizeLogisticsTrackingEventOptions {
  defaultProviderName?: string | null;
  eventSource?: ShipmentTrackingEventSource;
}

export interface LogisticsProviderTrackingEventCommand {
  actor: ShipmentServiceAttachTrackingReferenceCommand["actor"];
  shipmentId: string;
  event: LogisticsTrackingEventInput;
}

export interface LogisticsProviderAdapter {
  providerKind: LogisticsProviderAdapterKind;
  providerName: string;
  supportsExternalAutomation: false;
  createShipment(command: ShipmentServiceCreateCommand): Promise<ShipmentServiceCommandResult>;
  attachTrackingReference(
    command: ShipmentServiceAttachTrackingReferenceCommand,
  ): Promise<ShipmentServiceCommandResult>;
  recordTrackingEvent(
    command: LogisticsProviderTrackingEventCommand,
  ): Promise<ShipmentServiceCommandResult>;
  normalizeTrackingEvent(
    event: LogisticsTrackingEventInput,
  ): CreateShipmentTrackingEventInputBody;
}

export declare const LOGISTICS_PROVIDER_ADAPTER_KINDS: readonly LogisticsProviderAdapterKind[];

export declare class LogisticsProviderAdapterConfigError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare class LogisticsProviderAdapterUnavailableError extends Error {
  readonly providerName: string;
  constructor(providerName: string);
}

export declare class LogisticsTrackingEventNormalizationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}

export declare function createLogisticsProviderAdapter(
  config: LogisticsProviderAdapterRuntimeConfig,
  options?: CreateLogisticsProviderAdapterOptions,
): LogisticsProviderAdapter;
export declare function createManualLogisticsAdapter(
  input: CreateManualLogisticsAdapterInput,
): LogisticsProviderAdapter;
export declare function createExternalProviderAdapter(
  input?: CreateExternalProviderAdapterInput,
): LogisticsProviderAdapter;
export declare function normalizeLogisticsTrackingEvent(
  input?: LogisticsTrackingEventInput,
  options?: NormalizeLogisticsTrackingEventOptions,
): CreateShipmentTrackingEventInputBody;
export declare function validateLogisticsProviderAdapterRuntimeConfig(
  config?: LogisticsProviderAdapterRuntimeConfig,
): string[];
