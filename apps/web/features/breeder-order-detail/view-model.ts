import type {
  BreederOrderDetailErrorViewModel,
  BreederOrderDetailInput,
  BreederOrderDetailLoadingViewModel,
  BreederOrderDetailViewModel,
} from "./breeder-order-detail.d.ts";

import {
  createBreederOrderDetailErrorState as createErrorState,
  createBreederOrderDetailLoadingState as createLoadingState,
  createBreederOrderDetailViewModel as createViewModel,
} from "./breeder-order-detail.mjs";

export function createBreederOrderDetailViewModel(
  input: BreederOrderDetailInput,
): BreederOrderDetailViewModel {
  return createViewModel(input);
}

export function createBreederOrderDetailLoadingState(
  input?: { orderLabel?: string | null },
): BreederOrderDetailLoadingViewModel {
  return createLoadingState(input);
}

export function createBreederOrderDetailErrorState(
  error: unknown,
): BreederOrderDetailErrorViewModel {
  return createErrorState(error);
}
