import assert from "node:assert/strict";
import test from "node:test";

import {
  DATA_QUALITY_RULES,
  buildDataQualityFailureAuditHook,
  recordDataQualityFailures,
  validateDataQualityRecords,
  validateDocumentDataQuality,
  validateProofEventDataQuality,
  validateSemenOrderDataQuality,
  validateSemenOrderStatusTransitionDataQuality,
  validateShipmentDataQuality,
} from "./data-quality-rules.mjs";

const timestamp = "2026-06-10T08:00:00.000Z";
const actor = {
  userId: "user-admin",
  roleCode: "PLATFORM_ADMIN",
  organizationId: "org-platform",
};

test("data quality registry exposes scoped Phase 1 rules", () => {
  assert.deepEqual(
    DATA_QUALITY_RULES.map((rule) => rule.id),
    [
      "ORDER_REQUIRED_FIELDS",
      "ORDER_SUBMISSION_FIELDS",
      "ORDER_STATUS_TRANSITION",
      "SHIPMENT_REQUIRED_FIELDS",
      "DOCUMENT_REQUIRED_FIELDS",
      "PROOF_EVENT_REQUIRED_FIELDS",
    ],
  );
});

test("data quality rules enforce required order fields and submission quality", () => {
  const findings = validateSemenOrderDataQuality({
    id: "order-1",
    orderNumber: "SO-20260610-000001",
    semenListingId: "listing-1",
    breederOrganizationId: "org-breeder",
    breedingStationOrganizationId: "org-station",
    status: "SUBMITTED",
    createdByUserId: "user-breeder",
    updatedByUserId: "user-breeder",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  assert.equal(findings.some((item) => item.ruleId === "ORDER_REQUIRED_FIELDS"), false);
  assert.equal(findings.some((item) => item.ruleId === "ORDER_SUBMISSION_FIELDS"), true);
  assert.ok(findings.some((item) => item.message.includes("mareName is required")));
});

test("data quality rules reject invalid order transitions", () => {
  const findings = validateSemenOrderStatusTransitionDataQuality({
    objectId: "order-1",
    fromStatus: "DRAFT",
    toStatus: "RECEIVED",
  });

  assert.deepEqual(findings.map((item) => item.ruleId), ["ORDER_STATUS_TRANSITION"]);
  assert.equal(findings[0].message, "cannot transition semen order from DRAFT to RECEIVED.");
});

test("data quality rules enforce shipment and document required fields", () => {
  const shipmentFindings = validateShipmentDataQuality({
    id: "shipment-1",
    semenOrderId: "order-1",
    orderNumber: "SO-20260610-000001",
    breederOrganizationId: "org-breeder",
    breedingStationOrganizationId: "org-station",
    status: "NOT_A_STATUS",
    createdByUserId: "user-station",
    updatedByUserId: "user-station",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  const documentFindings = validateDocumentDataQuality({
    id: "document-1",
    documentType: "LAB_REPORT",
    targetType: "SemenOrder",
    targetId: "order-1",
    originalFileName: "lab.pdf",
    contentType: "application/pdf",
    fileSizeBytes: 0,
    storageProvider: "s3-compatible",
    storageBucket: "coritech-documents",
    storageObjectKey: "documents/lab.pdf",
    accessClassification: "ORDER_PARTICIPANTS",
    status: "ACTIVE",
    uploadedByUserId: "user-station",
    uploaderRoleCode: "BREEDING_STATION",
    uploaderOrganizationId: "org-station",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  assert.equal(shipmentFindings[0].field, "status");
  assert.equal(shipmentFindings[0].message, "status must be a valid shipment status.");
  assert.equal(documentFindings[0].field, "fileSizeBytes");
  assert.equal(documentFindings[0].message, "fileSizeBytes must be a positive integer.");
});

test("data quality rules flag proof events without required proof fields", () => {
  const findings = validateProofEventDataQuality({
    id: "proof-1",
    eventType: "SUBMITTED",
    source: "ORDER_STATUS_CHANGE",
    triggerType: "SEMEN_ORDER_STATUS_CHANGE",
    triggerRef: {
      targetType: "SemenOrder",
      targetId: "order-1",
    },
    lifecycleStage: "ORDER_SUBMITTED",
    actorUserId: "user-breeder",
    actorRoleCode: "BREEDER",
    actorOrganizationId: "org-breeder",
    status: "RECORDED",
    auditHookRef: {
      action: "SEMEN_ORDER_SUBMITTED",
    },
    createdAt: timestamp,
  });

  assert.ok(findings.some((item) => item.field === "occurredAt"));
  assert.ok(findings.some((item) => item.field === "verificationLevel"));
});

test("data quality aggregate report combines records and transition checks", () => {
  const report = validateDataQualityRecords({
    checkedAt: timestamp,
    orders: [
      {
        id: "order-1",
        status: "INVALID",
      },
    ],
    orderStatusTransitions: [
      {
        objectId: "order-1",
        fromStatus: "DRAFT",
        toStatus: "CONFIRMED",
      },
    ],
    proofEvents: [
      {
        id: "proof-1",
      },
    ],
  });

  assert.equal(report.checkedAt, timestamp);
  assert.equal(report.hasFailures, true);
  assert.ok(report.findingCount >= 3);
});

test("data quality failures can be logged through the audit hook path", async () => {
  const findings = validateSemenOrderStatusTransitionDataQuality({
    objectId: "order-1",
    fromStatus: "CANCELLED",
    toStatus: "RECEIVED",
  });
  const auditHook = buildDataQualityFailureAuditHook({
    actor,
    findings,
    targetType: "SemenOrder",
    targetId: "order-1",
    occurredAt: timestamp,
  });
  const auditLog = await recordDataQualityFailures({
    actor,
    findings,
    targetType: "SemenOrder",
    targetId: "order-1",
    repository: buildAuditRepository(),
    occurredAt: timestamp,
  });

  assert.equal(auditHook.action, "DATA_QUALITY_VALIDATION_FAILED");
  assert.equal(auditHook.newValue.findingCount, 1);
  assert.equal(auditLog?.action, "UPDATE");
  assert.equal(auditLog?.sourceAction, "DATA_QUALITY_VALIDATION_FAILED");
  assert.equal(auditLog?.objectType, "SemenOrder");
  assert.equal(auditLog?.metadata.sourceEventType, "DATA_QUALITY");
});

function buildAuditRepository() {
  return {
    async createAuditLog(auditLog) {
      return {
        ...auditLog,
        id: "audit-log-1",
      };
    },
  };
}
