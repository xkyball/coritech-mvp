import type {
  NotificationEventType,
  NotificationRecipientRuleType,
  RenderedNotificationTemplate,
} from "./notification-template-registry.d.ts";

export type EmailProviderName = "console" | "http_api";
export type NotificationEmailDeliveryStatus =
  | "QUEUED"
  | "SENT"
  | "FAILED"
  | "RETRY_PENDING";

export interface EmailProviderRuntimeConfig {
  provider: EmailProviderName | string;
  endpoint?: string | null;
  apiKey?: string | null;
  fromAddress: string;
  fromName: string;
}

export interface EmailRecipientContext {
  email: string;
  name?: string | null;
  userId?: string | null;
  organizationId?: string | null;
  roleCode?: string | null;
  recipientRef?: Readonly<Record<string, unknown>> | null;
}

export interface EmailNotificationMessage {
  eventType: NotificationEventType | string;
  templateId: string;
  recipientRule: NotificationRecipientRuleType | string;
  recipient: {
    email: string;
    name: string | null;
    userId: string | null;
    organizationId: string | null;
    roleCode: string | null;
  };
  recipientRef: Readonly<Record<string, unknown>>;
  subject: string;
  plainTextBody: string;
  htmlBody: string | null;
  payload: Readonly<Record<string, unknown>>;
}

export interface EmailProviderSendResult {
  provider: EmailProviderName;
  providerMessageId: string | null;
}

export interface EmailProvider {
  providerName: EmailProviderName;
  sendEmail(message: EmailNotificationMessage): Promise<EmailProviderSendResult>;
}

export interface NotificationEmailDeliveryLog {
  id: string | null;
  eventType: NotificationEventType | string;
  templateId: string;
  channel: "EMAIL";
  recipientRule: NotificationRecipientRuleType | string;
  recipientUserId: string | null;
  recipientOrganizationId: string | null;
  recipientRole: string | null;
  recipientRef: Readonly<Record<string, unknown>>;
  payload: Readonly<Record<string, unknown>>;
  status: NotificationEmailDeliveryStatus;
  providerMessageId: string | null;
  attemptCount: number;
  nextRetryAt: string | null;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationEmailLogRepository {
  createNotificationLog(
    log: NotificationEmailDeliveryLog,
  ): Promise<NotificationEmailDeliveryLog>;
}

export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
  headers: {
    get(name: string): string | null;
  };
}

export interface FetchLike {
  (
    url: string,
    init: {
      method: "POST";
      headers: Record<string, string>;
      body: string;
    },
  ): Promise<FetchLikeResponse>;
}

export interface CreateEmailProviderOptions {
  fetch?: FetchLike | null;
  consoleSink?: ((message: EmailNotificationMessage) => void) | null;
}

export interface CreateHttpEmailProviderOptions {
  fetch?: FetchLike | null;
}

export interface CreateConsoleEmailProviderInput {
  fromAddress: string;
  fromName: string;
  sink?: ((message: EmailNotificationMessage) => void) | null;
}

export interface CreateNotificationEmailMessageInput {
  eventType: NotificationEventType | string;
  renderedNotification: RenderedNotificationTemplate;
  recipient: EmailRecipientContext;
  payload?: Readonly<Record<string, unknown>> | null;
}

export interface SendNotificationEmailInput {
  eventType: NotificationEventType | string;
  variables: Readonly<Record<string, unknown>>;
  recipient: EmailRecipientContext;
  payload?: Readonly<Record<string, unknown>> | null;
  provider: EmailProvider;
  logRepository: NotificationEmailLogRepository;
  now?: string | Date;
}

export type SendNotificationEmailResult =
  | {
      ok: true;
      delivery: EmailProviderSendResult;
      notificationLog: NotificationEmailDeliveryLog;
    }
  | {
      ok: false;
      error: Error;
      notificationLog: NotificationEmailDeliveryLog;
    };

export declare const EMAIL_PROVIDER_NAMES: readonly EmailProviderName[];
export declare class EmailProviderConfigError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}
export declare function createEmailProvider(
  config: EmailProviderRuntimeConfig,
  options?: CreateEmailProviderOptions,
): EmailProvider;
export declare function createConsoleEmailProvider(
  input: CreateConsoleEmailProviderInput,
): EmailProvider;
export declare function createHttpEmailProvider(
  config: EmailProviderRuntimeConfig,
  options?: CreateHttpEmailProviderOptions,
): EmailProvider;
export declare function sendNotificationEmail(
  input: SendNotificationEmailInput,
): Promise<SendNotificationEmailResult>;
export declare function createNotificationEmailMessage(
  input: CreateNotificationEmailMessageInput,
): EmailNotificationMessage;
export declare function validateEmailProviderRuntimeConfig(
  config: EmailProviderRuntimeConfig,
): string[];
