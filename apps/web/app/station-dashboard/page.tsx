import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../features/auth/active-context-server";
import { ActiveContextBar } from "../../features/auth/ActiveContextBar";
import { StationDashboard } from "../../features/station-dashboard/StationDashboard";
import {
  createStationDashboardErrorState,
  createStationDashboardViewModel,
} from "../../features/station-dashboard/view-model";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../features/auth/server-session";
import { createPrismaDocumentRepository } from "../../features/documents/prisma-document-repository";
import { createPrismaSemenOrderRepository } from "../../features/order-creation/prisma-semen-order-repository";
import { createPrismaShipmentRepository } from "../../features/shipments/prisma-shipment-repository";

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

  return (
    <>
      <ActiveContextBar requiredRoleCode="BREEDING_STATION" />
      <StationDashboard viewModel={viewModel} />
    </>
  );
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  try {
    const activeContext = await requireActiveContextActor("BREEDING_STATION");
    const documentRepository = createPrismaDocumentRepository();
    const repository = createPrismaSemenOrderRepository();
    const shipmentRepository = createPrismaShipmentRepository();
    const filters = {
      breedingStationOrganizationId: activeContext.organizationId,
    };
    const orders = await repository.listSemenOrders(filters);
    const orderIds = orders.flatMap((order) => order.id ? [order.id] : []);
    const proofEvents = (await Promise.all(
      orderIds.map((orderId) => repository.listProofEventsForOrder(orderId)),
    )).flat();

    return createStationDashboardViewModel({
      actor: activeContext,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      listingRecords: (await repository.listOrderableSemenListingRecords())
        .filter((record) =>
          record.listing.breedingStationOrganizationId === activeContext.organizationId
        ),
      orders,
      statusHistory: await repository.listAllOrderStatusHistory(filters),
      shipments: await shipmentRepository.listShipments(filters),
      shipmentTrackingEvents: await shipmentRepository.listShipmentTrackingEventsForOrders(orderIds),
      documents: await documentRepository.listDocumentsForOrders(orderIds),
      proofEvents,
      selectedOrderId: firstSearchParam(searchParams.orderId),
    });
  } catch (error) {
    return createStationDashboardErrorState(error);
  }
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
