import { createHash } from "node:crypto";

import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import {
  Breadcrumbs,
  ButtonLink,
  Card,
  DashboardShell,
  DetailList,
  ErrorState,
  Field,
  Input,
  PageHeader,
  SectionHeader,
  Select,
  StatusBadge,
  Textarea,
  Button,
} from "../../../../components/ui";
import { requireActiveContextActor } from "../../../../features/auth/active-context-server";
import { createPrismaDocumentRepository } from "../../../../features/documents/prisma-document-repository";
import { getDocumentObjectStorageProvider } from "../../../../features/documents/object-storage-runtime";
import { getNavigationForRole } from "../../../../features/navigation";
import {
  DocumentEvidenceAuthorizationError,
  DocumentEvidenceNotFoundError,
} from "@coritech/domain/documents/document-evidence.mjs";
import {
  createControlledDocumentAccessUrl,
  replaceDocumentFile,
  revokeDocumentFile,
} from "@coritech/domain/documents/document-storage.mjs";

type DocumentParams = Promise<{ documentId: string }> | { documentId: string };

export default async function DocumentDetailPage({
  params,
}: Readonly<{
  params: DocumentParams;
}>) {
  const activeContext = await requireActiveContextActor();
  const { documentId } = await params;
  const result = await loadDocumentAccess(documentId);

  if (result.status === "not-found") {
    notFound();
  }

  return (
    <DashboardShell
      activeHref="/app/documents/upload"
      navigation={getNavigationForRole(activeContext.roleCode)}
      organizationName={activeContext.organizationName}
      roleLabel={roleLabel(activeContext.roleCode)}
    >
      {result.status === "forbidden" ? (
        <ErrorState
          message="This document is not visible to the current organization and role context."
          title="Document access denied"
        />
      ) : (
        <div className="ct-page-stack">
          <PageHeader
            actions={(
              <ButtonLink href={result.accessUrl} rel="noreferrer" target="_blank">
                Open controlled file
              </ButtonLink>
            )}
            breadcrumb={(
              <Breadcrumbs
                items={[
                  { href: defaultReturnTo(activeContext.roleCode), label: "Workspace" },
                  { label: result.document.originalFileName },
                ]}
              />
            )}
            eyebrow="Controlled document"
            meta={<StatusBadge value={result.document.accessClassification} />}
            subtitle={`Access URL expires at ${result.expiresAt}.`}
            title={result.document.originalFileName}
          />

          <Card aria-labelledby="document-metadata-heading">
            <SectionHeader
              id="document-metadata-heading"
              subtitle="Storage identifiers stay server-side; this page exposes only controlled access."
              title="Document metadata"
            />
            <DetailList
              items={[
                { term: "Type", value: result.document.documentType },
                { term: "Status", value: result.document.status },
                { term: "Linked object", value: `${result.document.targetType} ${result.document.orderNumber ?? result.document.targetId}` },
                { term: "Content type", value: result.document.contentType },
                { term: "File size", value: `${result.document.fileSizeBytes} bytes` },
                { term: "Uploaded", value: result.document.createdAt },
                { term: "Checksum", value: result.document.checksumSha256 ?? "Not recorded" },
              ]}
            />
          </Card>

          {result.document.status === "ACTIVE" ? (
            <Card aria-labelledby="document-lifecycle-heading">
              <SectionHeader
                id="document-lifecycle-heading"
                subtitle="Lifecycle changes require a reason and are recorded in the audit trail."
                title="Lifecycle actions"
              />
              <form action={revokeDocumentAction}>
                <div className="ct-form-grid">
                  <input name="documentId" type="hidden" value={result.document.id ?? ""} />
                  <Field className="ct-field--wide" htmlFor="revokeReason" label="Revocation reason">
                    <Textarea id="revokeReason" name="reason" required rows={3} />
                  </Field>
                  <div className="ct-form-actions">
                    <Button type="submit" variant="danger">
                      Revoke document
                    </Button>
                  </div>
                </div>
              </form>
              <form action={replaceDocumentAction}>
                <div className="ct-form-grid">
                  <input name="documentId" type="hidden" value={result.document.id ?? ""} />
                  <Field htmlFor="replacementDocumentType" label="Replacement type">
                    <Select
                      defaultValue={result.document.documentType}
                      id="replacementDocumentType"
                      name="documentType"
                      required
                    >
                      {[
                        "Shipment Document",
                        "Station Confirmation",
                        "Certificate",
                        "Vet Report prepared",
                        "Other Evidence",
                      ].map((option) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field htmlFor="replacementFile" label="Replacement file">
                    <Input
                      accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx,application/pdf,image/jpeg,image/png,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      id="replacementFile"
                      name="file"
                      required
                      type="file"
                    />
                  </Field>
                  <Field className="ct-field--wide" htmlFor="replacementReason" label="Replacement reason">
                    <Textarea id="replacementReason" name="reason" required rows={3} />
                  </Field>
                  <Field className="ct-field--wide" htmlFor="replacementDescription" label="Replacement description">
                    <Textarea id="replacementDescription" name="description" rows={3} />
                  </Field>
                  <div className="ct-form-actions">
                    <Button type="submit">
                      Replace document
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          ) : null}
        </div>
      )}
    </DashboardShell>
  );
}

async function revokeDocumentAction(formData: FormData) {
  "use server";

  const documentId = formValue(formData, "documentId");
  const actor = await requireActiveContextActor();

  await revokeDocumentFile({
    actor,
    repository: createPrismaDocumentRepository(),
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
    documentId,
    reason: formValue(formData, "reason"),
  });

  redirect(`/app/documents/${encodeURIComponent(documentId)}`);
}

async function replaceDocumentAction(formData: FormData) {
  "use server";

  const documentId = formValue(formData, "documentId");
  const file = formData.get("file");

  if (!(file instanceof File)) {
    redirect(`/app/documents/${encodeURIComponent(documentId)}`);
  }

  const body = new Uint8Array(await file.arrayBuffer());
  const actor = await requireActiveContextActor();
  const result = await replaceDocumentFile({
    actor,
    repository: createPrismaDocumentRepository(),
    storageProvider: getDocumentObjectStorageProvider(),
    auditContext: {
      userAgent: (await headers()).get("user-agent"),
    },
    documentId,
    reason: formValue(formData, "reason"),
    documentType: formValue(formData, "documentType"),
    description: optionalFormValue(formData, "description"),
    originalFileName: file.name,
    contentType: file.type || "application/octet-stream",
    fileSizeBytes: file.size,
    checksumSha256: createHash("sha256").update(body).digest("hex"),
    body,
  });

  redirect(`/app/documents/${encodeURIComponent(result.body.replacementDocument.id ?? documentId)}`);
}

function formValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" ? value : "";
}

function optionalFormValue(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);

  return typeof value === "string" && value.trim() ? value : null;
}

async function loadDocumentAccess(documentId: string): Promise<
  | Awaited<ReturnType<typeof toReadyResult>>
  | { status: "forbidden" }
  | { status: "not-found" }
> {
  try {
    const actor = await requireActiveContextActor();
    const result = await createControlledDocumentAccessUrl({
      actor,
      repository: createPrismaDocumentRepository(),
      storageProvider: getDocumentObjectStorageProvider(),
      auditContext: {
        userAgent: (await headers()).get("user-agent"),
      },
      documentId,
    });

    return toReadyResult(result);
  } catch (error) {
    if (error instanceof DocumentEvidenceAuthorizationError) {
      return { status: "forbidden" };
    }

    if (error instanceof DocumentEvidenceNotFoundError) {
      return { status: "not-found" };
    }

    throw error;
  }
}

function toReadyResult(result: Awaited<ReturnType<typeof createControlledDocumentAccessUrl>>) {
  return {
    status: "ready" as const,
    accessUrl: result.body.accessUrl,
    document: result.body.document,
    expiresAt: result.body.expiresAt,
  };
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
