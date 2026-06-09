import test from "node:test";
import assert from "node:assert/strict";

import { createSemenCatalogViewModel } from "../catalog/semen-catalog.mjs";
import {
  ListingManagementAuthorizationError,
  ListingManagementValidationError,
  createInMemoryListingManagementRepository,
  createListingManagementErrorState,
  createListingManagementLoadingState,
  createListingManagementViewModel,
  renderListingManagement,
  saveSemenListingFromForm,
} from "./listing-management.mjs";

const timestamp = "2026-06-09T09:00:00.000Z";
const stationOrganizationId = "org-station-a";
const otherStationOrganizationId = "org-station-b";
const breederOrganizationId = "org-breeder-a";

const stationActor = {
  userId: "user-station-a",
  roles: [
    {
      userId: "user-station-a",
      organizationId: stationOrganizationId,
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
      organizationId: otherStationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
  ],
};

const breederActor = {
  userId: "user-breeder-a",
  roles: [
    {
      userId: "user-breeder-a",
      organizationId: breederOrganizationId,
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const multiStationActor = {
  userId: "user-multi-station",
  roles: [
    {
      userId: "user-multi-station",
      organizationId: stationOrganizationId,
      roleCode: "BREEDING_STATION",
      revokedAt: null,
    },
    {
      userId: "user-multi-station",
      organizationId: otherStationOrganizationId,
      roleCode: "BREEDING_STATION",
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
  breedingStationOrganizationId: stationOrganizationId,
  status: "ACTIVE",
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const inactiveStallion = {
  ...stallionA,
  id: "stallion-inactive",
  name: "Retired Star",
  status: "INACTIVE",
};

const unlistedStallion = {
  ...stallionA,
  id: "stallion-new",
  name: "Copper Vale",
  breed: "KWPN",
};

const stallionB = {
  ...stallionA,
  id: "stallion-b",
  name: "Blue Meridian",
  breed: "Oldenburg",
  breedingStationOrganizationId: otherStationOrganizationId,
  createdByUserId: "user-station-b",
  updatedByUserId: "user-station-b",
};

const activeListing = {
  id: "listing-active",
  stallionId: "stallion-a",
  breedingStationOrganizationId: stationOrganizationId,
  availabilityStatus: "AVAILABLE",
  listingStatus: "ACTIVE",
  termsSummary: "Fresh chilled semen available weekdays",
  createdByUserId: "user-station-a",
  updatedByUserId: "user-station-a",
  createdAt: timestamp,
  updatedAt: timestamp,
};

const inactiveListing = {
  ...activeListing,
  id: "listing-inactive",
  stallionId: "stallion-inactive",
  listingStatus: "INACTIVE",
  termsSummary: "Inactive listing retained for audit history",
};

const otherStationListing = {
  ...activeListing,
  id: "listing-other",
  stallionId: "stallion-b",
  breedingStationOrganizationId: otherStationOrganizationId,
  availabilityStatus: "LIMITED",
  termsSummary: "Frozen doses by approval",
  createdByUserId: "user-station-b",
  updatedByUserId: "user-station-b",
};

const listingRecords = [
  {
    listing: activeListing,
    stallion: stallionA,
  },
  {
    listing: inactiveListing,
    stallion: inactiveStallion,
  },
  {
    listing: otherStationListing,
    stallion: stallionB,
  },
];

test("station listing management scopes listings and active stallion options to the station organization", () => {
  const viewModel = createListingManagementViewModel({
    actor: stationActor,
    organizationName: "North Valley Station",
    listingRecords,
    stallions: [unlistedStallion, stallionB],
  });
  const editViewModel = createListingManagementViewModel({
    actor: stationActor,
    selectedListingId: "listing-inactive",
    listingRecords,
    stallions: [unlistedStallion, stallionB],
  });
  const html = renderListingManagement(viewModel);

  assert.equal(viewModel.organizationContext.organizationName, "North Valley Station");
  assert.deepEqual(
    viewModel.listings.map((listing) => listing.id),
    ["listing-active", "listing-inactive"],
  );
  assert.deepEqual(
    viewModel.stallionOptions.map((stallion) => stallion.id),
    ["stallion-new", "stallion-a"],
  );
  assert.equal(
    viewModel.listings.some((listing) => listing.id === "listing-other"),
    false,
  );
  assert.equal(editViewModel.mode, "EDIT");
  assert.equal(editViewModel.form.listingStatus, "INACTIVE");
  assert.match(html, /Deactivate/);
  assert.match(html, /Activate/);
  assert.doesNotMatch(html, /Blue Meridian/);
});

test("station can create a listing for its own organization and receive audit evidence", async () => {
  const repository = createInMemoryListingManagementRepository({
    listingRecords,
    stallions: [unlistedStallion],
    listingSequenceStart: 20,
  });

  const result = await saveSemenListingFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    form: {
      stallionId: "stallion-new",
      availabilityStatus: "LIMITED",
      listingStatus: "ACTIVE",
      termsSummary: "Frozen semen available after station review",
      changeReason: "Initial station listing",
    },
    auditContext: {
      userAgent: "listing-management-test",
    },
    now: timestamp,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.operation, "CREATE");
  assert.equal(result.listing.id, "demo-listing-20");
  assert.equal(result.listing.breedingStationOrganizationId, stationOrganizationId);
  assert.equal(result.auditHook?.action, "SEMEN_LISTING_CREATED");
  assert.equal(result.auditLog?.objectType, "SemenListing");

  const records = await repository.listSemenListingRecords();

  assert.equal(
    records.some((record) => record.listing.id === "demo-listing-20"),
    true,
  );
  assert.equal((await repository.listAuditLogs()).length, 1);
});

test("station can edit and deactivate its own listing, and breeder catalog hides the inactive listing", async () => {
  const repository = createInMemoryListingManagementRepository({
    listingRecords,
  });
  const result = await saveSemenListingFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    form: {
      listingId: "listing-active",
      stallionId: "stallion-a",
      availabilityStatus: "UNAVAILABLE",
      listingStatus: "INACTIVE",
      termsSummary: "Paused while station documentation is updated",
      changeReason: "Deactivate listing for station review",
    },
    auditContext: {
      userAgent: "listing-management-test",
    },
    now: timestamp,
  });

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.operation, "UPDATE");
  assert.equal(result.listing.listingStatus, "INACTIVE");
  assert.equal(result.listing.availabilityStatus, "UNAVAILABLE");
  assert.equal(result.auditHook?.action, "SEMEN_LISTING_DEACTIVATED");

  const catalog = createSemenCatalogViewModel({
    actor: breederActor,
    listingRecords: await repository.listSemenListingRecords(),
  });

  assert.equal(
    catalog.listings.some((listing) => listing.id === "listing-active"),
    false,
  );
});

test("station cannot edit another station listing", async () => {
  const repository = createInMemoryListingManagementRepository({
    listingRecords,
  });
  const result = await saveSemenListingFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    form: {
      listingId: "listing-other",
      stallionId: "stallion-b",
      availabilityStatus: "AVAILABLE",
      listingStatus: "ACTIVE",
      termsSummary: "Attempted cross-station edit",
      changeReason: "Should not be allowed",
    },
    now: timestamp,
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.operation, "UPDATE");
  assert.equal(
    result.issues.some((issue) =>
      issue.includes("actor must be an active PLATFORM_ADMIN or BREEDING_STATION user")
    ),
    true,
  );
  assert.equal((await repository.listAuditLogs()).length, 0);
});

test("listing management validates required fields before saving", async () => {
  const repository = createInMemoryListingManagementRepository({
    listingRecords,
  });
  const result = await saveSemenListingFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    form: {
      stallionId: "",
      availabilityStatus: "",
      listingStatus: "",
      termsSummary: "",
      changeReason: "",
    },
  });

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.deepEqual(
    result.issues,
    [
      "stallionId is required.",
      "availabilityStatus is required.",
      "listingStatus is required.",
      "changeReason is required for the listing audit trail.",
    ],
  );
});

test("listing management rejects non-station and ambiguous multi-station contexts", () => {
  assert.throws(
    () =>
      createListingManagementViewModel({
        actor: breederActor,
      }),
    ListingManagementAuthorizationError,
  );

  assert.throws(
    () =>
      createListingManagementViewModel({
        actor: multiStationActor,
      }),
    (error) =>
      error instanceof ListingManagementValidationError &&
      error.issues.includes(
        "organizationId is required when actor has multiple active BREEDING_STATION roles.",
      ),
  );

  assert.throws(
    () =>
      createListingManagementViewModel({
        actor: otherStationActor,
        selectedListingId: "listing-active",
        listingRecords,
      }),
    ListingManagementAuthorizationError,
  );
});

test("listing management renders loading, error and confirmation states", () => {
  const loadingHtml = renderListingManagement(
    createListingManagementLoadingState({ organizationName: "North Valley Station" }),
  );
  const errorHtml = renderListingManagement(
    createListingManagementErrorState(
      new ListingManagementAuthorizationError("actor cannot manage this station"),
    ),
  );

  assert.match(loadingHtml, /aria-busy="true"/);
  assert.match(loadingHtml, /Loading North Valley Station listings/);
  assert.match(errorHtml, /role="alert"/);
  assert.match(errorHtml, /actor cannot manage this station/);
});
