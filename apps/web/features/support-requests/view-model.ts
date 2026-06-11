import type {
  AdminSupportQueueInput,
  AdminSupportQueueViewModel,
  SubmitSupportRequestInput,
  SubmitSupportRequestResult,
  SupportRequestFormInput,
  SupportRequestFormViewModel,
} from "./support-requests.d.ts";

import {
  createAdminSupportQueueViewModel as createQueueViewModel,
  createSupportRequestFormViewModel as createFormViewModel,
  submitSupportRequest as submitRequest,
} from "./support-requests.mjs";

export function createSupportRequestFormViewModel(
  input: SupportRequestFormInput,
): SupportRequestFormViewModel {
  return createFormViewModel(input);
}

export function submitSupportRequest(
  input: SubmitSupportRequestInput,
): Promise<SubmitSupportRequestResult> {
  return submitRequest(input);
}

export function createAdminSupportQueueViewModel(
  input: AdminSupportQueueInput,
): AdminSupportQueueViewModel {
  return createQueueViewModel(input);
}
