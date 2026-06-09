import { BreederDashboard } from "../../features/breeder-dashboard/BreederDashboard";
import { breederDashboardDemoInput } from "../../features/breeder-dashboard/demo-data";
import {
  createBreederDashboardErrorState,
  createBreederDashboardViewModel,
} from "../../features/breeder-dashboard/view-model";

export default function BreederDashboardPage() {
  const viewModel = createViewModel();

  return <BreederDashboard viewModel={viewModel} />;
}

function createViewModel() {
  try {
    return createBreederDashboardViewModel(breederDashboardDemoInput);
  } catch (error) {
    return createBreederDashboardErrorState(error);
  }
}
