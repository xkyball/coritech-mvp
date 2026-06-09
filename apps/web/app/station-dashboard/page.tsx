import { StationDashboard } from "../../features/station-dashboard/StationDashboard";
import { stationDashboardDemoInput } from "../../features/station-dashboard/demo-data";
import {
  createStationDashboardErrorState,
  createStationDashboardViewModel,
} from "../../features/station-dashboard/view-model";

type StationDashboardSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function StationDashboardPage({
  searchParams,
}: Readonly<{
  searchParams?: StationDashboardSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return <StationDashboard viewModel={viewModel} />;
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  try {
    return createStationDashboardViewModel({
      ...stationDashboardDemoInput,
      selectedOrderId: firstSearchParam(searchParams.orderId),
    });
  } catch (error) {
    return createStationDashboardErrorState(error);
  }
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
