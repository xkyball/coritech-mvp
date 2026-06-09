import type { ReactNode } from "react";
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
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailRenderableViewModel;
}>) {
  if (viewModel.state === "LOADING") {
    return <LoadingState viewModel={viewModel} />;
  }

  if (viewModel.state === "ERROR") {
    return <ErrorState viewModel={viewModel} />;
  }

  return <ReadyOrderDetail viewModel={viewModel} />;
}

function ReadyOrderDetail({
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailViewModel;
}>) {
  const sections = viewModel.sections;

  return (
    <main
      className="breeder-order-detail"
      data-organization-id={viewModel.organizationContext.organizationId}
    >
      <header className="breeder-order-detail__header">
        <div>
          <p className="breeder-order-detail__eyebrow">Breeder order detail</p>
          <h1>{viewModel.title}</h1>
          <p>{viewModel.summary}</p>
        </div>
        <nav aria-label="Order detail actions">
          <a href={viewModel.navigation.dashboardHref}>Dashboard</a>
          <a href={viewModel.supportAction.href}>{viewModel.supportAction.label}</a>
        </nav>
      </header>

      <CurrentStatus viewModel={viewModel} />
      <SummarySection section={sections.orderSummary} />
      <StatusHistorySection section={sections.statusHistory} />
      <ShipmentSection section={sections.shipments} />
      <DocumentsSection section={sections.documents} />
      <ProofEventsSection section={sections.proofEvents} />
      <SupportSection supportAction={viewModel.supportAction} />
    </main>
  );
}

function CurrentStatus({
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailViewModel;
}>) {
  const latest = viewModel.currentStatus.latestChange;

  return (
    <section className="breeder-order-detail__section breeder-order-detail__current" aria-labelledby="current-status-heading">
      <h2 id="current-status-heading">Current status</h2>
      <div>
        <strong>{formatStatus(viewModel.currentStatus.status)}</strong>
        {latest ? (
          <p>
            Latest movement: {formatStatus(latest.toStatus)} at {latest.changedAt}
            {latest.reason ? ` - ${latest.reason}` : null}
          </p>
        ) : (
          <p>No status movement has been recorded yet.</p>
        )}
      </div>
    </section>
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
        <dl className="breeder-order-detail__summary-list">
          {section.items.map((item) => (
            <DetailTerm key={item.term} term={item.term} value={item.value} />
          ))}
        </dl>
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
        <table>
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
                <td>{history.fromStatus ? formatStatus(history.fromStatus) : "Start"}</td>
                <td>{formatStatus(history.toStatus)}</td>
                <td>{formatStatus(history.actorRoleCode)}</td>
                <td>{history.reason ?? "Not recorded"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DetailSection>
  );
}

function ShipmentSection({
  section,
}: Readonly<{
  section: BreederOrderDetailSection<BreederOrderShipmentRow>;
}>) {
  return (
    <DetailSection headingId="shipment-information-heading" title={section.title}>
      {section.items.length === 0 ? (
        <EmptyMessage message={section.emptyMessage} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Provider</th>
              <th>Tracking</th>
              <th>Updated</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((shipment) => (
              <tr key={shipment.id ?? shipment.orderNumber}>
                <td>{formatStatus(shipment.status)}</td>
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
                <td>{shipment.updatedAt ?? "Not recorded"}</td>
                <td>
                  <TrackingEvents events={shipment.trackingEvents} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DetailSection>
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
    <ol className="breeder-order-detail__compact-list">
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
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Access</th>
              <th>Created</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((document) => (
              <tr key={document.id ?? `${document.targetType}-${document.targetId}`}>
                <td>{document.originalFileName}</td>
                <td>{document.documentType}</td>
                <td>{formatStatus(document.accessClassification)}</td>
                <td>{document.createdAt}</td>
                <td>{document.detailHref ? <a href={document.detailHref}>View</a> : "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DetailSection>
  );
}

function ProofEventsSection({
  section,
}: Readonly<{
  section: BreederOrderDetailSection<BreederOrderProofEventRow>;
}>) {
  return (
    <DetailSection headingId="proof-events-heading" title={section.title}>
      {section.items.length === 0 ? (
        <EmptyMessage message={section.emptyMessage} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Occurred</th>
              <th>Event</th>
              <th>Source</th>
              <th>Verification</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {section.items.map((event) => (
              <tr key={event.id ?? `${event.eventType}-${event.occurredAt}`}>
                <td>{event.occurredAt}</td>
                <td>{formatStatus(event.eventType)}</td>
                <td>{formatStatus(event.source)}</td>
                <td>{formatStatus(event.verificationLevel)}</td>
                <td>{formatStatus(event.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    <section className="breeder-order-detail__section breeder-order-detail__support" aria-labelledby="support-action-heading">
      <h2 id="support-action-heading">Support</h2>
      <div>
        <p>Order {supportAction.orderNumber}</p>
        <a href={supportAction.href}>{supportAction.label}</a>
      </div>
    </section>
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
    <section className="breeder-order-detail__section" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailLoadingViewModel;
}>) {
  return (
    <section className="breeder-order-detail breeder-order-detail--loading" aria-busy="true">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
    </section>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: BreederOrderDetailErrorViewModel;
}>) {
  return (
    <section className="breeder-order-detail breeder-order-detail--error" role="alert">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
    </section>
  );
}

function DetailTerm({
  term,
  value,
}: Readonly<{
  term: string;
  value: string;
}>) {
  return (
    <div>
      <dt>{term}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function EmptyMessage({ message }: Readonly<{ message: string }>) {
  return <p className="breeder-order-detail__empty">{message}</p>;
}

function formatStatus(value: unknown) {
  return String(value).toLowerCase().replace(/_/g, " ");
}
