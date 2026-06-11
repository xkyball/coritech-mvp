import { headers } from "next/headers";
import { redirect } from "next/navigation";

import type {
  Stallion,
  StallionLike,
} from "@coritech/domain/catalog/semen-catalog.d.ts";

import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { StallionManagement } from "../../../../features/stallion-management/StallionManagement";
import { createPrismaCatalogRepository } from "../../../../features/listing-management/prisma-catalog-repository";
import {
  createStallionManagementConfirmationViewModel,
  createStallionManagementErrorState,
  createStallionManagementViewModel,
  saveStallionFromForm,
} from "../../../../features/stallion-management/view-model";

type StallionManagementSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function StallionManagementPage({
  searchParams,
}: Readonly<{
  searchParams?: StallionManagementSearchParams;
}>) {
  const resolvedSearchParams = await searchParams;
  const viewModel = await createViewModel(resolvedSearchParams ?? {});

  return (
    <StallionManagement
      activateStallionAction={activateStallion}
      deactivateStallionAction={deactivateStallion}
      saveStallionAction={saveStallion}
      viewModel={viewModel}
    />
  );
}

async function saveStallion(formData: FormData) {
  "use server";

  await handleStallionAction(formData);
}

async function activateStallion(formData: FormData) {
  "use server";

  await handleStallionAction(formData, "ACTIVE");
}

async function deactivateStallion(formData: FormData) {
  "use server";

  await handleStallionAction(formData, "INACTIVE");
}

async function handleStallionAction(
  formData: FormData,
  statusOverride?: "ACTIVE" | "INACTIVE",
) {
  const form = formDataToStallionForm(formData);
  const activeContext = await requireActiveContextActor("BREEDING_STATION");
  const repository = createPrismaCatalogRepository();
  const result = await saveStallionFromForm({
    actor: activeContext,
    organizationId: activeContext.organizationId,
    repository,
    form,
    statusOverride,
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
  });

  if (!result.ok) {
    redirect(buildStallionManagementUrl({
      error: result.issues.join("\n"),
      stallionId: form.stallionId,
    }));
  }

  redirect(buildStallionManagementUrl({
    confirmationStallionId: result.stallion.id ?? undefined,
    operation: result.operation,
  }));
}

async function createViewModel(searchParams: Record<string, string | string[] | undefined>) {
  const confirmationStallionId = firstSearchParam(searchParams.confirmationStallionId);

  try {
    const activeContext = await requireActiveContextActor("BREEDING_STATION");
    const repository = createPrismaCatalogRepository();
    const requestedStallionId = firstSearchParam(searchParams.stallionId);
    const validationIssues = parseErrorParam(firstSearchParam(searchParams.error));
    let selectedStallionId = requestedStallionId;

    if (confirmationStallionId) {
      const stallion = await repository.findStallionById(confirmationStallionId);

      if (!stallion) {
        throw new Error(`Stallion was not found: ${confirmationStallionId}`);
      }

      return createStallionManagementConfirmationViewModel({
        stallion,
        operation: firstSearchParam(searchParams.operation) === "CREATE"
          ? "CREATE"
          : "UPDATE",
      });
    }

    if (requestedStallionId) {
      const selectedStallion = await repository.findStallionById(requestedStallionId);

      if (!selectedStallion) {
        selectedStallionId = undefined;
        validationIssues.push("Selected stallion is no longer available.");
      }
    }

    return createStallionManagementViewModel({
      actor: activeContext,
      organizationId: activeContext.organizationId,
      organizationName: activeContext.organizationName,
      stallions: toPersistedStallionRows(await repository.listStallions({
        breedingStationOrganizationId: activeContext.organizationId,
      })),
      selectedStallionId,
      searchQuery: firstSearchParam(searchParams.q),
      validationIssues,
    });
  } catch (error) {
    return createStallionManagementErrorState(error);
  }
}

function formDataToStallionForm(formData: FormData) {
  return {
    stallionId: formValue(formData, "stallionId"),
    name: formValue(formData, "name"),
    breed: formValue(formData, "breed"),
    ueln: formValue(formData, "ueln"),
    microchipNumber: formValue(formData, "microchipNumber"),
    status: formValue(formData, "status"),
    changeReason: formValue(formData, "changeReason"),
  };
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function buildStallionManagementUrl(input: {
  confirmationStallionId?: string;
  error?: string;
  operation?: string;
  stallionId?: string;
}) {
  const params = new URLSearchParams();

  if (input.stallionId) {
    params.set("stallionId", input.stallionId);
  }

  if (input.confirmationStallionId) {
    params.set("confirmationStallionId", input.confirmationStallionId);
  }

  if (input.operation) {
    params.set("operation", input.operation);
  }

  if (input.error) {
    params.set("error", input.error);
  }

  const query = params.toString();

  return query ? `/app/station/stallions?${query}` : "/app/station/stallions";
}

function parseErrorParam(value: string | undefined) {
  return value ? value.split("\n").filter(Boolean) : [];
}

function toPersistedStallionRows(stallions: Stallion[]): StallionLike[] {
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
