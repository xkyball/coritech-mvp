import type {
  SemenCatalogDetailInput,
  SemenCatalogDetailViewModel,
  SemenCatalogErrorViewModel,
  SemenCatalogInput,
  SemenCatalogListViewModel,
  SemenCatalogLoadingViewModel,
} from "./semen-catalog.d.ts";

import {
  createSemenCatalogDetailViewModel as createDetailViewModel,
  createSemenCatalogErrorState as createErrorState,
  createSemenCatalogLoadingState as createLoadingState,
  createSemenCatalogViewModel as createListViewModel,
} from "./semen-catalog.mjs";

export function createSemenCatalogViewModel(
  input: SemenCatalogInput,
): SemenCatalogListViewModel {
  return createListViewModel(input);
}

export function createSemenCatalogDetailViewModel(
  input: SemenCatalogDetailInput,
): SemenCatalogDetailViewModel {
  return createDetailViewModel(input);
}

export function createSemenCatalogLoadingState(
  input?: { label?: string | null },
): SemenCatalogLoadingViewModel {
  return createLoadingState(input);
}

export function createSemenCatalogErrorState(
  error: unknown,
): SemenCatalogErrorViewModel {
  return createErrorState(error);
}
