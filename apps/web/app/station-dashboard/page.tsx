import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { StationDashboard } from "../../features/station-dashboard/StationDashboard";
import { stationDashboardDemoInput } from "../../features/station-dashboard/demo-data";
import { getSemenOrderDemoRepository } from "../../features/order-creation/demo-store";
import {
  createStationDashboardErrorState,
  createStationDashboardViewModel,
} from "../../features/station-dashboard/view-model";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../features/auth/server-session";

type StationDashboardSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export const dynamic = "force-dynamic";

export default async function StationDashboardPage({
  searchParams,
}: Readonly<{
  searchParams?: StationDashboardSearchParams;
}>) {
  if (!await readManagedAuthSessionFromCookieHeader((await headers()).get("cookie"))) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent("/station-dashboard")}`);
  }

  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return <StationDashboard viewModel={viewModel} />;
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  try {
    const repository = getSemenOrderDemoRepository();
    const orders = mergeByOrderKey([
      ...(stationDashboardDemoInput.orders ?? []),
      ...(await repository.listSemenOrders()),
    ]);
    const statusHistory = mergeByHistoryKey([
      ...(stationDashboardDemoInput.statusHistory ?? []),
      ...(await repository.listAllOrderStatusHistory()),
    ]);

    return createStationDashboardViewModel({
      ...stationDashboardDemoInput,
      orders,
      statusHistory,
      selectedOrderId: firstSearchParam(searchParams.orderId),
    });
  } catch (error) {
    return createStationDashboardErrorState(error);
  }
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function mergeByOrderKey<TOrder extends { id?: string | null; orderNumber: string }>(
  orders: TOrder[],
) {
  const orderByKey = new Map<string, TOrder>();

  for (const order of orders) {
    orderByKey.set(order.id ?? `order-number:${order.orderNumber}`, order);
  }

  return [...orderByKey.values()];
}

function mergeByHistoryKey<THistory extends {
  id?: string | null;
  orderNumber: string;
  toStatus: string;
  changedAt: string;
}>(
  statusHistory: THistory[],
) {
  const historyByKey = new Map<string, THistory>();

  for (const history of statusHistory) {
    historyByKey.set(
      history.id ?? `${history.orderNumber}:${history.toStatus}:${history.changedAt}`,
      history,
    );
  }

  return [...historyByKey.values()];
}
