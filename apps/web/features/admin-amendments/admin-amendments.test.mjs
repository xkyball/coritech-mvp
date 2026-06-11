import assert from "node:assert/strict";
import test from "node:test";

import {
  canAccessAdminAmendments,
  createAdminAmendment,
  createAdminAmendmentViewModel,
  normalizeAmendmentFormDefaults,
} from "./admin-amendments.mjs";

const timestamp = "2026-06-10T13:00:00.000Z";
const platformOrganizationId = "00000000-0000-4000-8000-000000000001";
const breederOrganizationId = "00000000-0000-4000-8000-000000000002";
const stationOrganizationId = "00000000-0000-4000-8000-000000000003";

const adminActor = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000010",
  organizationId: platformOrganizationId,
  organizationName: "CoriTech Platform",
  roleCode: "PLATFORM_ADMIN",
  roles: Object.freeze([
    Object.freeze({
      userId: "00000000-0000-4000-8000-000000000010",
      organizationId: platformOrganizationId,
      roleCode: "PLATFORM_ADMIN",
      revokedAt: null,
    }),
  ]),
});

const breederActor = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000020",
  organizationId: breederOrganizationId,
  organizationName: "Blue Stud",
  roleCode: "BREEDER",
  roles: Object.freeze([
    Object.freeze({
      userId: "00000000-0000-4000-8000-000000000020",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    }),
  ]),
});

const semenOrderSnapshot = Object.freeze({
  targetType: "SemenOrder",
  targetId: "00000000-0000-4000-8000-000000000101",
  targetField: "mareName",
  targetRef: Object.freeze({
    targetType: "SemenOrder",
    id: "00000000-0000-4000-8000-000000000101",
    orderNumber: "CORI-2026-0001",
    status: "SUBMITTED",
  }),
  originalValue: Object.freeze({
    mareName: "Willow Queen",
  }),
  semenOrderId: "00000000-0000-4000-8000-000000000101",
  shipmentId: null,
  horseId: null,
  orderNumber: "CORI-2026-0001",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
});

test("admin amendment view model exposes creation options and visible rows", () => {
  const viewModel = createAdminAmendmentViewModel({
    actor: adminActor,
    defaults: {
      targetType: "SemenOrder",
      targetId: "00000000-0000-4000-8000-000000000101",
      targetField: "mareName",
      orderNumber: "CORI-2026-0001",
    },
    amendments: [
      {
        id: "amendment-1",
        targetType: "SemenOrder",
        targetId: "00000000-0000-4000-8000-000000000101",
        targetField: "mareName",
        targetRef: semenOrderSnapshot.targetRef,
        originalValue: { mareName: "Willow Queen" },
        amendedValue: { mareName: "Willow Queen II" },
        reason: "Registration paperwork corrected the mare name.",
        status: "SUBMITTED",
        actorUserId: adminActor.userId,
        actorRoleCode: "PLATFORM_ADMIN",
        actorOrganizationId: platformOrganizationId,
        approverUserId: null,
        approverRoleCode: null,
        approverOrganizationId: null,
        decidedAt: null,
        auditLogId: "audit-1",
        proofEventId: null,
        semenOrderId: semenOrderSnapshot.semenOrderId,
        shipmentId: null,
        horseId: null,
        orderNumber: "CORI-2026-0001",
        breederOrganizationId,
        breedingStationOrganizationId: stationOrganizationId,
        occurredAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
  });

  assert.equal(viewModel.canCreate, true);
  assert.equal(viewModel.defaults.targetType, "SemenOrder");
  assert.equal(viewModel.rows.length, 1);
  assert.equal(viewModel.rows[0].targetField, "mareName");
  assert.equal(viewModel.rows[0].orderNumber, "CORI-2026-0001");
  assert.match(viewModel.rows[0].originalValuePreview, /Willow Queen/);
  assert.match(viewModel.rows[0].amendedValuePreview, /Willow Queen II/);
  assert.match(viewModel.rows[0].auditHref, /action=CREATE_AMENDMENT/);
  assert.equal(viewModel.mutationPolicy.silentlyOverwriteTarget, false);
});

test("admin amendment creation preserves original snapshot and creates audit evidence", async () => {
  const repository = buildRepository();
  const response = await createAdminAmendment({
    actor: adminActor,
    repository,
    targetType: "SemenOrder",
    targetId: "00000000-0000-4000-8000-000000000101",
    targetField: "mareName",
    amendedValue: "Willow Queen II",
    reason: "Registration paperwork corrected the mare name.",
    auditContext: {
      userAgent: "node-test/admin-amendments",
    },
    now: timestamp,
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.amendment.id, "amendment-1");
  assert.deepEqual(response.body.amendment.originalValue, {
    mareName: "Willow Queen",
  });
  assert.deepEqual(response.body.amendment.amendedValue, {
    mareName: "Willow Queen II",
  });
  assert.equal(response.auditLog?.action, "CREATE_AMENDMENT");
  assert.equal(response.auditLog?.objectType, "SemenOrder");
  assert.equal(response.auditLog?.userAgent, "node-test/admin-amendments");
  assert.equal(repository.targetWasMutated, false);
});

test("admin amendment creation requires a reason and platform admin actor", async () => {
  assert.equal(canAccessAdminAmendments(adminActor), true);
  assert.equal(canAccessAdminAmendments(breederActor), false);

  await assert.rejects(
    () =>
      createAdminAmendment({
        actor: adminActor,
        repository: buildRepository(),
        targetType: "SemenOrder",
        targetId: "00000000-0000-4000-8000-000000000101",
        targetField: "mareName",
        amendedValue: "Willow Queen II",
        reason: " ",
        now: timestamp,
      }),
    /Reason is required/,
  );

  await assert.rejects(
    () =>
      createAdminAmendment({
        actor: breederActor,
        repository: buildRepository(),
        targetType: "SemenOrder",
        targetId: "00000000-0000-4000-8000-000000000101",
        targetField: "mareName",
        amendedValue: "Willow Queen II",
        reason: "Registration paperwork corrected the mare name.",
        now: timestamp,
      }),
    /Only active Platform Admin users can create amendments/,
  );
});

test("admin amendment defaults reject unsupported target types", () => {
  assert.deepEqual(
    normalizeAmendmentFormDefaults({
      targetType: "Invoice",
      targetId: "target-1",
      targetField: "status",
      orderNumber: "CORI-2026-0001",
    }),
    {
      targetType: "",
      targetId: "target-1",
      targetField: "status",
      orderNumber: "CORI-2026-0001",
    },
  );
});

function buildRepository() {
  const amendments = [];
  const auditLogs = [];

  return {
    targetWasMutated: false,
    async findAmendmentTargetSnapshot(targetType, targetId, targetField) {
      if (
        targetType === semenOrderSnapshot.targetType &&
        targetId === semenOrderSnapshot.targetId &&
        targetField === semenOrderSnapshot.targetField
      ) {
        return semenOrderSnapshot;
      }

      return null;
    },
    async createAmendment(amendment) {
      const persisted = Object.freeze({
        ...amendment,
        id: amendment.id ?? `amendment-${amendments.length + 1}`,
      });

      amendments.push(persisted);
      return persisted;
    },
    async createAuditLog(auditLog) {
      const persisted = Object.freeze({
        ...auditLog,
        id: auditLog.id ?? `audit-${auditLogs.length + 1}`,
      });

      auditLogs.push(persisted);
      return persisted;
    },
  };
}
