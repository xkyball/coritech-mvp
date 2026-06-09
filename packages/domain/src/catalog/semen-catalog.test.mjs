import test from "node:test";
import assert from "node:assert/strict";

import {
  SEMEN_CATALOG_ROUTES,
  SemenCatalogAuthorizationError,
  SemenCatalogValidationError,
  SemenListingNotOrderableError,
  canManageStationCatalog,
  canViewSemenListing,
  createSemenListingEndpoint,
  deleteSemenListingEndpoint,
  ensureSemenListingCanBeOrdered,
  isSemenListingOrderable,
  prepareCreateSemenListing,
  prepareCreateStallion,
  prepareUpdateSemenListing,
  searchSemenListingRecords,
  updateSemenListingEndpoint,
} from "./semen-catalog.mjs";

const timestamp = "2026-06-09T08:00:00.000Z";

const stationActor = {
  userId: "user-station-a",
  roles: [
    {
      userId: "user-station-a",
      organizationId: "org-station-a",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const otherStationActor = {
  userId: "user-station-b",
  roles: [
    {
      userId: "user-station-b",
      organizationId: "org-station-b",
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

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
      organizationId: "org-breeder-a",
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const futureBuyerActor = {
  userId: "user-buyer",
  roles: [
    {
      userId: "user-buyer",
      organizationId: "org-buyer-a",
      roleCode: "BUYER",
      revokedAt: null,
    },
  ],
};

const stallionA = {
  id: "stallion-a",
  name: "Northern Light",
  breed: "Warmblood",
  ueln: "276020000000001",
  microchipNumber: null,
  breedingStationOrganizationId: "org-station-a",
  status: "ACTIVE",
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const stallionB = {
  id: "stallion-b",
  name: "River Crown",
  breed: "Hanoverian",
  ueln: null,
  microchipNumber: "chip-002",
  breedingStationOrganizationId: "org-station-b",
  status: "ACTIVE",
  createdByUserId: "user-station-b",
  updatedByUserId: "user-station-b",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const activeListing = {
  id: "listing-active",
  stallionId: "stallion-a",
  breedingStationOrganizationId: "org-station-a",
  availabilityStatus: "AVAILABLE",
  listingStatus: "ACTIVE",
  termsSummary: "Fresh semen available weekdays",
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const inactiveListing = {
  ...activeListing,
  id: "listing-inactive",
  listingStatus: "INACTIVE",
};

const stationBListing = {
  ...activeListing,
  id: "listing-station-b",
  stallionId: "stallion-b",
  breedingStationOrganizationId: "org-station-b",
  availabilityStatus: "LIMITED",
  termsSummary: "Frozen doses by approval",
};

test("catalog route contract exposes scoped stallion and semen listing CRUD/search endpoints", () => {
  assert.deepEqual(
    SEMEN_CATALOG_ROUTES.map((route) => `${route.method} ${route.path}`),
    [
      "GET /stallions",
      "POST /stallions",
      "GET /stallions/:stallionId",
      "PATCH /stallions/:stallionId",
      "DELETE /stallions/:stallionId",
      "GET /semen-listings",
      "POST /semen-listings",
      "GET /semen-listings/:listingId",
      "PATCH /semen-listings/:listingId",
      "DELETE /semen-listings/:listingId",
    ],
  );
});

test("breeding station can create stallions and semen listings for its own station", () => {
  const preparedStallion = prepareCreateStallion({
    stallionId: "stallion-new",
    name: "  Blue Meridian ",
    breed: " Oldenburg ",
    ueln: "UELN-123",
    microchipNumber: null,
    breedingStationOrganizationId: "org-station-a",
    actor: stationActor,
    createdAt: timestamp,
  });

  assert.equal(preparedStallion.stallion.name, "Blue Meridian");
  assert.equal(preparedStallion.stallion.breed, "Oldenburg");
  assert.equal(preparedStallion.stallion.breedingStationOrganizationId, "org-station-a");
  assert.equal(canManageStationCatalog(stationActor, "org-station-a"), true);

  const preparedListing = prepareCreateSemenListing({
    listingId: "listing-new",
    stallion: preparedStallion.stallion,
    availabilityStatus: "AVAILABLE",
    listingStatus: "ACTIVE",
    termsSummary: "Fresh semen collection by appointment",
    changeReason: "Initial station listing",
    actor: stationActor,
    createdAt: timestamp,
  });

  assert.deepEqual(preparedListing.listing, {
    id: "listing-new",
    stallionId: "stallion-new",
    breedingStationOrganizationId: "org-station-a",
    availabilityStatus: "AVAILABLE",
    listingStatus: "ACTIVE",
    termsSummary: "Fresh semen collection by appointment",
    createdByUserId: "user-station-a",
    updatedByUserId: "user-station-a",
    createdAt: timestamp,
    updatedAt: timestamp,
  });
  assert.deepEqual(preparedListing.auditHook, {
    eventType: "SEMEN_LISTING_CHANGE",
    action: "SEMEN_LISTING_CREATED",
    actorUserId: "user-station-a",
    actorRoleCode: "BREEDING_STATION",
    actorOrganizationId: "org-station-a",
    targetType: "SemenListing",
    targetId: "listing-new",
    targetRef: {
      stallionId: "stallion-new",
      breedingStationOrganizationId: "org-station-a",
    },
    previousValue: null,
    newValue: {
      stallionId: "stallion-new",
      breedingStationOrganizationId: "org-station-a",
      availabilityStatus: "AVAILABLE",
      listingStatus: "ACTIVE",
      termsSummary: "Fresh semen collection by appointment",
    },
    reason: "Initial station listing",
    occurredAt: timestamp,
  });
});

test("listing management is limited to owning station or platform admin", () => {
  assert.throws(
    () =>
      prepareUpdateSemenListing({
        existingListing: activeListing,
        updates: {
          availabilityStatus: "LIMITED",
        },
        actor: otherStationActor,
        now: timestamp,
      }),
    (error) =>
      error instanceof SemenCatalogValidationError &&
      error.issues.includes(
        "actor must be an active PLATFORM_ADMIN or BREEDING_STATION user for the breeding station.",
      ),
  );

  const adminUpdate = prepareUpdateSemenListing({
    existingListing: activeListing,
    updates: {
      availabilityStatus: "LIMITED",
      changeReason: "Admin correction after station call",
    },
    actor: adminActor,
    now: timestamp,
  });

  assert.equal(adminUpdate.listing.availabilityStatus, "LIMITED");
  assert.equal(adminUpdate.auditHook.actorRoleCode, "PLATFORM_ADMIN");
  assert.equal(adminUpdate.auditHook.action, "SEMEN_LISTING_UPDATED");
});

test("breeder can view active listings and search by stallion, breed, station and availability", () => {
  const records = [
    { listing: activeListing, stallion: stallionA },
    { listing: inactiveListing, stallion: stallionA },
    { listing: stationBListing, stallion: stallionB },
  ];

  assert.equal(canViewSemenListing(breederActor, activeListing), true);
  assert.equal(canViewSemenListing(breederActor, inactiveListing), false);

  const activeWarmbloodListings = searchSemenListingRecords(
    records,
    {
      stallion: "north",
      breed: "warm",
      breedingStationOrganizationId: "org-station-a",
      availabilityStatus: "AVAILABLE",
    },
    breederActor,
  );

  assert.deepEqual(
    activeWarmbloodListings.map((record) => record.listing.id),
    ["listing-active"],
  );

  const inactiveBreederSearch = searchSemenListingRecords(
    records,
    {
      listingStatus: "INACTIVE",
    },
    breederActor,
  );

  assert.deepEqual(inactiveBreederSearch, []);
});

test("inactive or unavailable listings cannot be ordered", () => {
  assert.equal(isSemenListingOrderable(activeListing), true);
  assert.doesNotThrow(() => ensureSemenListingCanBeOrdered(activeListing));

  assert.equal(isSemenListingOrderable(inactiveListing), false);
  assert.throws(
    () => ensureSemenListingCanBeOrdered(inactiveListing),
    (error) =>
      error instanceof SemenListingNotOrderableError &&
      error.reasons.includes("listingStatus must be ACTIVE."),
  );

  assert.throws(
    () =>
      ensureSemenListingCanBeOrdered({
        ...activeListing,
        availabilityStatus: "UNAVAILABLE",
      }),
    (error) =>
      error instanceof SemenListingNotOrderableError &&
      error.reasons.includes("availabilityStatus must not be UNAVAILABLE."),
  );
});

test("semen listing endpoint handlers create, update and soft-delete with audit hooks", async () => {
  const repository = buildRepository({
    stallions: [stallionA],
    listings: [],
  });

  const created = await createSemenListingEndpoint({
    actor: stationActor,
    repository,
    body: {
      listingId: "listing-endpoint",
      stallionId: "stallion-a",
      availabilityStatus: "AVAILABLE",
      listingStatus: "ACTIVE",
      termsSummary: "Created through endpoint contract",
      changeReason: "Initial listing",
    },
  });

  assert.equal(created.status, 201);
  assert.equal(created.body.listing.id, "listing-endpoint");
  assert.equal(created.auditHook?.action, "SEMEN_LISTING_CREATED");
  assert.equal(created.auditLog?.action, "CREATE");
  assert.equal(created.auditLog?.objectType, "SemenListing");

  const updated = await updateSemenListingEndpoint({
    actor: stationActor,
    repository,
    params: {
      listingId: "listing-endpoint",
    },
    body: {
      availabilityStatus: "LIMITED",
      changeReason: "Collection slots reduced",
    },
  });

  assert.equal(updated.status, 200);
  assert.equal(updated.body.listing.availabilityStatus, "LIMITED");
  assert.equal(updated.auditHook?.previousValue?.availabilityStatus, "AVAILABLE");
  assert.equal(updated.auditHook?.newValue.availabilityStatus, "LIMITED");
  assert.equal(updated.auditLog?.action, "UPDATE");
  assert.equal(updated.auditLog?.newValues?.availabilityStatus, "LIMITED");

  const adminEdited = await updateSemenListingEndpoint({
    actor: adminActor,
    repository,
    params: {
      listingId: "listing-endpoint",
    },
    body: {
      termsSummary: "Admin-corrected collection window",
      changeReason: "Support correction after station call",
    },
  });

  assert.equal(adminEdited.status, 200);
  assert.equal(adminEdited.auditHook?.actorRoleCode, "PLATFORM_ADMIN");
  assert.equal(adminEdited.auditLog?.action, "ADMIN_EDIT");
  assert.equal(adminEdited.auditLog?.reason, "Support correction after station call");

  const deleted = await deleteSemenListingEndpoint({
    actor: stationActor,
    repository,
    params: {
      listingId: "listing-endpoint",
    },
    body: {
      changeReason: "Temporarily withdrawn",
    },
  });

  assert.equal(deleted.body.listing.listingStatus, "INACTIVE");
  assert.equal(deleted.auditHook?.action, "SEMEN_LISTING_DEACTIVATED");
  assert.equal(deleted.auditLog?.action, "UPDATE");
});

test("future buyer role cannot search listings as unrestricted buyer access", () => {
  assert.throws(
    () =>
      searchSemenListingRecords(
        [{ listing: activeListing, stallion: stallionA }],
        {},
        futureBuyerActor,
      ),
    (error) =>
      error instanceof SemenCatalogAuthorizationError &&
      error.message.includes("active Phase 1 role"),
  );
});

function buildRepository({ stallions, listings }) {
  const stallionStore = new Map(stallions.map((stallion) => [stallion.id, stallion]));
  const listingStore = new Map(listings.map((listing) => [listing.id, listing]));
  let auditLogSequence = 1;

  return {
    async createStallion(stallion) {
      stallionStore.set(stallion.id, stallion);
      return stallion;
    },
    async updateStallion(stallion) {
      stallionStore.set(stallion.id, stallion);
      return stallion;
    },
    async findStallionById(stallionId) {
      return stallionStore.get(stallionId) ?? null;
    },
    async listStallions() {
      return Array.from(stallionStore.values());
    },
    async createSemenListing(listing) {
      listingStore.set(listing.id, listing);
      return listing;
    },
    async updateSemenListing(listing) {
      listingStore.set(listing.id, listing);
      return listing;
    },
    async findSemenListingById(listingId) {
      return listingStore.get(listingId) ?? null;
    },
    async findSemenListingRecordById(listingId) {
      const listing = listingStore.get(listingId);

      if (!listing) {
        return null;
      }

      const stallion = stallionStore.get(listing.stallionId);

      return stallion ? { listing, stallion } : null;
    },
    async listSemenListingRecords() {
      return Array.from(listingStore.values())
        .map((listing) => {
          const stallion = stallionStore.get(listing.stallionId);
          return stallion ? { listing, stallion } : null;
        })
        .filter(Boolean);
    },
    async createAuditLog(auditLog) {
      return {
        ...auditLog,
        id: auditLog.id ?? `audit-log-${auditLogSequence++}`,
      };
    },
  };
}
