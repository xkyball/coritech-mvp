import { StallionManagement } from "../../../../features/stallion-management/StallionManagement";
import { createStallionManagementLoadingState } from "../../../../features/stallion-management/view-model";

export default function StallionManagementLoading() {
  return (
    <StallionManagement
      viewModel={createStallionManagementLoadingState({
        organizationName: "CoriTech Equine Station",
      })}
    />
  );
}
