import { StationDashboard } from "../../features/station-dashboard/StationDashboard";
import { createStationDashboardLoadingState } from "../../features/station-dashboard/view-model";

export default function StationDashboardLoading() {
  return (
    <StationDashboard
      viewModel={createStationDashboardLoadingState({
        organizationName: "station workspace",
      })}
    />
  );
}
