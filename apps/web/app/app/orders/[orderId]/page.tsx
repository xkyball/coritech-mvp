import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { createOrderService } from "@coritech/domain/orders/semen-order.mjs";
import { BreederOrderDetail } from "../../../../features/breeder-order-detail/BreederOrderDetail";
import {
  createBreederOrderDetailErrorState,
  createBreederOrderDetailViewModel,
} from "../../../../features/breeder-order-detail/view-model";
import {
  createPrismaSemenOrderRepository,
  createPrismaSemenOrderTransaction,
} from "../../../../features/order-creation/prisma-semen-order-repository";
import { createPrismaOrderActivityRepository } from "../../../../features/order-activity/prisma-order-activity-repository";
import { addSharedOrderComment } from "../../../../features/order-activity/view-model";
import { createPrismaSupportRequestRepository } from "../../../../features/support-requests/prisma-support-request-repository";
import { submitSupportRequest } from "../../../../features/support-requests/view-model";
import {
  createPrismaShipmentRepository,
  createPrismaShipmentTransaction,
} from "../../../../features/shipments/prisma-shipment-repository";
import { createPrismaDocumentRepository } from "../../../../features/documents/prisma-document-repository";
import { confirmShipmentReceivedAction } from "../../../../features/shipments/view-model";
import { createPrismaPaymentReferenceRepository } from "../../../../features/payment-references/prisma-payment-reference-repository";

type OrderDetailParams = Promise<{ orderId: string }> | { orderId: string };
type OrderDetailSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function BreederOrderDetailPage({
  params,
  searchParams,
}: Readonly<{
  params: OrderDetailParams;
  searchParams?: OrderDetailSearchParams;
}>) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel({
    orderId: resolvedParams.orderId,
    supportConfirmation: firstSearchParam(resolvedSearchParams?.support) === "created"
      ? "Your request is in the Platform Admin support queue."
      : null,
  });

  return (
    <BreederOrderDetail
      addCommentAction={addBreederOrderCommentCommand}
      cancelOrderAction={cancelOrderCommand}
      confirmReceivedAction={confirmReceivedCommand}
      supportRequestAction={submitBreederSupportRequestCommand}
      viewModel={viewModel}
    />
  );
}

async function cancelOrderCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDER");
  const repository = createPrismaSemenOrderRepository();
  const service = createOrderService({
    repository,
    transaction: createPrismaSemenOrderTransaction(),
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
  });
  const orderId = formValue(formData, "orderId");

  await service.cancelOrder({
    actor: activeContext,
    orderId,
    body: {
      reason: formValue(formData, "reason"),
    },
  });

  redirect(`/app/orders/${encodeURIComponent(orderId)}`);
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

async function addBreederOrderCommentCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDER");
  const orderRepository = createPrismaSemenOrderRepository();
  const activityRepository = createPrismaOrderActivityRepository();
  const orderId = formValue(formData, "orderId");
  const orders = await orderRepository.listSemenOrders({
    breederOrganizationId: activeContext.organizationId,
  });
  const order = orders.find((item) =>
    item.id === orderId ||
    item.orderNumber === orderId
  );

  if (order) {
    await addSharedOrderComment({
      actor: activeContext,
      order,
      repository: activityRepository,
      message: formValue(formData, "message"),
    });
  }

  redirect(`/app/orders/${encodeURIComponent(orderId)}`);
}

async function submitBreederSupportRequestCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDER");
  const orderRepository = createPrismaSemenOrderRepository();
  const supportRepository = createPrismaSupportRequestRepository();
  const orderId = formValue(formData, "orderId");
  const orders = await orderRepository.listSemenOrders({
    breederOrganizationId: activeContext.organizationId,
  });
  const order = orders.find((item) =>
    item.id === orderId ||
    item.orderNumber === orderId
  );

  if (order) {
    const result = await submitSupportRequest({
      actor: activeContext,
      category: formValue(formData, "category"),
      message: formValue(formData, "message"),
      order,
      repository: supportRepository,
    });

    if (!result.ok) {
      redirect(`/app/orders/${encodeURIComponent(orderId)}`);
    }
  }

  redirect(`/app/orders/${encodeURIComponent(orderId)}?support=created`);
}

async function createViewModel(input: {
  orderId: string;
  supportConfirmation?: string | null;
}) {
  try {
    const activeContext = await requireActiveContextActor("BREEDER");
    const repository = createPrismaSemenOrderRepository();
    const activityRepository = createPrismaOrderActivityRepository();
    const shipmentRepository = createPrismaShipmentRepository();
    const documentRepository = createPrismaDocumentRepository();
    const paymentReferenceRepository = createPrismaPaymentReferenceRepository();
    const orders = await repository.listSemenOrders({
      breederOrganizationId: activeContext.organizationId,
    });
    const order = orders.find((item) =>
      item.id === input.orderId ||
      item.orderNumber === input.orderId
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
    const orderActivities = order?.id
      ? await activityRepository.listOrderActivitiesForOrder(order.id)
      : [];

    return createBreederOrderDetailViewModel({
      actor: activeContext,
      orderId: input.orderId,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      orders: order ? [order] : [],
      statusHistory,
      shipments,
      shipmentTrackingEvents,
      documents: order?.id ? await documentRepository.listDocumentsForOrder(order.id) : [],
      proofEvents,
      orderActivities,
      paymentReference: order?.id
        ? await paymentReferenceRepository.findLatestPaymentReferenceForOrder(order.id)
        : null,
      supportConfirmation: input.supportConfirmation,
    });
  } catch (error) {
    return createBreederOrderDetailErrorState(error);
  }
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}
