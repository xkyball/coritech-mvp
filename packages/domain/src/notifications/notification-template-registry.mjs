// @ts-check

export class NotificationTemplateError extends Error {
  /**
   * @param {string[]} issues
   */
  constructor(issues) {
    super(`Invalid CoriTech notification template input:\n- ${issues.join("\n- ")}`);
    this.name = "NotificationTemplateError";
    this.issues = issues;
  }
}

const RETRY_PLACEHOLDER = Object.freeze({
  enabled: false,
  description:
    "Retry scheduling is intentionally a placeholder in Ticket 18.18. Ticket 9.2 owns delivery queue retry behavior.",
});

export const NOTIFICATION_TEMPLATE_REGISTRY = deepFreeze({
  "order.submitted.station": {
    id: "order.submitted.station",
    channel: "EMAIL",
    eventTypes: ["ORDER_SUBMITTED"],
    recipientRule: {
      type: "ORDER_BREEDING_STATION",
      description: "Notify the breeding station organization assigned to the order.",
    },
    subject: "New semen order {{orderNumber}} submitted",
    plainTextBody:
      "Order {{orderNumber}} was submitted by {{breederOrganizationName}}. Open CoriTech to review the order status and next station action.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("breederOrganizationName", "string", "Submitting breeder organization display name."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "order.received.breeder": {
    id: "order.received.breeder",
    channel: "EMAIL",
    eventTypes: ["ORDER_RECEIVED"],
    recipientRule: {
      type: "ORDER_BREEDER",
      description: "Notify the breeder organization that owns the order.",
    },
    subject: "Order {{orderNumber}} received by station",
    plainTextBody:
      "{{stationOrganizationName}} marked order {{orderNumber}} as received. Open CoriTech for the latest status history.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("stationOrganizationName", "string", "Assigned breeding station display name."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "order.confirmed.breeder": {
    id: "order.confirmed.breeder",
    channel: "EMAIL",
    eventTypes: ["ORDER_CONFIRMED"],
    recipientRule: {
      type: "ORDER_BREEDER",
      description: "Notify the breeder organization that owns the order.",
    },
    subject: "Order {{orderNumber}} confirmed",
    plainTextBody:
      "{{stationOrganizationName}} confirmed order {{orderNumber}}. Open CoriTech to follow fulfilment and shipment updates.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("stationOrganizationName", "string", "Assigned breeding station display name."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "order.rejected.breeder": {
    id: "order.rejected.breeder",
    channel: "EMAIL",
    eventTypes: ["ORDER_REJECTED"],
    recipientRule: {
      type: "ORDER_BREEDER",
      description: "Notify the breeder organization that owns the order.",
    },
    subject: "Order {{orderNumber}} rejected",
    plainTextBody:
      "{{stationOrganizationName}} rejected order {{orderNumber}}. Reason: {{reason}}. Open CoriTech to review the order detail.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("stationOrganizationName", "string", "Assigned breeding station display name."),
      variable("reason", "string", "Station rejection reason already visible to authorized order participants."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "order.cancelled.participant": {
    id: "order.cancelled.participant",
    channel: "EMAIL",
    eventTypes: ["ORDER_CANCELLED"],
    recipientRule: {
      type: "ORDER_BREEDING_STATION",
      description: "Notify the counterparty for an authorized order cancellation.",
    },
    subject: "Order {{orderNumber}} cancelled",
    plainTextBody:
      "Order {{orderNumber}} was cancelled. Reason: {{reason}}. Open CoriTech to review the status history.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("reason", "string", "Cancellation reason already visible to authorized order participants."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "shipment.created.breeder": {
    id: "shipment.created.breeder",
    channel: "EMAIL",
    eventTypes: ["SHIPMENT_CREATED"],
    recipientRule: {
      type: "ORDER_BREEDER",
      description: "Notify the breeder organization that owns the shipment order.",
    },
    subject: "Shipment created for order {{orderNumber}}",
    plainTextBody:
      "A shipment was created for order {{orderNumber}} by {{stationOrganizationName}}. Open CoriTech for controlled tracking details.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("stationOrganizationName", "string", "Assigned breeding station display name."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "shipment.updated.breeder": {
    id: "shipment.updated.breeder",
    channel: "EMAIL",
    eventTypes: ["SHIPMENT_STATUS_UPDATED"],
    recipientRule: {
      type: "ORDER_BREEDER",
      description: "Notify the breeder organization that owns the shipment order.",
    },
    subject: "Shipment update for order {{orderNumber}}",
    plainTextBody:
      "Shipment status for order {{orderNumber}} changed to {{shipmentStatus}}. Open CoriTech for the latest tracking timeline.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("shipmentStatus", "string", "Current shipment status label."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "shipment.delivered.breeder": {
    id: "shipment.delivered.breeder",
    channel: "EMAIL",
    eventTypes: ["SHIPMENT_DELIVERED"],
    recipientRule: {
      type: "ORDER_BREEDER",
      description: "Notify the breeder organization that owns the shipment order.",
    },
    subject: "Shipment delivered for order {{orderNumber}}",
    plainTextBody:
      "Shipment for order {{orderNumber}} was marked delivered. Open CoriTech to confirm receipt where required.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "document.uploaded.relevant_role": {
    id: "document.uploaded.relevant_role",
    channel: "EMAIL",
    eventTypes: ["DOCUMENT_UPLOADED"],
    recipientRule: {
      type: "DOCUMENT_RELEVANT_ROLE",
      description: "Notify only roles permitted to see the document metadata in CoriTech.",
    },
    subject: "Document uploaded for order {{orderNumber}}",
    plainTextBody:
      "{{documentType}} was uploaded for order {{orderNumber}}. Open CoriTech to request a permissioned document view.",
    variables: [
      variable("orderNumber", "string", "Human-readable order number."),
      variable("documentType", "string", "Document type label."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
  "admin.action_required": {
    id: "admin.action_required",
    channel: "EMAIL",
    eventTypes: ["SUPPORT_REQUEST_CREATED", "ADMIN_ACTION_REQUIRED"],
    recipientRule: {
      type: "PLATFORM_ADMIN",
      description: "Notify Platform Admin recipients through the configured admin support queue/provider.",
    },
    subject: "Admin action required: {{actionTitle}}",
    plainTextBody:
      "{{actionTitle}} requires Platform Admin review for {{objectLabel}}. Category: {{category}}. Open CoriTech admin support to inspect the controlled context.",
    variables: [
      variable("actionTitle", "string", "Short action title."),
      variable("objectLabel", "string", "Safe object label, such as order number."),
      variable("category", "string", "Admin action category."),
    ],
    retryPlaceholder: RETRY_PLACEHOLDER,
  },
});

export const NOTIFICATION_EVENT_TEMPLATE_MAP = deepFreeze(
  Object.fromEntries(
    Object.values(NOTIFICATION_TEMPLATE_REGISTRY).flatMap((template) =>
      template.eventTypes.map((eventType) => [eventType, template.id])
    ),
  ),
);

/**
 * @returns {readonly import("./notification-template-registry.d.ts").NotificationTemplate[]}
 */
export function listNotificationTemplates() {
  return Object.freeze(Object.values(NOTIFICATION_TEMPLATE_REGISTRY));
}

/**
 * @returns {readonly import("./notification-template-registry.d.ts").NotificationEventTemplateMapping[]}
 */
export function listNotificationEventTemplateMappings() {
  return Object.freeze(
    Object.entries(NOTIFICATION_EVENT_TEMPLATE_MAP).map(([eventType, templateId]) =>
      Object.freeze({
        eventType: /** @type {import("./notification-template-registry.d.ts").NotificationEventType} */ (eventType),
        templateId,
      })
    ),
  );
}

/**
 * @param {string} templateId
 * @returns {import("./notification-template-registry.d.ts").NotificationTemplate}
 */
export function getNotificationTemplate(templateId) {
  const template = NOTIFICATION_TEMPLATE_REGISTRY[templateId];

  if (!template) {
    throw new NotificationTemplateError([`unknown templateId: ${templateId}`]);
  }

  return template;
}

/**
 * @param {import("./notification-template-registry.d.ts").NotificationEventType | string} eventType
 * @returns {import("./notification-template-registry.d.ts").NotificationTemplate}
 */
export function resolveNotificationTemplateForEvent(eventType) {
  const templateId = NOTIFICATION_EVENT_TEMPLATE_MAP[
    /** @type {import("./notification-template-registry.d.ts").NotificationEventType} */ (eventType)
  ];

  if (!templateId) {
    throw new NotificationTemplateError([`no notification template mapped for eventType: ${eventType}`]);
  }

  return getNotificationTemplate(templateId);
}

/**
 * @param {import("./notification-template-registry.d.ts").RenderNotificationTemplateInput} input
 * @returns {import("./notification-template-registry.d.ts").RenderedNotificationTemplate}
 */
export function renderNotificationTemplate(input) {
  const template = getNotificationTemplate(input.templateId);
  const issues = validateNotificationTemplateVariables(template, input.variables);

  if (issues.length > 0) {
    throw new NotificationTemplateError(issues);
  }

  return Object.freeze({
    templateId: template.id,
    eventTypes: template.eventTypes,
    recipientRule: template.recipientRule,
    subject: renderStringTemplate(template.subject, input.variables),
    plainTextBody: renderStringTemplate(template.plainTextBody, input.variables),
    htmlBody: template.htmlBody
      ? renderStringTemplate(template.htmlBody, input.variables)
      : null,
  });
}

/**
 * @param {import("./notification-template-registry.d.ts").RenderNotificationEventInput} input
 * @returns {import("./notification-template-registry.d.ts").RenderedNotificationTemplate}
 */
export function renderNotificationForEvent(input) {
  const template = resolveNotificationTemplateForEvent(input.eventType);

  return renderNotificationTemplate({
    templateId: template.id,
    variables: input.variables,
  });
}

/**
 * @param {import("./notification-template-registry.d.ts").NotificationTemplate} template
 * @param {Readonly<Record<string, unknown>>} variables
 * @returns {string[]}
 */
export function validateNotificationTemplateVariables(template, variables) {
  const issues = [];

  for (const definition of template.variables) {
    const value = variables[definition.name];

    if (value === undefined || value === null || String(value).trim() === "") {
      issues.push(`${template.id} requires variable: ${definition.name}.`);
      continue;
    }

    if (definition.type === "number" && typeof value !== "number") {
      issues.push(`${definition.name} must be a number.`);
    }
  }

  return issues;
}

/**
 * @param {string} text
 * @param {Readonly<Record<string, unknown>>} variables
 */
function renderStringTemplate(text, variables) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, name) => {
    const value = variables[String(name)];
    return escapeText(value);
  });
}

/**
 * @param {string} name
 * @param {"string" | "number"} type
 * @param {string} description
 * @returns {import("./notification-template-registry.d.ts").NotificationTemplateVariable}
 */
function variable(name, type, description) {
  return Object.freeze({
    name,
    type,
    required: true,
    description,
  });
}

/**
 * @param {unknown} value
 */
function escapeText(value) {
  return String(value ?? "")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ")
    .trim();
}

function deepFreeze(value) {
  if (!value || typeof value !== "object") {
    return value;
  }

  Object.freeze(value);

  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }

  return value;
}
