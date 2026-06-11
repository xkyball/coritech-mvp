import assert from "node:assert/strict";
import test from "node:test";

import { createInMemoryListingManagementRepository } from "../listing-management/listing-management.mjs";
import {
  StallionManagementAuthorizationError,
  StallionManagementValidationError,
  createStallionManagementViewModel,
  renderStallionManagement,
  saveStallionFromForm,
} from "./stallion-management.mjs";

const timestamp = "2026-06-10T09:00:00.000Z";
const stationOrganizationId = "org-station-a";
const otherStationOrganizationId = "org-station-b";
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

const stallionA = {
  id: "stallion-a",
  name: "Northern Light",
  breed: "Warmblood",
  ueln: "276020000000001",
  microchipNumber: null,
  breedingStationOrganizationId: stationOrganizationId,
  status: "ACTIVE",
};

const inactiveStallion = {
  ...stallionA,
  id: "stallion-inactive",
  name: "Quiet Meridian",
  ueln: "528003202600777",
  status: "INACTIVE",
};

const stallionB = {
  ...stallionA,
  id: "stallion-b",
  name: "River Crown",
  breedingStationOrganizationId: otherStationOrganizationId,
};

test("station stallion management scopes rows and search to the active station", () => {
  const viewModel = createStallionManagementViewModel({
    actor: stationActor,
    organizationId: stationOrganizationId,
    organizationName: "Station A",
    stallions: [stallionA, inactiveStallion, stallionB],
    searchQuery: "276020",
  });

  assert.equal(viewModel.state, "FORM");
  assert.deepEqual(viewModel.stallions.map((stallion) => stallion.id), ["stallion-a"]);
  assert.equal(viewModel.stallions[0].createListingHref, "/app/station/listings?stallionId=stallion-a");

  const html = renderStallionManagement(viewModel);
  assert.match(html, /Northern Light/);
  assert.doesNotMatch(html, /River Crown/);
});

test("station stallion edit keeps an owned selection even when search filters the list", () => {
  const viewModel = createStallionManagementViewModel({
    actor: stationActor,
    organizationId: stationOrganizationId,
    organizationName: "Station A",
    selectedStallionId: "stallion-a",
    stallions: [stallionA, inactiveStallion],
    searchQuery: "quiet",
  });

  assert.deepEqual(viewModel.stallions.map((stallion) => stallion.id), ["stallion-inactive"]);
  assert.equal(viewModel.selectedStallion?.id, "stallion-a");
  assert.equal(viewModel.form.stallionId, "stallion-a");
});

test("station can create an own stallion with audit evidence", async () => {
  const repository = createInMemoryListingManagementRepository({
    stallions: [],
    stallionSequenceStart: 700,
  });
  const result = await saveStallionFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    form: {
      name: "Copper Vale",
      breed: "KWPN",
      ueln: "528003202600341",
      microchipNumber: "985141000000341",
      status: "ACTIVE",
      changeReason: "Station created stallion profile",
    },
    now: timestamp,
  });

  assert.equal(result.ok, true);
  assert.equal(result.operation, "CREATE");
  assert.equal(result.stallion.breedingStationOrganizationId, stationOrganizationId);
  assert.equal(result.auditHook?.action, "STALLION_CREATED");
  assert.equal(result.auditLog?.objectType, "Stallion");
});

test("station can edit and inactivate its own stallion", async () => {
  const repository = createInMemoryListingManagementRepository({
    stallions: [stallionA],
  });

  const updated = await saveStallionFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    form: {
      stallionId: "stallion-a",
      name: "Northern Light",
      breed: "Warmblood",
      ueln: "276020000000001",
      microchipNumber: "chip-a",
      status: "ACTIVE",
      changeReason: "Chip ID recorded",
    },
    now: timestamp,
  });

  assert.equal(updated.ok, true);
  assert.equal(updated.auditHook?.action, "STALLION_UPDATED");
  assert.equal(updated.stallion.microchipNumber, "chip-a");

  const inactivated = await saveStallionFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    statusOverride: "INACTIVE",
    form: {
      stallionId: "stallion-a",
      name: "Northern Light",
      breed: "Warmblood",
      ueln: "276020000000001",
      microchipNumber: "chip-a",
      status: "ACTIVE",
      changeReason: "Paused from station roster",
    },
    now: timestamp,
  });

  assert.equal(inactivated.ok, true);
  assert.equal(inactivated.auditHook?.action, "STALLION_DEACTIVATED");
  assert.equal(inactivated.stallion.status, "INACTIVE");

  const viewModel = createStallionManagementViewModel({
    actor: stationActor,
    organizationId: stationOrganizationId,
    stallions: await repository.listStallions({ breedingStationOrganizationId: stationOrganizationId }),
  });

  assert.equal(viewModel.stallions[0].createListingHref, null);
  assert.equal(viewModel.stallions[0].canActivate, true);
});

test("cross-organization and non-station stallion access is denied", async () => {
  assert.throws(
    () =>
      createStallionManagementViewModel({
        actor: stationActor,
        organizationId: stationOrganizationId,
        selectedStallionId: "stallion-b",
        stallions: [stallionB],
      }),
    StallionManagementAuthorizationError,
  );

  assert.throws(
    () =>
      createStallionManagementViewModel({
        actor: breederActor,
        organizationId: "org-breeder",
        stallions: [stallionA],
      }),
    StallionManagementAuthorizationError,
  );

  const repository = createInMemoryListingManagementRepository({
    stallions: [stallionB],
  });
  const result = await saveStallionFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository,
    form: {
      stallionId: "stallion-b",
      name: "River Crown",
      breed: "Hanoverian",
      status: "INACTIVE",
      changeReason: "Wrong station edit",
    },
  });

  assert.equal(result.ok, false);
  assert.match(result.issues.join(" "), /BREEDING_STATION user for the breeding station/);
});

test("stallion management validates required fields before saving", async () => {
  const result = await saveStallionFromForm({
    actor: stationActor,
    organizationId: stationOrganizationId,
    repository: createInMemoryListingManagementRepository({ stallions: [] }),
    form: {
      name: "",
      breed: "",
      status: "ACTIVE",
      changeReason: "",
    },
  });

  assert.equal(result.ok, false);
  assert.deepEqual(result.issues, [
    "name is required.",
    "breed is required.",
    "changeReason is required for the stallion audit trail.",
  ]);

  assert.throws(
    () =>
      createStallionManagementViewModel({
        actor: { userId: "", roles: [] },
      }),
    StallionManagementValidationError,
  );
});
