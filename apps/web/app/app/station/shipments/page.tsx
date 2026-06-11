import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import {
  createPrismaSemenOrderRepository,
} from "../../../../features/order-creation/prisma-semen-order-repository";
import { createNotificationService } from "../../../../features/notifications/notification-runtime";
import { ShipmentManagement } from "../../../../features/shipments/ShipmentManagement";
import {
  createPrismaShipmentRepository,
  createPrismaShipmentTransaction,
} from "../../../../features/shipments/prisma-shipment-repository";
import {
  createShipmentManagementErrorState,
  createShipmentManagementViewModel,
  executeShipmentManagementAction,
} from "../../../../features/shipments/view-model";

type ShipmentSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function StationShipmentsPage({
  searchParams,
}: Readonly<{
  searchParams?: ShipmentSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return (
    <ShipmentManagement
      saveShipmentAction={saveShipmentCommand}
      viewModel={viewModel}
    />
  );
}

async function saveShipmentCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const repository = createPrismaShipmentRepository();
  const result = await executeShipmentManagementAction({
    action: formValue(formData, "action"),
    actor: activeContext,
    orderId: formValue(formData, "orderId"),
    shipmentId: formValue(formData, "shipmentId"),
    repository,
    transaction: createPrismaShipmentTransaction(),
    notificationService: createNotificationService(),
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
    form: {
      action: formValue(formData, "action"),
      providerName: formValue(formData, "providerName"),
      providerTrackingId: formValue(formData, "providerTrackingId"),
      trackingUrl: formValue(formData, "trackingUrl"),
      status: formValue(formData, "status"),
      eventSource: formValue(formData, "eventSource"),
      providerStatus: formValue(formData, "providerStatus"),
      location: formValue(formData, "location"),
      notes: formValue(formData, "notes"),
    },
  });

  if (!result.ok) {
    redirect(buildShipmentManagementUrl({
      action: formValue(formData, "action"),
      error: result.issues.join("\n"),
      orderId: formValue(formData, "orderId"),
      shipmentId: formValue(formData, "shipmentId"),
    }));
  }

  redirect(buildShipmentManagementUrl({
    action: "update",
    orderId: result.shipment.semenOrderId,
    shipmentId: result.shipment.id ?? "",
    status: `${result.shipment.orderNumber} ${result.shipment.status.toLowerCase()}`,
  }));
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  try {
    const activeContext = await requireActiveContextActor("BREEDING_STATION");
    const orderRepository = createPrismaSemenOrderRepository();
    const shipmentRepository = createPrismaShipmentRepository();
    const orderId = firstSearchParam(searchParams.orderId);
    const shipmentId = firstSearchParam(searchParams.shipmentId);
    const action = firstSearchParam(searchParams.action);
    const error = firstSearchParam(searchParams.error);
    const status = firstSearchParam(searchParams.status);
    const orders = await orderRepository.listSemenOrders({
      breedingStationOrganizationId: activeContext.organizationId,
    });
    const order = orders.find((item) =>
      item.id === orderId ||
      item.orderNumber === orderId
    );

    if (!order) {
      throw new Error("Shipment workflow requires a station-visible order.");
    }

    const orderShipments = await shipmentRepository.listShipmentsForOrder(order.id ?? order.orderNumber);
    const shipment = shipmentId
      ? orderShipments.find((item) => item.id === shipmentId) ?? null
      : action === "update"
        ? orderShipments[0] ?? null
        : null;
    const trackingEvents = shipment?.id
      ? await shipmentRepository.listShipmentTrackingEvents(shipment.id)
      : [];

    return createShipmentManagementViewModel({
      actor: activeContext,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      order,
      shipment,
      trackingEvents,
      form: {
        action: shipment ? "update" : "create",
      },
      actionFeedback: error
        ? {
          tone: "danger",
          title: "Shipment action was blocked",
          message: error,
        }
        : status
          ? {
            tone: "success",
            title: "Shipment action recorded",
            message: status,
          }
          : undefined,
    });
  } catch (error) {
    return createShipmentManagementErrorState(error);
  }
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function buildShipmentManagementUrl(input: {
  action?: string;
  error?: string;
  orderId?: string;
  shipmentId?: string;
  status?: string;
}) {
  const params = new URLSearchParams();

  if (input.action) {
    params.set("action", input.action);
  }

  if (input.orderId) {
    params.set("orderId", input.orderId);
  }

  if (input.shipmentId) {
    params.set("shipmentId", input.shipmentId);
  }

  if (input.error) {
    params.set("error", input.error);
  }

  if (input.status) {
    params.set("status", input.status);
  }

  const query = params.toString();

  return query ? `/app/station/shipments?${query}` : "/app/station/shipments";
}
