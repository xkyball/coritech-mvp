import {
  Alert,
  Breadcrumbs,
  Button,
  ButtonLink,
  Card,
  DashboardShell,
  DetailList,
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
  formatStatusLabel,
} from "../../components/ui";
import { stationNavigation } from "../navigation";
import type {
  StallionManagementConfirmationViewModel,
  StallionManagementErrorViewModel,
  StallionManagementFormViewModel,
  StallionManagementLoadingViewModel,
  StallionManagementRenderableViewModel,
  StallionManagementStallionRow,
} from "./stallion-management.d.ts";

type FormAction = (formData: FormData) => void | Promise<void>;

export function StallionManagement({
  activateStallionAction,
  deactivateStallionAction,
  saveStallionAction,
  viewModel,
}: Readonly<{
  activateStallionAction?: FormAction;
  deactivateStallionAction?: FormAction;
  saveStallionAction?: FormAction;
  viewModel: StallionManagementRenderableViewModel;
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
    <StallionManagementForm
      activateStallionAction={activateStallionAction}
      deactivateStallionAction={deactivateStallionAction}
      saveStallionAction={saveStallionAction}
      viewModel={viewModel}
    />
  );
}

function StallionManagementForm({
  activateStallionAction,
  deactivateStallionAction,
  saveStallionAction,
  viewModel,
}: Readonly<{
  activateStallionAction?: FormAction;
  deactivateStallionAction?: FormAction;
  saveStallionAction?: FormAction;
  viewModel: StallionManagementFormViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/stallions"
      navigation={stationNavigation}
      organizationName={viewModel.organizationContext.organizationName}
      roleLabel="Breeding Station"
    >
      <div className="ct-page-stack" data-organization-id={viewModel.organizationContext.organizationId}>
        <PageHeader
          actions={(
            <ButtonLink href={viewModel.navigation.listingManagementHref} variant="secondary">
              Create listing
            </ButtonLink>
          )}
          breadcrumb={(
            <Breadcrumbs
              items={[
                { href: viewModel.navigation.dashboardHref, label: "Station dashboard" },
                { label: "Stallion management" },
              ]}
            />
          )}
          eyebrow="Station catalog control"
          subtitle={viewModel.summary}
          title={viewModel.title}
        />

        {viewModel.validationIssues.length > 0 ? (
          <Alert title="Check stallion details">
            <ul>
              {viewModel.validationIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          </Alert>
        ) : null}

        <EditorCard saveStallionAction={saveStallionAction} viewModel={viewModel} />
        <StallionTable
          activateStallionAction={activateStallionAction}
          deactivateStallionAction={deactivateStallionAction}
          searchQuery={viewModel.searchQuery}
          stallions={viewModel.stallions}
        />
      </div>
    </DashboardShell>
  );
}

function EditorCard({
  saveStallionAction,
  viewModel,
}: Readonly<{
  saveStallionAction?: FormAction;
  viewModel: StallionManagementFormViewModel;
}>) {
  const isEdit = viewModel.mode === "EDIT";

  return (
    <Card aria-labelledby="stallion-editor-heading">
      <SectionHeader
        id="stallion-editor-heading"
        subtitle={isEdit ? "Update the station-owned stallion profile." : "Create a station-owned stallion for future listings."}
        title={isEdit ? "Edit stallion" : "Create stallion"}
      />
      <form className="ct-form-grid" method="post">
        <input type="hidden" name="stallionId" value={viewModel.form.stallionId} />
        <Field htmlFor="stallion-name" label="Name">
          <Input id="stallion-name" name="name" defaultValue={viewModel.form.name} required />
        </Field>
        <Field htmlFor="stallion-breed" label="Breed">
          <Input id="stallion-breed" name="breed" defaultValue={viewModel.form.breed} required />
        </Field>
        <Field htmlFor="stallion-ueln" label="UELN">
          <Input id="stallion-ueln" name="ueln" defaultValue={viewModel.form.ueln} />
        </Field>
        <Field htmlFor="stallion-microchipNumber" label="Chip ID">
          <Input
            id="stallion-microchipNumber"
            name="microchipNumber"
            defaultValue={viewModel.form.microchipNumber}
          />
        </Field>
        <Field htmlFor="stallion-status" label="Status">
          <Select id="stallion-status" name="status" defaultValue={viewModel.form.status} required>
            {viewModel.statuses.map((status) => (
              <option key={status} value={status}>
                {formatStatusLabel(status)}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          className="ct-field--wide"
          hint="Required for the stallion audit trail."
          htmlFor="stallion-changeReason"
          label="Change reason"
        >
          <Input
            id="stallion-changeReason"
            name="changeReason"
            defaultValue={viewModel.form.changeReason}
            required
          />
        </Field>
        <div className="ct-form-actions">
          <Button formAction={saveStallionAction} type="submit">
            Save stallion
          </Button>
          {isEdit ? (
            <ButtonLink href={viewModel.navigation.stallionManagementHref} variant="secondary">
              Create another
            </ButtonLink>
          ) : null}
        </div>
      </form>
    </Card>
  );
}

function StallionTable({
  activateStallionAction,
  deactivateStallionAction,
  searchQuery,
  stallions,
}: Readonly<{
  activateStallionAction?: FormAction;
  deactivateStallionAction?: FormAction;
  searchQuery: string;
  stallions: readonly StallionManagementStallionRow[];
}>) {
  return (
    <Card aria-labelledby="station-stallions-heading">
      <SectionHeader
        count={`${stallions.length} total`}
        id="station-stallions-heading"
        subtitle="Search by name, UELN or chip ID."
        title="Station stallions"
      />
      <form className="ct-filter-bar" method="get">
        <Field htmlFor="stallion-search" label="Search">
          <Input id="stallion-search" name="q" defaultValue={searchQuery} />
        </Field>
        <div className="ct-form-actions">
          <Button type="submit" variant="secondary">
            Search
          </Button>
          <ButtonLink href="/app/station/stallions" variant="ghost">
            Clear
          </ButtonLink>
        </div>
      </form>
      {stallions.length === 0 ? (
        <EmptyState
          message="Create the first station-owned stallion before opening a listing."
          title="No stallions found"
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Breed</th>
              <th>Identifiers</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stallions.map((stallion) => (
              <tr key={stallion.id}>
                <td>{stallion.name}</td>
                <td>{stallion.breed}</td>
                <td>
                  <DetailList
                    className="ct-description-list--compact"
                    items={[
                      { term: "UELN", value: stallion.ueln ?? "Not recorded" },
                      { term: "Chip", value: stallion.microchipNumber ?? "Not recorded" },
                    ]}
                  />
                </td>
                <td><StatusBadge value={stallion.status} /></td>
                <td>
                  <div className="ct-table-actions">
                    <ButtonLink href={stallion.editHref} variant="secondary">
                      Edit
                    </ButtonLink>
                    {stallion.createListingHref ? (
                      <ButtonLink href={stallion.createListingHref} variant="ghost">
                        Create listing
                      </ButtonLink>
                    ) : null}
                    {stallion.canDeactivate ? (
                      <StallionStatusAction
                        action={deactivateStallionAction}
                        label="Inactivate"
                        nextStatus="INACTIVE"
                        reason="Inactivated from station stallion management."
                        stallion={stallion}
                      />
                    ) : null}
                    {stallion.canActivate ? (
                      <StallionStatusAction
                        action={activateStallionAction}
                        label="Activate"
                        nextStatus="ACTIVE"
                        reason="Activated from station stallion management."
                        stallion={stallion}
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

function StallionStatusAction({
  action,
  label,
  nextStatus,
  reason,
  stallion,
}: Readonly<{
  action?: FormAction;
  label: string;
  nextStatus: "ACTIVE" | "INACTIVE";
  reason: string;
  stallion: StallionManagementStallionRow;
}>) {
  return (
    <form method="post">
      <input type="hidden" name="stallionId" value={stallion.id} />
      <input type="hidden" name="name" value={stallion.name} />
      <input type="hidden" name="breed" value={stallion.breed} />
      <input type="hidden" name="ueln" value={stallion.ueln ?? ""} />
      <input type="hidden" name="microchipNumber" value={stallion.microchipNumber ?? ""} />
      <input type="hidden" name="status" value={nextStatus} />
      <input type="hidden" name="changeReason" value={reason} />
      <Button formAction={action} type="submit" variant={nextStatus === "INACTIVE" ? "danger" : "secondary"}>
        {label}
      </Button>
    </form>
  );
}

function ConfirmationState({
  viewModel,
}: Readonly<{
  viewModel: StallionManagementConfirmationViewModel;
}>) {
  return (
    <DashboardShell
      activeHref="/app/station/stallions"
      navigation={stationNavigation}
      roleLabel="Breeding Station"
    >
      <div className="ct-page-stack">
        <PageHeader
          actions={(
            <>
              <ButtonLink href={viewModel.navigation.stallionManagementHref}>
                Back to stallions
              </ButtonLink>
              {viewModel.stallion.createListingHref ? (
                <ButtonLink href={viewModel.stallion.createListingHref} variant="secondary">
                  Create listing
                </ButtonLink>
              ) : null}
            </>
          )}
          eyebrow="Station catalog control"
          subtitle={viewModel.summary}
          title={viewModel.title}
        />
        <Card aria-labelledby="stallion-confirmation-heading">
          <SectionHeader
            id="stallion-confirmation-heading"
            subtitle={viewModel.auditHook ? formatStatusLabel(viewModel.auditHook.action) : "Audit hook unavailable"}
            title={viewModel.stallion.name}
          />
          <DetailList
            items={[
              { term: "Breed", value: viewModel.stallion.breed },
              { term: "Status", value: <StatusBadge value={viewModel.stallion.status} /> },
              { term: "Audit object", value: viewModel.auditHook?.targetType ?? "Not recorded" },
              { term: "Audit log", value: viewModel.auditLog?.id ?? "Pending repository write" },
            ]}
          />
        </Card>
      </div>
    </DashboardShell>
  );
}

function LoadingState({
  viewModel,
}: Readonly<{
  viewModel: StallionManagementLoadingViewModel;
}>) {
  return <UiLoadingState message={viewModel.message} title={viewModel.title} />;
}

function ErrorState({
  viewModel,
}: Readonly<{
  viewModel: StallionManagementErrorViewModel;
}>) {
  return <UiErrorState message={viewModel.message} title={viewModel.title} />;
}
