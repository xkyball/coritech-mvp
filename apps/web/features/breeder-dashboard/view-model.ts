import type {
  BreederDashboardInput,
  BreederDashboardErrorViewModel,
  BreederDashboardLoadingViewModel,
  BreederDashboardViewModel,
} from "./breeder-dashboard.d.ts";

import {
  createBreederDashboardErrorState as createErrorState,
  createBreederDashboardLoadingState as createLoadingState,
  createBreederDashboardViewModel as createViewModel,
} from "./breeder-dashboard.mjs";

export function createBreederDashboardViewModel(
  input: BreederDashboardInput,
): BreederDashboardViewModel {
  return createViewModel(input);
}

export function createBreederDashboardLoadingState(
  input?: { organizationName?: string | null },
): BreederDashboardLoadingViewModel {
  return createLoadingState(input);
}

export function createBreederDashboardErrorState(
  error: unknown,
): BreederDashboardErrorViewModel {
  return createErrorState(error);
}
