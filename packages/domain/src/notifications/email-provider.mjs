// @ts-check

import {
  renderNotificationForEvent,
} from "./notification-template-registry.mjs";

export const EMAIL_PROVIDER_NAMES = /** @type {const} */ ([
  "console",
  "http_api",
]);

export class EmailProviderConfigError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech email provider configuration:\n- ${issues.join("\n- ")}`);
    this.name = "EmailProviderConfigError";
    this.issues = issues;
  }
}

/**
 * @param {import("./email-provider.d.ts").EmailProviderRuntimeConfig} config
 * @param {import("./email-provider.d.ts").CreateEmailProviderOptions} [options]
 * @returns {import("./email-provider.d.ts").EmailProvider}
 */
export function createEmailProvider(config, options = {}) {
  const issues = validateEmailProviderRuntimeConfig(config);

  if (issues.length > 0) {
    throw new EmailProviderConfigError(issues);
  }

  if (config.provider === "console") {
    return createConsoleEmailProvider({
      fromAddress: config.fromAddress,
      fromName: config.fromName,
      sink: options.consoleSink,
    });
  }

  return createHttpEmailProvider(config, {
    fetch: options.fetch,
  });
}

/**
 * @param {import("./email-provider.d.ts").CreateConsoleEmailProviderInput} input
 * @returns {import("./email-provider.d.ts").EmailProvider}
 */
export function createConsoleEmailProvider(input) {
  const fromAddress = normalize(input.fromAddress);
  const fromName = normalize(input.fromName);

  return Object.freeze({
    providerName: "console",
    async sendEmail(message) {
      const delivery = Object.freeze({
        provider: "console",
        providerMessageId: `console:${message.templateId}:${message.eventType}`,
      });

      input.sink?.(Object.freeze({
        ...message,
        from: Object.freeze({
          email: fromAddress,
          name: fromName,
        }),
      }));

      return delivery;
    },
  });
}

/**
 * @param {import("./email-provider.d.ts").EmailProviderRuntimeConfig} config
 * @param {import("./email-provider.d.ts").CreateHttpEmailProviderOptions} [options]
 * @returns {import("./email-provider.d.ts").EmailProvider}
 */
export function createHttpEmailProvider(config, options = {}) {
  const issues = validateEmailProviderRuntimeConfig({
    ...config,
    provider: "http_api",
  });

  if (issues.length > 0) {
    throw new EmailProviderConfigError(issues);
  }

  const endpoint = normalize(config.endpoint);
  const apiKey = normalize(config.apiKey);
  const fromAddress = normalize(config.fromAddress);
  const fromName = normalize(config.fromName);
  const fetchImplementation = options.fetch ?? globalThis.fetch;

  if (typeof fetchImplementation !== "function") {
    throw new EmailProviderConfigError([
      "A fetch implementation is required for the HTTP email provider.",
    ]);
  }

  return Object.freeze({
    providerName: "http_api",
    async sendEmail(message) {
      const response = await fetchImplementation(endpoint, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: {
            email: fromAddress,
            name: fromName,
          },
          to: [
            {
              email: message.recipient.email,
              name: message.recipient.name ?? null,
            },
          ],
          subject: message.subject,
          text: message.plainTextBody,
          html: message.htmlBody,
          metadata: {
            eventType: message.eventType,
            templateId: message.templateId,
            recipientRule: message.recipientRule,
            recipientRef: message.recipientRef,
            payload: message.payload,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Email provider request failed with HTTP ${response.status}: ${await safeResponseText(response)}`,
        );
      }

      return Object.freeze({
        provider: "http_api",
        providerMessageId: readProviderMessageId(response),
      });
    },
  });
}

/**
 * @param {import("./email-provider.d.ts").SendNotificationEmailInput} input
 * @returns {Promise<import("./email-provider.d.ts").SendNotificationEmailResult>}
 */
export async function sendNotificationEmail(input) {
  const rendered = renderNotificationForEvent({
    eventType: input.eventType,
    variables: input.variables,
  });
  const occurredAt = toIsoString(input.now);
  const baseMessage = createNotificationEmailMessage({
    eventType: input.eventType,
    payload: input.payload ?? {},
    recipient: input.recipient,
    renderedNotification: rendered,
  });

  try {
    const delivery = await input.provider.sendEmail(baseMessage);
    const notificationLog = await input.logRepository.createNotificationLog(
      createNotificationLog({
        baseMessage,
        occurredAt,
        providerMessageId: delivery.providerMessageId,
        status: "SENT",
        payload: {
          ...baseMessage.payload,
          provider: delivery.provider,
        },
      }),
    );

    return Object.freeze({
      ok: true,
      delivery,
      notificationLog,
    });
  } catch (error) {
    const notificationLog = await input.logRepository.createNotificationLog(
      createNotificationLog({
        baseMessage,
        occurredAt,
        status: "FAILED",
        lastError: error instanceof Error ? error.message : String(error),
      }),
    );

    return Object.freeze({
      ok: false,
      error: error instanceof Error ? error : new Error(String(error)),
      notificationLog,
    });
  }
}

/**
 * @param {import("./email-provider.d.ts").CreateNotificationEmailMessageInput} input
 * @returns {import("./email-provider.d.ts").EmailNotificationMessage}
 */
export function createNotificationEmailMessage(input) {
  return Object.freeze({
    eventType: input.eventType,
    templateId: input.renderedNotification.templateId,
    recipientRule: input.renderedNotification.recipientRule.type,
    recipient: Object.freeze({
      email: normalize(input.recipient.email),
      name: nullableString(input.recipient.name),
      userId: nullableString(input.recipient.userId),
      organizationId: nullableString(input.recipient.organizationId),
      roleCode: nullableString(input.recipient.roleCode),
    }),
    recipientRef: Object.freeze({
      email: normalize(input.recipient.email),
      name: nullableString(input.recipient.name),
      userId: nullableString(input.recipient.userId),
      organizationId: nullableString(input.recipient.organizationId),
      roleCode: nullableString(input.recipient.roleCode),
      ...(input.recipient.recipientRef ?? {}),
    }),
    subject: input.renderedNotification.subject,
    plainTextBody: input.renderedNotification.plainTextBody,
    htmlBody: input.renderedNotification.htmlBody,
    payload: Object.freeze(toRecord(input.payload)),
  });
}

/**
 * @param {import("./email-provider.d.ts").EmailProviderRuntimeConfig} config
 * @returns {string[]}
 */
export function validateEmailProviderRuntimeConfig(config) {
  const issues = [];

  if (!EMAIL_PROVIDER_NAMES.includes(
    /** @type {import("./email-provider.d.ts").EmailProviderName} */ (config.provider),
  )) {
    issues.push("provider must be one of: console, http_api.");
  }

  if (!isEmailAddress(config.fromAddress)) {
    issues.push("fromAddress must be a valid email address.");
  }

  if (!normalize(config.fromName)) {
    issues.push("fromName is required.");
  }

  if (config.provider === "http_api") {
    if (!normalize(config.apiKey)) {
      issues.push("apiKey is required for http_api.");
    }

    if (!isAbsoluteUrl(config.endpoint)) {
      issues.push("endpoint must be a valid absolute URL for http_api.");
    }
  }

  return issues;
}

/**
 * @param {{
 *   baseMessage: import("./email-provider.d.ts").EmailNotificationMessage;
 *   occurredAt: string;
 *   status: import("./email-provider.d.ts").NotificationEmailDeliveryStatus;
 *   providerMessageId?: string | null;
 *   payload?: Readonly<Record<string, unknown>>;
 *   lastError?: string | null;
 * }} input
 * @returns {import("./email-provider.d.ts").NotificationEmailDeliveryLog}
 */
function createNotificationLog(input) {
  return Object.freeze({
    id: null,
    eventType: input.baseMessage.eventType,
    templateId: input.baseMessage.templateId,
    channel: "EMAIL",
    recipientRule: input.baseMessage.recipientRule,
    recipientUserId: input.baseMessage.recipient.userId,
    recipientOrganizationId: input.baseMessage.recipient.organizationId,
    recipientRole: input.baseMessage.recipient.roleCode,
    recipientRef: input.baseMessage.recipientRef,
    payload: input.payload ?? input.baseMessage.payload,
    status: input.status,
    providerMessageId: input.providerMessageId ?? null,
    attemptCount: 1,
    nextRetryAt: null,
    lastError: input.lastError ?? null,
    createdAt: input.occurredAt,
    updatedAt: input.occurredAt,
  });
}

/**
 * @param {unknown} value
 * @returns {Readonly<Record<string, unknown>>}
 */
function toRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? /** @type {Record<string, unknown>} */ (value)
    : {};
}

/**
 * @param {string | null | undefined} value
 * @returns {string | null}
 */
function nullableString(value) {
  const normalized = normalize(value);
  return normalized ? normalized : null;
}

/**
 * @param {Date | string | undefined} value
 * @returns {string}
 */
function toIsoString(value) {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

/**
 * @param {string | null | undefined} value
 * @returns {string}
 */
function normalize(value) {
  return value?.trim() ?? "";
}

/**
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
function isEmailAddress(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalize(value));
}

/**
 * @param {string | null | undefined} value
 * @returns {boolean}
 */
function isAbsoluteUrl(value) {
  try {
    new URL(normalize(value));
    return true;
  } catch {
    return false;
  }
}

/**
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function safeResponseText(response) {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return "unavailable response body";
  }
}

/**
 * @param {Response} response
 * @returns {string | null}
 */
function readProviderMessageId(response) {
  return response.headers.get("x-message-id") ?? response.headers.get("x-request-id");
}
