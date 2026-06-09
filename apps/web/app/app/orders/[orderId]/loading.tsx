import { BreederOrderDetail } from "../../../../features/breeder-order-detail/BreederOrderDetail";
import { createBreederOrderDetailLoadingState } from "../../../../features/breeder-order-detail/view-model";

export default function BreederOrderDetailLoading() {
  return (
    <BreederOrderDetail
      viewModel={createBreederOrderDetailLoadingState({ orderLabel: "order detail" })}
    />
  );
}
