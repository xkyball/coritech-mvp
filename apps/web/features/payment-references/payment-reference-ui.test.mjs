// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import {
  PAYMENT_REFERENCE_SENSITIVE_FIELD_NAMES,
  PaymentReferenceUiAuthorizationError,
  PaymentReferenceUiValidationError,
  buildPaymentReferenceMutationCommand,
  createPaymentReferencePanelViewModel,
  executePaymentReferenceMutation,
  normalizePaymentReferenceFormValues,
} from "./payment-reference-ui.mjs";

const order = Object.freeze({
  id: "order-1",
  orderNumber: "SO-20260610-000001",
  breederOrganizationId: "org-breeder",
  breedingStationOrganizationId: "org-station",
});

const breederActor = actor("user-breeder", "BREEDER", "org-breeder");
const stationActor = actor("user-station", "BREEDING_STATION", "org-station");
const unrelatedStationActor = actor("user-other", "BREEDING_STATION", "org-other");
const adminActor = actor("user-admin", "PLATFORM_ADMIN", "org-platform");

test("payment reference panel displays current status for breeder without maintenance fields", () => {
  const viewModel = createPaymentReferencePanelViewModel({
    actor: breederActor,
    order,
    paymentReference: paymentReference({
      status: "PAID",
      providerReferenceId: "INV-1001",
    }),
  });

  assert.equal(viewModel.status, "PAID");
  assert.equal(viewModel.statusLabel, "Paid");
  assert.equal(viewModel.maintenance.canMaintain, false);
  assert.equal(viewModel.maintenance.form, null);
  assert.equal(
    viewModel.displayRows.find((row) => row.label === "Provider reference")?.value,
    "INV-1001",
  );
});

test("authorized station and admin users can prepare manual payment reference changes", async () => {
  const repository = createMemoryPaymentReferenceRepository([
    paymentReference({
      id: "payment-1",
      status: "PENDING",
    }),
  ]);
  const stationUpdate = await executePaymentReferenceMutation({
    actor: stationActor,
    existingPaymentReference: await repository.findPaymentReferenceById("payment-1"),
    order,
    repository,
    values: {
      status: "PAID",
      providerName: "manual",
      providerReferenceId: "INV-1001",
      amount: "1200.45",
      currency: "zar",
      reason: "Manual reference reconciled.",
    },
    now: "2026-06-10T12:00:00.000Z",
  });

  assert.equal(stationUpdate.paymentReference.status, "PAID");
  assert.equal(stationUpdate.paymentReference.currency, "ZAR");
  assert.equal(stationUpdate.auditHook.action, "PAYMENT_REFERENCE_STATUS_UPDATED");
  assert.equal(repository.auditLogs.at(-1)?.sourceAction, "PAYMENT_REFERENCE_STATUS_UPDATED");
  assert.equal(repository.auditLogs.at(-1)?.action, "STATUS_CHANGE");

  const adminCreate = await executePaymentReferenceMutation({
    actor: adminActor,
    existingPaymentReference: null,
    order: {
      ...order,
      id: "order-2",
      orderNumber: "SO-20260610-000002",
    },
    repository,
    values: {
      status: "AUTHORIZED",
      providerName: "manual",
      providerReferenceId: "INV-1002",
      amount: "900",
      currency: "EUR",
      reason: "Admin captured provider reference.",
    },
    now: "2026-06-10T12:30:00.000Z",
  });

  assert.equal(adminCreate.paymentReference.status, "AUTHORIZED");
  assert.equal(adminCreate.auditHook.action, "PAYMENT_REFERENCE_CREATED");
  assert.equal(repository.auditLogs.at(-1)?.sourceAction, "PAYMENT_REFERENCE_CREATED");
});

test("unauthorized station update is denied before the domain mutation runs", () => {
  assert.throws(
    () => buildPaymentReferenceMutationCommand({
      actor: unrelatedStationActor,
      existingPaymentReference: paymentReference({
        id: "payment-1",
      }),
      order,
      values: {
        status: "PAID",
        providerName: "manual",
        providerReferenceId: "INV-1001",
      },
    }),
    PaymentReferenceUiAuthorizationError,
  );
});

test("payment reference form rejects sensitive payment fields", () => {
  assert.throws(
    () => normalizePaymentReferenceFormValues({
      status: "PENDING",
      providerName: "manual",
      providerReferenceId: "INV-1001",
      cardNumber: "4111111111111111",
    }),
    (error) =>
      error instanceof PaymentReferenceUiValidationError &&
      error.issues.includes("cardNumber is not accepted by the payment reference UI."),
  );

  const stationPanel = createPaymentReferencePanelViewModel({
    actor: stationActor,
    order,
    paymentReference: null,
  });

  for (const fieldName of PAYMENT_REFERENCE_SENSITIVE_FIELD_NAMES) {
    assert.equal(stationPanel.maintenance.form?.fieldNames.includes(fieldName), false);
  }
});

/**
 * @param {string} userId
 * @param {"BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN"} roleCode
 * @param {string} organizationId
 */
function actor(userId, roleCode, organizationId) {
  return Object.freeze({
    userId,
    organizationId,
    organizationName: organizationId,
    roleCode,
    roles: Object.freeze([
      Object.freeze({
        userId,
        organizationId,
        roleCode,
        revokedAt: null,
      }),
    ]),
  });
}

/**
 * @param {Partial<import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceLike>} override
 * @returns {import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceLike}
 */
function paymentReference(override = {}) {
  return Object.freeze({
    id: override.id ?? "payment-1",
    semenOrderId: override.semenOrderId ?? order.id,
    orderNumber: override.orderNumber ?? order.orderNumber,
    breederOrganizationId: override.breederOrganizationId ?? order.breederOrganizationId,
    breedingStationOrganizationId: override.breedingStationOrganizationId ?? order.breedingStationOrganizationId,
    providerName: override.providerName ?? "manual",
    providerReferenceId: override.providerReferenceId ?? "INV-1000",
    status: override.status ?? "PENDING",
    amount: override.amount ?? 1000,
    currency: override.currency ?? "ZAR",
    createdByUserId: override.createdByUserId ?? "user-admin",
    updatedByUserId: override.updatedByUserId ?? "user-admin",
    createdAt: override.createdAt ?? "2026-06-10T10:00:00.000Z",
    updatedAt: override.updatedAt ?? "2026-06-10T10:00:00.000Z",
  });
}

/**
 * @param {import("@coritech/domain/payments/payment-reference.d.ts").PaymentReferenceLike[]} initial
 */
function createMemoryPaymentReferenceRepository(initial = []) {
  const records = new Map(initial.map((item) => [item.id, item]));
  const auditLogs = [];
  let paymentSequence = records.size + 1;
  let auditSequence = 1;

  return {
    auditLogs,
    async createPaymentReference(paymentReference) {
      const persisted = Object.freeze({
        ...paymentReference,
        id: paymentReference.id ?? `payment-${paymentSequence++}`,
      });
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
      const persisted = Object.freeze({
        ...auditLog,
        id: auditLog.id ?? `audit-${auditSequence++}`,
      });
      auditLogs.push(persisted);

      return persisted;
    },
  };
}
