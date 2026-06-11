import test from "node:test";
import assert from "node:assert/strict";

import { createConsoleEmailProvider } from "./email-provider.mjs";
import {
  createNotificationOrchestrationService,
  dispatchDocumentUploadNotification,
} from "./notification-orchestration.mjs";

const timestamp = "2026-06-10T12:00:00.000Z";
const orgs = Object.freeze({
  "org-breeder": "Ava Breeding",
  "org-station": "CoriTech Station",
  "org-platform": "CoriTech Platform",
});

test("order submitted notifies active station recipients", async () => {
  const sent = [];
  const repository = createLogRepository();
  const service = createNotificationOrchestrationService({
    provider: createConsoleEmailProvider({
      fromAddress: "notifications@coritech.test",
      fromName: "CoriTech",
      sink: (message) => sent.push(message),
    }),
    logRepository: repository,
    recipientResolver: createRecipientResolver(),
  });

  const result = await service.enqueueOrderNotification(orderHook({
    eventType: "ORDER_SUBMITTED",
    commandName: "SUBMIT_ORDER",
    status: "SUBMITTED",
  }));

  assert.equal(result.ok, true);
  assert.equal(result.recipients.length, 1);
  assert.equal(result.recipients[0].email, "station@coritech.test");
  assert.equal(sent[0].templateId, "order.submitted.station");
  assert.match(sent[0].plainTextBody, /Ava Breeding/);
  assert.equal(repository.logs[0].recipientOrganizationId, "org-station");
  assert.equal(repository.logs[0].status, "SENT");
});

test("confirmed and rejected order events notify breeder recipients", async () => {
  const sent = [];
  const repository = createLogRepository();
  const service = createNotificationOrchestrationService({
    provider: createConsoleEmailProvider({
      fromAddress: "notifications@coritech.test",
      fromName: "CoriTech",
      sink: (message) => sent.push(message),
    }),
    logRepository: repository,
    recipientResolver: createRecipientResolver(),
  });

  await service.recordOrderNotificationHook(orderHook({
    eventType: "ORDER_CONFIRMED",
    commandName: "CONFIRM_ORDER",
    status: "CONFIRMED",
  }));
  await service.recordOrderNotificationHook(orderHook({
    eventType: "ORDER_REJECTED",
    commandName: "REJECT_ORDER",
    status: "REJECTED",
    reason: "Collection date unavailable.",
  }));

  assert.deepEqual(sent.map((message) => message.recipient.email), [
    "breeder@coritech.test",
    "breeder@coritech.test",
  ]);
  assert.deepEqual(repository.logs.map((log) => log.templateId), [
    "order.confirmed.breeder",
    "order.rejected.breeder",
  ]);
  assert.match(sent[1].plainTextBody, /Collection date unavailable/);
});

test("shipment status updates notify breeder recipients", async () => {
  const sent = [];
  const repository = createLogRepository();
  const service = createNotificationOrchestrationService({
    provider: createConsoleEmailProvider({
      fromAddress: "notifications@coritech.test",
      fromName: "CoriTech",
      sink: (message) => sent.push(message),
    }),
    logRepository: repository,
    recipientResolver: createRecipientResolver(),
  });

  const result = await service.enqueueShipmentNotification({
    hookType: "SHIPMENT_NOTIFICATION_REQUEST",
    eventType: "SHIPMENT_STATUS_UPDATED",
    commandName: "UPDATE_SHIPMENT_STATUS",
    shipmentId: "shipment-a",
    semenOrderId: "order-a",
    orderNumber: "SO-20260610-000001",
    breederOrganizationId: "org-breeder",
    breedingStationOrganizationId: "org-station",
    fromStatus: "PREPARED",
    toStatus: "IN_TRANSIT",
    trackingEventId: "tracking-a",
    actorUserId: "user-station",
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: "org-station",
    occurredAt: timestamp,
  });

  assert.equal(result.ok, true);
  assert.equal(result.recipients[0].email, "breeder@coritech.test");
  assert.equal(repository.logs[0].templateId, "shipment.updated.breeder");
  assert.equal(repository.logs[0].payload.toStatus, "IN_TRANSIT");
});

test("document upload notifies relevant visible role without buyer expansion", async () => {
  const sent = [];
  const repository = createLogRepository();
  const result = await dispatchDocumentUploadNotification({
    provider: createConsoleEmailProvider({
      fromAddress: "notifications@coritech.test",
      fromName: "CoriTech",
      sink: (message) => sent.push(message),
    }),
    logRepository: repository,
    recipientResolver: createRecipientResolver(),
    document: documentUpload({
      accessClassification: "ORDER_PARTICIPANTS",
      uploadedByUserId: "user-breeder",
      uploaderRoleCode: "BREEDER",
      uploaderOrganizationId: "org-breeder",
    }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.recipients.map((recipient) => recipient.email), [
    "station@coritech.test",
  ]);
  assert.equal(repository.logs[0].templateId, "document.uploaded.relevant_role");
  assert.equal(sent[0].recipient.roleCode, "BREEDING_STATION");
  assert.equal(sent.some((message) => message.recipient.roleCode === "BUYER"), false);
});

test("provider failures are logged by orchestration", async () => {
  const repository = createLogRepository();
  const service = createNotificationOrchestrationService({
    provider: {
      providerName: "http_api",
      async sendEmail() {
        throw new Error("provider rejected message");
      },
    },
    logRepository: repository,
    recipientResolver: createRecipientResolver(),
  });

  const result = await service.recordOrderNotificationHook(orderHook({
    eventType: "ORDER_CONFIRMED",
    commandName: "CONFIRM_ORDER",
    status: "CONFIRMED",
  }));

  assert.equal(result.ok, false);
  assert.equal(repository.logs.length, 1);
  assert.equal(repository.logs[0].status, "FAILED");
  assert.match(repository.logs[0].lastError, /provider rejected message/);
  assert.equal(repository.logs[0].providerMessageId, null);
});

function orderHook(overrides = {}) {
  return {
    hookType: "NOTIFICATION_REQUEST",
    source: "ORDER_COMMAND",
    eventType: overrides.eventType ?? "ORDER_SUBMITTED",
    commandName: overrides.commandName ?? "SUBMIT_ORDER",
    orderRef: {
      orderId: "order-a",
      orderNumber: "SO-20260610-000001",
      semenListingId: "listing-a",
      breederOrganizationId: "org-breeder",
      breedingStationOrganizationId: "org-station",
      previousStatus: "DRAFT",
      status: overrides.status ?? "SUBMITTED",
    },
    actorRef: {
      userId: overrides.actorUserId ?? "user-breeder",
      roleCode: overrides.actorRoleCode ?? "BREEDER",
      organizationId: overrides.actorOrganizationId ?? "org-breeder",
    },
    reason: overrides.reason ?? "Workflow reason.",
    occurredAt: timestamp,
  };
}

function documentUpload(overrides = {}) {
  return {
    id: "document-a",
    documentType: "Health certificate",
    description: null,
    targetType: "SemenOrder",
    targetId: "order-a",
    semenOrderId: "order-a",
    shipmentId: null,
    proofEventId: null,
    orderNumber: "SO-20260610-000001",
    breederOrganizationId: "org-breeder",
    breedingStationOrganizationId: "org-station",
    originalFileName: "health.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 1200,
    checksumSha256: "checksum",
    storageProvider: "minio",
    storageBucket: "coritech-local-dev",
    storageObjectKey: "orders/order-a/health.pdf",
    storageRegion: "local-dev",
    storageVersionId: null,
    accessClassification: overrides.accessClassification ?? "ORDER_PARTICIPANTS",
    status: "ACTIVE",
    replacedByDocumentId: null,
    revocationReason: null,
    replacementReason: null,
    lifecycleChangedAt: null,
    lifecycleChangedByUserId: null,
    lifecycleChangedByRoleCode: null,
    lifecycleChangedByOrganizationId: null,
    uploadedByUserId: overrides.uploadedByUserId ?? "user-breeder",
    uploaderRoleCode: overrides.uploaderRoleCode ?? "BREEDER",
    uploaderOrganizationId: overrides.uploaderOrganizationId ?? "org-breeder",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createRecipientResolver() {
  const recipients = [
    {
      email: "breeder@coritech.test",
      name: "Breeder User",
      userId: "user-breeder",
      organizationId: "org-breeder",
      roleCode: "BREEDER",
    },
    {
      email: "station@coritech.test",
      name: "Station User",
      userId: "user-station",
      organizationId: "org-station",
      roleCode: "BREEDING_STATION",
    },
    {
      email: "admin@coritech.test",
      name: "Admin User",
      userId: "user-admin",
      organizationId: "org-platform",
      roleCode: "PLATFORM_ADMIN",
    },
    {
      email: "buyer@coritech.test",
      name: "Buyer User",
      userId: "user-buyer",
      organizationId: "org-buyer",
      roleCode: "BUYER",
    },
  ];

  return {
    async listNotificationRecipients(query) {
      return recipients.filter((recipient) =>
        (!query.organizationId || recipient.organizationId === query.organizationId) &&
        (!query.roleCode || recipient.roleCode === query.roleCode) &&
        (!query.excludeUserId || recipient.userId !== query.excludeUserId)
      );
    },
    async findNotificationOrganizationById(organizationId) {
      return orgs[organizationId]
        ? {
            id: organizationId,
            name: orgs[organizationId],
          }
        : null;
    },
  };
}

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
