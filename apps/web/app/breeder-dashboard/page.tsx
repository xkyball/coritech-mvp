import { BreederDashboard } from "../../features/breeder-dashboard/BreederDashboard";
import { breederDashboardDemoInput } from "../../features/breeder-dashboard/demo-data";
import { createBreederDashboardViewModel } from "../../features/breeder-dashboard/view-model";

export default function BreederDashboardPage() {
  const viewModel = createBreederDashboardViewModel(breederDashboardDemoInput);

  return <BreederDashboard viewModel={viewModel} />;
}
