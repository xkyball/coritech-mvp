import type {
  SemenCatalogDetailViewModel,
  SemenCatalogErrorViewModel,
  SemenCatalogListViewModel,
  SemenCatalogListingCard,
  SemenCatalogLoadingViewModel,
  SemenCatalogRenderableViewModel,
  SemenCatalogSelectOption,
} from "./semen-catalog.d.ts";

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
    <main
      className={`semen-catalog${viewModel.isEmpty ? " is-empty" : ""}`}
      data-actor-user-id={viewModel.actorUserId}
    >
      <CatalogHeader
        actionHref={viewModel.navigation.dashboardHref}
        actionLabel="Dashboard"
        eyebrow="Breeder catalog"
        summary={viewModel.summary}
        title={viewModel.title}
      />

      <section className="semen-catalog__filters" aria-labelledby="catalog-filters-heading">
        <h2 id="catalog-filters-heading">Search and filters</h2>
        <form method="get" action={viewModel.navigation.catalogHref}>
          <label>
            <span>Stallion</span>
            <input
              name="stallion"
              defaultValue={viewModel.filters.stallion ?? ""}
              placeholder="Search by stallion name"
            />
          </label>
          <FilterSelect
            emptyLabel="All breeds"
            label="Breed"
            name="breed"
            options={viewModel.filterOptions.breeds}
            value={viewModel.filters.breed}
          />
          <FilterSelect
            emptyLabel="All stations"
            label="Station"
            name="station"
            options={viewModel.filterOptions.stations}
            value={viewModel.filters.station}
          />
          <FilterSelect
            emptyLabel="All availability"
            label="Availability"
            name="availabilityStatus"
            options={viewModel.filterOptions.availabilityStatuses}
            value={viewModel.filters.availabilityStatus}
          />
          <div className="semen-catalog__filter-actions">
            <button type="submit">Apply filters</button>
            <a href={viewModel.navigation.catalogHref}>Clear</a>
          </div>
        </form>
      </section>

      <section className="semen-catalog__results" aria-labelledby="catalog-listings-heading">
        <div className="semen-catalog__section-heading">
          <h2 id="catalog-listings-heading">Active semen listings</h2>
          <span>{viewModel.listings.length} shown</span>
        </div>
        {viewModel.listings.length === 0 ? (
          <p className="semen-catalog__empty">No active semen listings match these filters.</p>
        ) : (
          <div className="semen-catalog__grid">
            {viewModel.listings.map((listing) => (
              <ListingCard key={listing.id ?? listing.stallionId} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function DetailView({
  viewModel,
}: Readonly<{
  viewModel: SemenCatalogDetailViewModel;
}>) {
  const listing = viewModel.listing;

  return (
    <main className="semen-catalog semen-catalog--detail" data-actor-user-id={viewModel.actorUserId}>
      <CatalogHeader
        actionHref={viewModel.navigation.catalogHref}
        actionLabel="Back to catalog"
        eyebrow="Listing detail"
        summary={`${listing.breed} at ${listing.stationLabel}`}
        title={listing.stallionName}
      />

      <section className="semen-catalog__detail-panel" aria-labelledby="listing-detail-heading">
        <div className="semen-catalog__detail-heading">
          <p>{formatStatus(listing.availabilityStatus)}</p>
          <h2 id="listing-detail-heading">Listing details</h2>
        </div>
        <dl className="semen-catalog__details">
          <DetailTerm term="Breeding station" value={listing.stationLabel} />
          <DetailTerm term="Breed" value={listing.breed} />
          <DetailTerm term="Availability" value={formatStatus(listing.availabilityStatus)} />
          <DetailTerm term="Terms" value={listing.termsSummary ?? "Not specified"} />
          <DetailTerm term="UELN" value={listing.ueln ?? "Not provided"} />
          <DetailTerm term="Microchip" value={listing.microchipNumber ?? "Not provided"} />
        </dl>
        <div className="semen-catalog__detail-action">
          {listing.canCreateOrder && listing.createOrderHref ? (
            <a className="semen-catalog__button" href={listing.createOrderHref}>
              {listing.orderActionLabel}
            </a>
          ) : (
            <>
              <button className="semen-catalog__button" type="button" disabled>
                Unavailable
              </button>
              <p>Unavailable listings cannot be ordered.</p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function ListingCard({
  listing,
}: Readonly<{
  listing: SemenCatalogListingCard;
}>) {
  return (
    <article className="semen-catalog__listing">
      <div className="semen-catalog__listing-heading">
        {listing.detailHref ? (
          <h3>
            <a href={listing.detailHref}>{listing.stallionName}</a>
          </h3>
        ) : (
          <h3>{listing.stallionName}</h3>
        )}
        <span>{formatStatus(listing.availabilityStatus)}</span>
      </div>
      <dl>
        <DetailTerm term="Breed" value={listing.breed} />
        <DetailTerm term="Station" value={listing.stationLabel} />
        <DetailTerm term="Terms" value={listing.termsSummary ?? "Not specified"} />
      </dl>
      <div className="semen-catalog__listing-actions">
        {listing.detailHref ? <a href={listing.detailHref}>Details</a> : null}
        {listing.canCreateOrder && listing.createOrderHref ? (
          <a className="semen-catalog__button" href={listing.createOrderHref}>
            {listing.orderActionLabel}
          </a>
        ) : (
          <button className="semen-catalog__button" type="button" disabled>
            Unavailable
          </button>
        )}
      </div>
    </article>
  );
}

function CatalogHeader({
  actionHref,
  actionLabel,
  eyebrow,
  summary,
  title,
}: Readonly<{
  actionHref: string;
  actionLabel: string;
  eyebrow: string;
  summary: string;
  title: string;
}>) {
  return (
    <header className="semen-catalog__header">
      <div>
        <p className="semen-catalog__eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{summary}</p>
      </div>
      <a className="semen-catalog__secondary-link" href={actionHref}>
        {actionLabel}
      </a>
    </header>
  );
}

function FilterSelect({
  emptyLabel,
  label,
  name,
  options,
  value,
}: Readonly<{
  emptyLabel: string;
  label: string;
  name: string;
  options: readonly SemenCatalogSelectOption[];
  value: string | null;
}>) {
  return (
    <label>
      <span>{label}</span>
      <select name={name} defaultValue={value ?? ""}>
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: SemenCatalogLoadingViewModel;
}>) {
  return (
    <section className="semen-catalog semen-catalog--loading" aria-busy="true">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
      <div className="semen-catalog__skeleton-grid" aria-hidden="true">
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
  viewModel: SemenCatalogErrorViewModel;
}>) {
  return (
    <section className="semen-catalog semen-catalog--error" role="alert">
      <h1>{viewModel.title}</h1>
      <p>{viewModel.message}</p>
    </section>
  );
}

function formatStatus(value: unknown) {
  return String(value).toLowerCase().replace(/_/g, " ");
}
