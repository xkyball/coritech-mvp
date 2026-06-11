import { redirect } from "next/navigation";
import { ListingManagement } from "../../../../features/listing-management/ListingManagement";
import {
  getListingManagementDemoInput,
  getListingManagementDemoRepository,
  listingManagementStationOrganizationId,
} from "../../../../features/listing-management/demo-store";
import {
  createListingManagementConfirmationViewModel,
  createListingManagementErrorState,
  createListingManagementViewModel,
  saveSemenListingFromForm,
} from "../../../../features/listing-management/view-model";

type ListingManagementSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function ListingManagementPage({
  searchParams,
}: Readonly<{
  searchParams?: ListingManagementSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return (
    <ListingManagement
      activateListingAction={activateListing}
      deactivateListingAction={deactivateListing}
      saveListingAction={saveListing}
      viewModel={viewModel}
    />
  );
}

async function saveListing(formData: FormData) {
  "use server";

  await handleListingAction(formData);
}

async function activateListing(formData: FormData) {
  "use server";

  await handleListingAction(formData, "ACTIVE");
}

async function deactivateListing(formData: FormData) {
  "use server";

  await handleListingAction(formData, "INACTIVE");
}

async function handleListingAction(
  formData: FormData,
  listingStatusOverride?: "ACTIVE" | "INACTIVE",
) {
  const form = formDataToListingForm(formData);
  const input = await getListingManagementDemoInput();
  const result = await saveSemenListingFromForm({
    actor: input.actor,
    organizationId: listingManagementStationOrganizationId,
    repository: getListingManagementDemoRepository(),
    form,
    listingStatusOverride,
    auditContext: {
      userAgent: "coritech-demo-listing-management",
    },
  });

  if (!result.ok) {
    redirect(buildListingManagementUrl({
      error: result.issues.join("\n"),
      listingId: form.listingId,
    }));
  }

  redirect(buildListingManagementUrl({
    confirmationListingId: result.listing.id ?? undefined,
    operation: result.operation,
  }));
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  const confirmationListingId = firstSearchParam(searchParams.confirmationListingId);

  try {
    const input = await getListingManagementDemoInput();

    if (confirmationListingId) {
      const record = await getListingManagementDemoRepository()
        .findSemenListingRecordById(confirmationListingId);

      if (!record) {
        throw new Error(`Semen listing was not found: ${confirmationListingId}`);
      }

      return createListingManagementConfirmationViewModel({
        record,
        operation: firstSearchParam(searchParams.operation) === "CREATE"
          ? "CREATE"
          : "UPDATE",
      });
    }

    return createListingManagementViewModel({
      ...input,
      selectedListingId: firstSearchParam(searchParams.listingId),
      form: {
        stallionId: firstSearchParam(searchParams.stallionId),
      },
      validationIssues: parseErrorParam(firstSearchParam(searchParams.error)),
    });
  } catch (error) {
    return createListingManagementErrorState(error);
  }
}

function formDataToListingForm(formData: FormData) {
  return {
    listingId: formValue(formData, "listingId"),
    stallionId: formValue(formData, "stallionId"),
    availabilityStatus: formValue(formData, "availabilityStatus"),
    listingStatus: formValue(formData, "listingStatus"),
    termsSummary: formValue(formData, "termsSummary"),
    changeReason: formValue(formData, "changeReason"),
  };
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function buildListingManagementUrl(input: {
  confirmationListingId?: string;
  error?: string;
  listingId?: string;
  operation?: string;
}) {
  const params = new URLSearchParams();

  if (input.listingId) {
    params.set("listingId", input.listingId);
  }

  if (input.confirmationListingId) {
    params.set("confirmationListingId", input.confirmationListingId);
  }

  if (input.operation) {
    params.set("operation", input.operation);
  }

  if (input.error) {
    params.set("error", input.error);
  }

  const query = params.toString();

  return query ? `/app/station/listings?${query}` : "/app/station/listings";
}

function parseErrorParam(value: string | undefined) {
  return value ? value.split("\n").filter(Boolean) : [];
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
