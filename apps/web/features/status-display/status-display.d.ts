import type { SemenOrderStatus } from "@coritech/domain/orders/semen-order.d.ts";
import type { ShipmentStatus } from "@coritech/domain/shipments/shipment.d.ts";
import type { ActivePhase1VerificationLevel } from "@coritech/domain/proof/verification-level.d.ts";

export type PaymentReferenceStatus =
  | "NOT_REQUIRED"
  | "PENDING"
  | "AUTHORIZED"
  | "PAID"
  | "FAILED"
  | "REFUNDED";

export type StatusDisplayKind =
  | "order"
  | "shipment"
  | "payment"
  | "verification";

export type StatusDisplayTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent";

export type StatusDisplayRoleCode =
  | "BREEDER"
  | "BREEDING_STATION"
  | "PLATFORM_ADMIN";

export type StatusDisplayCode =
  | SemenOrderStatus
  | ShipmentStatus
  | PaymentReferenceStatus
  | ActivePhase1VerificationLevel;

export interface StatusDisplayConfig {
  code: string;
  label: string;
  description: string;
  tone: StatusDisplayTone;
  nextActionHints: Readonly<Record<string, string>>;
}

export interface StatusDisplayCompletenessReport {
  order: readonly string[];
  shipment: readonly string[];
  payment: readonly string[];
  verification: readonly string[];
}

export declare const PAYMENT_REFERENCE_STATUSES: readonly PaymentReferenceStatus[];
export declare const STATUS_DISPLAY_KINDS: readonly StatusDisplayKind[];
export declare const ORDER_STATUS_DISPLAY: Readonly<Record<string, StatusDisplayConfig>>;
export declare const SHIPMENT_STATUS_DISPLAY: Readonly<Record<string, StatusDisplayConfig>>;
export declare const PAYMENT_STATUS_DISPLAY: Readonly<Record<string, StatusDisplayConfig>>;
export declare const VERIFICATION_STATUS_DISPLAY: Readonly<Record<string, StatusDisplayConfig>>;
export declare const STATUS_DISPLAY_CONFIG: Readonly<{
  order: Readonly<Record<string, StatusDisplayConfig>>;
  shipment: Readonly<Record<string, StatusDisplayConfig>>;
  payment: Readonly<Record<string, StatusDisplayConfig>>;
  verification: Readonly<Record<string, StatusDisplayConfig>>;
}>;

export declare function getStatusDisplayConfig(
  kind: StatusDisplayKind,
  value: unknown,
): StatusDisplayConfig | null;

export declare function formatStatusDisplayLabel(
  value: unknown,
  kind?: StatusDisplayKind,
): string;

export declare function getStatusBadgeTone(
  value: unknown,
  kind?: StatusDisplayKind,
): StatusDisplayTone;

export declare function getStatusDescription(
  value: unknown,
  kind: StatusDisplayKind,
): string | null;

export declare function getStatusNextActionHint(input: {
  kind: StatusDisplayKind;
  status: unknown;
  roleCode?: StatusDisplayRoleCode | string | null;
}): string | null;

export declare function listStatusDisplayOptions(
  kind: StatusDisplayKind,
): readonly StatusDisplayConfig[];

export declare function validateStatusDisplayCompleteness(): StatusDisplayCompletenessReport;

export declare function getStatusBadgeViewModel(
  value: unknown,
  kind?: StatusDisplayKind,
): {
  label: string;
  tone: StatusDisplayTone;
};
