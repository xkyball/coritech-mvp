import test from "node:test";
import assert from "node:assert/strict";

import {
  SupportRequestAuthorizationError,
  createSupportRequest,
  listAdminSupportRequests,
} from "./support-request.mjs";

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
const stationActor = Object.freeze({
  userId: "user-station",
  organizationId: "org-station-a",
  organizationName: "Station A",
  roleCode: "BREEDING_STATION",
  roles: Object.freeze([
    {
      userId: "user-station",
      organizationId: "org-station-a",
      roleCode: "BREEDING_STATION",
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

test("authorized breeder and station users can create support requests", async () => {
  const repository = createRepository();
  const breederResult = await createSupportRequest({
    actor: breederActor,
    category: "ORDER_STATUS",
    message: "Please confirm next station step.",
    now: timestamp,
    order,
    repository,
  });
  const stationResult = await createSupportRequest({
    actor: stationActor,
    category: "SHIPMENT",
    message: "Courier handoff needs review.",
    now: timestamp,
    order,
    repository,
  });

  assert.equal(breederResult.supportRequest.objectType, "SemenOrder");
  assert.equal(breederResult.supportRequest.objectId, "order-a");
  assert.equal(breederResult.supportRequest.status, "OPEN");
  assert.equal(breederResult.supportRequest.adminNotificationStatus, "QUEUED");
  assert.equal(breederResult.notificationHook.eventType, "SUPPORT_REQUEST_CREATED");
  assert.equal(stationResult.supportRequest.createdByRole, "BREEDING_STATION");
  assert.equal((await repository.listSupportRequests()).length, 2);
});

test("unauthorized object support request creation is denied", async () => {
  await assert.rejects(
    () => createSupportRequest({
      actor: {
        ...breederActor,
        organizationId: "org-other",
        roles: [],
      },
      category: "OTHER",
      message: "I should not see this.",
      order,
      repository: createRepository(),
    }),
    SupportRequestAuthorizationError,
  );
});

test("admin support request list is platform-admin only", async () => {
  const repository = createRepository();

  await createSupportRequest({
    actor: breederActor,
    category: "DOCUMENT_ACCESS",
    message: "I cannot open the uploaded certificate.",
    now: timestamp,
    order,
    repository,
  });

  const requests = await listAdminSupportRequests({
    actor: adminActor,
    repository,
  });

  assert.equal(requests.length, 1);
  assert.equal(requests[0].category, "DOCUMENT_ACCESS");
  await assert.rejects(
    () => listAdminSupportRequests({
      actor: breederActor,
      repository,
    }),
    SupportRequestAuthorizationError,
  );
});

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
