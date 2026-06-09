import { SemenCatalog } from "../../../features/catalog/SemenCatalog";
import { createSemenCatalogLoadingState } from "../../../features/catalog/view-model";

export default function SemenCatalogLoading() {
  return (
    <SemenCatalog
      viewModel={createSemenCatalogLoadingState({
        label: "semen catalog",
      })}
    />
  );
}
