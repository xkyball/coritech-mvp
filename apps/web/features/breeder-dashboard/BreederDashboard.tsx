import type { ReactNode } from "react";
import type {
  BreederDashboardActionItem,
  BreederDashboardDocumentRow,
  BreederDashboardErrorViewModel,
  BreederDashboardListingCard,
  BreederDashboardLoadingViewModel,
  BreederDashboardOrderRow,
  BreederDashboardRenderableViewModel,
  BreederDashboardStatusSummaryItem,
  BreederDashboardViewModel,
} from "./breeder-dashboard.d.ts";

export function BreederDashboard({
  viewModel,
}: Readonly<{
  viewModel: BreederDashboardRenderableViewModel;
}>) {
  if (viewModel.state === "LOADING") {
    return <LoadingState viewModel={viewModel} />;
  }

  if (viewModel.state === "ERROR") {
    return <ErrorState viewModel={viewModel} />;
  }

  return <ReadyDashboard viewModel={viewModel} />;
}

function ReadyDashboard({
  viewModel,
}: Readonly<{
  viewModel: BreederDashboardViewModel;
}>) {
  const sections = viewModel.sections;

  return (
    <main
      className={`breeder-dashboard${viewModel.isEmpty ? " is-empty" : ""}`}
      data-organization-id={viewModel.organizationContext.organizationId}
    >
      <header className="breeder-dashboard__header">
        <div>
          <p className="breeder-dashboard__eyebrow">Breeder workspace</p>
          <h1>{viewModel.organizationContext.organizationName}</h1>
        </div>
        <a className="breeder-dashboard__primary-link" href={viewModel.navigation.catalogHref}>
          Catalog
        </a>
      </header>

      <StatusSummary items={sections.orderStatusSummary.items} />
      <ListingsSection items={sections.activeListings.items} emptyMessage={sections.activeListings.emptyMessage} title={sections.activeListings.title} />
      <OrdersSection items={sections.myOrders.items} emptyMessage={sections.myOrders.emptyMessage} title={sections.myOrders.title} />
      <DocumentsSection items={sections.recentDocuments.items} emptyMessage={sections.recentDocuments.emptyMessage} title={sections.recentDocuments.title} />
      <ActionRequiredSection items={sections.actionRequired.items} emptyMessage={sections.actionRequired.emptyMessage} title={sections.actionRequired.title} />
    </main>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: BreederDashboardLoadingViewModel;
}>) {
  return (
    <section className="breeder-dashboard breeder-dashboard--loading" aria-busy="true">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <div className="breeder-dashboard__skeleton-grid" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: BreederDashboardErrorViewModel;
}>) {
  return (
    <section className="breeder-dashboard breeder-dashboard--error" role="alert">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
    </section>
  );
}

function StatusSummary({
  items,
}: Readonly<{
  items: readonly BreederDashboardStatusSummaryItem[];
}>) {
  const visibleItems = items.filter((item) => item.count > 0);

  return (
    <section className="breeder-dashboard__section breeder-dashboard__summary" aria-labelledby="order-status-summary-heading">
      <h2 id="order-status-summary-heading">Order status summary</h2>
      <ul>
        {visibleItems.length > 0 ? (
          visibleItems.map((item) => (
            <li key={item.status}>
              <span>{formatStatus(item.status)}</span>
              <strong>{item.count}</strong>
            </li>
          ))
        ) : (
          <li>
            <span>No orders</span>
            <strong>0</strong>
          </li>
        )}
      </ul>
    </section>
  );
}

function ListingsSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly BreederDashboardListingCard[];
}>) {
  return (
    <DashboardSection title={title} headingId="active-listings-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Stallion</th>
              <th>Breed</th>
              <th>Availability</th>
              <th>Terms</th>
              <th>Order</th>
            </tr>
          </thead>
          <tbody>
            {items.map((listing) => (
              <tr key={listing.id ?? listing.stallionId}>
                <td>{listing.stallionName}</td>
                <td>{listing.breed}</td>
                <td>{formatStatus(listing.availabilityStatus)}</td>
                <td>{listing.termsSummary ?? "Not specified"}</td>
                <td>{listing.createOrderHref ? <a href={listing.createOrderHref}>Order</a> : "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardSection>
  );
}

function OrdersSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly BreederDashboardOrderRow[];
}>) {
  return (
    <DashboardSection title={title} headingId="my-orders-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Status</th>
              <th>Station</th>
              <th>Latest movement</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {items.map((order) => {
              const latest = order.statusHistory[0];

              return (
                <tr key={order.id ?? order.orderNumber}>
                  <td>{order.orderNumber}</td>
                  <td>{formatStatus(order.status)}</td>
                  <td>{order.breedingStationOrganizationId}</td>
                  <td>{latest ? `${formatStatus(latest.toStatus)} at ${latest.changedAt}` : "No status history"}</td>
                  <td>
                    {order.detailHref ? <a href={order.detailHref}>Details</a> : null}
                    {order.detailHref && order.statusHistoryHref ? " " : null}
                    {order.statusHistoryHref ? <a href={order.statusHistoryHref}>History</a> : null}
                    {!order.detailHref && !order.statusHistoryHref ? "Unavailable" : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </DashboardSection>
  );
}

function DocumentsSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly BreederDashboardDocumentRow[];
}>) {
  return (
    <DashboardSection title={title} headingId="recent-documents-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <table>
          <thead>
            <tr>
              <th>Document</th>
              <th>Type</th>
              <th>Order</th>
              <th>Access</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {items.map((document) => (
              <tr key={document.id ?? `${document.targetType}:${document.targetId}`}>
                <td>{document.originalFileName}</td>
                <td>{document.documentType}</td>
                <td>{document.orderNumber ?? document.targetId}</td>
                <td>{formatStatus(document.accessClassification)}</td>
                <td>{document.detailHref ? <a href={document.detailHref}>View</a> : "Unavailable"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </DashboardSection>
  );
}

function ActionRequiredSection({
  title,
  emptyMessage,
  items,
}: Readonly<{
  title: string;
  emptyMessage: string;
  items: readonly BreederDashboardActionItem[];
}>) {
  return (
    <DashboardSection title={title} headingId="action-required-heading">
      {items.length === 0 ? (
        <EmptyMessage message={emptyMessage} />
      ) : (
        <ul className="breeder-dashboard__actions">
          {items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              <span>{item.orderNumber} - {formatStatus(item.status)}</span>
              <p>{item.description}</p>
              {item.actionHref ? <a href={item.actionHref}>{item.actionLabel}</a> : null}
            </li>
          ))}
        </ul>
      )}
    </DashboardSection>
  );
}

function DashboardSection({
  title,
  headingId,
  children,
}: Readonly<{
  title: string;
  headingId: string;
  children: ReactNode;
}>) {
  return (
    <section className="breeder-dashboard__section" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}

function EmptyMessage({ message }: Readonly<{ message: string }>) {
  return <p className="breeder-dashboard__empty">{message}</p>;
}

function formatStatus(value: unknown) {
  return String(value).toLowerCase().replace(/_/g, " ");
}
