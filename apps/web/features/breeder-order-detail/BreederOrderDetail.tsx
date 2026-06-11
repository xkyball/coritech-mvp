import type { ReactNode } from "react";
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  DetailList,
  EmptyState,
  ErrorState as UiErrorState,
  LoadingState as UiLoadingState,
  OrderStatusBadge,
  PageHeader,
  ProofEventList,
  SectionHeader,
  ShipmentStatusBadge,
  StatusDescription,
  StatusBadge,
  Table,
  Textarea,
  formatStatusLabel,
} from "../../components/ui";
import { breederNavigation } from "../navigation";
import { OrderActivityPanel } from "../order-activity/OrderActivityPanel";
import { PaymentReferencePanel } from "../payment-references/PaymentReferencePanel";
import { SupportRequestFormPanel } from "../support-requests/SupportRequestFormPanel";
import type {
  BreederOrderDetailErrorViewModel,
  BreederOrderDetailLoadingViewModel,
  BreederOrderDetailRenderableViewModel,
  BreederOrderDetailSection,
  BreederOrderDetailSupportAction,
  BreederOrderDetailViewModel,
  BreederOrderDocumentRow,
  BreederOrderProofEventRow,
  BreederOrderShipmentRow,
  BreederOrderShipmentTrackingEventRow,
  BreederOrderStatusHistoryRow,
  BreederOrderSummaryItem,
} from "./breeder-order-detail.d.ts";

export function BreederOrderDetail({
  addCommentAction,
  cancelOrderAction,
  confirmReceivedAction,
  supportRequestAction,
  viewModel,
}: Readonly<{
  addCommentAction?: (formData: FormData) => Promise<void>;
  cancelOrderAction?: (formData: FormData) => Promise<void>;
  confirmReceivedAction?: (formData: FormData) => Promise<void>;
  supportRequestAction?: (formData: FormData) => Promise<void>;
  viewModel: BreederOrderDetailRenderableViewModel;
}>) {
  if (viewModel.state === "LOADING") {
    return <LoadingState viewModel={viewModel} />;
  }

  if (viewModel.state === "ERROR") {
    return <ErrorState viewModel={viewModel} />;
  }

  return (
    <ReadyOrderDetail
      addCommentAction={addCommentAction}
      cancelOrderAction={cancelOrderAction}
      confirmReceivedAction={confirmReceivedAction}
      supportRequestAction={supportRequestAction}
      viewModel={viewModel}
    />
  );
}

function ReadyOrderDetail({
  addCommentAction,
  cancelOrderAction,
  confirmReceivedAction,
  supportRequestAction,
  viewModel,
}: Readonly<{
  addCommentAction?: (formData: FormData) => Promise<void>;
  cancelOrderAction?: (formData: FormData) => Promise<void>;
  confirmReceivedAction?: (formData: FormData) => Promise<void>;
  supportRequestAction?: (formData: FormData) => Promise<void>;
  viewModel: BreederOrderDetailViewModel;
}>) {
  const sections = viewModel.sections;

  return (
    <DashboardShell
      activeHref="/breeder-dashboard"
      navigation={breederNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeder"
    >
      <div className="ct-page-stack" data-organization-id={viewModel.organizationContext.organizationId}>
        <PageHeader
          actions={(
            <>
              {viewModel.order.id ? (
                <ButtonLink
                  href={buildDocumentUploadHref({
                    returnTo: `/app/orders/${encodeURIComponent(viewModel.order.id)}`,
                    targetId: viewModel.order.id,
                    targetType: "SemenOrder",
                  })}
                  variant="secondary"
                >
                  Upload document
                </ButtonLink>
              ) : null}
              <ButtonLink href={viewModel.navigation.dashboardHref} variant="secondary">
                Dashboard
              </ButtonLink>
              <ButtonLink href={viewModel.supportAction.href} variant="ghost">
                {viewModel.supportAction.label}
              </ButtonLink>
            </>
          )}
          breadcrumb={(
            <Breadcrumbs
              items={[
                { href: viewModel.navigation.dashboardHref, label: "Breeder dashboard" },
                { label: viewModel.title },
              ]}
            />
          )}
          eyebrow="Breeder order detail"
          subtitle={viewModel.summary}
          title={viewModel.title}
        />

        <CurrentStatus viewModel={viewModel} />
        <CancellationSection cancelOrderAction={cancelOrderAction} viewModel={viewModel} />
        <SummarySection section={sections.orderSummary} />
        <PaymentReferencePanel viewModel={viewModel.paymentReference} />
        <StatusHistorySection section={sections.statusHistory} />
        <ShipmentSection confirmReceivedAction={confirmReceivedAction} section={sections.shipments} />
        <DocumentsSection section={sections.documents} />
        <ProofEventsSection orderNumber={viewModel.order.orderNumber} section={sections.proofEvents} />
        <OrderActivityPanel
          commentAction={addCommentAction}
          orderId={viewModel.order.id ?? viewModel.order.orderNumber}
          viewModel={sections.activity}
        />
        <SupportRequestFormPanel
          action={supportRequestAction}
          secondaryAction={(
            <ButtonLink href={viewModel.supportAction.href} variant="ghost">
              {viewModel.supportAction.label}
            </ButtonLink>
          )}
          viewModel={viewModel.supportRequest}
        />
      </div>
    </DashboardShell>
  );
}

function CurrentStatus({
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailViewModel;
}>) {
  const latest = viewModel.currentStatus.latestChange;

  return (
    <Card aria-labelledby="current-status-heading">
      <SectionHeader
        actions={<OrderStatusBadge value={viewModel.currentStatus.status} />}
        id="current-status-heading"
        title="Current status"
      />
      <div className="ct-data-panel">
        <span>Status movement</span>
        <strong>{formatStatus(viewModel.currentStatus.status)}</strong>
        <StatusDescription
          kind="order"
          roleCode="BREEDER"
          status={viewModel.currentStatus.status}
        />
        {latest ? (
          <p>
            Latest movement: {formatStatus(latest.toStatus)} at {latest.changedAt}
            {latest.reason ? ` - ${latest.reason}` : ""}
          </p>
        ) : (
          <p>No status movement has been recorded yet.</p>
        )}
      </div>
    </Card>
  );
}

function CancellationSection({
  cancelOrderAction,
  viewModel,
}: Readonly<{
  cancelOrderAction?: (formData: FormData) => Promise<void>;
  viewModel: BreederOrderDetailViewModel;
}>) {
  const action = viewModel.cancellationAction;

  if (!action) {
    return null;
  }

  return (
    <Card aria-labelledby="order-cancellation-heading">
      <SectionHeader
        id="order-cancellation-heading"
        subtitle={action.description}
        title={action.title}
      />
      <form action={cancelOrderAction} className="ct-form-grid">
        <input name="orderId" type="hidden" value={action.orderId} />
        <label className="ct-field" htmlFor="cancellation-reason">
          <span>{action.reasonLabel}</span>
          <Textarea
            id="cancellation-reason"
            name="reason"
            placeholder="Explain why this order is being cancelled"
            required
            rows={4}
          />
        </label>
        <Button type="submit" variant="danger">
          {action.buttonLabel}
        </Button>
      </form>
    </Card>
  );
}

function SummarySection({
  section,
}: Readonly<{
  section: BreederOrderDetailSection<BreederOrderSummaryItem>;
}>) {
  return (
    <DetailSection headingId="order-summary-heading" title={section.title}>
      {section.items.length === 0 ? (
        <EmptyMessage message={section.emptyMessage} />
      ) : (
        <DetailList items={section.items} />
      )}
    </DetailSection>
  );
}

function StatusHistorySection({
  section,
}: Readonly<{
  section: BreederOrderDetailSection<BreederOrderStatusHistoryRow>;
}>) {
  return (
    <DetailSection headingId="status-history" title={section.title}>
      {section.items.length === 0 ? (
        <EmptyMessage message={section.emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Changed at</th>
              <th>From</th>
              <th>To</th>
              <th>Actor</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((history) => (
              <tr key={history.id ?? `${history.toStatus}-${history.changedAt}`}>
                <td>{history.changedAt}</td>
                <td>{history.fromStatus ? <OrderStatusBadge value={history.fromStatus} /> : "Start"}</td>
                <td><OrderStatusBadge value={history.toStatus} /></td>
                <td>{formatStatus(history.actorRoleCode)}</td>
                <td>{history.reason ?? "Not recorded"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </DetailSection>
  );
}

function ShipmentSection({
  confirmReceivedAction,
  section,
}: Readonly<{
  confirmReceivedAction?: (formData: FormData) => Promise<void>;
  section: BreederOrderDetailSection<BreederOrderShipmentRow>;
}>) {
  return (
    <DetailSection headingId="shipment-information-heading" title={section.title}>
      {section.items.length === 0 ? (
        <EmptyMessage message={section.emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Provider</th>
              <th>Tracking</th>
              <th>Receipt</th>
              <th>Updated</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((shipment) => (
              <tr key={shipment.id ?? shipment.orderNumber}>
                <td><ShipmentStatusBadge value={shipment.status} /></td>
                <td>{shipment.providerName ?? "Not recorded"}</td>
                <td>
                  {shipment.trackingUrl ? (
                    <a href={shipment.trackingUrl}>
                      {shipment.providerTrackingId ?? "Tracking"}
                    </a>
                  ) : (
                    shipment.providerTrackingId ?? "Tracking not recorded"
                  )}
                </td>
                <td>
                  <ReceiptCell
                    confirmReceivedAction={confirmReceivedAction}
                    shipment={shipment}
                  />
                </td>
                <td>{shipment.updatedAt ?? "Not recorded"}</td>
                <td>
                  <TrackingEvents events={shipment.trackingEvents} />
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </DetailSection>
  );
}

function ReceiptCell({
  confirmReceivedAction,
  shipment,
}: Readonly<{
  confirmReceivedAction?: (formData: FormData) => Promise<void>;
  shipment: BreederOrderShipmentRow;
}>) {
  if (!shipment.canConfirmReceived) {
    return <span>{shipment.confirmationSummary}</span>;
  }

  return (
    <form action={confirmReceivedAction}>
      <input name="orderId" type="hidden" value={shipment.semenOrderId} />
      <input name="shipmentId" type="hidden" value={shipment.id ?? ""} />
      <Button type="submit">
        Confirm received
      </Button>
    </form>
  );
}

function TrackingEvents({
  events,
}: Readonly<{
  events: readonly BreederOrderShipmentTrackingEventRow[];
}>) {
  if (events.length === 0) {
    return <>No tracking events</>;
  }

  return (
    <ol className="ct-compact-list">
      {events.map((event) => (
        <li key={event.id ?? `${event.toStatus}-${event.occurredAt}`}>
          {formatStatus(event.toStatus)} at {event.occurredAt}
          {event.location ? <span>{event.location}</span> : null}
        </li>
      ))}
    </ol>
  );
}

function DocumentsSection({
  section,
}: Readonly<{
  section: BreederOrderDetailSection<BreederOrderDocumentRow>;
}>) {
  return (
    <DetailSection headingId="linked-documents-heading" title={section.title}>
      {section.items.length === 0 ? (
        <EmptyMessage message={section.emptyMessage} />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Access</th>
              <th>Status</th>
              <th>Created</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((document) => (
              <tr key={document.id ?? `${document.targetType}-${document.targetId}`}>
                <td>{document.originalFileName}</td>
                <td>{document.documentType}</td>
                <td><StatusBadge value={document.accessClassification} /></td>
                <td><StatusBadge value={document.status} /></td>
                <td>{document.createdAt}</td>
                <td>
                  {isImplementedDocumentHref(document.detailHref) ? (
                    <ButtonLink href={document.detailHref ?? ""} variant="ghost">
                      View
                    </ButtonLink>
                  ) : (
                    <StatusBadge label="Metadata only" value="metadata_only" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </DetailSection>
  );
}

function ProofEventsSection({
  orderNumber,
  section,
}: Readonly<{
  orderNumber: string;
  section: BreederOrderDetailSection<BreederOrderProofEventRow>;
}>) {
  return (
    <DetailSection headingId="proof-events-heading" title={section.title}>
      {section.items.length === 0 ? (
        <EmptyMessage message={section.emptyMessage} />
      ) : (
        <ProofEventList
          items={section.items.map((event) => ({
            ...event,
            linkedObjectLabel: `Order ${orderNumber}`,
          }))}
        />
      )}
    </DetailSection>
  );
}

function SupportSection({
  supportAction,
}: Readonly<{
  supportAction: BreederOrderDetailSupportAction;
}>) {
  return (
    <Card aria-labelledby="support-action-heading">
      <SectionHeader id="support-action-heading" title="Support" />
      <div className="ct-data-panel">
        <span>Support reference</span>
        <p>Order {supportAction.orderNumber}</p>
        <ButtonLink href={supportAction.href} variant="secondary">
          {supportAction.label}
        </ButtonLink>
      </div>
    </Card>
  );
}

function DetailSection({
  title,
  headingId,
  children,
}: Readonly<{
  title: string;
  headingId: string;
  children: ReactNode;
}>) {
  return (
    <Card aria-labelledby={headingId}>
      <SectionHeader id={headingId} title={title} />
      {children}
    </Card>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailLoadingViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/breeder-dashboard"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <UiLoadingState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailErrorViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/breeder-dashboard"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <UiErrorState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function EmptyMessage({ message }: Readonly<{ message: string }>) {
  return <EmptyState message={message} title="No records found" />;
}

function formatStatus(value: unknown) {
  return formatStatusLabel(value);
}

function isImplementedDocumentHref(href: string | null) {
  return Boolean(href);
}

function buildDocumentUploadHref(input: {
  returnTo: string;
  targetId: string;
  targetType: string;
}) {
  const params = new URLSearchParams({
    returnTo: input.returnTo,
    targetId: input.targetId,
    targetType: input.targetType,
  });

  return `/app/documents/upload?${params.toString()}`;
}
