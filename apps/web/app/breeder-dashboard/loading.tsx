import { BreederDashboard } from "../../features/breeder-dashboard/BreederDashboard";
import { createBreederDashboardLoadingState } from "../../features/breeder-dashboard/view-model";

export default function BreederDashboardLoading() {
  return (
    <BreederDashboard
      viewModel={createBreederDashboardLoadingState({
        organizationName: "Breeder workspace",
      })}
    />
  );
}
