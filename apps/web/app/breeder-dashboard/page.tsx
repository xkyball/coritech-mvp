import { BreederDashboard } from "../../features/breeder-dashboard/BreederDashboard";
import { getBreederDashboardDemoInput } from "../../features/order-creation/demo-store";
import {
  createBreederDashboardErrorState,
  createBreederDashboardViewModel,
} from "../../features/breeder-dashboard/view-model";

export default async function BreederDashboardPage() {
  const viewModel = await createViewModel();

  return <BreederDashboard viewModel={viewModel} />;
}

async function createViewModel() {
  try {
    return createBreederDashboardViewModel(await getBreederDashboardDemoInput());
  } catch (error) {
    return createBreederDashboardErrorState(error);
  }
}
