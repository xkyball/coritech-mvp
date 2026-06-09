import test from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_PROOF_EVENT_VERIFICATION_LEVEL,
  PROOF_EVENT_DELETION_POLICY,
  PROOF_EVENT_SOURCES,
  PROOF_EVENT_STATUSES,
  PROOF_EVENT_TYPES,
  ProofEventValidationError,
  canDeleteProofEvent,
  createProofEventFromHook,
  prepareCreateProofEvent,
  prepareProofEventFromHook,
  proofEventTypeForOrderStatus,
  proofEventTypeForShipmentStatus,
} from "./proof-event.mjs";
import {
  prepareTransitionSemenOrderStatus,
} from "../orders/semen-order.mjs";
import {
  prepareCreateShipmentTrackingEvent,
} from "../shipments/shipment.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";
const breederOrganizationId = "org-breeder-a";
const stationOrganizationId = "org-station-a";

const breederActor = {
  userId: "user-breeder",
  roles: [
    {
      userId: "user-breeder",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const stationActor = {
  userId: "user-station",
  roles: [
    {
      userId: "user-station",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const draftOrder = {
  id: "order-1",
  orderNumber: "SO-20260609-000001",
  semenListingId: "listing-active",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "DRAFT",
  createdByUserId: "user-breeder",
  updatedByUserId: "user-breeder",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const submittedOrder = {
  ...draftOrder,
  status: "SUBMITTED",
};

const shipment = {
  id: "shipment-1",
  semenOrderId: "order-1",
  orderNumber: "SO-20260609-000001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "IN_TRANSIT",
  providerName: "Manual Courier",
  providerTrackingId: "TRACK-1",
  trackingUrl: "https://carrier.example/track/TRACK-1",
  createdByUserId: "user-station",
  updatedByUserId: "user-station",
  createdAt: timestamp,
  updatedAt: timestamp,
};

test("proof event enums and deletion policy stay inside Ticket 1.6", () => {
  assert.deepEqual(PROOF_EVENT_TYPES, [
    "SEMEN_ORDER_CREATED",
    "SUBMITTED",
    "CONFIRMED",
    "REJECTED",
    "SHIPMENT_CREATED",
    "SHIPMENT_STATUS_UPDATED",
    "SHIPMENT_CONFIRMED",
    "DOCUMENT_UPLOADED",
    "ORDER_COMPLETED",
    "ADMIN_CORRECTION_CREATED",
  ]);
  assert.deepEqual(PROOF_EVENT_SOURCES, [
    "ORDER_STATUS_CHANGE",
    "SHIPMENT_TRACKING_EVENT",
    "DOCUMENT_UPLOAD",
    "ADMIN_CORRECTION",
  ]);
  assert.deepEqual(PROOF_EVENT_STATUSES, ["RECORDED", "VOIDED"]);
  assert.equal(DEFAULT_PROOF_EVENT_VERIFICATION_LEVEL, "WORKFLOW_RECORDED");
  assert.equal(PROOF_EVENT_DELETION_POLICY.supported, false);
  assert.equal(canDeleteProofEvent(breederActor, /** @type {never} */ ({})), false);
});

test("order action proof hook can be materialized into a proof event", () => {
  const orderChange = prepareTransitionSemenOrderStatus({
    existingOrder: draftOrder,
    toStatus: "SUBMITTED",
    reason: "Ready for station review",
    actor: breederActor,
    now: timestamp,
  });
  const prepared = prepareProofEventFromHook({
    proofHook: orderChange.proofHook,
    proofEventId: "proof-order-submitted",
    verificationLevel: "WORKFLOW_RECORDED",
    createdAt: timestamp,
  });

  assert.equal(prepared.proofEvent.id, "proof-order-submitted");
  assert.equal(prepared.proofEvent.eventType, "SUBMITTED");
  assert.equal(prepared.proofEvent.source, "ORDER_STATUS_CHANGE");
  assert.equal(prepared.proofEvent.semenOrderId, "order-1");
  assert.equal(prepared.proofEvent.shipmentId, null);
  assert.equal(prepared.proofEvent.orderNumber, "SO-20260609-000001");
  assert.equal(prepared.proofEvent.breederOrganizationId, breederOrganizationId);
  assert.equal(
    prepared.proofEvent.breedingStationOrganizationId,
    stationOrganizationId,
  );
  assert.equal(prepared.proofEvent.actorUserId, "user-breeder");
  assert.equal(prepared.proofEvent.actorRoleCode, "BREEDER");
  assert.equal(prepared.proofEvent.actorOrganizationId, breederOrganizationId);
  assert.equal(prepared.proofEvent.lifecycleStage, "ORDER_SUBMITTED");
  assert.equal(prepared.proofEvent.verificationLevel, "WORKFLOW_RECORDED");
  assert.equal(prepared.proofEvent.status, "RECORDED");
  assert.deepEqual(prepared.proofEvent.documentationRefs, []);
  assert.deepEqual(prepared.proofEvent.signatureRef, {
    type: "MANAGED_AUTH_ACTOR_CONTEXT",
    actorUserId: "user-breeder",
  });
  assert.deepEqual(prepared.proofEvent.auditHookRef, {
    eventType: "SEMEN_ORDER_STATUS_CHANGE",
    action: "SEMEN_ORDER_SUBMITTED",
    occurredAt: timestamp,
  });
  assert.equal(prepared.auditHook.action, "PROOF_EVENT_CREATED");
  assert.equal(prepared.auditHook.targetId, "proof-order-submitted");
});

test("shipment action proof hook can be materialized into a proof event", () => {
  const shipmentChange = prepareCreateShipmentTrackingEvent({
    existingShipment: shipment,
    toStatus: "DELIVERED",
    eventSource: "MANUAL",
    notes: "Delivered and confirmed by station",
    actor: stationActor,
    now: timestamp,
  });
  const prepared = prepareProofEventFromHook({
    proofHook: shipmentChange.proofHook,
    proofEventId: "proof-shipment-delivered",
    verificationLevel: "WORKFLOW_RECORDED",
    createdAt: timestamp,
  });

  assert.equal(prepared.proofEvent.eventType, "SHIPMENT_CONFIRMED");
  assert.equal(prepared.proofEvent.source, "SHIPMENT_TRACKING_EVENT");
  assert.equal(prepared.proofEvent.semenOrderId, "order-1");
  assert.equal(prepared.proofEvent.shipmentId, "shipment-1");
  assert.equal(prepared.proofEvent.lifecycleStage, "SHIPMENT_CONFIRMED");
  assert.equal(prepared.proofEvent.actorRoleCode, "BREEDING_STATION");
  assert.equal(prepared.proofEvent.actorOrganizationId, stationOrganizationId);
  assert.equal(prepared.proofEvent.triggerRef.toStatus, "DELIVERED");
  assert.equal(prepared.proofEvent.triggerRef.eventSource, "MANUAL");
  assert.equal(prepared.proofEvent.auditHookRef.action, "SHIPMENT_STATUS_UPDATED");
});

test("order milestones are mapped without implementing future automatic generation", () => {
  assert.equal(proofEventTypeForOrderStatus("DRAFT"), "SEMEN_ORDER_CREATED");
  assert.equal(proofEventTypeForOrderStatus("SUBMITTED"), "SUBMITTED");
  assert.equal(proofEventTypeForOrderStatus("CONFIRMED"), "CONFIRMED");
  assert.equal(proofEventTypeForOrderStatus("REJECTED"), "REJECTED");
  assert.equal(proofEventTypeForOrderStatus("COMPLETED"), "ORDER_COMPLETED");
  assert.equal(proofEventTypeForOrderStatus("RECEIVED"), null);

  const receivedChange = prepareTransitionSemenOrderStatus({
    existingOrder: submittedOrder,
    toStatus: "RECEIVED",
    reason: "Station received the order",
    actor: stationActor,
    now: timestamp,
  });

  assert.throws(
    () =>
      prepareProofEventFromHook({
        proofHook: receivedChange.proofHook,
        createdAt: timestamp,
      }),
    (error) =>
      error instanceof ProofEventValidationError &&
      error.issues.includes(
        "order status RECEIVED is not a Ticket 1.6 proof-event milestone.",
      ),
  );

  assert.equal(
    proofEventTypeForShipmentStatus("SHIPMENT_CREATED", "PREPARED"),
    "SHIPMENT_CREATED",
  );
  assert.equal(
    proofEventTypeForShipmentStatus("SHIPMENT_STATUS_UPDATED", "IN_TRANSIT"),
    "SHIPMENT_STATUS_UPDATED",
  );
  assert.equal(
    proofEventTypeForShipmentStatus("SHIPMENT_STATUS_UPDATED", "DELIVERED"),
    "SHIPMENT_CONFIRMED",
  );
});

test("direct proof event model supports later signatures and attestations", () => {
  const prepared = prepareCreateProofEvent({
    proofEventId: "proof-document-uploaded",
    eventType: "DOCUMENT_UPLOADED",
    source: "DOCUMENT_UPLOAD",
    triggerType: "DOCUMENT_ACCESS",
    triggerRef: {
      targetType: "Document",
      targetId: "document-1",
    },
    semenOrderId: "order-1",
    orderNumber: "SO-20260609-000001",
    breederOrganizationId,
    breedingStationOrganizationId: stationOrganizationId,
    lifecycleStage: "DOCUMENTATION",
    actor: {
      userId: "user-station",
      roleCode: "BREEDING_STATION",
      organizationId: stationOrganizationId,
    },
    documentationRefs: [
      {
        documentId: "document-1",
        documentType: "LAB_REPORT",
      },
    ],
    signatureRef: {
      type: "MANAGED_AUTH_ACTOR_CONTEXT",
      actorUserId: "user-station",
    },
    attestationRefs: [
      {
        type: "FUTURE_ATTESTATION_SLOT",
      },
    ],
    auditHookRef: {
      eventType: "DOCUMENT_ACCESS",
      action: "DOCUMENT_UPLOADED",
      occurredAt: timestamp,
    },
    occurredAt: timestamp,
  });

  assert.equal(prepared.proofEvent.verificationLevel, "WORKFLOW_RECORDED");
  assert.deepEqual(prepared.proofEvent.attestationRefs, [
    {
      type: "FUTURE_ATTESTATION_SLOT",
    },
  ]);
  assert.equal(Object.isFrozen(prepared.proofEvent.attestationRefs), true);
  assert.equal(prepared.auditHook.targetRef.proofEventType, "DOCUMENT_UPLOADED");
});

test("createProofEventFromHook persists via an explicit proof service call", async () => {
  const orderChange = prepareTransitionSemenOrderStatus({
    existingOrder: draftOrder,
    toStatus: "SUBMITTED",
    reason: "Ready for station review",
    actor: breederActor,
    now: timestamp,
  });
  const persisted = await createProofEventFromHook({
    proofHook: orderChange.proofHook,
    repository: buildRepository(),
    createdAt: timestamp,
  });

  assert.equal(persisted.proofEvent.id, "proof-event-1");
  assert.equal(persisted.auditHook.targetId, "proof-event-1");
  assert.equal(persisted.auditHook.targetRef.semenOrderId, "order-1");
});

function buildRepository() {
  let sequence = 1;

  return {
    async createProofEvent(proofEvent) {
      return {
        ...proofEvent,
        id: proofEvent.id ?? `proof-event-${sequence++}`,
      };
    },
  };
}
