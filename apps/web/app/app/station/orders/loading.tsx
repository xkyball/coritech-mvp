import { DashboardShell, LoadingState } from "../../../../components/ui";
import { stationNavigation } from "../../../../features/navigation";

export default function StationOrdersLoading() {
  return (
    <DashboardShell
      activeHref="/app/station/orders"
      navigation={stationNavigation}
      organizationName="Station orders"
      roleLabel="Breeding Station"
    >
      <LoadingState
        message="Loading assigned station orders."
        title="Order management"
      />
    </DashboardShell>
  );
}
