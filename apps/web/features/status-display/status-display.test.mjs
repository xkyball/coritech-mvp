import assert from "node:assert/strict";
import test from "node:test";

import { SEMEN_ORDER_STATUSES } from "@coritech/domain/orders/semen-order.mjs";
import { SHIPMENT_STATUSES } from "@coritech/domain/shipments/shipment.mjs";
import { ACTIVE_PHASE_1_VERIFICATION_LEVELS } from "@coritech/domain/proof/verification-level.mjs";

import {
  PAYMENT_REFERENCE_STATUSES,
  formatStatusDisplayLabel,
  getStatusBadgeViewModel,
  getStatusDescription,
  getStatusNextActionHint,
  listStatusDisplayOptions,
  validateStatusDisplayCompleteness,
} from "./status-display.mjs";

test("status display config covers active order, shipment, payment and verification statuses", () => {
  assert.deepEqual(validateStatusDisplayCompleteness(), {
    order: [],
    shipment: [],
    payment: [],
    verification: [],
  });
  assert.deepEqual(
    listStatusDisplayOptions("order").map((option) => option.code),
    SEMEN_ORDER_STATUSES,
  );
  assert.deepEqual(
    listStatusDisplayOptions("shipment").map((option) => option.code),
    SHIPMENT_STATUSES,
  );
  assert.deepEqual(
    listStatusDisplayOptions("payment").map((option) => option.code),
    PAYMENT_REFERENCE_STATUSES,
  );
  assert.deepEqual(
    listStatusDisplayOptions("verification").map((option) => option.code),
    ACTIVE_PHASE_1_VERIFICATION_LEVELS,
  );
});

test("status display entries include labels and descriptions for every active value", () => {
  for (const kind of ["order", "shipment", "payment", "verification"]) {
    for (const option of listStatusDisplayOptions(kind)) {
      assert.equal(typeof option.label, "string");
      assert.notEqual(option.label.trim(), "");
      assert.equal(typeof option.description, "string");
      assert.notEqual(option.description.trim(), "");
      assert.equal(typeof option.tone, "string");
      assert.notEqual(option.tone.trim(), "");
    }
  }
});

test("badge view model uses shared labels and tones for key statuses", () => {
  assert.deepEqual(getStatusBadgeViewModel("CONFIRMED", "order"), {
    label: "Confirmed",
    tone: "success",
  });
  assert.deepEqual(getStatusBadgeViewModel("DELAYED", "shipment"), {
    label: "Delayed",
    tone: "warning",
  });
  assert.deepEqual(getStatusBadgeViewModel("FAILED", "payment"), {
    label: "Failed",
    tone: "danger",
  });
  assert.deepEqual(getStatusBadgeViewModel("ADMIN_REVIEWED", "verification"), {
    label: "Admin reviewed",
    tone: "accent",
  });
});

test("status labels and role-specific hints are readable and display-only", () => {
  assert.equal(formatStatusDisplayLabel("IN_FULFILMENT", "order"), "In fulfilment");
  assert.equal(
    getStatusDescription("SELF_REPORTED", "verification"),
    "A breeder-entered or participant-entered workflow fact that has not been confirmed by the station or reviewed by an admin.",
  );
  assert.equal(
    getStatusNextActionHint({
      kind: "order",
      roleCode: "BREEDING_STATION",
      status: "RECEIVED",
    }),
    "Confirm or reject the received order.",
  );
  assert.equal(
    getStatusNextActionHint({
      kind: "shipment",
      roleCode: "BREEDER",
      status: "DELIVERED",
    }),
    "Confirm receipt where applicable.",
  );
});

test("unknown statuses fall back to safe readable badge text", () => {
  assert.deepEqual(getStatusBadgeViewModel("metadata_only"), {
    label: "Metadata Only",
    tone: "neutral",
  });
});
