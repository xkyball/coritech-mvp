import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { createPrismaOrderActivityRepository } from "../../../../features/order-activity/prisma-order-activity-repository";
import { addSharedOrderComment } from "../../../../features/order-activity/view-model";
import { createPrismaSupportRequestRepository } from "../../../../features/support-requests/prisma-support-request-repository";
import { submitSupportRequest } from "../../../../features/support-requests/view-model";
import {
  createPrismaSemenOrderRepository,
  createPrismaSemenOrderTransaction,
} from "../../../../features/order-creation/prisma-semen-order-repository";
import { createNotificationService } from "../../../../features/notifications/notification-runtime";
import { createPrismaDocumentRepository } from "../../../../features/documents/prisma-document-repository";
import { createPrismaShipmentRepository } from "../../../../features/shipments/prisma-shipment-repository";
import { saveManualPaymentReference } from "../../../../features/payment-references/payment-reference-actions";
import { createPrismaPaymentReferenceRepository } from "../../../../features/payment-references/prisma-payment-reference-repository";
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
      addCommentAction={addStationOrderCommentCommand}
      executeAction={executeStationOrderCommand}
      paymentReferenceAction={saveStationPaymentReferenceCommand}
      supportRequestAction={submitStationSupportRequestCommand}
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
    notificationService: createNotificationService(),
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

async function saveStationPaymentReferenceCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const orderRepository = createPrismaSemenOrderRepository();
  const paymentReferenceRepository = createPrismaPaymentReferenceRepository();
  const orderId = formValue(formData, "orderId");
  const result = await saveManualPaymentReference({
    actor: activeContext,
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
    formData,
    orderRepository,
    paymentReferenceRepository,
  });

  if (!result.ok) {
    redirect(buildStationOrdersUrl({
      error: result.issues.join("\n"),
      orderId: orderId || result.orderId,
    }));
  }

  redirect(buildStationOrdersUrl({
    orderId: result.order.id ?? result.order.orderNumber,
    status: "Payment reference saved",
  }));
}

async function addStationOrderCommentCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const orderRepository = createPrismaSemenOrderRepository();
  const activityRepository = createPrismaOrderActivityRepository();
  const orderId = formValue(formData, "orderId");
  const orders = await orderRepository.listSemenOrders({
    breedingStationOrganizationId: activeContext.organizationId,
  });
  const order = orders.find((item) =>
    item.id === orderId ||
    item.orderNumber === orderId
  );

  if (order) {
    const result = await addSharedOrderComment({
      actor: activeContext,
      order,
      repository: activityRepository,
      message: formValue(formData, "message"),
    });

    if (!result.ok) {
      redirect(buildStationOrdersUrl({
        error: result.issues.join("\n"),
        orderId,
      }));
    }
  }

  redirect(buildStationOrdersUrl({
    orderId,
    status: "Comment added",
  }));
}

async function submitStationSupportRequestCommand(formData: FormData) {
  "use server";

  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const orderRepository = createPrismaSemenOrderRepository();
  const supportRepository = createPrismaSupportRequestRepository();
  const orderId = formValue(formData, "orderId");
  const orders = await orderRepository.listSemenOrders({
    breedingStationOrganizationId: activeContext.organizationId,
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
      redirect(buildStationOrdersUrl({
        error: result.issues.join("\n"),
        orderId,
      }));
    }
  }

  redirect(buildStationOrdersUrl({
    orderId,
    status: "Support request queued",
  }));
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const activityRepository = createPrismaOrderActivityRepository();
  const documentRepository = createPrismaDocumentRepository();
  const repository = createPrismaSemenOrderRepository();
  const shipmentRepository = createPrismaShipmentRepository();
  const paymentReferenceRepository = createPrismaPaymentReferenceRepository();
  const filters = {
    breedingStationOrganizationId: activeContext.organizationId,
  };
  const orders = await repository.listSemenOrders(filters);
  const orderIds = orders.flatMap((order) => order.id ? [order.id] : []);
  const proofEvents = (await Promise.all(
    orderIds.map((orderId) => repository.listProofEventsForOrder(orderId)),
  )).flat();
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
    documents: await documentRepository.listDocumentsForOrders(orderIds),
    proofEvents,
    orderActivities: await activityRepository.listOrderActivitiesForOrders(orderIds),
    paymentReferences: await paymentReferenceRepository.listLatestPaymentReferencesForOrders(orderIds),
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
