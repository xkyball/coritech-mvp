import {
  Breadcrumbs,
  Card,
  DashboardShell,
  PageHeader,
  SectionHeader,
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { DocumentUploadForm } from "../../../../features/documents/DocumentUploadForm";
import { getNavigationForRole } from "../../../../features/navigation";

type UploadSearchParams =
  | Promise<Record<string, string | string[] | undefined>>
  | Record<string, string | string[] | undefined>;

export default async function DocumentUploadPage({
  searchParams,
}: Readonly<{
  searchParams?: UploadSearchParams;
}>) {
  const activeContext = await requireActiveContextActor();
  const params = (await searchParams) ?? {};
  const returnTo = firstSearchParam(params.returnTo) ?? defaultReturnTo(activeContext.roleCode);

  return (
    <DashboardShell
      activeHref="/app/documents/upload"
      navigation={getNavigationForRole(activeContext.roleCode)}
      organizationName={activeContext.organizationName}
      roleLabel={roleLabel(activeContext.roleCode)}
    >
      <div className="ct-page-stack">
        <PageHeader
          breadcrumb={(
            <Breadcrumbs
              items={[
                { href: returnTo, label: "Workflow" },
                { label: "Upload document" },
              ]}
            />
          )}
          eyebrow="Controlled documents"
          subtitle="Upload evidence against an order, shipment or proof event using controlled storage and permissioned access."
          title="Upload document"
        />

        <Card aria-labelledby="document-upload-heading">
          <SectionHeader
            id="document-upload-heading"
            subtitle="Classification is required before CoriTech stores the document and creates an audit entry."
            title="Document details"
          />
          <DocumentUploadForm
            initialTargetId={firstSearchParam(params.targetId)}
            initialTargetType={firstSearchParam(params.targetType)}
            returnTo={returnTo}
            roleCode={activeContext.roleCode}
          />
        </Card>
      </div>
    </DashboardShell>
  );
}

function firstSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function defaultReturnTo(roleCode: string) {
  if (roleCode === "BREEDING_STATION") {
    return "/station-dashboard";
  }

  if (roleCode === "PLATFORM_ADMIN") {
    return "/app/admin";
  }

  return "/breeder-dashboard";
}

function roleLabel(roleCode: string) {
  if (roleCode === "BREEDING_STATION") {
    return "Breeding station";
  }

  if (roleCode === "PLATFORM_ADMIN") {
    return "Platform admin";
  }

  return "Breeder";
}
