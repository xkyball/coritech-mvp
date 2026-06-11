import test from "node:test";
import assert from "node:assert/strict";

import {
  EmailProviderConfigError,
  createConsoleEmailProvider,
  createEmailProvider,
  createHttpEmailProvider,
  sendNotificationEmail,
} from "./email-provider.mjs";

const timestamp = "2026-06-10T12:00:00.000Z";
const recipient = Object.freeze({
  email: "station.ops@coritech.test",
  name: "Station Ops",
  userId: "user-station",
  organizationId: "org-station",
  roleCode: "BREEDING_STATION",
});

test("sendNotificationEmail renders template, sends email and logs success", async () => {
  const sent = [];
  const repository = createLogRepository();
  const result = await sendNotificationEmail({
    eventType: "ORDER_SUBMITTED",
    variables: {
      orderNumber: "SO-20260610-000001",
      breederOrganizationName: "Ava Breeding",
    },
    payload: {
      orderId: "order-a",
    },
    recipient,
    provider: createConsoleEmailProvider({
      fromAddress: "notifications@coritech.test",
      fromName: "CoriTech",
      sink: (message) => sent.push(message),
    }),
    logRepository: repository,
    now: timestamp,
  });

  assert.equal(result.ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].subject, "New semen order SO-20260610-000001 submitted");
  assert.equal(repository.logs.length, 1);
  assert.equal(repository.logs[0].status, "SENT");
  assert.equal(repository.logs[0].attemptCount, 1);
  assert.equal(
    repository.logs[0].providerMessageId,
    "console:order.submitted.station:ORDER_SUBMITTED",
  );
  assert.equal(repository.logs[0].eventType, "ORDER_SUBMITTED");
  assert.equal(repository.logs[0].templateId, "order.submitted.station");
  assert.equal(repository.logs[0].recipientRule, "ORDER_BREEDING_STATION");
  assert.equal(repository.logs[0].recipientOrganizationId, "org-station");
  assert.equal(repository.logs[0].lastError, null);
});

test("sendNotificationEmail logs provider failures", async () => {
  const repository = createLogRepository();
  const result = await sendNotificationEmail({
    eventType: "DOCUMENT_UPLOADED",
    variables: {
      orderNumber: "SO-20260610-000001",
      documentType: "Health certificate",
    },
    recipient,
    provider: {
      providerName: "http_api",
      async sendEmail() {
        throw new Error("provider timeout");
      },
    },
    logRepository: repository,
    now: timestamp,
  });

  assert.equal(result.ok, false);
  assert.equal(repository.logs.length, 1);
  assert.equal(repository.logs[0].status, "FAILED");
  assert.equal(repository.logs[0].attemptCount, 1);
  assert.equal(repository.logs[0].providerMessageId, null);
  assert.match(repository.logs[0].lastError, /provider timeout/);
  assert.equal(repository.logs[0].templateId, "document.uploaded.relevant_role");
});

test("createHttpEmailProvider posts provider-neutral email payload", async () => {
  const calls = [];
  const provider = createHttpEmailProvider(
    {
      provider: "http_api",
      endpoint: "https://email.provider.test/send",
      apiKey: "provider-key",
      fromAddress: "notifications@coritech.test",
      fromName: "CoriTech",
    },
    {
      fetch: async (url, init) => {
        calls.push({ url, init });
        return {
          ok: true,
          status: 202,
          async text() {
            return "";
          },
          headers: {
            get(name) {
              return name.toLowerCase() === "x-message-id"
                ? "provider-message-1"
                : null;
            },
          },
        };
      },
    },
  );

  const delivery = await provider.sendEmail({
    eventType: "ORDER_CONFIRMED",
    templateId: "order.confirmed.breeder",
    recipientRule: "ORDER_BREEDER",
    recipient,
    recipientRef: {
      orderNumber: "SO-20260610-000001",
    },
    subject: "Order confirmed",
    plainTextBody: "Order confirmed.",
    htmlBody: null,
    payload: {
      orderId: "order-a",
    },
  });

  assert.equal(delivery.providerMessageId, "provider-message-1");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://email.provider.test/send");
  assert.equal(calls[0].init.headers.Authorization, "Bearer provider-key");

  const body = JSON.parse(calls[0].init.body);
  assert.deepEqual(body.from, {
    email: "notifications@coritech.test",
    name: "CoriTech",
  });
  assert.deepEqual(body.to, [
    {
      email: "station.ops@coritech.test",
      name: "Station Ops",
    },
  ]);
  assert.equal(body.metadata.templateId, "order.confirmed.breeder");
  assert.equal(body.metadata.payload.orderId, "order-a");
});

test("createEmailProvider validates runtime provider config", () => {
  assert.throws(
    () =>
      createEmailProvider({
        provider: "http_api",
        endpoint: "not-a-url",
        apiKey: "",
        fromAddress: "not-an-email",
        fromName: "",
      }),
    (error) =>
      error instanceof EmailProviderConfigError &&
      error.issues.includes("apiKey is required for http_api.") &&
      error.issues.includes("endpoint must be a valid absolute URL for http_api.") &&
      error.issues.includes("fromAddress must be a valid email address.") &&
      error.issues.includes("fromName is required."),
  );
});

function createLogRepository() {
  const logs = [];

  return {
    logs,
    async createNotificationLog(log) {
      const persisted = {
        ...log,
        id: log.id ?? `notification-log-${logs.length + 1}`,
      };
      logs.push(persisted);
      return persisted;
    },
  };
}
