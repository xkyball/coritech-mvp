import type {
  InMemoryListingManagementRepository,
  InMemoryListingManagementRepositoryInput,
  ListingManagementConfirmationInput,
  ListingManagementConfirmationViewModel,
  ListingManagementErrorViewModel,
  ListingManagementFormViewModel,
  ListingManagementInput,
  ListingManagementLoadingViewModel,
  SaveSemenListingFromFormInput,
  SaveSemenListingFromFormResult,
} from "./listing-management.d.ts";

import {
  createInMemoryListingManagementRepository as createRepository,
  createListingManagementConfirmationViewModel as createConfirmationViewModel,
  createListingManagementErrorState as createErrorState,
  createListingManagementLoadingState as createLoadingState,
  createListingManagementViewModel as createFormViewModel,
  saveSemenListingFromForm as saveFromForm,
} from "./listing-management.mjs";

export function createListingManagementViewModel(
  input: ListingManagementInput,
): ListingManagementFormViewModel {
  return createFormViewModel(input);
}

export function createListingManagementConfirmationViewModel(
  input: ListingManagementConfirmationInput,
): ListingManagementConfirmationViewModel {
  return createConfirmationViewModel(input);
}

export function createListingManagementLoadingState(
  input?: { organizationName?: string | null },
): ListingManagementLoadingViewModel {
  return createLoadingState(input);
}

export function createListingManagementErrorState(
  error: unknown,
): ListingManagementErrorViewModel {
  return createErrorState(error);
}

export function saveSemenListingFromForm(
  input: SaveSemenListingFromFormInput,
): Promise<SaveSemenListingFromFormResult> {
  return saveFromForm(input);
}

export function createInMemoryListingManagementRepository(
  input: InMemoryListingManagementRepositoryInput,
): InMemoryListingManagementRepository {
  return createRepository(input);
}
