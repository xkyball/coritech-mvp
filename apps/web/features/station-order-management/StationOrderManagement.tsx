import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
  Table,
  Textarea,
  formatStatusLabel,
} from "../../components/ui";
import { stationNavigation } from "../navigation";
import { OrderActivityPanel } from "../order-activity/OrderActivityPanel";
import { PaymentReferencePanel } from "../payment-references/PaymentReferencePanel";
import { ProofTimeline } from "../proof-timeline/ProofTimeline";
import { SupportRequestFormPanel } from "../support-requests/SupportRequestFormPanel";
import type {
  StationOrderCommandAction,
  StationOrderManagementSelectedOrder,
  StationOrderManagementViewModel,
} from "./station-order-management.d.ts";

export function StationOrderManagement({
  addCommentAction,
  executeAction,
  supportRequestAction,
  paymentReferenceAction,
  viewModel,
}: Readonly<{
  addCommentAction?: (formData: FormData) => Promise<void>;
  executeAction?: (formData: FormData) => Promise<void>;
  paymentReferenceAction?: (formData: FormData) => Promise<void>;
  supportRequestAction?: (formData: FormData) => Promise<void>;
  viewModel: StationOrderManagementViewModel;
}>) {
  return (
    <DashboardShell
      activeHref={viewModel.navigation.orderManagementHref}
      navigation={stationNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeding Station"
    >
      <div className="ct-page-stack" data-organization-id={viewModel.organizationContext.organizationId}>
        <PageHeader
          actions={(
            <>
              <ButtonLink href={viewModel.navigation.dashboardHref} variant="secondary">
                Station dashboard
              </ButtonLink>
              <ButtonLink href={viewModel.navigation.listingManagementHref} variant="secondary">
                Listings
              </ButtonLink>
            </>
          )}
          breadcrumb={<a href={viewModel.navigation.dashboardHref}>Station dashboard</a>}
          eyebrow="Station orders"
          meta={<Badge tone="info">{viewModel.organizationContext.roleCode}</Badge>}
          subtitle="Review assigned semen orders and complete station actions through the controlled order service."
          title="Order management"
        />

        {viewModel.actionFeedback ? (
          <Alert title={viewModel.actionFeedback.title} tone={viewModel.actionFeedback.tone}>
            <p>{viewModel.actionFeedback.message}</p>
          </Alert>
        ) : null}

        <Card>
          <SectionHeader
            count={`${viewModel.orders.length} assigned`}
            id="station-order-list-heading"
            title="Assigned orders"
          />
          {viewModel.orders.length === 0 ? (
            <EmptyState message="No orders are assigned to this station." />
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Requested delivery</th>
                  <th>Updated</th>
                  <th>Open</th>
                </tr>
              </thead>
              <tbody>
                {viewModel.orders.map((order) => (
                  <tr key={order.id ?? order.orderNumber}>
                    <td>{order.orderNumber}</td>
                    <td><StatusBadge value={order.status} /></td>
                    <td>{order.requestedDeliveryDate ?? "Not recorded"}</td>
                    <td>{order.updatedAt ?? "Not recorded"}</td>
                    <td>
                      <ButtonLink href={`${viewModel.navigation.orderManagementHref}?orderId=${encodeURIComponent(order.id ?? order.orderNumber)}`} variant="ghost">
                        Review
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        {viewModel.selectedOrder ? (
          <SelectedOrder
            addCommentAction={addCommentAction}
            executeAction={executeAction}
            order={viewModel.selectedOrder as StationOrderManagementSelectedOrder}
            paymentReferenceAction={paymentReferenceAction}
            supportRequestAction={supportRequestAction}
          />
        ) : null}
      </div>
    </DashboardShell>
  );
}

function SelectedOrder({
  addCommentAction,
  executeAction,
  order,
  paymentReferenceAction,
  supportRequestAction,
}: Readonly<{
  addCommentAction?: (formData: FormData) => Promise<void>;
  executeAction?: (formData: FormData) => Promise<void>;
  order: StationOrderManagementSelectedOrder;
  paymentReferenceAction?: (formData: FormData) => Promise<void>;
  supportRequestAction?: (formData: FormData) => Promise<void>;
}>) {
  return (
    <Card>
      <SectionHeader
        id="selected-station-order-heading"
        subtitle="Status changes write order history, audit hooks and proof hooks through OrderService."
        title={`Order ${order.orderNumber}`}
      />
      <div className="ct-detail-grid">
        <DetailItem label="Status" value={formatStatusLabel(order.status)} />
        <DetailItem label="Delivery" value={order.requestedDeliveryDate ?? "Not recorded"} />
        <DetailItem label="Mare" value={order.mareName ?? "Not recorded"} />
        <DetailItem
          label="Mare registration"
          value={order.mareRegistrationReference ?? "Not recorded"}
        />
        <DetailItem label="Mare breed" value={order.mareBreed ?? "Not recorded"} />
        <DetailItem label="Mare owner" value={order.mareOwnerName ?? "Not recorded"} />
        <DetailItem
          label="Insemination context"
          value={order.intendedInseminationContext ?? "Not recorded"}
        />
        <DetailItem
          label="Vet or recipient contact"
          value={order.vetOrRecipientContact ?? "Not recorded"}
        />
        <DetailItem label="Contact" value={order.shippingContactName ?? "Not recorded"} />
        <DetailItem label="Destination" value={order.shippingDestination ?? "Not recorded"} />
      </div>

      <PaymentReferencePanel
        action={paymentReferenceAction}
        surface="section"
        viewModel={order.paymentReference}
      />

      {order.commandActions.length > 0 ? (
        <div className="ct-card-grid">
          {order.commandActions.map((action) => (
            <CommandActionForm
              action={action}
              executeAction={executeAction}
              key={action.id}
              orderId={order.id ?? order.orderNumber}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          message="No station status command is currently available for this order."
          title="No status command"
        />
      )}

      {order.workflowActions.length > 0 ? (
        <div className="ct-card-grid">
          {order.workflowActions.map((action) => (
            <article className="ct-record-card" key={action.id}>
              <div className="ct-record-card__header">
                <h3>{action.title}</h3>
                <StatusBadge value={action.status} />
              </div>
              <p>{action.description}</p>
              {action.actionHref ? (
                <ButtonLink href={action.actionHref} variant="secondary">
                  {action.actionLabel}
                </ButtonLink>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      <Table>
        <thead>
          <tr>
            <th>Status history</th>
            <th>Actor</th>
            <th>Reason</th>
            <th>When</th>
          </tr>
        </thead>
        <tbody>
          {order.statusHistory.length > 0 ? (
            order.statusHistory.map((history) => (
              <tr key={history.id ?? `${history.orderNumber}:${history.changedAt}`}>
                <td>{history.fromStatus ? `${formatStatusLabel(history.fromStatus)} to ${formatStatusLabel(history.toStatus)}` : formatStatusLabel(history.toStatus)}</td>
                <td>{formatStatusLabel(history.actorRoleCode)}</td>
                <td>{history.reason ?? "Not recorded"}</td>
                <td>{history.changedAt}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4}>No status history is recorded.</td>
            </tr>
          )}
        </tbody>
      </Table>

      <div className="ct-section-divider">
        <SectionHeader
          id="station-order-proof-timeline-heading"
          title={order.proofTimeline.title}
        />
        <ProofTimeline viewModel={order.proofTimeline} />
      </div>

      <OrderActivityPanel
        commentAction={addCommentAction}
        orderId={order.id ?? order.orderNumber}
        surface="section"
        viewModel={order.activity}
      />

      <SupportRequestFormPanel
        action={supportRequestAction}
        surface="section"
        viewModel={order.supportRequest}
      />
    </Card>
  );
}

function CommandActionForm({
  action,
  executeAction,
  orderId,
}: Readonly<{
  action: StationOrderCommandAction;
  executeAction?: (formData: FormData) => Promise<void>;
  orderId: string;
}>) {
  return (
    <form action={executeAction} className="ct-record-card">
      <div className="ct-record-card__header">
        <h3>{action.title}</h3>
        <Badge tone={action.tone === "danger" ? "danger" : "success"}>Audit-ready</Badge>
      </div>
      <p>{action.description}</p>
      <input name="orderId" type="hidden" value={orderId} />
      <input name="action" type="hidden" value={action.action} />
      <Textarea
        aria-label={`${action.title} reason`}
        name="reason"
        placeholder="Station reason or comment"
        required={action.action === "reject"}
      />
      <Button type="submit" variant={action.tone === "danger" ? "danger" : "primary"}>
        {action.buttonLabel}
      </Button>
    </form>
  );
}

function DetailItem({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="ct-data-panel">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
