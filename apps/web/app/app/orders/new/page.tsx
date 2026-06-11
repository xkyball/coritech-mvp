import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { SemenOrderCreation } from "../../../../features/order-creation/SemenOrderCreation";
import {
  createSemenOrderCreationConfirmationViewModel,
  createSemenOrderCreationErrorState,
  createSemenOrderCreationViewModel,
  createSemenOrderFromForm,
} from "../../../../features/order-creation/view-model";
import {
  createPrismaSemenOrderRepository,
  createPrismaSemenOrderTransaction,
} from "../../../../features/order-creation/prisma-semen-order-repository";
import { createNotificationService } from "../../../../features/notifications/notification-runtime";

type NewOrderSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function NewSemenOrderPage({
  searchParams,
}: Readonly<{
  searchParams?: NewOrderSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return (
    <SemenOrderCreation
      cancelDraftAction={cancelDraftOrder}
      createDraftAction={createDraftOrder}
      submitOrderAction={submitOrder}
      viewModel={viewModel}
    />
  );
}

async function createDraftOrder(formData: FormData) {
  "use server";

  await handleOrderAction("draft", formData);
}

async function submitOrder(formData: FormData) {
  "use server";

  await handleOrderAction("submit", formData);
}

async function cancelDraftOrder(formData: FormData) {
  "use server";

  await handleOrderAction("cancel", formData);
}

async function handleOrderAction(action: "draft" | "submit" | "cancel", formData: FormData) {
  const form = formDataToOrderCreationForm(formData);
  const activeContext = await requireActiveContextActor("BREEDER");
  const repository = createPrismaSemenOrderRepository();
  const result = await createSemenOrderFromForm({
    action,
    actor: activeContext,
    breederOrganizationId: activeContext.organizationId,
    repository,
    transaction: createPrismaSemenOrderTransaction(),
    notificationService: createNotificationService(),
    form,
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
  });

  if (!result.ok) {
    redirect(buildNewOrderUrl({
      draftOrderId: form.orderId,
      error: result.issues.join("\n"),
      semenListingId: form.semenListingId,
    }));
  }

  redirect(buildNewOrderUrl({
    confirmationOrderId: result.order.id ?? undefined,
    semenListingId: result.order.semenListingId,
  }));
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  const confirmationOrderId = firstSearchParam(searchParams.confirmationOrderId);
  const draftOrderId = firstSearchParam(searchParams.draftOrderId);

  try {
    const activeContext = await requireActiveContextActor("BREEDER");
    const repository = createPrismaSemenOrderRepository();

    if (confirmationOrderId) {
      const order = await repository.findSemenOrderById(confirmationOrderId);

      if (!order) {
        throw new Error(`Semen order was not found: ${confirmationOrderId}`);
      }

      if (order.breederOrganizationId !== activeContext.organizationId) {
        throw new Error("Only the owning breeder organization can view this order confirmation.");
      }

      return createSemenOrderCreationConfirmationViewModel({
        order,
        statusHistory: await repository.listOrderStatusHistory(confirmationOrderId),
      });
    }

    const draftOrder = draftOrderId
      ? await repository.findSemenOrderById(draftOrderId)
      : null;

    if (draftOrderId && !draftOrder) {
      throw new Error(`Semen order draft was not found: ${draftOrderId}`);
    }

    return createSemenOrderCreationViewModel({
      actor: activeContext,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      draftOrder,
      selectedListingId: firstSearchParam(searchParams.semenListingId),
      listingRecords: await repository.listOrderableSemenListingRecords(),
      stationOrganizations: await repository.listStationOrganizations(),
      validationIssues: parseErrorParam(firstSearchParam(searchParams.error)),
    });
  } catch (error) {
    return createSemenOrderCreationErrorState(error);
  }
}

function formDataToOrderCreationForm(formData: FormData) {
  return {
    orderId: formValue(formData, "orderId"),
    semenListingId: formValue(formData, "semenListingId"),
    requestedDeliveryDate: formValue(formData, "requestedDeliveryDate"),
    mareName: formValue(formData, "mareName"),
    mareRegistrationReference: formValue(formData, "mareRegistrationReference"),
    mareBreed: formValue(formData, "mareBreed"),
    mareOwnerName: formValue(formData, "mareOwnerName"),
    intendedInseminationContext: formValue(formData, "intendedInseminationContext"),
    vetOrRecipientContact: formValue(formData, "vetOrRecipientContact"),
    shippingContactName: formValue(formData, "shippingContactName"),
    shippingContactPhone: formValue(formData, "shippingContactPhone"),
    shippingAddressLine1: formValue(formData, "shippingAddressLine1"),
    shippingAddressLine2: formValue(formData, "shippingAddressLine2"),
    shippingCity: formValue(formData, "shippingCity"),
    shippingRegion: formValue(formData, "shippingRegion"),
    shippingPostalCode: formValue(formData, "shippingPostalCode"),
    shippingCountry: formValue(formData, "shippingCountry"),
    specialInstructions: formValue(formData, "specialInstructions"),
    cancellationReason: formValue(formData, "cancellationReason"),
  };
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function buildNewOrderUrl(input: {
  confirmationOrderId?: string;
  draftOrderId?: string;
  error?: string;
  semenListingId?: string;
}) {
  const params = new URLSearchParams();

  if (input.semenListingId) {
    params.set("semenListingId", input.semenListingId);
  }

  if (input.confirmationOrderId) {
    params.set("confirmationOrderId", input.confirmationOrderId);
  }

  if (input.draftOrderId && !input.confirmationOrderId) {
    params.set("draftOrderId", input.draftOrderId);
  }

  if (input.error) {
    params.set("error", input.error);
  }

  const query = params.toString();

  return query ? `/app/orders/new?${query}` : "/app/orders/new";
}

function parseErrorParam(value: string | undefined) {
  return value ? value.split("\n").filter(Boolean) : [];
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
