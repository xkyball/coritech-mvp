import type {
  CreateSemenOrderFromFormInput,
  CreateSemenOrderFromFormResult,
  InMemorySemenOrderRepository,
  InMemorySemenOrderRepositoryInput,
  SemenOrderCreationConfirmationInput,
  SemenOrderCreationConfirmationViewModel,
  SemenOrderCreationErrorViewModel,
  SemenOrderCreationFormViewModel,
  SemenOrderCreationInput,
  SemenOrderCreationLoadingViewModel,
} from "./semen-order-creation.d.ts";

import {
  createInMemorySemenOrderRepository as createRepository,
  createSemenOrderCreationConfirmationViewModel as createConfirmationViewModel,
  createSemenOrderCreationErrorState as createErrorState,
  createSemenOrderCreationLoadingState as createLoadingState,
  createSemenOrderCreationViewModel as createFormViewModel,
  createSemenOrderFromForm as createFromForm,
} from "./semen-order-creation.mjs";

export function createSemenOrderCreationViewModel(
  input: SemenOrderCreationInput,
): SemenOrderCreationFormViewModel {
  return createFormViewModel(input);
}

export function createSemenOrderCreationConfirmationViewModel(
  input: SemenOrderCreationConfirmationInput,
): SemenOrderCreationConfirmationViewModel {
  return createConfirmationViewModel(input);
}

export function createSemenOrderCreationLoadingState(
  input?: { label?: string | null },
): SemenOrderCreationLoadingViewModel {
  return createLoadingState(input);
}

export function createSemenOrderCreationErrorState(
  error: unknown,
): SemenOrderCreationErrorViewModel {
  return createErrorState(error);
}

export function createSemenOrderFromForm(
  input: CreateSemenOrderFromFormInput,
): Promise<CreateSemenOrderFromFormResult> {
  return createFromForm(input);
}

export function createInMemorySemenOrderRepository(
  input: InMemorySemenOrderRepositoryInput,
): InMemorySemenOrderRepository {
  return createRepository(input);
}
