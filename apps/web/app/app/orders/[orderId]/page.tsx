import { BreederOrderDetail } from "../../../../features/breeder-order-detail/BreederOrderDetail";
import {
  breederOrderDetailDemoDocuments,
  breederOrderDetailDemoProofEvents,
  breederOrderDetailDemoShipmentTrackingEvents,
  breederOrderDetailDemoShipments,
  breederOrderDetailDemoSupportEmail,
} from "../../../../features/breeder-order-detail/demo-data";
import {
  createBreederOrderDetailErrorState,
  createBreederOrderDetailViewModel,
} from "../../../../features/breeder-order-detail/view-model";
import { breederDashboardDemoInput } from "../../../../features/breeder-dashboard/demo-data";
import { getSemenOrderDemoRepository } from "../../../../features/order-creation/demo-store";

type OrderDetailParams = Promise<{ orderId: string }> | { orderId: string };

export default async function BreederOrderDetailPage({
  params,
}: Readonly<{
  params: OrderDetailParams;
}>) {
  const resolvedParams = await params;
  const viewModel = await createViewModel(resolvedParams.orderId);

  return <BreederOrderDetail viewModel={viewModel} />;
}

async function createViewModel(orderId: string) {
  try {
    const repository = getSemenOrderDemoRepository();
    const orders = await repository.listSemenOrders();
    const order = orders.find((item) =>
      item.id === orderId ||
      item.orderNumber === orderId
    );
    const statusHistory = order?.id
      ? await repository.listOrderStatusHistory(order.id)
      : await repository.listAllOrderStatusHistory();

    return createBreederOrderDetailViewModel({
      actor: breederDashboardDemoInput.actor,
      orderId,
      organizationId: breederDashboardDemoInput.organizationId,
      organizationName: breederDashboardDemoInput.organizationName,
      orders: order ? [order] : [],
      statusHistory,
      shipments: breederOrderDetailDemoShipments,
      shipmentTrackingEvents: breederOrderDetailDemoShipmentTrackingEvents,
      documents: [
        ...(breederDashboardDemoInput.documents ?? []),
        ...breederOrderDetailDemoDocuments,
      ],
      proofEvents: breederOrderDetailDemoProofEvents,
      supportEmail: breederOrderDetailDemoSupportEmail,
    });
  } catch (error) {
    return createBreederOrderDetailErrorState(error);
  }
}
