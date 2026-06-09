import type {
  StationDashboardErrorViewModel,
  StationDashboardInput,
  StationDashboardLoadingViewModel,
  StationDashboardViewModel,
} from "./station-dashboard.d.ts";

import {
  createStationDashboardErrorState as createErrorState,
  createStationDashboardLoadingState as createLoadingState,
  createStationDashboardViewModel as createViewModel,
} from "./station-dashboard.mjs";

export function createStationDashboardViewModel(
  input: StationDashboardInput,
): StationDashboardViewModel {
  return createViewModel(input);
}

export function createStationDashboardLoadingState(
  input?: { organizationName?: string | null },
): StationDashboardLoadingViewModel {
  return createLoadingState(input);
}

export function createStationDashboardErrorState(
  error: unknown,
): StationDashboardErrorViewModel {
  return createErrorState(error);
}
