import type { ReactNode } from "react";
import {
  Button,
  Card,
  EmptyState,
  SectionHeader,
  StatusBadge,
  Table,
  Textarea,
  cx,
} from "../../components/ui";
import type {
  OrderActivityPanelRow,
  OrderActivityPanelViewModel,
} from "./order-activity.d.ts";

type OrderActivityPanelSurface = "card" | "section";

export function OrderActivityPanel({
  commentAction,
  orderId,
  surface = "card",
  viewModel,
}: Readonly<{
  commentAction?: (formData: FormData) => Promise<void>;
  orderId: string;
  surface?: OrderActivityPanelSurface;
  viewModel: OrderActivityPanelViewModel;
}>) {
  const content = (
    <>
      <SectionHeader
        count={`${viewModel.items.length} item${viewModel.items.length === 1 ? "" : "s"}`}
        id="order-activity-heading"
        title={viewModel.title}
      />
      <OrderActivityRows emptyMessage={viewModel.emptyMessage} items={viewModel.items} />
      {viewModel.comment.canAdd && commentAction ? (
        <form action={commentAction} className="ct-form-grid">
          <input name="orderId" type="hidden" value={orderId || viewModel.comment.orderId} />
          <label className="ct-field" htmlFor={`order-activity-comment-${viewModel.comment.orderId}`}>
            <span>{viewModel.comment.fieldLabel}</span>
            <Textarea
              id={`order-activity-comment-${viewModel.comment.orderId}`}
              name="message"
              placeholder={viewModel.comment.placeholder}
              required
              rows={3}
            />
          </label>
          <Button type="submit" variant="secondary">
            {viewModel.comment.label}
          </Button>
        </form>
      ) : null}
    </>
  );

  if (surface === "section") {
    return <div className="ct-section-divider">{content}</div>;
  }

  return (
    <Card aria-labelledby="order-activity-heading">
      {content}
    </Card>
  );
}

function OrderActivityRows({
  emptyMessage,
  items,
}: Readonly<{
  emptyMessage: string;
  items: readonly OrderActivityPanelRow[];
}>) {
  if (items.length === 0) {
    return <EmptyState message={emptyMessage} title="No activity" />;
  }

  return (
    <Table>
      <thead>
        <tr>
          <th>Activity</th>
          <th>Visibility</th>
          <th>Actor</th>
          <th>Organization</th>
          <th>When</th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id ?? `${item.type}:${item.createdAt}:${item.message}`}>
            <td>
              <div className="ct-table-cell-stack">
                <StatusBadge label={item.label} value={item.type} />
                <span>{item.message}</span>
              </div>
            </td>
            <td>{item.visibilityLabel}</td>
            <td>{item.actorLabel}</td>
            <td>{item.organizationLabel}</td>
            <td>{item.createdAt}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export function OrderActivityInlineList({
  children,
  className,
}: Readonly<{
  children: ReactNode;
  className?: string;
}>) {
  return <div className={cx("ct-section-divider", className)}>{children}</div>;
}
