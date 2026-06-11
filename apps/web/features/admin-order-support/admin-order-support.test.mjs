import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAdminOrderSupportHref,
  canAccessAdminOrderSupport,
  createAdminOrderSupportAccessDecision,
  createAdminOrderSupportDetailViewModel,
  createAdminOrderSupportSearchViewModel,
  normalizeSearchFilters,
} from "./admin-order-support.mjs";

const timestamp = "2026-06-10T08:00:00.000Z";
const platformActor = {
  userId: "user-admin",
  organizationId: "org-platform",
  organizationName: "CoriTech Admin",
  roleCode: "PLATFORM_ADMIN",
  roles: [
    {
      userId: "user-admin",
      organizationId: "org-platform",
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    },
  ],
};
const breederActor = {
  userId: "user-breeder",
  organizationId: "org-breeder-a",
  organizationName: "Ava Breeding",
  roleCode: "BREEDER",
  roles: [
    {
      userId: "user-breeder",
      organizationId: "org-breeder-a",
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};
const organizations = [
  {
    organizationId: "org-breeder-a",
    name: "Ava Breeding",
  },
  {
    organizationId: "org-station-a",
    name: "Highveld Station",
  },
];
const orders = [
  buildOrder({
    id: "order-1",
    orderNumber: "SO-20260610-000001",
    breederOrganizationId: "org-breeder-a",
    breedingStationOrganizationId: "org-station-a",
    status: "SUBMITTED",
  }),
  buildOrder({
    id: "order-2",
    orderNumber: "SO-20260610-000002",
    breederOrganizationId: "org-breeder-b",
    breedingStationOrganizationId: "org-station-b",
    status: "CONFIRMED",
  }),
];

test("admin order support search filters by order, organization and status", () => {
  const byOrder = createAdminOrderSupportSearchViewModel({
    actor: platformActor,
    orders,
    organizations,
    filters: {
      query: "000001",
    },
  });
  const byOrganization = createAdminOrderSupportSearchViewModel({
    actor: platformActor,
    orders,
    organizations,
    filters: {
      query: "Highveld",
    },
  });
  const byStatus = createAdminOrderSupportSearchViewModel({
    actor: platformActor,
    orders,
    organizations,
    filters: {
      status: "CONFIRMED",
    },
  });

  assert.equal(byOrder.rows.length, 1);
  assert.equal(byOrder.rows[0].orderNumber, "SO-20260610-000001");
  assert.equal(byOrganization.rows.length, 1);
  assert.equal(byOrganization.rows[0].breedingStationOrganizationName, "Highveld Station");
  assert.equal(byStatus.rows.length, 1);
  assert.equal(byStatus.rows[0].status, "CONFIRMED");
  assert.equal(byStatus.pagination.totalItems, 1);
});

test("admin order support blocks non-admin actors at the feature contract", () => {
  assert.equal(canAccessAdminOrderSupport(platformActor), true);
  assert.equal(canAccessAdminOrderSupport(breederActor), false);
});

test("admin order support detail exposes context without silent overwrite actions", () => {
  const viewModel = createAdminOrderSupportDetailViewModel({
    actor: platformActor,
    order: orders[0],
    organizations,
    statusHistory: [
      {
        id: "history-1",
        semenOrderId: "order-1",
        orderNumber: "SO-20260610-000001",
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        actorUserId: "user-breeder",
        actorRoleCode: "BREEDER",
        actorOrganizationId: "org-breeder-a",
        reason: "Ready for station review",
        changedAt: timestamp,
      },
    ],
    proofEvents: [],
    documents: [],
    shipments: [],
    shipmentTrackingEvents: [],
    orderActivities: [
      {
        id: "activity-1",
        semenOrderId: "order-1",
        orderNumber: "SO-20260610-000001",
        type: "USER_COMMENT",
        visibility: "SHARED",
        message: "Station is reviewing the order.",
        createdByUserId: "user-station",
        createdByOrganizationId: "org-station-a",
        createdByRole: "BREEDING_STATION",
        createdAt: timestamp,
      },
    ],
    auditLogs: [],
  });

  assert.equal(viewModel.order.orderNumber, "SO-20260610-000001");
  assert.equal(viewModel.statusHistory.length, 1);
  assert.equal(viewModel.proofTimeline.items.length, 0);
  assert.equal(viewModel.activity.items.length, 2);
  assert.equal(viewModel.notImplementedContext.commentsAvailable, true);
  assert.equal(viewModel.canSilentlyOverwriteProofCriticalFields, false);
  assert.match(viewModel.auditHref, /objectType=SemenOrder/);
  assert.match(viewModel.amendmentHref, /targetType=SemenOrder/);
  assert.match(viewModel.amendmentHref, /targetId=order-1/);
});

test("admin order support access decision is ready for audit logging", () => {
  const decision = createAdminOrderSupportAccessDecision({
    actor: platformActor,
    order: orders[0],
    handlerName: "AdminOrderSupportDetailPage",
    now: timestamp,
  });

  assert.equal(decision.outcome, "ALLOW");
  assert.equal(decision.action, "VIEW_SEMEN_ORDER");
  assert.equal(decision.actorRoleCode, "PLATFORM_ADMIN");
  assert.equal(decision.targetType, "SemenOrder");
  assert.equal(decision.targetId, "order-1");
  assert.equal(decision.handlerName, "AdminOrderSupportDetailPage");
  assert.equal(decision.occurredAt, timestamp);
});

test("admin order support normalizes pagination filters defensively", () => {
  assert.deepEqual(
    normalizeSearchFilters({
      query: " SO-1 ",
      status: "SUBMITTED",
      page: "2",
      pageSize: "500",
      direction: "sideways",
      sort: "unsafe",
    }),
    {
      direction: "desc",
      query: "SO-1",
      sort: "updatedAt",
      status: "SUBMITTED",
      page: 2,
      pageSize: 100,
    },
  );
});

test("admin order support preserves whitelisted sort and filter params in hrefs", () => {
  const filters = normalizeSearchFilters({
    direction: "asc",
    pageSize: "10",
    query: "SO",
    sort: "orderNumber",
    status: "SUBMITTED",
  });

  assert.equal(
    buildAdminOrderSupportHref(filters, { page: 2 }),
    "/app/admin/orders?query=SO&sort=orderNumber&direction=asc&pageSize=10&page=2&status=SUBMITTED",
  );
});

test("admin order support sorts before paginating", () => {
  const viewModel = createAdminOrderSupportSearchViewModel({
    actor: platformActor,
    orders,
    organizations,
    filters: {
      direction: "desc",
      page: 1,
      pageSize: 1,
      query: "",
      sort: "orderNumber",
      status: "",
    },
  });

  assert.equal(viewModel.rows.length, 1);
  assert.equal(viewModel.rows[0].orderNumber, "SO-20260610-000002");
  assert.equal(viewModel.pagination.totalItems, 2);
  assert.equal(viewModel.pagination.hasNextPage, true);
  assert.match(viewModel.pagination.nextHref, /sort=orderNumber/);
  assert.match(viewModel.pagination.nextHref, /direction=desc/);
});

function buildOrder(overrides) {
  return {
    id: overrides.id,
    orderNumber: overrides.orderNumber,
    semenListingId: "listing-1",
    breederOrganizationId: overrides.breederOrganizationId,
    breedingStationOrganizationId: overrides.breedingStationOrganizationId,
    status: overrides.status,
    requestedDeliveryDate: "2026-06-15",
    mareName: "Willow Queen",
    mareRegistrationReference: "M-REG-2048",
    mareBreed: "Warmblood",
    mareOwnerName: "Ava Breeder",
    intendedInseminationContext: "Fresh semen insemination at home yard.",
    vetOrRecipientContact: "Dr. Ndlovu",
    shippingContactName: "Ava Breeder",
    shippingContactPhone: "+27 82 555 0101",
    shippingAddressLine1: "42 Foaling Barn Road",
    shippingAddressLine2: null,
    shippingCity: "Pretoria",
    shippingRegion: "Gauteng",
    shippingPostalCode: "0081",
    shippingCountry: "South Africa",
    specialInstructions: "Call before dispatch.",
    createdByUserId: "user-breeder",
    updatedByUserId: "user-breeder",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
