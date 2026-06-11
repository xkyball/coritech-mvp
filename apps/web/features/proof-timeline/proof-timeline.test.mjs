import test from "node:test";
import assert from "node:assert/strict";

import {
  createProofTimelineViewModel,
  renderProofTimeline,
} from "./proof-timeline.mjs";

const orderId = "order-a";
const orderNumber = "SO-20260609-000001";

const submittedProofEvent = {
  id: "proof-submitted",
  eventType: "SUBMITTED",
  source: "ORDER_STATUS_CHANGE",
  triggerType: "SEMEN_ORDER_STATUS_CHANGE",
  triggerRef: {
    targetType: "SemenOrder",
    targetId: orderId,
    statusHistoryId: "history-submitted",
  },
  semenOrderId: orderId,
  shipmentId: null,
  horseId: null,
  orderNumber,
  breederOrganizationId: "org-breeder-a",
  breedingStationOrganizationId: "org-station-a",
  lifecycleStage: "ORDER_SUBMITTED",
  verificationLevel: "SELF_REPORTED",
  status: "RECORDED",
  actorUserId: "user-breeder",
  actorRoleCode: "BREEDER",
  actorOrganizationId: "org-breeder-a",
  documentationRefs: [
    {
      documentId: "document-order",
    },
  ],
  signatureRef: null,
  attestationRefs: [],
  auditLogId: "audit-submitted",
  auditHookRef: {},
  occurredAt: "2026-06-09T09:00:00.000Z",
  createdAt: "2026-06-09T09:00:00.000Z",
  updatedAt: "2026-06-09T09:00:00.000Z",
};

const shipmentProofEvent = {
  ...submittedProofEvent,
  id: "proof-shipment",
  eventType: "SHIPMENT_CREATED",
  source: "SHIPMENT_TRACKING_EVENT",
  shipmentId: "shipment-a",
  lifecycleStage: "SHIPMENT_CREATED",
  verificationLevel: "STATION_CONFIRMED",
  actorUserId: "user-station",
  actorRoleCode: "BREEDING_STATION",
  actorOrganizationId: "org-station-a",
  documentationRefs: [],
  auditLogId: "audit-shipment",
  occurredAt: "2026-06-09T10:00:00.000Z",
  createdAt: "2026-06-09T10:00:00.000Z",
  updatedAt: "2026-06-09T10:00:00.000Z",
};

const otherProofEvent = {
  ...submittedProofEvent,
  id: "proof-other",
  semenOrderId: "order-other",
  orderNumber: "SO-20260609-000002",
};

const linkedDocument = {
  id: "document-order",
  documentType: "Station Confirmation",
  description: null,
  targetType: "SemenOrder",
  targetId: orderId,
  semenOrderId: orderId,
  shipmentId: null,
  proofEventId: null,
  orderNumber,
  breederOrganizationId: "org-breeder-a",
  breedingStationOrganizationId: "org-station-a",
  originalFileName: "station-confirmation.pdf",
  contentType: "application/pdf",
  fileSizeBytes: 2048,
  checksumSha256: null,
  storageProvider: "s3",
  storageBucket: "coritech-documents",
  storageObjectKey: "orders/order-a/station-confirmation.pdf",
  storageRegion: "local-dev",
  storageVersionId: null,
  accessClassification: "ORDER_PARTICIPANTS",
  status: "ACTIVE",
  replacedByDocumentId: null,
  revocationReason: null,
  replacementReason: null,
  lifecycleChangedAt: null,
  lifecycleChangedByUserId: null,
  lifecycleChangedByRoleCode: null,
  lifecycleChangedByOrganizationId: null,
  uploadedByUserId: "user-station",
  uploaderRoleCode: "BREEDING_STATION",
  uploaderOrganizationId: "org-station-a",
  createdAt: "2026-06-09T10:30:00.000Z",
  updatedAt: "2026-06-09T10:30:00.000Z",
};

const proofLinkedDocument = {
  ...linkedDocument,
  id: "document-proof",
  targetType: "ProofEvent",
  targetId: "proof-shipment",
  proofEventId: "proof-shipment",
  originalFileName: "shipment-proof.pdf",
};

test("proof timeline filters by order context and exposes trust indicators", () => {
  const timeline = createProofTimelineViewModel({
    orderId,
    orderNumber,
    shipmentIds: ["shipment-a"],
    proofEvents: [shipmentProofEvent, otherProofEvent, submittedProofEvent],
    documents: [linkedDocument, proofLinkedDocument],
  });
  const html = renderProofTimeline(timeline);

  assert.deepEqual(
    timeline.items.map((item) => item.id),
    ["proof-submitted", "proof-shipment"],
  );
  assert.equal(timeline.items[0].actorRoleCode, "BREEDER");
  assert.equal(timeline.items[0].verificationLevel, "SELF_REPORTED");
  assert.equal(timeline.items[0].linkedDocumentLabel, "1 linked document");
  assert.equal(timeline.items[1].linkedObjectLabel, "Shipment shipment-a");
  assert.equal(timeline.items[1].linkedDocumentLabel, "1 linked document");
  assert.match(html, /data-verification-level="SELF_REPORTED"/);
  assert.match(html, /BREEDING_STATION/);
  assert.match(html, /1 linked document/);
});

test("proof timeline renders an explicit empty state without future claims", () => {
  const timeline = createProofTimelineViewModel({
    proofEvents: [otherProofEvent],
    orderId,
  });

  assert.equal(timeline.items.length, 0);
  assert.match(renderProofTimeline(timeline), /No proof events have been recorded/);
});
