import type {
  ConfirmShipmentReceivedActionInput,
  ExecuteShipmentManagementActionInput,
  ExecuteShipmentManagementActionResult,
  ShipmentManagementErrorViewModel,
  ShipmentManagementInput,
  ShipmentManagementViewModel,
} from "./shipment-management.d.ts";

import {
  confirmShipmentReceivedAction as confirmReceipt,
  createShipmentManagementErrorState as createErrorState,
  createShipmentManagementViewModel as createViewModel,
  executeShipmentManagementAction as executeAction,
} from "./shipment-management.mjs";

export function createShipmentManagementViewModel(
  input: ShipmentManagementInput,
): ShipmentManagementViewModel {
  return createViewModel(input);
}

export function createShipmentManagementErrorState(
  error: unknown,
): ShipmentManagementErrorViewModel {
  return createErrorState(error);
}

export function executeShipmentManagementAction(
  input: ExecuteShipmentManagementActionInput,
): Promise<ExecuteShipmentManagementActionResult> {
  return executeAction(input);
}

export function confirmShipmentReceivedAction(
  input: ConfirmShipmentReceivedActionInput,
): Promise<ExecuteShipmentManagementActionResult> {
  return confirmReceipt(input);
}
