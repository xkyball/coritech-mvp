import type { StationDashboardInput } from "./station-dashboard.d.ts";

import {
  breederOrderDetailDemoDocuments,
  breederOrderDetailDemoShipmentTrackingEvents,
  breederOrderDetailDemoShipments,
} from "../breeder-order-detail/demo-data";
import { breederDashboardDemoInput } from "../breeder-dashboard/demo-data";
import { semenCatalogDemoInput } from "../catalog/demo-data";

const stationOrganizationId = "00000000-0000-4000-8000-000000000003";
const otherStationOrganizationId = "00000000-0000-4000-8000-000000000004";
const breederOrganizationId = "00000000-0000-4000-8000-000000000002";
const stationUserId = "00000000-0000-4000-8000-000000000103";
const timestamp = "2026-06-09T09:00:00.000Z";
const submittedAt = "2026-06-09T09:40:00.000Z";
const receivedAt = "2026-06-09T10:10:00.000Z";
const confirmedAt = "2026-06-09T11:05:00.000Z";

const submittedOrder = {
  id: "00000000-0000-4000-8000-000000000404",
  orderNumber: "SO-20260609-000004",
  semenListingId: "00000000-0000-4000-8000-000000000302",
  breederOrganizationId,
  breedingStationOrganizationId: stationOrganizationId,
  status: "SUBMITTED" as const,
  requestedDeliveryDate: "2026-06-11",
  shippingContactName: "Avery Stone",
  shippingContactPhone: "+27 21 555 0100",
  shippingAddressLine1: "42 Blue Oak Road",
  shippingAddressLine2: "Stable office",
  shippingCity: "Cape Town",
  shippingRegion: "Western Cape",
  shippingPostalCode: "8001",
  shippingCountry: "South Africa",
  specialInstructions: "Station review requested before collection.",
  createdByUserId: "00000000-0000-4000-8000-000000000102",
  updatedByUserId: "00000000-0000-4000-8000-000000000102",
  createdAt: timestamp,
  updatedAt: submittedAt,
};

const receivedOrder = {
  ...submittedOrder,
  id: "00000000-0000-4000-8000-000000000405",
  orderNumber: "SO-20260609-000005",
  status: "RECEIVED" as const,
  specialInstructions: "Please confirm availability for morning dispatch.",
  updatedByUserId: stationUserId,
  updatedAt: receivedAt,
};

const confirmedOrderWithoutShipment = {
  ...submittedOrder,
  id: "00000000-0000-4000-8000-000000000406",
  orderNumber: "SO-20260609-000006",
  status: "CONFIRMED" as const,
  specialInstructions: "Shipment can be created after station packing.",
  updatedByUserId: stationUserId,
  updatedAt: confirmedAt,
};

const otherStationOrder = {
  ...submittedOrder,
  id: "00000000-0000-4000-8000-000000000407",
  orderNumber: "SO-20260609-000007",
  breedingStationOrganizationId: otherStationOrganizationId,
};

const stationStatusHistory = [
  {
    id: "history-submitted-dashboard",
    semenOrderId: submittedOrder.id,
    orderNumber: submittedOrder.orderNumber,
    fromStatus: "DRAFT" as const,
    toStatus: "SUBMITTED" as const,
    actorUserId: "00000000-0000-4000-8000-000000000102",
    actorRoleCode: "BREEDER" as const,
    actorOrganizationId: breederOrganizationId,
    reason: "Submitted to station.",
    changedAt: submittedAt,
  },
  {
    id: "history-received-dashboard",
    semenOrderId: receivedOrder.id,
    orderNumber: receivedOrder.orderNumber,
    fromStatus: "SUBMITTED" as const,
    toStatus: "RECEIVED" as const,
    actorUserId: stationUserId,
    actorRoleCode: "BREEDING_STATION" as const,
    actorOrganizationId: stationOrganizationId,
    reason: "Station intake recorded.",
    changedAt: receivedAt,
  },
  {
    id: "history-confirmed-dashboard",
    semenOrderId: confirmedOrderWithoutShipment.id,
    orderNumber: confirmedOrderWithoutShipment.orderNumber,
    fromStatus: "RECEIVED" as const,
    toStatus: "CONFIRMED" as const,
    actorUserId: stationUserId,
    actorRoleCode: "BREEDING_STATION" as const,
    actorOrganizationId: stationOrganizationId,
    reason: "Station confirmed availability.",
    changedAt: confirmedAt,
  },
  {
    id: "history-other-station-dashboard",
    semenOrderId: otherStationOrder.id,
    orderNumber: otherStationOrder.orderNumber,
    fromStatus: "DRAFT" as const,
    toStatus: "SUBMITTED" as const,
    actorUserId: "00000000-0000-4000-8000-000000000102",
    actorRoleCode: "BREEDER" as const,
    actorOrganizationId: breederOrganizationId,
    reason: "Other station order.",
    changedAt: submittedAt,
  },
];

export const stationDashboardDemoInput: StationDashboardInput = {
  actor: {
    userId: stationUserId,
    roles: [
      {
        userId: stationUserId,
        organizationId: stationOrganizationId,
        roleCode: "BREEDING_STATION",
        revokedAt: null,
      },
    ],
  },
  organizationId: stationOrganizationId,
  organizationName: "CoriTech Equine Station",
  listingRecords: semenCatalogDemoInput.listingRecords,
  orders: [
    ...(breederDashboardDemoInput.orders ?? []),
    submittedOrder,
    receivedOrder,
    confirmedOrderWithoutShipment,
    otherStationOrder,
  ],
  statusHistory: [
    ...(breederDashboardDemoInput.statusHistory ?? []),
    ...stationStatusHistory,
  ],
  shipments: breederOrderDetailDemoShipments,
  shipmentTrackingEvents: breederOrderDetailDemoShipmentTrackingEvents,
  documents: [
    ...(breederDashboardDemoInput.documents ?? []),
    ...breederOrderDetailDemoDocuments,
  ],
};
