import type { BreederDashboardInput } from "../breeder-dashboard/breeder-dashboard.d.ts";
import type { InMemorySemenOrderRepository } from "./semen-order-creation.d.ts";

import { breederDashboardDemoInput } from "../breeder-dashboard/demo-data";
import { semenCatalogDemoInput } from "../catalog/demo-data";
import { stationDashboardDemoInput } from "../station-dashboard/demo-data";
import { createInMemorySemenOrderRepository } from "./view-model";

const demoRepository = createInMemorySemenOrderRepository({
  listingRecords: semenCatalogDemoInput.listingRecords,
  orders: stationDashboardDemoInput.orders,
  statusHistory: stationDashboardDemoInput.statusHistory,
  orderNumberSequenceStart: 100,
});

export function getSemenOrderDemoRepository(): InMemorySemenOrderRepository {
  return demoRepository;
}

export async function getBreederDashboardDemoInput(): Promise<BreederDashboardInput> {
  return {
    ...breederDashboardDemoInput,
    orders: await demoRepository.listSemenOrders(),
    statusHistory: await demoRepository.listAllOrderStatusHistory(),
  };
}
