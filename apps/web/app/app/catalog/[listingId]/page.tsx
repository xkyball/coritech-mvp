import { SemenCatalog } from "../../../../features/catalog/SemenCatalog";
import { semenCatalogDemoInput } from "../../../../features/catalog/demo-data";
import { getSemenCatalogDemoListingRecords } from "../../../../features/listing-management/demo-store";
import {
  createSemenCatalogDetailViewModel,
  createSemenCatalogErrorState,
} from "../../../../features/catalog/view-model";

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
    return createSemenCatalogDetailViewModel({
      ...semenCatalogDemoInput,
      listingRecords: await getSemenCatalogDemoListingRecords(),
      listingId,
    });
  } catch (error) {
    return createSemenCatalogErrorState(error);
  }
}
