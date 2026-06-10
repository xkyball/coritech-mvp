import {
  Alert,
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  EmptyState,
  ErrorState as UiErrorState,
  Field,
  Input,
  PageHeader,
  SectionHeader,
  Select,
  StatusBadge,
  Table,
  Textarea,
  formatStatusLabel,
} from "../../components/ui";
import { stationNavigation } from "../navigation";
import type {
  ShipmentManagementErrorViewModel,
  ShipmentManagementRenderableViewModel,
  ShipmentManagementViewModel,
} from "./shipment-management.d.ts";

type FormAction = (formData: FormData) => void | Promise<void>;

export function ShipmentManagement({
  saveShipmentAction,
  viewModel,
}: Readonly<{
  saveShipmentAction?: FormAction;
  viewModel: ShipmentManagementRenderableViewModel;
}>) {
  if (viewModel.state === "ERROR") {
    return <ErrorState viewModel={viewModel} />;
  }

  return (
    <ShipmentManagementForm
      saveShipmentAction={saveShipmentAction}
      viewModel={viewModel}
    />
  );
}

function ShipmentManagementForm({
  saveShipmentAction,
  viewModel,
}: Readonly<{
  saveShipmentAction?: FormAction;
  viewModel: ShipmentManagementViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/orders"
      navigation={stationNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeding Station"
    >
      <div className="ct-page-stack" data-organization-id={viewModel.organizationContext.organizationId}>
        <PageHeader
          actions={(
            <>
              <ButtonLink href={viewModel.navigation.orderManagementHref} variant="secondary">
                Order management
              </ButtonLink>
              <ButtonLink href={viewModel.navigation.dashboardHref} variant="ghost">
                Station dashboard
              </ButtonLink>
            </>
          )}
          breadcrumb={(
            <Breadcrumbs
              items={[
                { href: viewModel.navigation.dashboardHref, label: "Station dashboard" },
                { href: viewModel.navigation.orderManagementHref, label: "Order management" },
                { label: viewModel.operation === "CREATE" ? "Create shipment" : "Update shipment" },
              ]}
            />
          )}
          eyebrow="Station shipment workflow"
          meta={<StatusBadge value={viewModel.order.status} />}
          subtitle={viewModel.summary}
          title={viewModel.title}
        />

        {viewModel.actionFeedback ? (
          <Alert title={viewModel.actionFeedback.title} tone={viewModel.actionFeedback.tone}>
            <p>{viewModel.actionFeedback.message}</p>
          </Alert>
        ) : null}

        {viewModel.validationIssues.length > 0 ? (
          <Alert title="Check shipment details">
            <ul>
              {viewModel.validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <Card aria-labelledby="shipment-editor-heading">
          <SectionHeader
            id="shipment-editor-heading"
            subtitle="Shipment changes write tracking history, audit logs and proof events through ShipmentService."
            title={viewModel.operation === "CREATE" ? "Create shipment" : "Update shipment"}
          />
          <form action={saveShipmentAction} className="ct-form-grid" method="post">
            <input name="action" type="hidden" value={viewModel.form.action} />
            <input name="orderId" type="hidden" value={viewModel.order.id ?? ""} />
            <input name="shipmentId" type="hidden" value={viewModel.shipment?.id ?? ""} />
            <Field htmlFor="shipment-providerName" label="Provider name">
              <Input
                id="shipment-providerName"
                name="providerName"
                defaultValue={viewModel.form.providerName}
              />
            </Field>
            <Field htmlFor="shipment-providerTrackingId" label="Tracking ID">
              <Input
                id="shipment-providerTrackingId"
                name="providerTrackingId"
                defaultValue={viewModel.form.providerTrackingId}
              />
            </Field>
            <Field htmlFor="shipment-trackingUrl" label="Tracking URL">
              <Input
                id="shipment-trackingUrl"
                name="trackingUrl"
                defaultValue={viewModel.form.trackingUrl}
                type="url"
              />
            </Field>
            <Field htmlFor="shipment-status" label="Shipment status">
              <Select id="shipment-status" name="status" defaultValue={viewModel.form.status} required>
                {viewModel.statuses.map((status) => (
                  <option key={status} value={status}>
                    {formatStatusLabel(status)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="shipment-eventSource" label="Event source">
              <Select id="shipment-eventSource" name="eventSource" defaultValue={viewModel.form.eventSource} required>
                {viewModel.eventSources.map((source) => (
                  <option key={source} value={source}>
                    {formatStatusLabel(source)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field htmlFor="shipment-providerStatus" label="Provider status">
              <Input
                id="shipment-providerStatus"
                name="providerStatus"
                defaultValue={viewModel.form.providerStatus}
              />
            </Field>
            <Field htmlFor="shipment-location" label="Location">
              <Input
                id="shipment-location"
                name="location"
                defaultValue={viewModel.form.location}
              />
            </Field>
            <Field htmlFor="shipment-notes" label="Notes" className="ct-field--wide">
              <Textarea
                id="shipment-notes"
                name="notes"
                defaultValue={viewModel.form.notes}
              />
            </Field>
            <div className="ct-form-actions">
              <Button formAction={saveShipmentAction} type="submit">
                {viewModel.operation === "CREATE" ? "Create shipment" : "Save tracking update"}
              </Button>
            </div>
          </form>
        </Card>

        <TimelineCard viewModel={viewModel} />
      </div>
    </DashboardShell>
  );
}

function TimelineCard({
  viewModel,
}: Readonly<{
  viewModel: ShipmentManagementViewModel;
}>) {
  return (
    <Card aria-labelledby="shipment-timeline-heading">
      <SectionHeader
        count={`${viewModel.trackingEvents.length} events`}
        id="shipment-timeline-heading"
        title="Shipment tracking timeline"
      />
      {viewModel.trackingEvents.length === 0 ? (
        <EmptyState message="No tracking events are recorded for this shipment yet." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>When</th>
              <th>From</th>
              <th>To</th>
              <th>Source</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {viewModel.trackingEvents.map((event) => (
              <tr key={event.id ?? `${event.toStatus}:${event.occurredAt}`}>
                <td>{event.occurredAt}</td>
                <td>{event.fromStatus ? <StatusBadge value={event.fromStatus} /> : "Start"}</td>
                <td><StatusBadge value={event.toStatus} /></td>
                <td>{formatStatusLabel(event.eventSource)}</td>
                <td>{event.notes ?? event.providerStatus ?? event.location ?? "Not recorded"}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: ShipmentManagementErrorViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/orders"
      navigation={stationNavigation}
      roleLabel="Breeding Station"
    >
      <UiErrorState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}
