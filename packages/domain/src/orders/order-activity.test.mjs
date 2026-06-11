import assert from "node:assert/strict";
import test from "node:test";

import {
  ORDER_ACTIVITY_MUTATION_POLICY,
  ORDER_ACTIVITY_TYPES,
  ORDER_ACTIVITY_VISIBILITIES,
  OrderActivityAuthorizationError,
  createOrderActivity,
  createOrderActivityFeed,
  filterVisibleOrderActivities,
} from "./order-activity.mjs";

const timestamp = "2026-06-10T15:00:00.000Z";
const breederOrganizationId = "org-breeder";
const stationOrganizationId = "org-station";
const platformOrganizationId = "org-platform";

const breederActor = actorFixture({
  userId: "user-breeder",
  organizationId: breederOrganizationId,
  roleCode: "BREEDER",
});
const stationActor = actorFixture({
  userId: "user-station",
  organizationId: stationOrganizationId,
  roleCode: "BREEDING_STATION",
});
const adminActor = actorFixture({
  userId: "user-admin",
  organizationId: platformOrganizationId,
  roleCode: "PLATFORM_ADMIN",
});
const unrelatedBreederActor = actorFixture({
  userId: "user-other",
  organizationId: "org-other-breeder",
  roleCode: "BREEDER",
});
const order = Object.freeze({
  id: "order-1",
  orderNumber: "SO-20260610-000001",
  semenListingId: "listing-1",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "SUBMITTED",
  createdByUserId: breederActor.userId,
  createdAt: timestamp,
  updatedAt: timestamp,
});

test("order activity contract exposes comment types and does not replace audit logs", () => {
  assert.deepEqual(ORDER_ACTIVITY_TYPES, [
    "SYSTEM_STATUS",
    "USER_COMMENT",
    "INTERNAL_NOTE",
    "SUPPORT_NOTE",
  ]);
  assert.deepEqual(ORDER_ACTIVITY_VISIBILITIES, [
    "SHARED",
    "STATION_INTERNAL",
    "ADMIN_INTERNAL",
  ]);
  assert.equal(ORDER_ACTIVITY_MUTATION_POLICY.replacesAuditLog, false);
});

test("authorized breeder and station users can add shared comments", async () => {
  const repository = buildRepository();
  const breederComment = await createOrderActivity({
    actor: breederActor,
    order,
    repository,
    message: "Vet details added to the order notes.",
    now: timestamp,
  });
  const stationComment = await createOrderActivity({
    actor: stationActor,
    order,
    repository,
    message: "Station has started availability review.",
    now: "2026-06-10T15:05:00.000Z",
  });

  assert.equal(breederComment.type, "USER_COMMENT");
  assert.equal(breederComment.visibility, "SHARED");
  assert.equal(breederComment.createdByRole, "BREEDER");
  assert.equal(stationComment.createdByRole, "BREEDING_STATION");
  assert.equal(repository.activities.length, 2);
});

test("activity feed includes system status events and actor context", async () => {
  const repository = buildRepository();
  await createOrderActivity({
    actor: breederActor,
    order,
    repository,
    message: "Please call before dispatch.",
    now: "2026-06-10T15:05:00.000Z",
  });
  const feed = createOrderActivityFeed({
    actor: breederActor,
    order,
    activities: repository.activities,
    statusHistory: [
      {
        id: "history-1",
        semenOrderId: order.id,
        orderNumber: order.orderNumber,
        fromStatus: "DRAFT",
        toStatus: "SUBMITTED",
        actorUserId: breederActor.userId,
        actorRoleCode: "BREEDER",
        actorOrganizationId: breederOrganizationId,
        reason: "Ready for station review",
        changedAt: timestamp,
      },
    ],
  });

  assert.equal(feed.length, 2);
  assert.equal(feed[0].type, "SYSTEM_STATUS");
  assert.match(feed[0].message, /DRAFT to SUBMITTED/);
  assert.equal(feed[1].type, "USER_COMMENT");
  assert.equal(feed[1].actorRoleCode, "BREEDER");
  assert.equal(feed[1].actorOrganizationId, breederOrganizationId);
});

test("internal visibility is filtered by role", async () => {
  const repository = buildRepository();
  const shared = await createOrderActivity({
    actor: stationActor,
    order,
    repository,
    message: "Shared station comment.",
    now: timestamp,
  });
  const stationInternal = await createOrderActivity({
    actor: stationActor,
    order,
    repository,
    message: "Internal packing note.",
    type: "INTERNAL_NOTE",
    visibility: "STATION_INTERNAL",
    now: "2026-06-10T15:05:00.000Z",
  });
  const adminInternal = await createOrderActivity({
    actor: adminActor,
    order,
    repository,
    message: "Support-only escalation note.",
    type: "SUPPORT_NOTE",
    visibility: "ADMIN_INTERNAL",
    now: "2026-06-10T15:10:00.000Z",
  });

  assert.deepEqual(
    filterVisibleOrderActivities({
      actor: breederActor,
      order,
      activities: [shared, stationInternal, adminInternal],
    }).map((activity) => activity.message),
    ["Shared station comment."],
  );
  assert.deepEqual(
    filterVisibleOrderActivities({
      actor: stationActor,
      order,
      activities: [shared, stationInternal, adminInternal],
    }).map((activity) => activity.message),
    ["Shared station comment.", "Internal packing note."],
  );
  assert.equal(
    filterVisibleOrderActivities({
      actor: adminActor,
      order,
      activities: [shared, stationInternal, adminInternal],
    }).length,
    3,
  );
});

test("unauthorized users cannot view or add order activity", async () => {
  const repository = buildRepository();

  await assert.rejects(
    () =>
      createOrderActivity({
        actor: unrelatedBreederActor,
        order,
        repository,
        message: "I should not be here.",
        now: timestamp,
      }),
    OrderActivityAuthorizationError,
  );
  assert.throws(
    () =>
      createOrderActivityFeed({
        actor: unrelatedBreederActor,
        order,
        activities: [],
        statusHistory: [],
      }),
    OrderActivityAuthorizationError,
  );
});

function buildRepository() {
  return {
    activities: [],
    async createOrderActivity(activity) {
      const persisted = Object.freeze({
        ...activity,
        id: activity.id ?? `activity-${this.activities.length + 1}`,
      });

      this.activities.push(persisted);
      return persisted;
    },
  };
}

function actorFixture(input) {
  return Object.freeze({
    userId: input.userId,
    organizationId: input.organizationId,
    organizationName: input.organizationId,
    roleCode: input.roleCode,
    roles: Object.freeze([
      Object.freeze({
        userId: input.userId,
        organizationId: input.organizationId,
        roleCode: input.roleCode,
        revokedAt: null,
      }),
    ]),
  });
}
