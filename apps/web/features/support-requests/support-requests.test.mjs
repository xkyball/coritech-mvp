import test from "node:test";
import assert from "node:assert/strict";

import {
  createAdminSupportQueueViewModel,
  createSupportRequestFormViewModel,
  submitSupportRequest,
} from "./support-requests.mjs";

const timestamp = "2026-06-10T12:00:00.000Z";
const order = Object.freeze({
  id: "order-a",
  orderNumber: "SO-20260610-000001",
  semenListingId: "listing-a",
  breederOrganizationId: "org-breeder-a",
  breedingStationOrganizationId: "org-station-a",
  status: "SUBMITTED",
});
const breederActor = Object.freeze({
  userId: "user-breeder",
  organizationId: "org-breeder-a",
  organizationName: "Breeder A",
  roleCode: "BREEDER",
  roles: Object.freeze([
    {
      userId: "user-breeder",
      organizationId: "org-breeder-a",
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ]),
});
const adminActor = Object.freeze({
  userId: "user-admin",
  organizationId: "org-platform",
  organizationName: "CoriTech Admin",
  roleCode: "PLATFORM_ADMIN",
  roles: Object.freeze([
    {
      userId: "user-admin",
      organizationId: "org-platform",
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    },
  ]),
});

test("support request form exposes categories for authorized order users", () => {
  const viewModel = createSupportRequestFormViewModel({
    actor: breederActor,
    order,
  });

  assert.equal(viewModel.canSubmit, true);
  assert.equal(viewModel.orderId, "order-a");
  assert.ok(viewModel.categories.some((category) => category.value === "ORDER_STATUS"));
});

test("submitSupportRequest persists and queues admin notification", async () => {
  const repository = createRepository();
  const result = await submitSupportRequest({
    actor: breederActor,
    category: "ORDER_STATUS",
    message: "Please review this order.",
    now: timestamp,
    order,
    repository,
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok ? result.result.supportRequest.adminNotificationStatus : null, "QUEUED");
  assert.equal(result.ok ? result.result.notificationHook.channel : null, "ADMIN_QUEUE");
  assert.equal((await repository.listSupportRequests()).length, 1);
});

test("submitSupportRequest returns issues for unauthorized object access", async () => {
  const result = await submitSupportRequest({
    actor: {
      ...breederActor,
      organizationId: "org-other",
      roles: [],
    },
    category: "OTHER",
    message: "Not mine",
    order,
    repository: createRepository(),
  });

  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.issues.join(" "), /authorized/);
});

test("admin support queue filters request rows without exposing to normal users", async () => {
  const queue = createAdminSupportQueueViewModel({
    actor: adminActor,
    filters: {
      status: "OPEN",
    },
    supportRequests: [
      buildRequest({
        id: "support-1",
        category: "ORDER_STATUS",
        status: "OPEN",
      }),
      buildRequest({
        id: "support-2",
        category: "SHIPMENT",
        status: "RESOLVED",
      }),
    ],
  });
  const deniedQueue = createAdminSupportQueueViewModel({
    actor: breederActor,
    supportRequests: [],
  });

  assert.equal(queue.canAccess, true);
  assert.deepEqual(queue.rows.map((row) => row.id), ["support-1"]);
  assert.equal(queue.rows[0].orderNumber, "SO-20260610-000001");
  assert.equal(deniedQueue.canAccess, false);
});

function buildRequest(overrides = {}) {
  return {
    id: overrides.id ?? "support-1",
    objectType: "SemenOrder",
    objectId: "order-a",
    objectRef: {
      orderNumber: "SO-20260610-000001",
    },
    category: overrides.category ?? "OTHER",
    message: "Support message",
    status: overrides.status ?? "OPEN",
    createdByUserId: "user-breeder",
    createdByOrganizationId: "org-breeder-a",
    createdByRole: "BREEDER",
    adminNotificationStatus: "QUEUED",
    adminNotificationQueuedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function createRepository() {
  const requests = [];

  return {
    async createSupportRequest(request) {
      const persisted = {
        ...request,
        id: request.id ?? `support-${requests.length + 1}`,
      };
      requests.push(persisted);
      return persisted;
    },
    async listSupportRequests(filters = {}) {
      return requests.filter((request) =>
        (!filters.status || request.status === filters.status) &&
        (!filters.category || request.category === filters.category)
      );
    },
  };
}
