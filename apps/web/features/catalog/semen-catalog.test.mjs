import test from "node:test";
import assert from "node:assert/strict";

import { SemenCatalogAuthorizationError } from "@coritech/domain/catalog/semen-catalog.mjs";

import {
  SemenCatalogUiValidationError,
  createSemenCatalogDetailViewModel,
  createSemenCatalogErrorState,
  createSemenCatalogLoadingState,
  createSemenCatalogViewModel,
  renderSemenCatalog,
} from "./semen-catalog.mjs";

const breederActor = {
  userId: "user-breeder-a",
  roles: [
    {
      userId: "user-breeder-a",
      organizationId: "org-breeder-a",
      roleCode: "BREEDER",
      revokedAt: null,
    },
  ],
};

const buyerActor = {
  userId: "user-buyer-a",
  roles: [
    {
      userId: "user-buyer-a",
      organizationId: "org-buyer-a",
      roleCode: "BUYER",
      revokedAt: null,
    },
  ],
};

const stationOrganizations = [
  {
    organizationId: "org-station-a",
    name: "North Valley Station",
  },
  {
    organizationId: "org-station-b",
    name: "Riverbend Breeding Station",
  },
];

const activeAvailableRecord = {
  listing: {
    id: "listing-active-available",
    stallionId: "stallion-northern",
    breedingStationOrganizationId: "org-station-a",
    availabilityStatus: "AVAILABLE",
    listingStatus: "ACTIVE",
    termsSummary: "Fresh chilled semen available weekdays",
  },
  stallion: {
    id: "stallion-northern",
    name: "Northern Light",
    breed: "Warmblood",
    ueln: "276020000000001",
    microchipNumber: "chip-001",
    breedingStationOrganizationId: "org-station-a",
    status: "ACTIVE",
  },
};

const activeLimitedRecord = {
  listing: {
    id: "listing-active-limited",
    stallionId: "stallion-blue",
    breedingStationOrganizationId: "org-station-b",
    availabilityStatus: "LIMITED",
    listingStatus: "ACTIVE",
    termsSummary: "Frozen doses by station approval",
  },
  stallion: {
    id: "stallion-blue",
    name: "Blue Meridian",
    breed: "Oldenburg",
    ueln: null,
    microchipNumber: null,
    breedingStationOrganizationId: "org-station-b",
    status: "ACTIVE",
  },
};

const activeUnavailableRecord = {
  listing: {
    id: "listing-active-unavailable",
    stallionId: "stallion-river",
    breedingStationOrganizationId: "org-station-a",
    availabilityStatus: "UNAVAILABLE",
    listingStatus: "ACTIVE",
    termsSummary: "Collection paused",
  },
  stallion: {
    id: "stallion-river",
    name: "River Crown",
    breed: "Hanoverian",
    ueln: null,
    microchipNumber: "chip-003",
    breedingStationOrganizationId: "org-station-a",
    status: "ACTIVE",
  },
};

const inactiveRecord = {
  listing: {
    id: "listing-inactive",
    stallionId: "stallion-hidden",
    breedingStationOrganizationId: "org-station-a",
    availabilityStatus: "AVAILABLE",
    listingStatus: "INACTIVE",
    termsSummary: "Inactive listing retained for history",
  },
  stallion: {
    id: "stallion-hidden",
    name: "Hidden Star",
    breed: "Warmblood",
    ueln: null,
    microchipNumber: null,
    breedingStationOrganizationId: "org-station-a",
    status: "INACTIVE",
  },
};

const listingRecords = [
  activeAvailableRecord,
  activeLimitedRecord,
  activeUnavailableRecord,
  inactiveRecord,
];

test("catalog list shows only active breeder-visible listings with clear station names", () => {
  const catalog = createSemenCatalogViewModel({
    actor: breederActor,
    listingRecords,
    stationOrganizations,
  });
  const html = renderSemenCatalog(catalog);

  assert.deepEqual(
    catalog.listings.map((listing) => listing.id),
    [
      "listing-active-limited",
      "listing-active-available",
      "listing-active-unavailable",
    ],
  );
  assert.equal(
    catalog.listings.some((listing) => listing.id === "listing-inactive"),
    false,
  );
  assert.match(html, /North Valley Station \(org-station-a\)/);
  assert.match(html, /Riverbend Breeding Station \(org-station-b\)/);
  assert.doesNotMatch(html, /Hidden Star/);
});

test("catalog search and filters narrow by stallion, breed, station and availability", () => {
  const catalog = createSemenCatalogViewModel({
    actor: breederActor,
    listingRecords,
    stationOrganizations,
    filters: {
      stallion: "blue",
      breed: "olden",
      station: "org-station-b",
      availabilityStatus: "LIMITED",
    },
  });
  const html = renderSemenCatalog(catalog);

  assert.deepEqual(
    catalog.listings.map((listing) => listing.id),
    ["listing-active-limited"],
  );
  assert.equal(catalog.filters.stallion, "blue");
  assert.equal(catalog.filters.breed, "olden");
  assert.equal(catalog.filters.station, "org-station-b");
  assert.equal(catalog.filters.availabilityStatus, "LIMITED");
  assert.match(html, /value="org-station-b" selected/);
  assert.match(html, /value="LIMITED" selected/);
});

test("unavailable active listings are visible but cannot start an order", () => {
  const catalog = createSemenCatalogViewModel({
    actor: breederActor,
    listingRecords,
    stationOrganizations,
  });
  const available = catalog.listings.find((listing) =>
    listing.id === "listing-active-available"
  );
  const unavailable = catalog.listings.find((listing) =>
    listing.id === "listing-active-unavailable"
  );
  const html = renderSemenCatalog(catalog);

  assert.equal(available?.canCreateOrder, true);
  assert.equal(
    available?.createOrderHref,
    "/app/orders/new?semenListingId=listing-active-available",
  );
  assert.equal(unavailable?.canCreateOrder, false);
  assert.equal(unavailable?.createOrderHref, null);
  assert.match(html, /href="\/app\/orders\/new\?semenListingId=listing-active-available"/);
  assert.match(html, /<button class="semen-catalog__button" type="button" disabled>Unavailable<\/button>/);
});

test("breeder can open active listing detail and start order from detail", () => {
  const detail = createSemenCatalogDetailViewModel({
    actor: breederActor,
    listingId: "listing-active-available",
    listingRecords,
    stationOrganizations,
  });
  const html = renderSemenCatalog(detail);

  assert.equal(detail.state, "DETAIL");
  assert.equal(detail.listing.stallionName, "Northern Light");
  assert.equal(detail.listing.listingStatus, "ACTIVE");
  assert.equal(detail.listing.detailHref, "/app/catalog/listing-active-available");
  assert.equal(
    detail.listing.createOrderHref,
    "/app/orders/new?semenListingId=listing-active-available",
  );
  assert.match(html, /Listing details/);
  assert.match(html, /Breeding station/);
  assert.match(html, /North Valley Station \(org-station-a\)/);
  assert.match(html, /href="\/app\/orders\/new\?semenListingId=listing-active-available"/);
});

test("catalog renders loading, empty and error states", () => {
  const loadingHtml = renderSemenCatalog(
    createSemenCatalogLoadingState({ label: "semen catalog" }),
  );
  const emptyCatalog = createSemenCatalogViewModel({
    actor: breederActor,
    listingRecords,
    stationOrganizations,
    filters: {
      stallion: "no match",
    },
  });
  const emptyHtml = renderSemenCatalog(emptyCatalog);
  const errorHtml = renderSemenCatalog(
    createSemenCatalogErrorState(
      new SemenCatalogUiValidationError(["availabilityStatus must be valid."]),
    ),
  );

  assert.match(loadingHtml, /aria-busy="true"/);
  assert.match(loadingHtml, /Loading semen catalog/);
  assert.equal(emptyCatalog.isEmpty, true);
  assert.match(emptyHtml, /No active semen listings match these filters/);
  assert.match(errorHtml, /role="alert"/);
  assert.match(errorHtml, /availabilityStatus must be valid/);
});

test("catalog does not permit unrestricted future buyer access", () => {
  assert.throws(
    () =>
      createSemenCatalogViewModel({
        actor: buyerActor,
        listingRecords,
        stationOrganizations,
      }),
    SemenCatalogAuthorizationError,
  );
});
