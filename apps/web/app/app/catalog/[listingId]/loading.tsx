import { SemenCatalog } from "../../../../features/catalog/SemenCatalog";
import { createSemenCatalogLoadingState } from "../../../../features/catalog/view-model";

export default function SemenCatalogDetailLoading() {
  return (
    <SemenCatalog
      viewModel={createSemenCatalogLoadingState({
        label: "listing detail",
      })}
    />
  );
}
