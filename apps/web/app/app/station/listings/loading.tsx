import { ListingManagement } from "../../../../features/listing-management/ListingManagement";
import { createListingManagementLoadingState } from "../../../../features/listing-management/view-model";

export default function ListingManagementLoading() {
  return (
    <ListingManagement
      viewModel={createListingManagementLoadingState({
        organizationName: "CoriTech Equine Station",
      })}
    />
  );
}
