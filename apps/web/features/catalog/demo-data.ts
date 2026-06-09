import type { SemenCatalogInput } from "./semen-catalog.d.ts";

const timestamp = "2026-06-09T09:00:00.000Z";

export const semenCatalogDemoInput: SemenCatalogInput = {
  actor: {
    userId: "00000000-0000-4000-8000-000000000102",
    roles: [
      {
        userId: "00000000-0000-4000-8000-000000000102",
        organizationId: "00000000-0000-4000-8000-000000000002",
        roleCode: "BREEDER",
        revokedAt: null,
      },
    ],
  },
  stationOrganizations: [
    {
      organizationId: "00000000-0000-4000-8000-000000000003",
      name: "CoriTech Equine Station",
    },
    {
      organizationId: "00000000-0000-4000-8000-000000000004",
      name: "Blue Ridge Breeding Station",
    },
  ],
  listingRecords: [
    {
      listing: {
        id: "00000000-0000-4000-8000-000000000302",
        stallionId: "00000000-0000-4000-8000-000000000301",
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000003",
        availabilityStatus: "AVAILABLE",
        listingStatus: "ACTIVE",
        termsSummary: "Fresh chilled semen available by station confirmation.",
      },
      stallion: {
        id: "00000000-0000-4000-8000-000000000301",
        name: "Coriander Gold",
        breed: "Warmblood",
        ueln: "826002202600001",
        microchipNumber: "985141000000001",
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000003",
        status: "ACTIVE",
      },
    },
    {
      listing: {
        id: "00000000-0000-4000-8000-000000000312",
        stallionId: "00000000-0000-4000-8000-000000000311",
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000004",
        availabilityStatus: "LIMITED",
        listingStatus: "ACTIVE",
        termsSummary: "Frozen doses released after station review.",
      },
      stallion: {
        id: "00000000-0000-4000-8000-000000000311",
        name: "Blue Meridian",
        breed: "Oldenburg",
        ueln: "276020000000311",
        microchipNumber: null,
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000004",
        status: "ACTIVE",
      },
    },
    {
      listing: {
        id: "00000000-0000-4000-8000-000000000322",
        stallionId: "00000000-0000-4000-8000-000000000321",
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000003",
        availabilityStatus: "UNAVAILABLE",
        listingStatus: "ACTIVE",
        termsSummary: "Collection paused while station documentation is updated.",
      },
      stallion: {
        id: "00000000-0000-4000-8000-000000000321",
        name: "River Crown",
        breed: "Hanoverian",
        ueln: null,
        microchipNumber: "985141000000321",
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000003",
        status: "ACTIVE",
      },
    },
    {
      listing: {
        id: "00000000-0000-4000-8000-000000000332",
        stallionId: "00000000-0000-4000-8000-000000000331",
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000003",
        availabilityStatus: "AVAILABLE",
        listingStatus: "INACTIVE",
        termsSummary: "Inactive listing retained for audit history.",
      },
      stallion: {
        id: "00000000-0000-4000-8000-000000000331",
        name: "Hidden Star",
        breed: "Warmblood",
        ueln: null,
        microchipNumber: null,
        breedingStationOrganizationId: "00000000-0000-4000-8000-000000000003",
        status: "INACTIVE",
      },
    },
  ],
};

export const semenCatalogDemoUpdatedAt = timestamp;
