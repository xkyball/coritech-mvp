import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { BreederDashboard } from "../../features/breeder-dashboard/BreederDashboard";
import { getBreederDashboardDemoInput } from "../../features/order-creation/demo-store";
import {
  createBreederDashboardErrorState,
  createBreederDashboardViewModel,
} from "../../features/breeder-dashboard/view-model";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../features/auth/server-session";

export const dynamic = "force-dynamic";

export default async function BreederDashboardPage() {
  if (!await readManagedAuthSessionFromCookieHeader((await headers()).get("cookie"))) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent("/breeder-dashboard")}`);
  }

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
