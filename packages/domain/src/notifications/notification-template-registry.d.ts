export type NotificationChannel = "EMAIL";

export type NotificationEventType =
  | "ORDER_SUBMITTED"
  | "ORDER_RECEIVED"
  | "ORDER_CONFIRMED"
  | "ORDER_REJECTED"
  | "ORDER_CANCELLED"
  | "SHIPMENT_CREATED"
  | "SHIPMENT_STATUS_UPDATED"
  | "SHIPMENT_DELIVERED"
  | "DOCUMENT_UPLOADED"
  | "SUPPORT_REQUEST_CREATED"
  | "ADMIN_ACTION_REQUIRED";

export type NotificationRecipientRuleType =
  | "ORDER_BREEDING_STATION"
  | "ORDER_BREEDER"
  | "DOCUMENT_RELEVANT_ROLE"
  | "PLATFORM_ADMIN";

export interface NotificationRecipientRule {
  type: NotificationRecipientRuleType;
  description: string;
}

export interface NotificationTemplateVariable {
  name: string;
  type: "string" | "number";
  required: true;
  description: string;
}

export interface NotificationTemplate {
  id: string;
  channel: NotificationChannel;
  eventTypes: readonly NotificationEventType[];
  recipientRule: NotificationRecipientRule;
  subject: string;
  plainTextBody: string;
  htmlBody?: string | null;
  variables: readonly NotificationTemplateVariable[];
  retryPlaceholder: {
    enabled: false;
    description: string;
  };
}

export interface RenderNotificationTemplateInput {
  templateId: string;
  variables: Readonly<Record<string, unknown>>;
}

export interface RenderNotificationEventInput {
  eventType: NotificationEventType | string;
  variables: Readonly<Record<string, unknown>>;
}

export interface RenderedNotificationTemplate {
  templateId: string;
  eventTypes: readonly NotificationEventType[];
  recipientRule: NotificationRecipientRule;
  subject: string;
  plainTextBody: string;
  htmlBody: string | null;
}

export interface NotificationEventTemplateMapping {
  eventType: NotificationEventType;
  templateId: string;
}

export declare const NOTIFICATION_TEMPLATE_REGISTRY: Readonly<Record<string, NotificationTemplate>>;
export declare const NOTIFICATION_EVENT_TEMPLATE_MAP: Readonly<Record<NotificationEventType, string>>;
export declare class NotificationTemplateError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}
export declare function listNotificationTemplates(): readonly NotificationTemplate[];
export declare function listNotificationEventTemplateMappings(): readonly NotificationEventTemplateMapping[];
export declare function getNotificationTemplate(
  templateId: string,
): NotificationTemplate;
export declare function resolveNotificationTemplateForEvent(
  eventType: NotificationEventType | string,
): NotificationTemplate;
export declare function renderNotificationTemplate(
  input: RenderNotificationTemplateInput,
): RenderedNotificationTemplate;
export declare function renderNotificationForEvent(
  input: RenderNotificationEventInput,
): RenderedNotificationTemplate;
export declare function validateNotificationTemplateVariables(
  template: NotificationTemplate,
  variables: Readonly<Record<string, unknown>>,
): string[];
