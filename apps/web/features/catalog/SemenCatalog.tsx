import {
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  EmptyState,
  ErrorState as UiErrorState,
  Field,
  Input,
  LoadingState as UiLoadingState,
  PageHeader,
  SectionHeader,
  Select,
  StatusBadge,
  formatStatusLabel,
} from "../../components/ui";
import type {
  SemenCatalogDetailViewModel,
  SemenCatalogErrorViewModel,
  SemenCatalogListViewModel,
  SemenCatalogListingCard,
  SemenCatalogLoadingViewModel,
  SemenCatalogRenderableViewModel,
  SemenCatalogSelectOption,
} from "./semen-catalog.d.ts";

const breederNavigation = [
  { href: "/breeder-dashboard", label: "My Orders" },
  { href: "/app/catalog", label: "Browse Semen Listings" },
  { href: "/app/orders/new", label: "Create Order" },
] as const;

export function SemenCatalog({
  viewModel,
}: Readonly<{
  viewModel: SemenCatalogRenderableViewModel;
}>) {
  if (viewModel.state === "LOADING") {
    return <LoadingState viewModel={viewModel} />;
  }

  if (viewModel.state === "ERROR") {
    return <ErrorState viewModel={viewModel} />;
  }

  if (viewModel.state === "DETAIL") {
    return <DetailView viewModel={viewModel} />;
  }

  return <ListView viewModel={viewModel} />;
}

function ListView({
  viewModel,
}: Readonly<{
  viewModel: SemenCatalogListViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/catalog"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <div className="ct-page-stack" data-actor-user-id={viewModel.actorUserId}>
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
                { label: "Catalog" },
              ]}
            />
          )}
          eyebrow="Breeder catalog"
          subtitle={viewModel.summary}
          title={viewModel.title}
        />

        <Card aria-labelledby="catalog-filters-heading">
          <SectionHeader id="catalog-filters-heading" title="Search and filters" />
          <form className="ct-form-grid ct-form-grid--filters" method="get" action={viewModel.navigation.catalogHref}>
            <Field htmlFor="stallion" label="Stallion">
              <Input
                id="stallion"
                name="stallion"
                defaultValue={viewModel.filters.stallion ?? ""}
                placeholder="Search by stallion name"
              />
            </Field>
            <FilterSelect
              emptyLabel="All breeds"
              id="breed"
              label="Breed"
              name="breed"
              options={viewModel.filterOptions.breeds}
              value={viewModel.filters.breed}
            />
            <FilterSelect
              emptyLabel="All stations"
              id="station"
              label="Station"
              name="station"
              options={viewModel.filterOptions.stations}
              value={viewModel.filters.station}
            />
            <FilterSelect
              emptyLabel="All availability"
              id="availabilityStatus"
              label="Availability"
              name="availabilityStatus"
              options={viewModel.filterOptions.availabilityStatuses}
              value={viewModel.filters.availabilityStatus}
            />
            <div className="ct-form-actions">
              <Button type="submit">Apply filters</Button>
              <ButtonLink href={viewModel.navigation.catalogHref} variant="ghost">
                Clear
              </ButtonLink>
            </div>
          </form>
        </Card>

        <Card aria-labelledby="catalog-listings-heading">
          <SectionHeader
            count={`${viewModel.listings.length} shown`}
            id="catalog-listings-heading"
            title="Active semen listings"
          />
          {viewModel.listings.length === 0 ? (
            <EmptyState message="No active semen listings match these filters." title="No listings found" />
          ) : (
            <div className="ct-card-grid">
              {viewModel.listings.map((listing) => (
                <ListingCard key={listing.id ?? listing.stallionId} listing={listing} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

function DetailView({
  viewModel,
}: Readonly<{
  viewModel: SemenCatalogDetailViewModel;
}>) {
  const listing = viewModel.listing;

  return (
    <DashboardShell
      activeHref="/app/catalog"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <div className="ct-page-stack" data-actor-user-id={viewModel.actorUserId}>
        <PageHeader
          actions={(
            <ButtonLink href={viewModel.navigation.catalogHref} variant="secondary">
              Back to catalog
            </ButtonLink>
          )}
          breadcrumb={(
            <Breadcrumbs
              items={[
                { href: viewModel.navigation.dashboardHref, label: "Breeder dashboard" },
                { href: viewModel.navigation.catalogHref, label: "Catalog" },
                { label: listing.stallionName },
              ]}
            />
          )}
          eyebrow="Listing detail"
          meta={<StatusBadge value={listing.availabilityStatus} />}
          subtitle={`${listing.breed} at ${listing.stationLabel}`}
          title={listing.stallionName}
        />

        <Card aria-labelledby="listing-detail-heading">
          <SectionHeader id="listing-detail-heading" title="Listing details" />
          <dl className="ct-description-list ct-description-list--grid">
            <DetailTerm term="Breeding station" value={listing.stationLabel} />
            <DetailTerm term="Breed" value={listing.breed} />
            <DetailTerm term="Availability" value={formatStatus(listing.availabilityStatus)} />
            <DetailTerm term="Terms" value={listing.termsSummary ?? "Not specified"} />
            <DetailTerm term="UELN" value={listing.ueln ?? "Not provided"} />
            <DetailTerm term="Microchip" value={listing.microchipNumber ?? "Not provided"} />
          </dl>
          <div className="ct-form-actions">
            {listing.canCreateOrder && listing.createOrderHref ? (
              <ButtonLink href={listing.createOrderHref} variant="primary">
                {listing.orderActionLabel}
              </ButtonLink>
            ) : (
              <>
                <Button type="button" disabled>
                  Unavailable
                </Button>
                <span>Unavailable listings cannot be ordered.</span>
              </>
            )}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}

function ListingCard({
  listing,
}: Readonly<{
  listing: SemenCatalogListingCard;
}>) {
  return (
    <article className="ct-record-card">
      <div className="ct-record-card__header">
        {listing.detailHref ? (
          <h3>
            <a href={listing.detailHref}>{listing.stallionName}</a>
          </h3>
        ) : (
          <h3>{listing.stallionName}</h3>
        )}
        <StatusBadge value={listing.availabilityStatus} />
      </div>
      <dl className="ct-description-list">
        <DetailTerm term="Breed" value={listing.breed} />
        <DetailTerm term="Station" value={listing.stationLabel} />
        <DetailTerm term="Terms" value={listing.termsSummary ?? "Not specified"} />
      </dl>
      <div className="ct-action-bar">
        {listing.detailHref ? (
          <ButtonLink href={listing.detailHref} variant="ghost">
            Details
          </ButtonLink>
        ) : null}
        {listing.canCreateOrder && listing.createOrderHref ? (
          <ButtonLink href={listing.createOrderHref} variant="primary">
            {listing.orderActionLabel}
          </ButtonLink>
        ) : (
          <Button type="button" disabled>
            Unavailable
          </Button>
        )}
      </div>
    </article>
  );
}

function FilterSelect({
  emptyLabel,
  id,
  label,
  name,
  options,
  value,
}: Readonly<{
  emptyLabel: string;
  id: string;
  label: string;
  name: string;
  options: readonly SemenCatalogSelectOption[];
  value: string | null;
}>) {
  return (
    <Field htmlFor={id} label={label}>
      <Select id={id} name={name} defaultValue={value ?? ""}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
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

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: SemenCatalogLoadingViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/catalog"
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
  viewModel: SemenCatalogErrorViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/catalog"
      navigation={breederNavigation}
      roleLabel="Breeder"
    >
      <UiErrorState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function formatStatus(value: unknown) {
  return formatStatusLabel(value);
}
