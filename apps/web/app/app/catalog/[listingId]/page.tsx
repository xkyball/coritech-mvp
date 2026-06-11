import { SemenCatalog } from "../../../../features/catalog/SemenCatalog";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import {
  createSemenCatalogDetailViewModel,
  createSemenCatalogErrorState,
} from "../../../../features/catalog/view-model";
import { createPrismaSemenOrderRepository } from "../../../../features/order-creation/prisma-semen-order-repository";

type CatalogDetailParams = Promise<{ listingId: string }> | { listingId: string };

export default async function SemenCatalogDetailPage({
  params,
}: Readonly<{
  params: CatalogDetailParams;
}>) {
  const resolvedParams = await params;
  const viewModel = await createViewModel(resolvedParams.listingId);

  return <SemenCatalog viewModel={viewModel} />;
}

async function createViewModel(listingId: string) {
  try {
    const activeContext = await requireActiveContextActor("BREEDER");
    const repository = createPrismaSemenOrderRepository();

    return createSemenCatalogDetailViewModel({
      actor: activeContext,
      listingRecords: await repository.listActiveSemenListingRecords(),
      stationOrganizations: await repository.listStationOrganizations(),
      listingId,
    });
  } catch (error) {
    return createSemenCatalogErrorState(error);
  }
}
