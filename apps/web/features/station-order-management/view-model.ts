import type {
  StationOrderActionInput,
  StationOrderActionResult,
  StationOrderManagementInput,
  StationOrderManagementViewModel,
} from "./station-order-management.d.ts";

import {
  createStationOrderManagementViewModel as createViewModel,
  executeStationOrderAction as executeAction,
} from "./station-order-management.mjs";

export function createStationOrderManagementViewModel(
  input: StationOrderManagementInput,
): StationOrderManagementViewModel {
  return createViewModel(input);
}

export function executeStationOrderAction(
  input: StationOrderActionInput,
): Promise<StationOrderActionResult> {
  return executeAction(input);
}
