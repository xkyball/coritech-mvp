import { redirect } from "next/navigation";

import { getSemenOrderDemoRepository } from "../../../../features/order-creation/demo-store";
import { StationOrderManagement } from "../../../../features/station-order-management/StationOrderManagement";
import {
  createStationOrderManagementViewModel,
  executeStationOrderAction,
} from "../../../../features/station-order-management/view-model";
import { stationDashboardDemoInput } from "../../../../features/station-dashboard/demo-data";

type StationOrdersSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function StationOrdersPage({
  searchParams,
}: Readonly<{
  searchParams?: StationOrdersSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return (
    <StationOrderManagement
      executeAction={executeStationOrderCommand}
      viewModel={viewModel}
    />
  );
}

async function executeStationOrderCommand(formData: FormData) {
  "use server";

  const repository = getSemenOrderDemoRepository();
  const orderId = formValue(formData, "orderId");
  const result = await executeStationOrderAction({
    action: formValue(formData, "action"),
    actor: stationDashboardDemoInput.actor,
    orderId,
    reason: formValue(formData, "reason"),
    repository,
    auditContext: {
      userAgent: "coritech-demo-station-order-management",
    },
  });

  if (!result.ok) {
    redirect(buildStationOrdersUrl({
      error: result.issues.join("\n"),
      orderId,
    }));
  }

  redirect(buildStationOrdersUrl({
    orderId: result.order.id ?? result.order.orderNumber,
    status: `${result.order.orderNumber} ${result.order.status.toLowerCase()}`,
  }));
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  const repository = getSemenOrderDemoRepository();
  const orders = mergeByOrderKey([
    ...(stationDashboardDemoInput.orders ?? []),
    ...(await repository.listSemenOrders()),
  ]);
  const statusHistory = mergeByHistoryKey([
    ...(stationDashboardDemoInput.statusHistory ?? []),
    ...(await repository.listAllOrderStatusHistory()),
  ]);
  const error = firstSearchParam(searchParams.error);
  const status = firstSearchParam(searchParams.status);

  return createStationOrderManagementViewModel({
    ...stationDashboardDemoInput,
    orders,
    statusHistory,
    selectedOrderId: firstSearchParam(searchParams.orderId),
    actionFeedback: error
      ? {
        tone: "danger",
        title: "Station action was blocked",
        message: error,
      }
      : status
        ? {
          tone: "success",
          title: "Station action recorded",
          message: status,
        }
        : undefined,
  });
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function buildStationOrdersUrl(input: {
  error?: string;
  orderId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  if (input.orderId) {
    params.set("orderId", input.orderId);
  }

  if (input.error) {
    params.set("error", input.error);
  }

  if (input.status) {
    params.set("status", input.status);
  }

  const query = params.toString();

  return query ? `/app/station/orders?${query}` : "/app/station/orders";
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
