import type { StallionManagementInput } from "./stallion-management.d.ts";

import {
  getListingManagementDemoRepository,
  listingManagementStationOrganizationId,
  listingManagementStationUserId,
} from "../listing-management/demo-store";

export const stallionManagementStationOrganizationId = listingManagementStationOrganizationId;
export const stallionManagementStationUserId = listingManagementStationUserId;

export function getStallionManagementDemoRepository() {
  return getListingManagementDemoRepository();
}

export async function getStallionManagementDemoInput(): Promise<StallionManagementInput> {
  const repository = getStallionManagementDemoRepository();
  const stallions = await repository.listStallions({
    breedingStationOrganizationId: stallionManagementStationOrganizationId,
  });

  return {
    actor: {
      userId: stallionManagementStationUserId,
      roles: [
        {
          userId: stallionManagementStationUserId,
          organizationId: stallionManagementStationOrganizationId,
          roleCode: "BREEDING_STATION",
          revokedAt: null,
        },
      ],
    },
    organizationId: stallionManagementStationOrganizationId,
    organizationName: "CoriTech Equine Station",
    stallions: stallions.map((stallion) => ({
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
