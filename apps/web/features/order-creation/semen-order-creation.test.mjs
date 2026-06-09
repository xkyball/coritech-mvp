import test from "node:test";
import assert from "node:assert/strict";

import { createBreederDashboardViewModel } from "../breeder-dashboard/breeder-dashboard.mjs";
import {
  SemenOrderCreationValidationError,
  createInMemorySemenOrderRepository,
  createSemenOrderCreationConfirmationViewModel,
  createSemenOrderCreationViewModel,
  createSemenOrderFromForm,
  renderSemenOrderCreation,
} from "./semen-order-creation.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";

const breederActor = {
  userId: "user-breeder-a",
  roles: [
    {
      userId: "user-breeder-a",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const listingRecords = [
  {
    listing: {
      id: "listing-active",
      stallionId: "stallion-a",
      breedingStationOrganizationId: stationOrganizationId,
      availabilityStatus: "AVAILABLE",
      listingStatus: "ACTIVE",
      termsSummary: "Fresh chilled semen available weekdays",
    },
    stallion: {
      id: "stallion-a",
      name: "Northern Light",
      breed: "Warmblood",
      ueln: "276020000000001",
      microchipNumber: "chip-001",
      breedingStationOrganizationId: stationOrganizationId,
      status: "ACTIVE",
    },
  },
  {
    listing: {
      id: "listing-unavailable",
      stallionId: "stallion-b",
      breedingStationOrganizationId: stationOrganizationId,
      availabilityStatus: "UNAVAILABLE",
      listingStatus: "ACTIVE",
      termsSummary: "Collection paused",
    },
    stallion: {
      id: "stallion-b",
      name: "River Crown",
      breed: "Hanoverian",
      ueln: null,
      microchipNumber: null,
      breedingStationOrganizationId: stationOrganizationId,
      status: "ACTIVE",
    },
  },
];

const stationOrganizations = [
  {
    organizationId: stationOrganizationId,
    name: "North Valley Station",
  },
];

const completeForm = {
  semenListingId: "listing-active",
  requestedDeliveryDate: "2026-06-12",
  shippingContactName: "Ava Breeder",
  shippingContactPhone: "+27 82 555 0101",
  shippingAddressLine1: "42 Foaling Barn Road",
  shippingAddressLine2: "Gate 3",
  shippingCity: "Pretoria",
  shippingRegion: "Gauteng",
  shippingPostalCode: "0081",
  shippingCountry: "South Africa",
  specialInstructions: "Call before dispatch.",
};

test("order creation view renders listing selection, review and draft/submit controls", () => {
  const viewModel = createSemenOrderCreationViewModel({
    actor: breederActor,
    organizationName: "Northern Breeding",
    selectedListingId: "listing-active",
    listingRecords,
    stationOrganizations,
    form: completeForm,
  });
  const html = renderSemenOrderCreation(viewModel);

  assert.equal(viewModel.organizationContext.organizationId, breederOrganizationId);
  assert.equal(viewModel.selectedListing?.stallionName, "Northern Light");
  assert.deepEqual(
    viewModel.selectableListings.map((listing) => listing.id),
    ["listing-active"],
  );
  assert.match(html, /Review stallion and station/);
  assert.match(html, /North Valley Station \(org-station-a\)/);
  assert.match(html, /name="requestedDeliveryDate" type="date" value="2026-06-12" required/);
  assert.match(html, /value="draft" formnovalidate/);
  assert.match(html, /value="submit"/);
});

test("order creation rejects unavailable or invisible selected listings", () => {
  assert.throws(
    () =>
      createSemenOrderCreationViewModel({
        actor: breederActor,
        selectedListingId: "listing-unavailable",
        listingRecords,
        stationOrganizations,
      }),
    (error) =>
      error instanceof SemenOrderCreationValidationError &&
      error.issues.includes(
        "semenListingId must reference an active orderable listing visible to this breeder.",
      ),
  );
});

test("breeder can create a draft from the order form", async () => {
  const repository = createRepository();
  const result = await createSemenOrderFromForm({
    action: "draft",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      semenListingId: "listing-active",
    },
    now: timestamp,
    auditContext: {
      userAgent: "node-test/order-creation-draft",
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.order.status, "DRAFT");
  assert.equal(result.order.orderNumber, "SO-20260609-000010");
  assert.equal(result.order.requestedDeliveryDate, null);
  assert.equal(result.statusHistory[0].toStatus, "DRAFT");
  assert.equal(result.auditHook?.action, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(result.auditLog?.sourceAction, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(result.proofHook?.triggerRef.toStatus, "DRAFT");
});

test("submit validates required delivery and shipping fields before creating an order", async () => {
  const repository = createRepository();
  const result = await createSemenOrderFromForm({
    action: "submit",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      semenListingId: "listing-active",
      requestedDeliveryDate: "not-a-date",
    },
    now: timestamp,
  });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.issues,
    [
      "requestedDeliveryDate must be a valid YYYY-MM-DD date.",
      "shippingContactName is required before submitting semen order.",
      "shippingContactPhone is required before submitting semen order.",
      "shippingAddressLine1 is required before submitting semen order.",
      "shippingCity is required before submitting semen order.",
      "shippingPostalCode is required before submitting semen order.",
      "shippingCountry is required before submitting semen order.",
    ],
  );
  assert.deepEqual(await repository.listSemenOrders(), []);
});

test("breeder can submit an order and see it in dashboard data", async () => {
  const repository = createRepository();
  const result = await createSemenOrderFromForm({
    action: "submit",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: completeForm,
    now: timestamp,
    auditContext: {
      userAgent: "node-test/order-creation-submit",
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.order.status, "SUBMITTED");
  assert.equal(result.order.orderNumber, "SO-20260609-000010");
  assert.equal(result.order.shippingCity, "Pretoria");
  assert.deepEqual(
    result.statusHistory.map((history) => history.toStatus),
    ["DRAFT", "SUBMITTED"],
  );
  assert.equal(result.draftAuditHook?.action, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(result.auditHook?.action, "SEMEN_ORDER_SUBMITTED");
  assert.equal(result.proofHook?.triggerRef.toStatus, "SUBMITTED");

  const dashboard = createBreederDashboardViewModel({
    actor: breederActor,
    orders: await repository.listSemenOrders(),
    statusHistory: await repository.listAllOrderStatusHistory(),
  });

  assert.deepEqual(
    dashboard.sections.myOrders.items.map((order) => order.orderNumber),
    ["SO-20260609-000010"],
  );
  assert.equal(dashboard.sections.myOrders.items[0].status, "SUBMITTED");

  const confirmation = createSemenOrderCreationConfirmationViewModel({
    order: result.order,
    statusHistory: [...result.statusHistory],
    auditHook: result.auditHook,
    proofHook: result.proofHook,
  });
  const html = renderSemenOrderCreation(confirmation);

  assert.match(html, /SO-20260609-000010/);
  assert.match(html, /submitted/);
});

function createRepository() {
  return createInMemorySemenOrderRepository({
    listingRecords,
    orderNumberSequenceStart: 10,
  });
}
