import type {
  BreederDashboardInput,
  BreederDashboardViewModel,
} from "./breeder-dashboard.d.ts";

// The original dashboard logic remains in the migrated framework-neutral module.
// @ts-expect-error The sibling declaration is named for the historical module.
import { createBreederDashboardViewModel as createViewModel } from "./breeder-dashboard.mjs";

export function createBreederDashboardViewModel(
  input: BreederDashboardInput,
): BreederDashboardViewModel {
  return createViewModel(input);
}
