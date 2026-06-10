import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import {
  createPrismaSemenOrderRepository,
  createPrismaSemenOrderTransaction,
} from "../../../../features/order-creation/prisma-semen-order-repository";
import { createPrismaShipmentRepository } from "../../../../features/shipments/prisma-shipment-repository";
import { StationOrderManagement } from "../../../../features/station-order-management/StationOrderManagement";
import {
  createStationOrderManagementViewModel,
  executeStationOrderAction,
} from "../../../../features/station-order-management/view-model";

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

  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const repository = createPrismaSemenOrderRepository();
  const orderId = formValue(formData, "orderId");
  const result = await executeStationOrderAction({
    action: formValue(formData, "action"),
    actor: activeContext,
    orderId,
    reason: formValue(formData, "reason"),
    repository,
    transaction: createPrismaSemenOrderTransaction(),
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
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
  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const repository = createPrismaSemenOrderRepository();
  const shipmentRepository = createPrismaShipmentRepository();
  const filters = {
    breedingStationOrganizationId: activeContext.organizationId,
  };
  const orders = await repository.listSemenOrders(filters);
  const orderIds = orders.flatMap((order) => order.id ? [order.id] : []);
  const statusHistory = await repository.listAllOrderStatusHistory(filters);
  const error = firstSearchParam(searchParams.error);
  const status = firstSearchParam(searchParams.status);

  return createStationOrderManagementViewModel({
    actor: activeContext,
    organizationId: activeContext.organizationId,
    organizationName: activeContext.organizationName,
    listingRecords: (await repository.listOrderableSemenListingRecords())
      .filter((record) =>
        record.listing.breedingStationOrganizationId === activeContext.organizationId
    ),
    orders,
    statusHistory,
    shipments: await shipmentRepository.listShipments(filters),
    shipmentTrackingEvents: await shipmentRepository.listShipmentTrackingEventsForOrders(orderIds),
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
