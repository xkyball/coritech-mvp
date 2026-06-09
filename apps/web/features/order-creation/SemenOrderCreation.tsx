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
    <main className="semen-order-creation" data-organization-id={viewModel.organizationContext.organizationId}>
      <header className="semen-order-creation__header">
        <div>
          <p className="semen-order-creation__eyebrow">Breeder order flow</p>
          <h1>{viewModel.title}</h1>
          <p>{viewModel.summary}</p>
        </div>
        <a href={viewModel.navigation.dashboardHref}>Dashboard</a>
      </header>

      <section className="semen-order-creation__section" aria-labelledby="order-listing-selector-heading">
        <h2 id="order-listing-selector-heading">Listing</h2>
        <form method="get" action={viewModel.navigation.newOrderHref}>
          <label>
            <span>Select listing</span>
            <select name="semenListingId" defaultValue={viewModel.form.semenListingId}>
              <option value="">Choose a listing</option>
              {viewModel.selectableListings.map((listing) => (
                <option key={listing.id} value={listing.id}>
                  {listing.stallionName} - {listing.stationLabel}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Review listing</button>
        </form>
      </section>

      {viewModel.selectedListing ? <ListingReview listing={viewModel.selectedListing} /> : null}
      {viewModel.validationIssues.length > 0 ? (
        <section className="semen-order-creation__alert" role="alert">
          <h2>Check order details</h2>
          <ul>
            {viewModel.validationIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="semen-order-creation__section" aria-labelledby="order-details-heading">
        <h2 id="order-details-heading">Delivery and shipping</h2>
        <form method="post">
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
          <label className="semen-order-creation__wide">
            <span>Special instructions</span>
            <textarea name="specialInstructions" defaultValue={viewModel.form.specialInstructions} />
          </label>
          <div className="semen-order-creation__actions">
            <button
              disabled={formDisabled}
              formAction={createDraftAction}
              formNoValidate
              name="intent"
              type="submit"
              value="draft"
            >
              Save draft
            </button>
            <button
              disabled={formDisabled}
              formAction={submitOrderAction}
              name="intent"
              type="submit"
              value="submit"
            >
              Submit order
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function ListingReview({
  listing,
}: Readonly<{
  listing: SemenOrderCreationListingOption;
}>) {
  return (
    <section className="semen-order-creation__section" aria-labelledby="order-listing-review-heading">
      <h2 id="order-listing-review-heading">Review stallion and station</h2>
      <dl className="semen-order-creation__details">
        <DetailTerm term="Stallion" value={listing.stallionName} />
        <DetailTerm term="Breed" value={listing.breed} />
        <DetailTerm term="Breeding station" value={listing.stationLabel} />
        <DetailTerm term="Availability" value={formatStatus(listing.availabilityStatus)} />
        <DetailTerm term="Terms" value={listing.termsSummary ?? "Not specified"} />
        <DetailTerm term="UELN" value={listing.ueln ?? "Not provided"} />
      </dl>
    </section>
  );
}

function ConfirmationState({
  viewModel,
}: Readonly<{
  viewModel: SemenOrderCreationConfirmationViewModel;
}>) {
  return (
    <main className="semen-order-creation semen-order-creation--confirmation">
      <section className="semen-order-creation__confirmation" aria-labelledby="order-confirmation-heading">
        <h1 id="order-confirmation-heading">{viewModel.title}</h1>
        <p>{viewModel.summary}</p>
        <dl>
          <DetailTerm term="Order number" value={viewModel.order.orderNumber} />
          <DetailTerm term="Status" value={formatStatus(viewModel.order.status)} />
          <DetailTerm
            term="Requested delivery"
            value={viewModel.order.requestedDeliveryDate ?? "Not set"}
          />
        </dl>
        <div className="semen-order-creation__confirmation-actions">
          <a href={viewModel.navigation.dashboardHref}>Dashboard</a>
          {viewModel.order.detailHref ? <a href={viewModel.order.detailHref}>Order detail</a> : null}
        </div>
      </section>
    </main>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: SemenOrderCreationLoadingViewModel;
}>) {
  return (
    <section className="semen-order-creation semen-order-creation--loading" aria-busy="true">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
    </section>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: SemenOrderCreationErrorViewModel;
}>) {
  return (
    <section className="semen-order-creation semen-order-creation--error" role="alert">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
    </section>
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
  return (
    <label>
      <span>{label}</span>
      <input name={name} type={type} defaultValue={value} required={required} />
    </label>
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

function formatStatus(value: string) {
  return value.toLowerCase().replace(/_/g, " ");
}
