import { SemenCatalog } from "../../../../features/catalog/SemenCatalog";
import { semenCatalogDemoInput } from "../../../../features/catalog/demo-data";
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
  const viewModel = createViewModel(resolvedParams.listingId);

  return <SemenCatalog viewModel={viewModel} />;
}

function createViewModel(listingId: string) {
  try {
    return createSemenCatalogDetailViewModel({
      ...semenCatalogDemoInput,
      listingId,
    });
  } catch (error) {
    return createSemenCatalogErrorState(error);
  }
}
