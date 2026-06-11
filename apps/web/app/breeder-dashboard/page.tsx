import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { requireActiveContextActor } from "../../features/auth/active-context-server";
import { ActiveContextBar } from "../../features/auth/ActiveContextBar";
import { BreederDashboard } from "../../features/breeder-dashboard/BreederDashboard";
import {
  createBreederDashboardErrorState,
  createBreederDashboardViewModel,
} from "../../features/breeder-dashboard/view-model";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../features/auth/server-session";
import { createPrismaDocumentRepository } from "../../features/documents/prisma-document-repository";
import { createPrismaSemenOrderRepository } from "../../features/order-creation/prisma-semen-order-repository";

export const dynamic = "force-dynamic";

export default async function BreederDashboardPage() {
  if (!await readManagedAuthSessionFromCookieHeader((await headers()).get("cookie"))) {
    redirect(`${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent("/breeder-dashboard")}`);
  }

  const viewModel = await createViewModel();

  return (
    <>
      <ActiveContextBar requiredRoleCode="BREEDER" />
      <BreederDashboard viewModel={viewModel} />
    </>
  );
}

async function createViewModel() {
  try {
    const activeContext = await requireActiveContextActor("BREEDER");
    const repository = createPrismaSemenOrderRepository();
    const documentRepository = createPrismaDocumentRepository();
    const filters = {
      breederOrganizationId: activeContext.organizationId,
    };
    const orders = await repository.listSemenOrders(filters);
    const orderIds = orders.flatMap((order) => order.id ? [order.id] : []);

    return createBreederDashboardViewModel({
      actor: activeContext,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      listingRecords: await repository.listOrderableSemenListingRecords(),
      orders,
      statusHistory: await repository.listAllOrderStatusHistory(filters),
      documents: await documentRepository.listDocumentsForOrders(orderIds),
    });
  } catch (error) {
    return createBreederDashboardErrorState(error);
  }
}
