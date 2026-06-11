import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAverageTimeToConfirmation,
  calculateDocumentationCompletion,
  createOperationalReportingViewModel,
} from "./operational-reporting.mjs";

const timestamp = "2026-06-10T08:00:00.000Z";

test("operational reporting creates investor-demo metrics from real records", () => {
  const report = createOperationalReportingViewModel({
    activeListingCount: 2,
    generatedAt: timestamp,
    orders: [
      orderFixture({ id: "order-1", status: "SUBMITTED" }),
      orderFixture({ id: "order-2", status: "CONFIRMED" }),
      orderFixture({ id: "order-3", status: "REJECTED" }),
      orderFixture({ id: "order-4", status: "COMPLETED" }),
    ],
    orderStatusHistory: [
      historyFixture({ semenOrderId: "order-2", toStatus: "SUBMITTED", changedAt: "2026-06-10T08:00:00.000Z" }),
      historyFixture({ semenOrderId: "order-2", fromStatus: "SUBMITTED", toStatus: "CONFIRMED", changedAt: "2026-06-10T14:00:00.000Z" }),
    ],
    shipments: [{ id: "shipment-1" }],
    documents: [
      { id: "document-1", semenOrderId: "order-2" },
      { id: "document-2", semenOrderId: "order-4" },
    ],
    proofEvents: [{ id: "proof-1" }, { id: "proof-2" }],
  });

  assert.equal(report.generatedAt, timestamp);
  assert.deepEqual(report.orderStatusCounts, {
    SUBMITTED: 1,
    CONFIRMED: 1,
    REJECTED: 1,
    COMPLETED: 1,
  });
  assert.equal(report.averageTimeToConfirmation.averageHours, 6);
  assert.equal(report.documentationCompletion.rate, 50);
  assert.deepEqual(
    report.metrics.map((metric) => [metric.key, metric.displayValue]),
    [
      ["activeListings", "2"],
      ["submittedOrders", "1"],
      ["confirmedOrders", "1"],
      ["rejectedOrders", "1"],
      ["completedOrders", "1"],
      ["shipments", "1"],
      ["uploadedDocuments", "2"],
      ["proofEvents", "2"],
      ["documentationCompletionRate", "50%"],
      ["averageTimeToConfirmation", "6h"],
    ],
  );
});

test("average time to confirmation ignores incomplete or reversed history", () => {
  const metric = calculateAverageTimeToConfirmation({
    orders: [
      orderFixture({ id: "order-1", status: "CONFIRMED" }),
      orderFixture({ id: "order-2", status: "CONFIRMED" }),
    ],
    statusHistory: [
      historyFixture({ semenOrderId: "order-1", toStatus: "SUBMITTED", changedAt: "2026-06-10T08:00:00.000Z" }),
      historyFixture({ semenOrderId: "order-1", fromStatus: "SUBMITTED", toStatus: "CONFIRMED", changedAt: "2026-06-10T09:30:00.000Z" }),
      historyFixture({ semenOrderId: "order-2", toStatus: "CONFIRMED", changedAt: "2026-06-10T07:00:00.000Z" }),
    ],
  });

  assert.equal(metric.averageHours, 1.5);
  assert.equal(metric.sampleSize, 1);
});

test("documentation completion is unavailable when no eligible orders exist", () => {
  const metric = calculateDocumentationCompletion({
    orders: [orderFixture({ id: "order-1", status: "DRAFT" })],
    documents: [{ id: "document-1", semenOrderId: "order-1" }],
  });

  assert.equal(metric.rate, null);
  assert.equal(metric.displayValue, "Not enough data");
  assert.equal(metric.eligibleOrderCount, 0);
});

function orderFixture(overrides = {}) {
  return {
    id: "order-1",
    orderNumber: "SO-20260610-000001",
    semenListingId: "listing-1",
    breederOrganizationId: "org-breeder",
    breedingStationOrganizationId: "org-station",
    status: "DRAFT",
    requestedDeliveryDate: null,
    mareName: null,
    mareRegistrationReference: null,
    mareBreed: null,
    mareOwnerName: null,
    intendedInseminationContext: null,
    vetOrRecipientContact: null,
    shippingContactName: null,
    shippingContactPhone: null,
    shippingAddressLine1: null,
    shippingAddressLine2: null,
    shippingCity: null,
    shippingRegion: null,
    shippingPostalCode: null,
    shippingCountry: null,
    specialInstructions: null,
    createdByUserId: "user-breeder",
    updatedByUserId: "user-breeder",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

function historyFixture(overrides = {}) {
  return {
    id: "history-1",
    semenOrderId: "order-1",
    orderNumber: "SO-20260610-000001",
    fromStatus: null,
    toStatus: "SUBMITTED",
    actorUserId: "user-breeder",
    actorRoleCode: "BREEDER",
    actorOrganizationId: "org-breeder",
    reason: null,
    changedAt: timestamp,
    ...overrides,
  };
}
