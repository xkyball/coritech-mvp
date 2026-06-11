import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAuditLogViewerHref,
  canAccessAuditLogViewer,
  createAuditLogViewerViewModel,
  formatAuditLabel,
  normalizeAuditLogFilters,
} from "./audit-log-viewer.mjs";

const adminActor = {
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
const breederActor = {
  userId: "user-breeder",
  roles: [
    {
      userId: "user-breeder",
      organizationId: "org-breeder",
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const auditLogs = [
  {
    id: "audit-access-denied",
    actorUserId: "user-breeder-b",
    actorRoleCode: "BREEDER",
    actorOrganizationId: "org-breeder-b",
    action: "ACCESS_DECISION",
    sourceAction: "RBAC_VIEW_DOCUMENT_DENY",
    objectType: "Document",
    objectId: "document-1",
    objectRef: {},
    previousValues: null,
    newValues: {
      outcome: "DENY",
      allowed: false,
      status: 403,
    },
    reason: "Actor may view only participant-visible documents.",
    ipAddress: "203.0.113.30",
    userAgent: "node-test/audit-log-viewer",
    metadata: {
      accessOutcome: "DENY",
      permissionAction: "VIEW_DOCUMENT",
    },
    occurredAt: "2026-06-09T08:00:00.000Z",
    createdAt: "2026-06-09T08:00:00.000Z",
  },
  {
    id: "audit-status",
    actorUserId: "user-station",
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: "org-station",
    action: "STATUS_CHANGE",
    sourceAction: "SEMEN_ORDER_CONFIRMED",
    objectType: "SemenOrder",
    objectId: "order-1",
    objectRef: {},
    previousValues: {
      status: "RECEIVED",
    },
    newValues: {
      status: "CONFIRMED",
    },
    reason: "Station confirmed availability.",
    ipAddress: null,
    userAgent: null,
    metadata: {},
    occurredAt: "2026-06-09T08:05:00.000Z",
    createdAt: "2026-06-09T08:05:00.000Z",
  },
];

test("audit log viewer summarizes access-decision rows without mutating records", () => {
  const viewModel = createAuditLogViewerViewModel({
    auditLogs,
    filters: {
      action: "ACCESS_DECISION",
      limit: 25,
    },
  });

  assert.equal(viewModel.summary.totalCount, 2);
  assert.equal(viewModel.summary.accessDecisionCount, 1);
  assert.equal(viewModel.summary.deniedDecisionCount, 1);
  assert.equal(viewModel.canEdit, false);
  assert.equal(viewModel.filters.action, "ACCESS_DECISION");
  assert.equal(viewModel.filters.limit, 25);
  assert.equal(viewModel.pagination.page, 1);
  assert.equal(viewModel.pagination.pageSize, 25);
  assert.equal(viewModel.pagination.hasPreviousPage, false);
  assert.equal(viewModel.rows[0].actionLabel, "Access Decision");
  assert.equal(viewModel.rows[0].outcomeLabel, "Deny");
  assert.match(viewModel.rows[0].newValues, /"status": 403/);
  assert.match(viewModel.rows[0].metadata, /"permissionAction": "VIEW_DOCUMENT"/);
  assert.equal(
    viewModel.rows[0].requestLabel,
    "203.0.113.30 / node-test/audit-log-viewer",
  );
  assert.equal(viewModel.rows[1].requestLabel, "Not recorded");
});

test("audit log filter normalization only keeps supported canonical actions", () => {
  assert.deepEqual(
    normalizeAuditLogFilters({
      objectType: " SemenOrder ",
      objectId: " order-1 ",
      action: "STATUS_CHANGE",
      actorOrganizationId: " org-admin ",
      fromOccurredAt: "2026-06-09T08:00",
      toOccurredAt: "2026-06-09T09:00",
      page: "2",
      limit: "10",
    }),
    {
      objectType: "SemenOrder",
      objectId: "order-1",
      actorUserId: undefined,
      actorOrganizationId: "org-admin",
      action: "STATUS_CHANGE",
      fromOccurredAt: "2026-06-09T08:00",
      toOccurredAt: "2026-06-09T09:00",
      limit: 10,
      page: 2,
    },
  );

  assert.equal(normalizeAuditLogFilters({ action: "NOT_REAL" }).action, undefined);
  assert.equal(normalizeAuditLogFilters({ limit: "999" }).limit, 50);
});

test("audit viewer access is admin-only at the feature contract", () => {
  assert.equal(canAccessAuditLogViewer(adminActor), true);
  assert.equal(canAccessAuditLogViewer(breederActor), false);
});

test("audit viewer filter links preserve supported query filters", () => {
  assert.equal(
    buildAuditLogViewerHref({
      objectType: "SemenOrder",
      objectId: "order-1",
      actorUserId: "user-admin",
      actorOrganizationId: "org-platform",
      action: "ACCESS_DECISION",
      fromOccurredAt: "2026-06-09T08:00",
      toOccurredAt: "2026-06-09T09:00",
      limit: 25,
      page: 2,
    }),
    "/app/admin/audit?objectType=SemenOrder&objectId=order-1&actorUserId=user-admin&actorOrganizationId=org-platform&fromOccurredAt=2026-06-09T08%3A00&toOccurredAt=2026-06-09T09%3A00&action=ACCESS_DECISION&limit=25&page=2",
  );
});

test("audit labels are human readable", () => {
  assert.equal(formatAuditLabel("RBAC_VIEW_DOCUMENT_DENY"), "Rbac View Document Deny");
});
