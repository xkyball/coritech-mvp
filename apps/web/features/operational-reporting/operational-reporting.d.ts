import type { Document } from "@coritech/domain/documents/document-evidence.d.ts";
import type { OrderStatusHistory, SemenOrder } from "@coritech/domain/orders/semen-order.d.ts";
import type { ProofEvent } from "@coritech/domain/proof/proof-event.d.ts";
import type { Shipment } from "@coritech/domain/shipments/shipment.d.ts";

export type OperationalReportingOrderStatus =
  | "SUBMITTED"
  | "CONFIRMED"
  | "REJECTED"
  | "COMPLETED";

export type DocumentationEligibleOrderStatus =
  | "SUBMITTED"
  | "RECEIVED"
  | "CONFIRMED"
  | "REJECTED"
  | "IN_FULFILMENT"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED";

export interface OperationalReportingMetric {
  key: string;
  label: string;
  value: number | null;
  displayValue: string;
  meta: string;
}

export interface AverageTimeToConfirmationMetric {
  averageHours: number | null;
  displayValue: string;
  sampleSize: number;
}

export interface DocumentationCompletionMetric {
  documentedOrderCount: number;
  eligibleOrderCount: number;
  rate: number | null;
  displayValue: string;
}

export interface OperationalReportingInput {
  activeListingCount?: number | null;
  orders?: readonly SemenOrder[];
  orderStatusHistory?: readonly OrderStatusHistory[];
  shipments?: readonly Shipment[];
  documents?: readonly Document[];
  proofEvents?: readonly ProofEvent[];
  generatedAt?: string | Date;
}

export interface OperationalReportingViewModel {
  generatedAt: string;
  metrics: readonly OperationalReportingMetric[];
  orderStatusCounts: Record<OperationalReportingOrderStatus, number>;
  averageTimeToConfirmation: AverageTimeToConfirmationMetric;
  documentationCompletion: DocumentationCompletionMetric;
}

export declare const OPERATIONAL_REPORTING_ORDER_STATUSES: readonly OperationalReportingOrderStatus[];
export declare const DOCUMENTATION_ELIGIBLE_ORDER_STATUSES: readonly DocumentationEligibleOrderStatus[];

export declare function createOperationalReportingViewModel(
  input: OperationalReportingInput,
): OperationalReportingViewModel;
export declare function calculateAverageTimeToConfirmation(input: {
  orders: readonly SemenOrder[];
  statusHistory: readonly OrderStatusHistory[];
}): AverageTimeToConfirmationMetric;
export declare function calculateDocumentationCompletion(input: {
  orders: readonly SemenOrder[];
  documents: readonly Document[];
}): DocumentationCompletionMetric;
