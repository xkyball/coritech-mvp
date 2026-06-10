"use client";

import { useMemo, useState, type FormEvent } from "react";

import {
  Button,
  ButtonLink,
  Field,
  Input,
  Notice,
  Select,
  Textarea,
} from "../../components/ui";

type RoleCode = "BREEDER" | "BREEDING_STATION" | "PLATFORM_ADMIN";
type UploadState =
  | { status: "idle" }
  | { status: "uploading" }
  | { status: "success"; documentId: string | null; fileName: string }
  | { status: "error"; message: string; issues: readonly string[] };

const DOCUMENT_TYPE_OPTIONS = [
  "Shipment Document",
  "Station Confirmation",
  "Certificate",
  "Vet Report prepared",
  "Other Evidence",
] as const;

const TARGET_TYPE_OPTIONS = [
  ["SemenOrder", "Order"],
  ["Shipment", "Shipment"],
  ["ProofEvent", "Proof event"],
] as const;

const ACCESS_CLASSIFICATION_OPTIONS: Record<RoleCode, readonly string[]> = {
  BREEDER: ["ORDER_PARTICIPANTS", "RESTRICTED"],
  BREEDING_STATION: ["ORDER_PARTICIPANTS", "INTERNAL", "RESTRICTED"],
  PLATFORM_ADMIN: ["ORDER_PARTICIPANTS", "INTERNAL", "RESTRICTED", "ADMIN_ONLY"],
};

export function DocumentUploadForm({
  initialTargetId,
  initialTargetType,
  returnTo,
  roleCode,
}: Readonly<{
  initialTargetId?: string | null;
  initialTargetType?: string | null;
  returnTo?: string | null;
  roleCode: RoleCode;
}>) {
  const [uploadState, setUploadState] = useState<UploadState>({ status: "idle" });
  const accessOptions = useMemo(
    () => ACCESS_CLASSIFICATION_OPTIONS[roleCode] ?? ACCESS_CLASSIFICATION_OPTIONS.BREEDER,
    [roleCode],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    setUploadState({ status: "uploading" });

    try {
      const response = await fetch("/api/documents/upload", {
        body: formData,
        method: "POST",
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        setUploadState({
          status: "error",
          message: typeof payload.error === "string" ? payload.error : "Document upload failed.",
          issues: Array.isArray(payload.issues) ? payload.issues.map(String) : [],
        });
        return;
      }

      setUploadState({
        status: "success",
        documentId: typeof payload.document?.id === "string" ? payload.document.id : null,
        fileName: file instanceof File ? file.name : "Document",
      });
      form.reset();
    } catch {
      setUploadState({
        status: "error",
        message: "Document upload failed.",
        issues: [],
      });
    }
  }

  return (
    <form aria-busy={uploadState.status === "uploading"} onSubmit={handleSubmit}>
      <div className="ct-form-grid">
        <Field htmlFor="targetType" label="Linked object">
          <Select
            defaultValue={normalizeTargetType(initialTargetType)}
            id="targetType"
            name="targetType"
            required
          >
            {TARGET_TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>

        <Field htmlFor="targetId" label="Object ID">
          <Input
            defaultValue={initialTargetId ?? ""}
            id="targetId"
            name="targetId"
            required
            type="text"
          />
        </Field>

        <Field htmlFor="documentType" label="Document type">
          <Select id="documentType" name="documentType" required>
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <Field htmlFor="accessClassification" label="Access">
          <Select id="accessClassification" name="accessClassification" required>
            <option value="">Select access</option>
            {accessOptions.map((option) => (
              <option key={option} value={option}>
                {formatOption(option)}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          className="ct-field--wide"
          hint="Accepted formats: PDF, JPEG, PNG, TXT, DOC or DOCX."
          htmlFor="file"
          label="File"
        >
          <Input
            accept=".pdf,.jpg,.jpeg,.png,.txt,.doc,.docx,application/pdf,image/jpeg,image/png,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            id="file"
            name="file"
            required
            type="file"
          />
        </Field>

        <Field className="ct-field--wide" htmlFor="description" label="Description">
          <Textarea id="description" name="description" rows={4} />
        </Field>

        <div className="ct-form-actions">
          <Button disabled={uploadState.status === "uploading"} type="submit">
            {uploadState.status === "uploading" ? "Uploading..." : "Upload document"}
          </Button>
          {returnTo ? (
            <ButtonLink href={returnTo} variant="ghost">
              Back
            </ButtonLink>
          ) : null}
        </div>
      </div>

      {uploadState.status === "success" ? (
        <Notice
          action={returnTo ? <ButtonLink href={returnTo}>Return to workflow</ButtonLink> : null}
          title="Document uploaded"
          tone="success"
        >
          {uploadState.fileName} is stored with controlled access metadata.
        </Notice>
      ) : null}

      {uploadState.status === "error" ? (
        <Notice title="Document upload blocked" tone="danger">
          {[uploadState.message, ...uploadState.issues].filter(Boolean).join(" ")}
        </Notice>
      ) : null}
    </form>
  );
}

function normalizeTargetType(value: string | null | undefined): string {
  for (const [option] of TARGET_TYPE_OPTIONS) {
    if (option === value) {
      return option;
    }
  }

  return "SemenOrder";
}

function formatOption(value: string) {
  return value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
