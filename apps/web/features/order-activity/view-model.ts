import type {
  AddSharedOrderCommentInput,
  OrderActivityCommentResult,
  OrderActivityPanelInput,
  OrderActivityPanelViewModel,
} from "./order-activity.d.ts";

import {
  addSharedOrderComment as addComment,
  createOrderActivityPanelViewModel as createPanelViewModel,
} from "./order-activity.mjs";

export function createOrderActivityPanelViewModel(
  input: OrderActivityPanelInput,
): OrderActivityPanelViewModel {
  return createPanelViewModel(input);
}

export function addSharedOrderComment(
  input: AddSharedOrderCommentInput,
): Promise<OrderActivityCommentResult> {
  return addComment(input);
}
