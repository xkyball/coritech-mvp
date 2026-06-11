import assert from "node:assert/strict";
import test from "node:test";

import {
  PAYMENT_REFERENCE_STATUSES,
  PaymentReferenceValidationError,
  createPaymentReferenceService,
  prepareCreatePaymentReference,
  prepareUpdatePaymentReferenceStatus,
  validateCreatePaymentReferenceInput,
} from "./payment-reference.mjs";

const timestamp = "2026-06-10T08:00:00.000Z";
const actor = {
  userId: "user-admin",
  roles: [
    {
      userId: "user-admin",
      organizationId: "org-platform",
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    },
  ],
};
const order = {
  id: "order-1",
  orderNumber: "SO-20260610-000001",
  breederOrganizationId: "org-breeder",
  breedingStationOrganizationId: "org-station",
};

test("payment reference statuses stay reference-only and phase scoped", () => {
  assert.deepEqual(PAYMENT_REFERENCE_STATUSES, [
    "NOT_REQUIRED",
    "PENDING",
    "AUTHORIZED",
    "PAID",
    "FAILED",
    "REFUNDED",
  ]);
});

test("payment reference links to an order without storing sensitive payment data", () => {
  const prepared = prepareCreatePaymentReference({
    actor,
    order,
    paymentReferenceId: "payment-1",
    providerName: "manual",
    providerReferenceId: "INV-1001",
    status: "PENDING",
    amount: 1200.456,
    currency: "zar",
    createdAt: timestamp,
  });

  assert.equal(prepared.paymentReference.semenOrderId, "order-1");
  assert.equal(prepared.paymentReference.orderNumber, "SO-20260610-000001");
  assert.equal(prepared.paymentReference.providerName, "manual");
  assert.equal(prepared.paymentReference.providerReferenceId, "INV-1001");
  assert.equal(prepared.paymentReference.amount, 1200.46);
  assert.equal(prepared.paymentReference.currency, "ZAR");
  assert.equal("cardNumber" in prepared.paymentReference, false);
});

test("payment reference validation rejects card data and missing provider reference", () => {
  assert.deepEqual(
    validateCreatePaymentReferenceInput({
      actor,
      order,
      providerName: "manual",
      status: "PENDING",
      cardNumber: "4111111111111111",
    }),
    [
      "cardNumber is not stored by CoriTech payment references.",
      "providerReferenceId is required.",
    ],
  );
});

test("payment reference status update preserves provider reference and audit value", () => {
  const existing = prepareCreatePaymentReference({
    actor,
    order,
    paymentReferenceId: "payment-1",
    providerName: "manual",
    providerReferenceId: "INV-1001",
    status: "PENDING",
    amount: 1200,
    currency: "ZAR",
    createdAt: timestamp,
  }).paymentReference;
  const updated = prepareUpdatePaymentReferenceStatus({
    actor,
    existingPaymentReference: existing,
    status: "PAID",
    reason: "Manual bank payment reconciled.",
    now: "2026-06-10T09:00:00.000Z",
  });

  assert.equal(updated.paymentReference.status, "PAID");
  assert.equal(updated.paymentReference.providerReferenceId, "INV-1001");
  assert.equal(updated.reason, "Manual bank payment reconciled.");
  assert.equal(updated.paymentReference.updatedByUserId, "user-admin");
});

test("payment reference service writes audit log for status updates", async () => {
  const repository = buildRepository();
  const service = createPaymentReferenceService({ repository });
  const created = await service.createPaymentReference({
    actor,
    order,
    providerName: "manual",
    providerReferenceId: "INV-1001",
    status: "PENDING",
    amount: 1200,
    currency: "ZAR",
    createdAt: timestamp,
  });
  const paid = await service.updatePaymentReferenceStatus({
    actor,
    paymentReferenceId: created.paymentReference.id,
    status: "PAID",
    reason: "Manual payment confirmed.",
    now: "2026-06-10T09:00:00.000Z",
  });

  assert.equal(paid.paymentReference.status, "PAID");
  assert.equal(paid.auditHook.action, "PAYMENT_REFERENCE_STATUS_UPDATED");
  assert.equal(paid.auditLog.sourceAction, "PAYMENT_REFERENCE_STATUS_UPDATED");
  assert.equal(paid.auditLog.objectType, "PaymentReference");
  assert.equal(paid.auditLog.objectId, created.paymentReference.id);
  assert.equal(paid.auditLog.previousValues?.status, "PENDING");
  assert.equal(paid.auditLog.newValues?.status, "PAID");
});

test("payment reference update requires provider reference unless not required", () => {
  const existing = {
    ...prepareCreatePaymentReference({
      actor,
      order,
      paymentReferenceId: "payment-1",
      providerName: "manual",
      providerReferenceId: "INV-1001",
      status: "PENDING",
      createdAt: timestamp,
    }).paymentReference,
    providerName: null,
    providerReferenceId: null,
  };

  assert.throws(
    () =>
      prepareUpdatePaymentReferenceStatus({
        actor,
        existingPaymentReference: existing,
        status: "PAID",
      }),
    (error) =>
      error instanceof PaymentReferenceValidationError &&
      error.issues.includes(
        "providerName and providerReferenceId are required unless status is NOT_REQUIRED.",
      ),
  );
});

function buildRepository() {
  let paymentSequence = 1;
  let auditSequence = 1;
  const records = new Map();

  return {
    async createPaymentReference(paymentReference) {
      const persisted = {
        ...paymentReference,
        id: paymentReference.id ?? `payment-${paymentSequence++}`,
      };
      records.set(persisted.id, persisted);
      return persisted;
    },
    async findPaymentReferenceById(paymentReferenceId) {
      return records.get(paymentReferenceId) ?? null;
    },
    async updatePaymentReference(paymentReference) {
      records.set(paymentReference.id, paymentReference);
      return paymentReference;
    },
    async createAuditLog(auditLog) {
      return {
        ...auditLog,
        id: auditLog.id ?? `audit-${auditSequence++}`,
      };
    },
  };
}
