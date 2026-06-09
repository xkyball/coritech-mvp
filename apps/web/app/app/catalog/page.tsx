import { SemenCatalog } from "../../../features/catalog/SemenCatalog";
import { semenCatalogDemoInput } from "../../../features/catalog/demo-data";
import {
  createSemenCatalogErrorState,
  createSemenCatalogViewModel,
} from "../../../features/catalog/view-model";

type CatalogSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function SemenCatalogPage({
  searchParams,
}: Readonly<{
  searchParams?: CatalogSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = createViewModel(resolvedSearchParams ?? {});

  return <SemenCatalog viewModel={viewModel} />;
}

function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  try {
    return createSemenCatalogViewModel({
      ...semenCatalogDemoInput,
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
