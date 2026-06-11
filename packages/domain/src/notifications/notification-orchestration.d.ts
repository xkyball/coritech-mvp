import type { DocumentLike } from "../documents/document-evidence.d.ts";
import type {
  EmailProvider,
  EmailRecipientContext,
  NotificationEmailLogRepository,
  SendNotificationEmailResult,
} from "./email-provider.d.ts";
import type { OrderNotificationHook } from "../orders/semen-order.d.ts";
import type { ShipmentNotificationHook } from "../shipments/shipment.d.ts";

export type NotificationDispatchSource = "ORDER" | "SHIPMENT" | "DOCUMENT";

export interface NotificationRecipientQuery {
  recipientRule: string;
  organizationId?: string | null;
  roleCode?: string | null;
  excludeUserId?: string | null;
}

export interface NotificationOrganizationContext {
  id: string;
  name: string;
}

export interface NotificationRecipientResolver {
  listNotificationRecipients(
    query: NotificationRecipientQuery,
  ): Promise<EmailRecipientContext[]>;
  findNotificationOrganizationById?(
    organizationId: string,
  ): Promise<NotificationOrganizationContext | null>;
}

export interface NotificationOrchestrationServiceOptions {
  provider: EmailProvider;
  logRepository: NotificationEmailLogRepository;
  recipientResolver: NotificationRecipientResolver;
  now?: string | Date;
}

export interface NotificationOrchestrationService {
  recordOrderNotificationHook(
    hook: OrderNotificationHook | null,
  ): Promise<NotificationDispatchResult>;
  enqueueOrderNotification(
    hook: OrderNotificationHook | null,
  ): Promise<NotificationDispatchResult>;
  recordShipmentNotificationHook(
    hook: ShipmentNotificationHook | null,
  ): Promise<NotificationDispatchResult>;
  enqueueShipmentNotification(
    hook: ShipmentNotificationHook | null,
  ): Promise<NotificationDispatchResult>;
  sendDocumentUploadNotification(
    document: DocumentLike,
  ): Promise<NotificationDispatchResult>;
}

export interface NotificationDispatchResult {
  ok: boolean;
  source: NotificationDispatchSource;
  eventType: string | null;
  skipped: boolean;
  skipReason: string | null;
  recipients: readonly EmailRecipientContext[];
  deliveries: readonly SendNotificationEmailResult[];
}

export interface NotificationDispatchPlan {
  source: NotificationDispatchSource;
  eventType: string;
  variables: Readonly<Record<string, unknown>>;
  payload: Readonly<Record<string, unknown>>;
  recipientQueries: readonly NotificationRecipientQuery[];
}

export interface DispatchNotificationPlanInput
  extends NotificationOrchestrationServiceOptions {
  occurredAt?: string | Date | null;
  plan: NotificationDispatchPlan;
}

export interface DispatchOrderNotificationInput
  extends NotificationOrchestrationServiceOptions {
  hook: OrderNotificationHook | null;
}

export interface BuildOrderNotificationPlanInput
  extends NotificationOrchestrationServiceOptions {
  hook: OrderNotificationHook;
}

export interface DispatchShipmentNotificationInput
  extends NotificationOrchestrationServiceOptions {
  hook: ShipmentNotificationHook | null;
}

export interface BuildShipmentNotificationPlanInput
  extends NotificationOrchestrationServiceOptions {
  hook: ShipmentNotificationHook;
}

export interface DispatchDocumentUploadNotificationInput
  extends NotificationOrchestrationServiceOptions {
  document: DocumentLike | null;
}

export declare class NotificationOrchestrationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}
export declare function createNotificationOrchestrationService(
  options: NotificationOrchestrationServiceOptions,
): NotificationOrchestrationService;
export declare function dispatchOrderNotification(
  input: DispatchOrderNotificationInput,
): Promise<NotificationDispatchResult>;
export declare function dispatchShipmentNotification(
  input: DispatchShipmentNotificationInput,
): Promise<NotificationDispatchResult>;
export declare function dispatchDocumentUploadNotification(
  input: DispatchDocumentUploadNotificationInput,
): Promise<NotificationDispatchResult>;
