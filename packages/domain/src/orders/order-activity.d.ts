import type { UserOrganizationRoleLike } from "../identity/role-model.d.ts";
import type {
  OrderStatusHistory,
  SemenOrderLike,
} from "./semen-order.d.ts";

export type OrderActivityType =
  | "SYSTEM_STATUS"
  | "USER_COMMENT"
  | "INTERNAL_NOTE"
  | "SUPPORT_NOTE";

export type OrderActivityVisibility =
  | "SHARED"
  | "STATION_INTERNAL"
  | "ADMIN_INTERNAL";

export interface OrderActivityActorContext {
  userId: string;
  organizationId: string;
  organizationName?: string | null;
  roleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
  roles: UserOrganizationRoleLike[];
}

export interface OrderActivity {
  id: string | null;
  semenOrderId: string;
  orderNumber: string;
  type: OrderActivityType;
  visibility: OrderActivityVisibility;
  message: string;
  createdByUserId: string | null;
  createdByOrganizationId: string | null;
  createdByRole: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN" | null;
  createdAt: string;
}

export interface OrderActivityFeedItem {
  id: string | null;
  type: OrderActivityType;
  visibility: OrderActivityVisibility;
  label: string;
  message: string;
  actorUserId: string | null;
  actorOrganizationId: string | null;
  actorRoleCode: "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN" | null;
  createdAt: string;
}

export interface OrderActivityRepository {
  createOrderActivity(activity: OrderActivity): Promise<OrderActivity>;
}

export interface CreateOrderActivityInput {
  actor: OrderActivityActorContext;
  order: SemenOrderLike;
  repository: OrderActivityRepository;
  message?: string | null;
  type?: OrderActivityType | string | null;
  visibility?: OrderActivityVisibility | string | null;
  activityId?: string | null;
  createdAt?: string | Date | null;
  now?: string | Date;
}

export interface OrderActivityFeedInput {
  actor: OrderActivityActorContext;
  order: SemenOrderLike;
  activities?: readonly OrderActivity[];
  statusHistory?: readonly OrderStatusHistory[];
}

export declare const ORDER_ACTIVITY_TYPES: readonly OrderActivityType[];
export declare const ORDER_ACTIVITY_VISIBILITIES: readonly OrderActivityVisibility[];
export declare const ORDER_ACTIVITY_MUTATION_POLICY: Readonly<{
  replacesAuditLog: false;
  reason: string;
}>;
export declare class OrderActivityValidationError extends Error {
  readonly issues: readonly string[];
  constructor(issues: string[]);
}
export declare class OrderActivityAuthorizationError extends Error {}
export declare function isOrderActivityType(value: unknown): value is OrderActivityType;
export declare function isOrderActivityVisibility(
  value: unknown,
): value is OrderActivityVisibility;
export declare function canViewOrderActivity(
  actor: OrderActivityActorContext,
  order: SemenOrderLike,
): boolean;
export declare function canCreateOrderActivity(input: {
  actor: OrderActivityActorContext;
  order: SemenOrderLike;
  type?: string | null;
  visibility?: string | null;
}): boolean;
export declare function createOrderActivity(
  input: CreateOrderActivityInput,
): Promise<OrderActivity>;
export declare function prepareOrderActivity(
  input: CreateOrderActivityInput,
): OrderActivity;
export declare function createOrderActivityFeed(
  input: OrderActivityFeedInput,
): readonly OrderActivityFeedItem[];
export declare function filterVisibleOrderActivities(input: {
  actor: OrderActivityActorContext;
  order: SemenOrderLike;
  activities: readonly OrderActivity[];
}): readonly OrderActivity[];
export declare function validateCreateOrderActivityInput(
  input: CreateOrderActivityInput | undefined,
): string[];
