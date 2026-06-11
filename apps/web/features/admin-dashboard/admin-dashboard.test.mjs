import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessAdminDashboard,
  createAdminDashboardViewModel,
  prepareAdminDashboardAuditLog,
} from "./admin-dashboard.mjs";

const platformOrganizationId = "00000000-0000-4000-8000-000000000001";

const adminActor = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000010",
  organizationId: platformOrganizationId,
  organizationName: "CoriTech Platform",
  roleCode: "PLATFORM_ADMIN",
  roles: Object.freeze([
    Object.freeze({
      id: "role-admin",
      userId: "00000000-0000-4000-8000-000000000010",
      organizationId: platformOrganizationId,
      roleCode: "PLATFORM_ADMIN",
      effectiveAt: "2026-06-01T00:00:00.000Z",
      revokedAt: null,
    }),
  ]),
});

const breederActor = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000020",
  organizationId: "00000000-0000-4000-8000-000000000002",
  organizationName: "Blue Stud",
  roleCode: "BREEDER",
  roles: Object.freeze([
    Object.freeze({
      id: "role-breeder",
      userId: "00000000-0000-4000-8000-000000000020",
      organizationId: "00000000-0000-4000-8000-000000000002",
      roleCode: "BREEDER",
      effectiveAt: "2026-06-01T00:00:00.000Z",
      revokedAt: null,
    }),
  ]),
});

test("admin dashboard summarizes operations and routes search to order support", () => {
  const viewModel = createAdminDashboardViewModel({
    actor: adminActor,
    activeListingCount: 3,
    orders: [
      orderFixture({
        id: "00000000-0000-4000-8000-000000000101",
        orderNumber: "CORI-2026-0002",
        status: "SUBMITTED",
        updatedAt: "2026-06-10T11:00:00.000Z",
      }),
      orderFixture({
        id: "00000000-0000-4000-8000-000000000102",
        orderNumber: "CORI-2026-0001",
        status: "CONFIRMED",
        updatedAt: "2026-06-10T10:00:00.000Z",
      }),
    ],
    orderStatusHistory: [
      statusHistoryFixture({
        semenOrderId: "00000000-0000-4000-8000-000000000102",
        toStatus: "SUBMITTED",
        changedAt: "2026-06-10T08:00:00.000Z",
      }),
      statusHistoryFixture({
        semenOrderId: "00000000-0000-4000-8000-000000000102",
        fromStatus: "SUBMITTED",
        toStatus: "CONFIRMED",
        changedAt: "2026-06-10T10:00:00.000Z",
      }),
    ],
    shipments: [Object.freeze({ id: "shipment-1" })],
    documents: [
      Object.freeze({
        id: "document-1",
        semenOrderId: "00000000-0000-4000-8000-000000000102",
      }),
    ],
    proofEvents: [Object.freeze({ id: "proof-1" }), Object.freeze({ id: "proof-2" })],
    supportRequests: [Object.freeze({ id: "support-1" })],
    auditLogs: [Object.freeze({ id: "audit-1" })],
  });

  assert.equal(viewModel.canAccess, true);
  assert.deepEqual(
    viewModel.metrics.map((metric) => [metric.label, metric.value]),
    [
      ["Orders", 2],
      ["Active listings", 3],
      ["Shipments", 1],
      ["Documents", 1],
      ["Proof events", 2],
      ["Support requests", 1],
      ["Audit logs", 1],
    ],
  );
  assert.deepEqual(
    viewModel.orderStatusSummary.map((item) => [item.status, item.count]),
    [
      ["SUBMITTED", 1],
      ["CONFIRMED", 1],
    ],
  );
  assert.equal(viewModel.orderSearch.action, "/app/admin/orders");
  assert.equal(viewModel.auditLogHref, "/app/admin/audit");
  assert.equal(viewModel.recentOrders[0].orderNumber, "CORI-2026-0002");
  assert.equal(viewModel.operationalReport.averageTimeToConfirmation.displayValue, "2h");
  assert.equal(viewModel.operationalReport.documentationCompletion.displayValue, "50%");
  assert.deepEqual(
    viewModel.operationalReport.metrics.map((metric) => metric.key),
    [
      "activeListings",
      "submittedOrders",
      "confirmedOrders",
      "rejectedOrders",
      "completedOrders",
      "shipments",
      "uploadedDocuments",
      "proofEvents",
      "documentationCompletionRate",
      "averageTimeToConfirmation",
    ],
  );
});

test("admin dashboard exposes all required admin navigation areas without enabling planned flows", () => {
  const viewModel = createAdminDashboardViewModel({
    actor: adminActor,
    orders: [],
  });

  assert.deepEqual(
    viewModel.navigationAreas.map((area) => area.key),
    [
      "users",
      "invitations",
      "organizations",
      "roles",
      "listings",
      "orders",
      "support",
      "shipments",
      "documents",
      "proof",
      "audit",
      "amendments",
    ],
  );
  assert.equal(
    viewModel.navigationAreas.find((area) => area.key === "orders")?.status,
    "available",
  );
  assert.equal(
    viewModel.navigationAreas.find((area) => area.key === "support")?.status,
    "available",
  );
  assert.equal(
    viewModel.navigationAreas.find((area) => area.key === "users")?.status,
    "available",
  );
  assert.equal(
    viewModel.navigationAreas.find((area) => area.key === "amendments")?.status,
    "available",
  );
  assert.equal(viewModel.limitations.amendmentWorkflowAvailable, true);
});

test("admin dashboard access is platform-admin only and prepares audit evidence", () => {
  assert.equal(canAccessAdminDashboard(adminActor), true);
  assert.equal(canAccessAdminDashboard(breederActor), false);

  const auditLog = prepareAdminDashboardAuditLog({
    actor: adminActor,
    auditLogId: "audit-dashboard",
    requestContext: {
      ipAddress: null,
      userAgent: "node-test",
    },
    now: "2026-06-10T12:00:00.000Z",
  });

  assert.equal(auditLog.action, "ACCESS_DECISION");
  assert.equal(auditLog.sourceAction, "ADMIN_DASHBOARD_VIEW");
  assert.equal(auditLog.objectType, "AdminDashboard");
  assert.equal(auditLog.objectId, platformOrganizationId);
  assert.equal(auditLog.userAgent, "node-test");
  assert.equal(auditLog.metadata.handlerName, "adminDashboard");
});

function orderFixture(overrides = {}) {
  return Object.freeze({
    id: "00000000-0000-4000-8000-000000000100",
    orderNumber: "CORI-2026-0001",
    semenListingId: "00000000-0000-4000-8000-000000000200",
    breederOrganizationId: "00000000-0000-4000-8000-000000000002",
    breedingStationOrganizationId: "00000000-0000-4000-8000-000000000003",
    status: "DRAFT",
    mareName: null,
    mareRegistrationReference: null,
    mareBreed: null,
    mareOwnerName: null,
    intendedInseminationContext: null,
    requestedDeliveryDate: null,
    shippingContactName: null,
    shippingContactPhone: null,
    shippingAddressLine1: null,
    shippingAddressLine2: null,
    shippingCity: null,
    shippingRegion: null,
    shippingPostalCode: null,
    shippingCountry: null,
    vetOrRecipientContact: null,
    specialInstructions: null,
    createdByUserId: adminActor.userId,
    submittedAt: null,
    cancelledAt: null,
    cancellationReason: null,
    cancellationActorUserId: null,
    createdAt: "2026-06-10T09:00:00.000Z",
    updatedAt: "2026-06-10T09:00:00.000Z",
    ...overrides,
  });
}

function statusHistoryFixture(overrides = {}) {
  return Object.freeze({
    id: "status-history-1",
    semenOrderId: "00000000-0000-4000-8000-000000000101",
    orderNumber: "CORI-2026-0001",
    fromStatus: null,
    toStatus: "SUBMITTED",
    actorUserId: adminActor.userId,
    actorRoleCode: "PLATFORM_ADMIN",
    actorOrganizationId: platformOrganizationId,
    reason: null,
    changedAt: "2026-06-10T08:00:00.000Z",
    ...overrides,
  });
}
