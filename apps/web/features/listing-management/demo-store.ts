import type {
  ListingManagementInput,
  SemenListingRecordLike,
} from "./listing-management.d.ts";

import { semenCatalogDemoInput } from "../catalog/demo-data";
import { createInMemoryListingManagementRepository } from "./view-model";

export const listingManagementStationOrganizationId = "00000000-0000-4000-8000-000000000003";
export const listingManagementStationUserId = "00000000-0000-4000-8000-000000000103";

const unlistedStationStallion = {
  id: "00000000-0000-4000-8000-000000000341",
  name: "Copper Vale",
  breed: "KWPN",
  ueln: "528003202600341",
  microchipNumber: "985141000000341",
  breedingStationOrganizationId: listingManagementStationOrganizationId,
  status: "ACTIVE" as const,
};

const demoListingRecords = (semenCatalogDemoInput.listingRecords ?? []) as SemenListingRecordLike[];

const demoRepository = createInMemoryListingManagementRepository({
  listingRecords: demoListingRecords,
  stallions: [
    ...demoListingRecords.map((record) => record.stallion),
    unlistedStationStallion,
  ],
  listingSequenceStart: 500,
});

export function getListingManagementDemoRepository() {
  return demoRepository;
}

export async function getListingManagementDemoInput(): Promise<ListingManagementInput> {
  const stallions = await demoRepository.listStallions({
    breedingStationOrganizationId: listingManagementStationOrganizationId,
    status: "ACTIVE",
  });

  return {
    actor: {
      userId: listingManagementStationUserId,
      roles: [
        {
          userId: listingManagementStationUserId,
          organizationId: listingManagementStationOrganizationId,
          roleCode: "BREEDING_STATION",
          revokedAt: null,
        },
      ],
    },
    organizationId: listingManagementStationOrganizationId,
    organizationName: "CoriTech Equine Station",
    listingRecords: await demoRepository.listSemenListingRecords(),
    stallions: stallions
      .filter((stallion) => typeof stallion.id === "string" && stallion.id.length > 0)
      .map((stallion) => ({
        id: stallion.id ?? "",
        name: stallion.name,
        breed: stallion.breed,
        ueln: stallion.ueln,
        microchipNumber: stallion.microchipNumber,
        breedingStationOrganizationId: stallion.breedingStationOrganizationId,
        status: stallion.status,
      })),
  };
}

export async function getSemenCatalogDemoListingRecords() {
  return demoRepository.listSemenListingRecords();
}
