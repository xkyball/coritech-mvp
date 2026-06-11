import test from "node:test";
import assert from "node:assert/strict";

import {
  addSharedOrderComment,
  createOrderActivityPanelViewModel,
} from "./order-activity.mjs";

const order = Object.freeze({
  id: "order-a",
  orderNumber: "SO-20260610-000001",
  semenListingId: "listing-a",
  breederOrganizationId: "org-breeder-a",
  breedingStationOrganizationId: "org-station-a",
  status: "SUBMITTED",
});

const breederActor = Object.freeze({
  userId: "user-breeder",
  organizationId: "org-breeder-a",
  organizationName: "Breeder A",
  roleCode: "BREEDER",
  roles: Object.freeze([
    {
      userId: "user-breeder",
      organizationId: "org-breeder-a",
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ]),
});

const stationActor = Object.freeze({
  userId: "user-station",
  organizationId: "org-station-a",
  organizationName: "Station A",
  roleCode: "BREEDING_STATION",
  roles: Object.freeze([
    {
      userId: "user-station",
      organizationId: "org-station-a",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ]),
});

test("activity panel shows system status rows and actor context", () => {
  const viewModel = createOrderActivityPanelViewModel({
    actor: breederActor,
    order,
    statusHistory: [
      {
        id: "history-submitted",
        semenOrderId: "order-a",
        orderNumber: order.orderNumber,
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        actorUserId: "user-breeder",
        actorRoleCode: "BREEDER",
        actorOrganizationId: "org-breeder-a",
        reason: "Ready for review",
        changedAt: "2026-06-10T09:00:00.000Z",
      },
    ],
  });

  assert.equal(viewModel.title, "Order activity");
  assert.equal(viewModel.comment.canAdd, true);
  assert.equal(viewModel.items.length, 1);
  assert.equal(viewModel.items[0].label, "System Status");
  assert.equal(viewModel.items[0].actorLabel, "Breeder");
  assert.equal(viewModel.items[0].organizationLabel, "org-breeder-a");
});

test("activity panel applies visibility filtering from the domain", () => {
  const shared = {
    id: "activity-shared",
    semenOrderId: "order-a",
    orderNumber: order.orderNumber,
    type: "USER_COMMENT",
    visibility: "SHARED",
    message: "Shared note",
    createdByUserId: "user-station",
    createdByOrganizationId: "org-station-a",
    createdByRole: "BREEDING_STATION",
    createdAt: "2026-06-10T10:00:00.000Z",
  };
  const internal = {
    ...shared,
    id: "activity-internal",
    visibility: "STATION_INTERNAL",
    message: "Station note",
  };

  const breederView = createOrderActivityPanelViewModel({
    actor: breederActor,
    order,
    activities: [shared, internal],
  });
  const stationView = createOrderActivityPanelViewModel({
    actor: stationActor,
    order,
    activities: [shared, internal],
  });

  assert.deepEqual(breederView.items.map((item) => item.message), ["Shared note"]);
  assert.deepEqual(stationView.items.map((item) => item.message), [
    "Shared note",
    "Station note",
  ]);
});

test("shared comment action persists authorized comments", async () => {
  const persisted = [];
  const result = await addSharedOrderComment({
    actor: stationActor,
    order,
    message: "Order is being reviewed",
    now: "2026-06-10T11:00:00.000Z",
    repository: {
      async createOrderActivity(activity) {
        const row = {
          ...activity,
          id: "activity-created",
        };
        persisted.push(row);
        return row;
      },
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.ok ? result.activity.type : null, "USER_COMMENT");
  assert.equal(result.ok ? result.activity.visibility : null, "SHARED");
  assert.equal(persisted.length, 1);
});

test("shared comment action reports authorization failures", async () => {
  const result = await addSharedOrderComment({
    actor: {
      ...breederActor,
      organizationId: "org-other",
      roles: [],
    },
    order,
    message: "Not allowed",
    repository: {
      async createOrderActivity(activity) {
        return activity;
      },
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.ok ? "" : result.issues.join(" "), /authorized/);
});
