import {
  Alert,
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  DetailList,
  ErrorState as UiErrorState,
  Field,
  Input,
  LoadingState as UiLoadingState,
  PageHeader,
  SectionHeader,
  Select,
  StatusBadge,
  Textarea,
  formatStatusLabel,
} from "../../components/ui";
import { breederNavigation } from "../navigation";
import type {
  SemenOrderCreationConfirmationViewModel,
  SemenOrderCreationErrorViewModel,
  SemenOrderCreationFormViewModel,
  SemenOrderCreationListingOption,
  SemenOrderCreationLoadingViewModel,
  SemenOrderCreationRenderableViewModel,
} from "./semen-order-creation.d.ts";

type FormAction = (formData: FormData) => void | Promise<void>;

export function SemenOrderCreation({
  createDraftAction,
  submitOrderAction,
  viewModel,
}: Readonly<{
  createDraftAction?: FormAction;
  submitOrderAction?: FormAction;
  viewModel: SemenOrderCreationRenderableViewModel;
}>) {
  if (viewModel.state === "LOADING") {
    return <LoadingState viewModel={viewModel} />;
  }

  if (viewModel.state === "ERROR") {
    return <ErrorState viewModel={viewModel} />;
  }

  if (viewModel.state === "CONFIRMATION") {
    return <ConfirmationState viewModel={viewModel} />;
  }

  return (
    <OrderCreationForm
      createDraftAction={createDraftAction}
      submitOrderAction={submitOrderAction}
      viewModel={viewModel}
    />
  );
}

function OrderCreationForm({
  createDraftAction,
  submitOrderAction,
  viewModel,
}: Readonly<{
  createDraftAction?: FormAction;
  submitOrderAction?: FormAction;
  viewModel: SemenOrderCreationFormViewModel;
}>) {
  const formDisabled = !viewModel.selectedListing;

  return (
    <DashboardShell
      activeHref="/app/orders/new"
      navigation={breederNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeder"
    >
      <div className="ct-page-stack" data-organization-id={viewModel.organizationContext.organizationId}>
        <PageHeader
          actions={(
            <ButtonLink href={viewModel.navigation.dashboardHref} variant="secondary">
              Dashboard
            </ButtonLink>
          )}
          breadcrumb={(
            <Breadcrumbs
              items={[
                { href: viewModel.navigation.dashboardHref, label: "Breeder dashboard" },
                { href: "/app/catalog", label: "Catalog" },
                { label: "New order" },
              ]}
            />
          )}
          eyebrow="Breeder order flow"
          subtitle={viewModel.summary}
          title={viewModel.title}
        />

        <Card aria-labelledby="order-listing-selector-heading">
          <SectionHeader id="order-listing-selector-heading" title="Listing" />
          <form className="ct-form-grid" method="get" action={viewModel.navigation.newOrderHref}>
            <Field htmlFor="order-semenListingId" label="Select listing">
              <Select
                id="order-semenListingId"
                name="semenListingId"
                defaultValue={viewModel.form.semenListingId}
              >
                <option value="">Choose a listing</option>
                {viewModel.selectableListings.map((listing) => (
                  <option key={listing.id} value={listing.id}>
                    {listing.stallionName} - {listing.stationLabel}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="ct-form-actions">
              <Button type="submit">Review listing</Button>
            </div>
          </form>
        </Card>

        {viewModel.selectedListing ? <ListingReview listing={viewModel.selectedListing} /> : null}
        {viewModel.validationIssues.length > 0 ? (
          <Alert title="Check order details">
            <ul>
              {viewModel.validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <Card aria-labelledby="order-details-heading">
          <SectionHeader
            id="order-details-heading"
            subtitle="Shipping details are recorded as part of the order proof trail."
            title="Delivery and shipping"
          />
          <form className="ct-form-grid" method="post">
            <input type="hidden" name="semenListingId" value={viewModel.form.semenListingId} />
            <OrderInput
              label="Requested delivery date"
              name="requestedDeliveryDate"
              required
              type="date"
              value={viewModel.form.requestedDeliveryDate}
            />
            <OrderInput
              label="Shipping contact"
              name="shippingContactName"
              required
              value={viewModel.form.shippingContactName}
            />
            <OrderInput
              label="Contact phone"
              name="shippingContactPhone"
              required
              type="tel"
              value={viewModel.form.shippingContactPhone}
            />
            <OrderInput
              label="Address line 1"
              name="shippingAddressLine1"
              required
              value={viewModel.form.shippingAddressLine1}
            />
            <OrderInput
              label="Address line 2"
              name="shippingAddressLine2"
              value={viewModel.form.shippingAddressLine2}
            />
            <OrderInput
              label="City"
              name="shippingCity"
              required
              value={viewModel.form.shippingCity}
            />
            <OrderInput
              label="Region"
              name="shippingRegion"
              value={viewModel.form.shippingRegion}
            />
            <OrderInput
              label="Postal code"
              name="shippingPostalCode"
              required
              value={viewModel.form.shippingPostalCode}
            />
            <OrderInput
              label="Country"
              name="shippingCountry"
              required
              value={viewModel.form.shippingCountry}
            />
            <Field htmlFor="specialInstructions" label="Special instructions" className="ct-field--wide">
              <Textarea
                id="specialInstructions"
                name="specialInstructions"
                defaultValue={viewModel.form.specialInstructions}
              />
            </Field>
            <div className="ct-form-actions">
              <Button
                disabled={formDisabled}
                formAction={createDraftAction}
                formNoValidate
                name="intent"
                type="submit"
                value="draft"
                variant="secondary"
              >
                Save draft
              </Button>
              <Button
                disabled={formDisabled}
                formAction={submitOrderAction}
                name="intent"
                type="submit"
                value="submit"
              >
                Submit order
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardShell>
  );
}

function ListingReview({
  listing,
}: Readonly<{
  listing: SemenOrderCreationListingOption;
}>) {
  return (
    <Card aria-labelledby="order-listing-review-heading">
      <SectionHeader
        id="order-listing-review-heading"
        title="Review stallion and station"
        actions={<StatusBadge value={listing.availabilityStatus} />}
      />
      <DetailList
        items={[
          { term: "Stallion", value: listing.stallionName },
          { term: "Breed", value: listing.breed },
          { term: "Breeding station", value: listing.stationLabel },
          { term: "Availability", value: formatStatus(listing.availabilityStatus) },
          { term: "Terms", value: listing.termsSummary ?? "Not specified" },
          { term: "UELN", value: listing.ueln ?? "Not provided" },
        ]}
      />
    </Card>
  );
}

function ConfirmationState({
  viewModel,
}: Readonly<{
  viewModel: SemenOrderCreationConfirmationViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/orders/new"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <div className="ct-page-stack">
        <PageHeader
          eyebrow="Order confirmation"
          subtitle={viewModel.summary}
          title={viewModel.title}
        />
        <Card aria-labelledby="order-confirmation-heading">
          <SectionHeader
            id="order-confirmation-heading"
            title="Submitted order"
            actions={<StatusBadge value={viewModel.order.status} />}
          />
          <DetailList
            items={[
              { term: "Order number", value: viewModel.order.orderNumber },
              { term: "Status", value: formatStatus(viewModel.order.status) },
              {
                term: "Requested delivery",
                value: viewModel.order.requestedDeliveryDate ?? "Not set",
              },
            ]}
          />
          <div className="ct-form-actions">
            <ButtonLink href={viewModel.navigation.dashboardHref} variant="secondary">
              Dashboard
            </ButtonLink>
            {viewModel.order.detailHref ? (
              <ButtonLink href={viewModel.order.detailHref} variant="primary">
                Order detail
              </ButtonLink>
            ) : null}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: SemenOrderCreationLoadingViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/orders/new"
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
  viewModel: SemenOrderCreationErrorViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/orders/new"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <UiErrorState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function OrderInput({
  label,
  name,
  required = false,
  type = "text",
  value,
}: Readonly<{
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  value: string;
}>) {
  const id = `order-${name}`;

  return (
    <Field htmlFor={id} label={label}>
      <Input id={id} name={name} type={type} defaultValue={value} required={required} />
    </Field>
  );
}

function formatStatus(value: string) {
  return formatStatusLabel(value);
}
