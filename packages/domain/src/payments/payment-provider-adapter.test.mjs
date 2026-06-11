// @ts-check

import assert from "node:assert/strict";
import test from "node:test";

import {
  PaymentProviderAdapterConfigError,
  PaymentProviderAdapterUnavailableError,
  createManualPaymentProviderAdapter,
  createPaymentProviderAdapter,
  createPlaceholderPaymentProviderAdapter,
  validatePaymentProviderAdapterRuntimeConfig,
} from "./payment-provider-adapter.mjs";
import {
  PaymentReferenceValidationError,
} from "./payment-reference.mjs";

const order = Object.freeze({
  id: "order-1",
  orderNumber: "SO-20260610-000001",
  breederOrganizationId: "org-breeder",
  breedingStationOrganizationId: "org-station",
});
const stationActor = Object.freeze({
  userId: "user-station",
  roles: Object.freeze([
    Object.freeze({
      userId: "user-station",
      organizationId: "org-station",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    }),
  ]),
});

test("manual payment provider adapter creates reference-only payment records", async () => {
  const repository = createMemoryPaymentReferenceRepository();
  const adapter = createManualPaymentProviderAdapter({
    repository,
  });
  const result = await adapter.createPaymentReference({
    actor: stationActor,
    order,
    providerReferenceId: "INV-1001",
    status: "PENDING",
    amount: 1200.45,
    currency: "zar",
    reason: "Manual invoice reference.",
    now: "2026-06-10T12:00:00.000Z",
  });

  assert.equal(adapter.providerKind, "manual_reference");
  assert.equal(adapter.supportsRealProcessing, false);
  assert.equal(adapter.storesSensitivePaymentData, false);
  assert.equal(result.paymentReference.providerName, "manual_reference");
  assert.equal(result.paymentReference.providerReferenceId, "INV-1001");
  assert.equal(result.paymentReference.currency, "ZAR");
  assert.equal(repository.auditLogs.at(-1)?.sourceAction, "PAYMENT_REFERENCE_CREATED");
});

test("manual payment provider adapter updates payment reference status through audit path", async () => {
  const repository = createMemoryPaymentReferenceRepository();
  const adapter = createPaymentProviderAdapter(
    {
      provider: "manual_reference",
      providerName: "manual",
    },
    {
      repository,
    },
  );
  const created = await adapter.createPaymentReference({
    actor: stationActor,
    order,
    providerReferenceId: "INV-1002",
    status: "PENDING",
    reason: "Manual reference created.",
    now: "2026-06-10T12:00:00.000Z",
  });
  const updated = await adapter.updatePaymentReferenceStatus({
    actor: stationActor,
    paymentReferenceId: created.paymentReference.id,
    status: "PAID",
    reason: "Manual payment marked paid.",
    now: "2026-06-10T13:00:00.000Z",
  });

  assert.equal(updated.paymentReference.status, "PAID");
  assert.equal(updated.paymentReference.providerName, "manual");
  assert.equal(updated.auditHook.action, "PAYMENT_REFERENCE_STATUS_UPDATED");
  assert.equal(repository.auditLogs.at(-1)?.sourceAction, "PAYMENT_REFERENCE_STATUS_UPDATED");
});

test("manual payment provider adapter rejects sensitive payment data", async () => {
  const adapter = createManualPaymentProviderAdapter({
    repository: createMemoryPaymentReferenceRepository(),
  });

  await assert.rejects(
    () =>
      adapter.createPaymentReference({
        actor: stationActor,
        order,
        providerReferenceId: "INV-1003",
        status: "PENDING",
        cardNumber: "4111111111111111",
      }),
    (error) =>
      error instanceof PaymentReferenceValidationError &&
      error.issues.includes("cardNumber is not stored by CoriTech payment references."),
  );
});

test("placeholder payment provider adapter makes future integration explicit", async () => {
  const adapter = createPlaceholderPaymentProviderAdapter({
    providerName: "future_provider",
  });

  assert.equal(adapter.providerKind, "provider_placeholder");
  assert.equal(adapter.supportsRealProcessing, false);

  await assert.rejects(
    () =>
      adapter.createPaymentReference({
        actor: stationActor,
        order,
        providerName: "future_provider",
        providerReferenceId: "future-session",
      }),
    (error) =>
      error instanceof PaymentProviderAdapterUnavailableError &&
      error.providerName === "future_provider",
  );
});

test("payment provider adapter config stays provider-neutral", () => {
  assert.deepEqual(validatePaymentProviderAdapterRuntimeConfig({
    provider: "manual_reference",
  }), []);
  assert.throws(
    () =>
      createPaymentProviderAdapter({
        provider: "processor_x",
      }),
    (error) =>
      error instanceof PaymentProviderAdapterConfigError &&
      error.issues.includes("provider must be one of: manual_reference, provider_placeholder."),
  );
  assert.throws(
    () =>
      createPaymentProviderAdapter({
        provider: "manual_reference",
      }),
    (error) =>
      error instanceof PaymentProviderAdapterConfigError &&
      error.issues.includes("repository is required for the manual_reference payment adapter."),
  );
});

/**
 * @param {import("./payment-reference.d.ts").PaymentReferenceLike[]} initial
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
