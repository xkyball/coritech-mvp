import test from "node:test";
import assert from "node:assert/strict";

import { createBreederDashboardViewModel } from "../breeder-dashboard/breeder-dashboard.mjs";
import { createStationDashboardViewModel } from "../station-dashboard/station-dashboard.mjs";
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

const otherBreederActor = {
  userId: "user-breeder-b",
  roles: [
    {
      userId: "user-breeder-b",
      organizationId: "org-breeder-b",
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const stationActor = {
  userId: "user-station-a",
  roles: [
    {
      userId: "user-station-a",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
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
  mareName: "Willow Queen",
  mareRegistrationReference: "M-REG-2048",
  mareBreed: "Warmblood",
  mareOwnerName: "Ava Breeder",
  intendedInseminationContext: "Fresh semen insemination at home yard.",
  vetOrRecipientContact: "Dr. Ndlovu, +27 82 555 0102",
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
  assert.match(html, /name="mareName" type="text" value="Willow Queen" required/);
  assert.match(html, /value="draft" formnovalidate/);
  assert.match(html, /value="submit"/);
});

test("order creation view can load an existing draft for editing", async () => {
  const repository = createRepository();
  const draft = await createSemenOrderFromForm({
    action: "draft",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      semenListingId: "listing-active",
      shippingCity: "Pretoria",
    },
    now: timestamp,
  });

  assert.equal(draft.ok, true);

  const viewModel = createSemenOrderCreationViewModel({
    actor: breederActor,
    organizationName: "Northern Breeding",
    draftOrder: draft.order,
    listingRecords,
    stationOrganizations,
  });
  const html = renderSemenOrderCreation(viewModel);

  assert.equal(viewModel.title, "Edit draft order");
  assert.equal(viewModel.draftOrder?.orderNumber, "SO-20260609-000010");
  assert.equal(viewModel.form.orderId, draft.order.id);
  assert.equal(viewModel.form.shippingCity, "Pretoria");
  assert.match(html, /name="draftOrderId" value="demo-order-1"/);
  assert.match(html, /Draft status: draft/);
  assert.match(html, /value="cancel" formnovalidate/);
});

test("order creation surfaces stale selected listings without blocking the form", () => {
  const viewModel = createSemenOrderCreationViewModel({
    actor: breederActor,
    selectedListingId: "listing-unavailable",
    listingRecords,
    stationOrganizations,
  });

  assert.equal(viewModel.state, "FORM");
  assert.equal(viewModel.form.semenListingId, "");
  assert.equal(viewModel.selectedListing, null);
  assert.deepEqual(viewModel.validationIssues, [
    "semenListingId must reference an active orderable listing visible to this breeder.",
  ]);
});

test("order creation rejects drafts whose listing is no longer orderable", () => {
  assert.throws(
    () =>
      createSemenOrderCreationViewModel({
        actor: breederActor,
        draftOrder: {
          id: "draft-inactive-listing",
          orderNumber: "SO-20260609-000099",
          semenListingId: "listing-unavailable",
          breederOrganizationId,
          breedingStationOrganizationId: stationOrganizationId,
          status: "DRAFT",
          createdByUserId: breederActor.userId,
          updatedByUserId: breederActor.userId,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
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
  assert.equal(result.order.mareName, null);
  assert.equal(result.statusHistory[0].toStatus, "DRAFT");
  assert.equal(result.auditHook?.action, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(result.auditLog?.sourceAction, "SEMEN_ORDER_DRAFT_CREATED");
  assert.equal(result.proofHook?.triggerRef.toStatus, "DRAFT");
});

test("breeder can update an own draft before submitting it to the assigned station", async () => {
  const repository = createRepository();
  const draft = await createSemenOrderFromForm({
    action: "draft",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      semenListingId: "listing-active",
      shippingCity: "Pretoria",
    },
    now: timestamp,
  });

  assert.equal(draft.ok, true);

  const updated = await createSemenOrderFromForm({
    action: "draft",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      ...completeForm,
      orderId: draft.order.id,
      specialInstructions: "Updated while still a draft.",
    },
    now: "2026-06-09T08:10:00.000Z",
    auditContext: {
      userAgent: "node-test/order-creation-update-draft",
    },
  });

  assert.equal(updated.ok, true);
  assert.equal(updated.order.status, "DRAFT");
  assert.equal(updated.order.specialInstructions, "Updated while still a draft.");
  assert.deepEqual(updated.statusHistory, []);
  assert.equal(updated.auditHook?.action, "SEMEN_ORDER_DRAFT_UPDATED");
  assert.equal(updated.proofHook, null);

  const submitted = await createSemenOrderFromForm({
    action: "submit",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      ...completeForm,
      orderId: draft.order.id,
    },
    now: "2026-06-09T08:20:00.000Z",
    auditContext: {
      userAgent: "node-test/order-creation-submit-draft",
    },
  });

  assert.equal(submitted.ok, true);
  assert.equal(submitted.order.status, "SUBMITTED");
  assert.deepEqual(
    submitted.statusHistory.map((history) => history.toStatus),
    ["SUBMITTED"],
  );
  assert.equal(submitted.draftAuditHook?.action, "SEMEN_ORDER_DRAFT_UPDATED");
  assert.equal(submitted.auditHook?.action, "SEMEN_ORDER_SUBMITTED");
  assert.equal(submitted.proofHook?.triggerRef.toStatus, "SUBMITTED");

  const stationDashboard = createStationDashboardViewModel({
    actor: stationActor,
    orders: await repository.listSemenOrders(),
    statusHistory: await repository.listAllOrderStatusHistory(),
  });

  assert.deepEqual(
    stationDashboard.sections.incomingOrders.items.map((order) => order.id),
    [draft.order.id],
  );
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
      "mareName is required before submitting semen order.",
      "mareRegistrationReference is required before submitting semen order.",
      "mareBreed is required before submitting semen order.",
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

test("duplicate submit of an already submitted draft is idempotent", async () => {
  const repository = createRepository();
  const submitted = await createSemenOrderFromForm({
    action: "submit",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: completeForm,
    now: timestamp,
  });

  assert.equal(submitted.ok, true);

  const duplicate = await createSemenOrderFromForm({
    action: "submit",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      ...completeForm,
      orderId: submitted.order.id,
    },
    now: "2026-06-09T08:30:00.000Z",
  });

  assert.equal(duplicate.ok, true);
  assert.equal(duplicate.idempotent, true);
  assert.equal(duplicate.order.status, "SUBMITTED");
  assert.deepEqual(duplicate.statusHistory, []);
  assert.equal((await repository.listAllOrderStatusHistory()).length, 2);
});

test("cross-organization draft update and submit are denied", async () => {
  const repository = createRepository();
  const draft = await createSemenOrderFromForm({
    action: "draft",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      semenListingId: "listing-active",
    },
    now: timestamp,
  });

  assert.equal(draft.ok, true);

  const deniedUpdate = await createSemenOrderFromForm({
    action: "draft",
    actor: otherBreederActor,
    breederOrganizationId: "org-breeder-b",
    repository,
    form: {
      ...completeForm,
      orderId: draft.order.id,
    },
    now: "2026-06-09T08:40:00.000Z",
  });

  assert.equal(deniedUpdate.ok, false);
  assert.deepEqual(deniedUpdate.issues, [
    "actor must be authorized before updating a draft semen order.",
  ]);

  const deniedSubmit = await createSemenOrderFromForm({
    action: "submit",
    actor: otherBreederActor,
    breederOrganizationId: "org-breeder-b",
    repository,
    form: {
      ...completeForm,
      orderId: draft.order.id,
    },
    now: "2026-06-09T08:45:00.000Z",
  });

  assert.equal(deniedSubmit.ok, false);
  assert.deepEqual(deniedSubmit.issues, [
    "actor must be authorized before updating a draft semen order.",
  ]);
});

test("breeder can cancel an own draft without deleting order evidence", async () => {
  const repository = createRepository();
  const draft = await createSemenOrderFromForm({
    action: "draft",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      semenListingId: "listing-active",
    },
    now: timestamp,
  });

  assert.equal(draft.ok, true);

  const cancelled = await createSemenOrderFromForm({
    action: "cancel",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      ...completeForm,
      orderId: draft.order.id,
      cancellationReason: "Breeder needs to revise mare details.",
    },
    now: "2026-06-09T08:50:00.000Z",
    auditContext: {
      userAgent: "node-test/order-creation-cancel-draft",
    },
  });

  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.order.status, "CANCELLED");
  assert.deepEqual(
    (await repository.listAllOrderStatusHistory()).map((history) => history.toStatus),
    ["DRAFT", "CANCELLED"],
  );
  assert.equal(cancelled.auditHook?.action, "SEMEN_ORDER_CANCELLED");
  assert.equal(cancelled.proofHook?.triggerRef.toStatus, "CANCELLED");
});

test("breeder cancellation requires a reason before closing an own draft", async () => {
  const repository = createRepository();
  const draft = await createSemenOrderFromForm({
    action: "draft",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      semenListingId: "listing-active",
    },
    now: timestamp,
  });

  assert.equal(draft.ok, true);

  const cancelled = await createSemenOrderFromForm({
    action: "cancel",
    actor: breederActor,
    breederOrganizationId,
    repository,
    form: {
      ...completeForm,
      orderId: draft.order.id,
    },
    now: "2026-06-09T08:55:00.000Z",
  });

  assert.equal(cancelled.ok, false);
  assert.deepEqual(cancelled.issues, [
    "cancellationReason is required before canceling a draft order.",
  ]);
});

function createRepository() {
  return createInMemorySemenOrderRepository({
    listingRecords,
    orderNumberSequenceStart: 10,
  });
}
