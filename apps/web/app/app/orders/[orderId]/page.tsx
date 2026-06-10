import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { BreederOrderDetail } from "../../../../features/breeder-order-detail/BreederOrderDetail";
import {
  breederOrderDetailDemoSupportEmail,
} from "../../../../features/breeder-order-detail/demo-data";
import {
  createBreederOrderDetailErrorState,
  createBreederOrderDetailViewModel,
} from "../../../../features/breeder-order-detail/view-model";
import { createPrismaSemenOrderRepository } from "../../../../features/order-creation/prisma-semen-order-repository";
import {
  createPrismaShipmentRepository,
  createPrismaShipmentTransaction,
} from "../../../../features/shipments/prisma-shipment-repository";
import { createPrismaDocumentRepository } from "../../../../features/documents/prisma-document-repository";
import { confirmShipmentReceivedAction } from "../../../../features/shipments/view-model";

type OrderDetailParams = Promise<{ orderId: string }> | { orderId: string };

export default async function BreederOrderDetailPage({
  params,
}: Readonly<{
  params: OrderDetailParams;
}>) {
  const resolvedParams = await params;
  const viewModel = await createViewModel(resolvedParams.orderId);

  return (
    <BreederOrderDetail
      confirmReceivedAction={confirmReceivedCommand}
      viewModel={viewModel}
    />
  );
}

async function confirmReceivedCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDER");
  const repository = createPrismaShipmentRepository();
  const orderId = formValue(formData, "orderId");
  const shipmentId = formValue(formData, "shipmentId");
  const result = await confirmShipmentReceivedAction({
    actor: activeContext,
    repository,
    shipmentId,
    transaction: createPrismaShipmentTransaction(),
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
    notes: "Breeder confirmed shipment receipt.",
  });

  if (!result.ok) {
    redirect(`/app/orders/${encodeURIComponent(orderId)}`);
  }

  redirect(`/app/orders/${encodeURIComponent(orderId)}`);
}

async function createViewModel(orderId: string) {
  try {
    const activeContext = await requireActiveContextActor("BREEDER");
    const repository = createPrismaSemenOrderRepository();
    const shipmentRepository = createPrismaShipmentRepository();
    const documentRepository = createPrismaDocumentRepository();
    const orders = await repository.listSemenOrders({
      breederOrganizationId: activeContext.organizationId,
    });
    const order = orders.find((item) =>
      item.id === orderId ||
      item.orderNumber === orderId
    );
    const statusHistory = order?.id
      ? await repository.listOrderStatusHistory(order.id)
      : await repository.listAllOrderStatusHistory();
    const shipments = order?.id
      ? await shipmentRepository.listShipmentsForOrder(order.id)
      : [];
    const shipmentTrackingEvents = order?.id
      ? await shipmentRepository.listShipmentTrackingEventsForOrders([order.id])
      : [];
    const proofEvents = order?.id && repository.listProofEventsForOrder
      ? await repository.listProofEventsForOrder(order.id)
      : [];

    return createBreederOrderDetailViewModel({
      actor: activeContext,
      orderId,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      orders: order ? [order] : [],
      statusHistory,
      shipments,
      shipmentTrackingEvents,
      documents: order?.id ? await documentRepository.listDocumentsForOrder(order.id) : [],
      proofEvents,
      supportEmail: breederOrderDetailDemoSupportEmail,
    });
  } catch (error) {
    return createBreederOrderDetailErrorState(error);
  }
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}
