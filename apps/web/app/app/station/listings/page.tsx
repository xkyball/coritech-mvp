import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type {
  Stallion,
  StallionLike,
} from "@coritech/domain/catalog/semen-catalog.d.ts";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { ListingManagement } from "../../../../features/listing-management/ListingManagement";
import { createPrismaCatalogRepository } from "../../../../features/listing-management/prisma-catalog-repository";
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
  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const repository = createPrismaCatalogRepository();
  const result = await saveSemenListingFromForm({
    actor: activeContext,
    organizationId: activeContext.organizationId,
    repository,
    form,
    listingStatusOverride,
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
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
    const activeContext = await requireActiveContextActor("BREEDING_STATION");
    const repository = createPrismaCatalogRepository();
    const requestedListingId = firstSearchParam(searchParams.listingId);
    const validationIssues = parseErrorParam(firstSearchParam(searchParams.error));
    let selectedListingId = requestedListingId;

    if (confirmationListingId) {
      const record = await repository.findSemenListingRecordById(confirmationListingId);

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

    if (requestedListingId) {
      const selectedRecord = await repository.findSemenListingRecordById(requestedListingId);

      if (!selectedRecord) {
        selectedListingId = undefined;
        validationIssues.push("Selected listing is no longer available.");
      }
    }

    return createListingManagementViewModel({
      actor: activeContext,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      listingRecords: await repository.listSemenListingRecords(),
      stallions: toPersistedStallionOptions(await repository.listStallions({
        breedingStationOrganizationId: activeContext.organizationId,
        status: "ACTIVE",
      })),
      selectedListingId,
      form: {
        stallionId: firstSearchParam(searchParams.stallionId),
      },
      validationIssues,
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

function toPersistedStallionOptions(stallions: Stallion[]): StallionLike[] {
  return stallions.flatMap((stallion) =>
    stallion.id
      ? [{
        id: stallion.id,
        name: stallion.name,
        breed: stallion.breed,
        ueln: stallion.ueln,
        microchipNumber: stallion.microchipNumber,
        breedingStationOrganizationId: stallion.breedingStationOrganizationId,
        status: stallion.status,
      }]
      : []
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
