import test from "node:test";
import assert from "node:assert/strict";

import {
  NOTIFICATION_EVENT_TEMPLATE_MAP,
  NotificationTemplateError,
  listNotificationTemplates,
  renderNotificationForEvent,
  renderNotificationTemplate,
  resolveNotificationTemplateForEvent,
} from "./notification-template-registry.mjs";

test("core notification templates render subject and plain text bodies", () => {
  const rendered = renderNotificationForEvent({
    eventType: "ORDER_SUBMITTED",
    variables: {
      orderNumber: "SO-20260610-000001",
      breederOrganizationName: "Ava Breeding",
    },
  });

  assert.equal(rendered.templateId, "order.submitted.station");
  assert.equal(rendered.subject, "New semen order SO-20260610-000001 submitted");
  assert.match(rendered.plainTextBody, /Ava Breeding/);
  assert.equal(rendered.htmlBody, null);
});

test("missing required variables fail safely", () => {
  assert.throws(
    () => renderNotificationTemplate({
      templateId: "order.rejected.breeder",
      variables: {
        orderNumber: "SO-20260610-000001",
      },
    }),
    NotificationTemplateError,
  );
});

test("event-to-template mapping covers required Phase 1 events", () => {
  for (const eventType of [
    "ORDER_SUBMITTED",
    "ORDER_RECEIVED",
    "ORDER_CONFIRMED",
    "ORDER_REJECTED",
    "SHIPMENT_CREATED",
    "SHIPMENT_STATUS_UPDATED",
    "SHIPMENT_DELIVERED",
    "DOCUMENT_UPLOADED",
    "SUPPORT_REQUEST_CREATED",
    "ADMIN_ACTION_REQUIRED",
  ]) {
    assert.equal(typeof NOTIFICATION_EVENT_TEMPLATE_MAP[eventType], "string");
    assert.equal(resolveNotificationTemplateForEvent(eventType).id, NOTIFICATION_EVENT_TEMPLATE_MAP[eventType]);
  }
});

test("templates define recipient rules and no hardcoded recipient email", () => {
  const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/;

  for (const template of listNotificationTemplates()) {
    assert.equal(template.channel, "EMAIL");
    assert.equal(typeof template.recipientRule.type, "string");
    assert.equal(template.variables.every((variable) => variable.required), true);
    assert.equal(emailPattern.test(JSON.stringify(template)), false);
  }
});
