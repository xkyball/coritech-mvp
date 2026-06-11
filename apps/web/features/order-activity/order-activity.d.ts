import type {
  CreateOrderActivityInput,
  OrderActivity,
  OrderActivityActorContext,
  OrderActivityFeedItem,
  OrderActivityRepository,
  OrderActivityVisibility,
} from "@coritech/domain/orders/order-activity.d.ts";
import type {
  OrderStatusHistory,
  SemenOrderLike,
} from "@coritech/domain/orders/semen-order.d.ts";

export interface OrderActivityListRepository extends OrderActivityRepository {
  listOrderActivitiesForOrder(orderId: string): Promise<OrderActivity[]>;
  listOrderActivitiesForOrders(orderIds: readonly string[]): Promise<OrderActivity[]>;
}

export interface OrderActivityPanelInput {
  actor: OrderActivityActorContext;
  order: SemenOrderLike;
  activities?: readonly OrderActivity[];
  statusHistory?: readonly OrderStatusHistory[];
  title?: string | null;
  emptyMessage?: string | null;
}

export interface OrderActivityPanelViewModel {
  title: string;
  emptyMessage: string;
  items: readonly OrderActivityPanelRow[];
  comment: {
    canAdd: boolean;
    orderId: string;
    label: string;
    fieldLabel: string;
    placeholder: string;
  };
}

export interface OrderActivityPanelRow extends OrderActivityFeedItem {
  actorLabel: string;
  organizationLabel: string;
  visibilityLabel: string;
}

export type OrderActivityCommentResult =
  | {
      ok: true;
      activity: OrderActivity;
    }
  | {
      ok: false;
      issues: readonly string[];
    };

export interface AddSharedOrderCommentInput
  extends Omit<CreateOrderActivityInput, "type" | "visibility"> {
  repository: OrderActivityRepository;
}

export declare const ORDER_ACTIVITY_DEFAULT_TITLE: "Order activity";
export declare function createOrderActivityPanelViewModel(
  input: OrderActivityPanelInput,
): OrderActivityPanelViewModel;
export declare function addSharedOrderComment(
  input: AddSharedOrderCommentInput,
): Promise<OrderActivityCommentResult>;
export declare function formatOrderActivityVisibility(
  value: OrderActivityVisibility,
): string;
export declare function renderOrderActivityPanel(
  input: OrderActivityPanelInput | OrderActivityPanelViewModel,
): string;
