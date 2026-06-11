import { SemenCatalog } from "../../../features/catalog/SemenCatalog";
import { requireActiveContextActor } from "../../../features/auth/active-context-server";
import {
  createSemenCatalogErrorState,
  createSemenCatalogViewModel,
} from "../../../features/catalog/view-model";
import { createPrismaSemenOrderRepository } from "../../../features/order-creation/prisma-semen-order-repository";

type CatalogSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function SemenCatalogPage({
  searchParams,
}: Readonly<{
  searchParams?: CatalogSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return <SemenCatalog viewModel={viewModel} />;
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  try {
    const activeContext = await requireActiveContextActor("BREEDER");
    const repository = createPrismaSemenOrderRepository();

    return createSemenCatalogViewModel({
      actor: activeContext,
      listingRecords: await repository.listActiveSemenListingRecords(),
      stationOrganizations: await repository.listStationOrganizations(),
      filters: {
        stallion: firstSearchParam(searchParams.stallion),
        breed: firstSearchParam(searchParams.breed),
        station: firstSearchParam(searchParams.station),
        availabilityStatus: firstSearchParam(searchParams.availabilityStatus),
      },
    });
  } catch (error) {
    return createSemenCatalogErrorState(error);
  }
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
