export type {
  PaymentReferenceStatus,
  StatusDisplayCode,
  StatusDisplayConfig,
  StatusDisplayKind,
  StatusDisplayRoleCode,
  StatusDisplayTone,
} from "./status-display.d.ts";

import type {
  PaymentReferenceStatus,
  StatusDisplayConfig,
  StatusDisplayKind,
  StatusDisplayRoleCode,
  StatusDisplayTone,
} from "./status-display.d.ts";

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

export declare function getStatusBadgeViewModel(
  value: unknown,
  kind?: StatusDisplayKind,
): {
  label: string;
  tone: StatusDisplayTone;
};

export declare function missingConfigCodes(
  codes: readonly string[],
  registry: Readonly<Record<string, StatusDisplayConfig>>,
): readonly string[];
