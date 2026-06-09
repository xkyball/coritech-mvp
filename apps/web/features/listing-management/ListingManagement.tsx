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
  Table,
  Textarea,
  formatStatusLabel,
} from "../../components/ui";
import type {
  ListingManagementConfirmationViewModel,
  ListingManagementErrorViewModel,
  ListingManagementFormViewModel,
  ListingManagementListingRow,
  ListingManagementLoadingViewModel,
  ListingManagementRenderableViewModel,
  ListingManagementStallionOption,
} from "./listing-management.d.ts";

type FormAction = (formData: FormData) => void | Promise<void>;

const stationNavigation = [
  { href: "/station-dashboard", label: "Station Overview" },
  { href: "/app/station/listings", label: "Listing Management" },
  { href: "/app/station/orders", label: "Order Management" },
] as const;

export function ListingManagement({
  activateListingAction,
  deactivateListingAction,
  saveListingAction,
  viewModel,
}: Readonly<{
  activateListingAction?: FormAction;
  deactivateListingAction?: FormAction;
  saveListingAction?: FormAction;
  viewModel: ListingManagementRenderableViewModel;
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
    <ListingManagementForm
      activateListingAction={activateListingAction}
      deactivateListingAction={deactivateListingAction}
      saveListingAction={saveListingAction}
      viewModel={viewModel}
    />
  );
}

function ListingManagementForm({
  activateListingAction,
  deactivateListingAction,
  saveListingAction,
  viewModel,
}: Readonly<{
  activateListingAction?: FormAction;
  deactivateListingAction?: FormAction;
  saveListingAction?: FormAction;
  viewModel: ListingManagementFormViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/listings"
      navigation={stationNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeding Station"
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
                { href: viewModel.navigation.dashboardHref, label: "Station dashboard" },
                { label: "Listing management" },
              ]}
            />
          )}
          eyebrow="Station catalog control"
          subtitle={viewModel.summary}
          title={viewModel.title}
        />

        {viewModel.validationIssues.length > 0 ? (
          <section className="ct-alert" role="alert">
            <h2>Check listing details</h2>
            <ul>
              {viewModel.validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <EditorCard saveListingAction={saveListingAction} viewModel={viewModel} />
        <ListingTable
          activateListingAction={activateListingAction}
          deactivateListingAction={deactivateListingAction}
          listings={viewModel.listings}
        />
      </div>
    </DashboardShell>
  );
}

function EditorCard({
  saveListingAction,
  viewModel,
}: Readonly<{
  saveListingAction?: FormAction;
  viewModel: ListingManagementFormViewModel;
}>) {
  const isEdit = viewModel.mode === "EDIT";

  return (
    <Card aria-labelledby="listing-editor-heading">
      <SectionHeader
        id="listing-editor-heading"
        subtitle={isEdit ? "Update availability, status and station terms." : "Link a station-owned active stallion to a semen listing."}
        title={isEdit ? "Edit listing" : "Create listing"}
      />
      <form className="ct-form-grid" method="post">
        <input type="hidden" name="listingId" value={viewModel.form.listingId} />
        {isEdit ? (
          <input type="hidden" name="stallionId" value={viewModel.form.stallionId} />
        ) : (
          <StallionSelect
            options={viewModel.stallionOptions}
            value={viewModel.form.stallionId}
          />
        )}
        <StatusSelect
          label="Availability"
          name="availabilityStatus"
          options={viewModel.availabilityStatuses}
          value={viewModel.form.availabilityStatus}
        />
        <StatusSelect
          label="Listing status"
          name="listingStatus"
          options={viewModel.listingStatuses}
          value={viewModel.form.listingStatus}
        />
        <Field htmlFor="listing-termsSummary" label="Terms summary" className="ct-field--wide">
          <Textarea
            id="listing-termsSummary"
            name="termsSummary"
            defaultValue={viewModel.form.termsSummary}
          />
        </Field>
        <Field
          htmlFor="listing-changeReason"
          label="Change reason"
          hint="Required for the listing audit trail."
          className="ct-field--wide"
        >
          <Input
            id="listing-changeReason"
            name="changeReason"
            defaultValue={viewModel.form.changeReason}
            required
          />
        </Field>
        <div className="ct-form-actions">
          <Button formAction={saveListingAction} type="submit">
            Save listing
          </Button>
          {isEdit ? (
            <ButtonLink href={viewModel.navigation.listingManagementHref} variant="secondary">
              Create another
            </ButtonLink>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function StallionSelect({
  options,
  value,
}: Readonly<{
  options: readonly ListingManagementStallionOption[];
  value: string;
}>) {
  return (
    <Field htmlFor="listing-stallionId" label="Linked stallion">
      <Select id="listing-stallionId" name="stallionId" defaultValue={value} required>
        <option value="">Choose a stallion</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function StatusSelect({
  label,
  name,
  options,
  value,
}: Readonly<{
  label: string;
  name: string;
  options: readonly string[];
  value: string;
}>) {
  const id = `listing-${name}`;

  return (
    <Field htmlFor={id} label={label}>
      <Select id={id} name={name} defaultValue={value} required>
        {options.map((option) => (
          <option key={option} value={option}>
            {formatStatus(option)}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function ListingTable({
  activateListingAction,
  deactivateListingAction,
  listings,
}: Readonly<{
  activateListingAction?: FormAction;
  deactivateListingAction?: FormAction;
  listings: readonly ListingManagementListingRow[];
}>) {
  return (
    <Card aria-labelledby="station-listings-heading">
      <SectionHeader
        count={`${listings.length} total`}
        id="station-listings-heading"
        title="Station listings"
      />
      {listings.length === 0 ? (
        <EmptyState
          message="Create the first station-owned semen listing from an active stallion."
          title="No station listings"
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Stallion</th>
              <th>Availability</th>
              <th>Status</th>
              <th>Terms</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id ?? listing.stallionId}>
                <td>{listing.stallionName}</td>
                <td><StatusBadge value={listing.availabilityStatus} /></td>
                <td><StatusBadge value={listing.listingStatus} /></td>
                <td>{listing.termsSummary ?? "Not specified"}</td>
                <td>
                  <div className="ct-action-bar">
                    {listing.editHref ? (
                      <ButtonLink href={listing.editHref} variant="ghost">
                        Edit
                      </ButtonLink>
                    ) : null}
                    {listing.canDeactivate ? (
                      <ActivationForm
                        action={deactivateListingAction}
                        label="Deactivate"
                        listing={listing}
                        nextStatus="INACTIVE"
                      />
                    ) : null}
                    {listing.canActivate ? (
                      <ActivationForm
                        action={activateListingAction}
                        label="Activate"
                        listing={listing}
                        nextStatus="ACTIVE"
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function ActivationForm({
  action,
  label,
  listing,
  nextStatus,
}: Readonly<{
  action?: FormAction;
  label: string;
  listing: ListingManagementListingRow;
  nextStatus: "ACTIVE" | "INACTIVE";
}>) {
  return (
    <form method="post">
      <input type="hidden" name="listingId" value={listing.id ?? ""} />
      <input type="hidden" name="stallionId" value={listing.stallionId} />
      <input type="hidden" name="availabilityStatus" value={listing.availabilityStatus} />
      <input type="hidden" name="listingStatus" value={nextStatus} />
      <input type="hidden" name="termsSummary" value={listing.termsSummary ?? ""} />
      <input type="hidden" name="changeReason" value={`${label}d from station listing management.`} />
      <Button formAction={action} type="submit" variant={nextStatus === "ACTIVE" ? "secondary" : "danger"}>
        {label}
      </Button>
    </form>
  );
}

function ConfirmationState({
  viewModel,
}: Readonly<{
  viewModel: ListingManagementConfirmationViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/listings"
      navigation={stationNavigation}
      roleLabel="Breeding Station"
    >
      <div className="ct-page-stack">
        <PageHeader
          actions={(
            <ButtonLink href={viewModel.navigation.listingManagementHref} variant="secondary">
              Back to listings
            </ButtonLink>
          )}
          eyebrow="Listing saved"
          meta={<StatusBadge value={viewModel.listing.listingStatus} />}
          subtitle={viewModel.summary}
          title={viewModel.title}
        />
        <Card aria-labelledby="listing-confirmation-heading">
          <SectionHeader
            actions={<StatusBadge value={viewModel.listing.availabilityStatus} />}
            id="listing-confirmation-heading"
            title={viewModel.listing.stallionName}
          />
          <dl className="ct-description-list ct-description-list--grid">
            <DetailTerm term="Breed" value={viewModel.listing.breed} />
            <DetailTerm term="Availability" value={formatStatus(viewModel.listing.availabilityStatus)} />
            <DetailTerm term="Listing status" value={formatStatus(viewModel.listing.listingStatus)} />
            <DetailTerm term="Terms" value={viewModel.listing.termsSummary ?? "Not specified"} />
            <DetailTerm
              term="Audit action"
              value={viewModel.auditHook ? formatStatus(viewModel.auditHook.action) : "Audit hook unavailable"}
            />
          </dl>
        </Card>
      </div>
    </DashboardShell>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: ListingManagementLoadingViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/listings"
      navigation={stationNavigation}
      organizationName={viewModel.title}
      roleLabel="Breeding Station"
    >
      <UiLoadingState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
  );
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: ListingManagementErrorViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/listings"
      navigation={stationNavigation}
      roleLabel="Breeding Station"
    >
      <UiErrorState message={viewModel.message} title={viewModel.title} />
    </DashboardShell>
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
  return formatStatusLabel(value);
}
