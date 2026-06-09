import { SemenOrderCreation } from "../../../../features/order-creation/SemenOrderCreation";
import { createSemenOrderCreationLoadingState } from "../../../../features/order-creation/view-model";

export default function NewSemenOrderLoading() {
  return (
    <SemenOrderCreation
      viewModel={createSemenOrderCreationLoadingState({ label: "semen order creation" })}
    />
  );
}
