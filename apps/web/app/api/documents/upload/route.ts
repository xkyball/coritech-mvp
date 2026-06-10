import { createHash } from "node:crypto";
import { isIP } from "node:net";

import { NextRequest, NextResponse } from "next/server";

import { EnvironmentConfigError } from "@coritech/config/environment";
import {
  DocumentEvidenceAuthorizationError,
  DocumentEvidenceNotFoundError,
} from "@coritech/domain/documents/document-evidence.mjs";
import { uploadDocumentFile, DocumentStorageValidationError } from "@coritech/domain/documents/document-storage.mjs";
import {
  ObjectStorageConfigError,
  ObjectStorageRuntimeError,
  ObjectStorageValidationError,
} from "@coritech/domain/storage/object-storage.mjs";

import { requireActiveContextActor, ActiveContextRequiredError } from "../../../../features/auth/active-context-server";
import { getDocumentObjectStorageProvider } from "../../../../features/documents/object-storage-runtime";
import { createPrismaDocumentRepository } from "../../../../features/documents/prisma-document-repository";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const actor = await requireActiveContextActor();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("file is required.", 400);
    }

    const body = new Uint8Array(await file.arrayBuffer());
    const result = await uploadDocumentFile({
      actor,
      repository: createPrismaDocumentRepository(),
      storageProvider: getDocumentObjectStorageProvider(),
      auditContext: toAuditContext(request),
      targetType: formDataValue(formData, "targetType"),
      targetId: formDataValue(formData, "targetId"),
      documentType: formDataValue(formData, "documentType"),
      description: optionalFormDataValue(formData, "description"),
      originalFileName: file.name,
      contentType: file.type || "application/octet-stream",
      fileSizeBytes: file.size,
      checksumSha256: createHash("sha256").update(body).digest("hex"),
      accessClassification: formDataValue(formData, "accessClassification"),
      body,
    });

    return NextResponse.json(
      {
        document: toDocumentResponse(result.body.document),
        malwareScan: result.body.malwareScan,
      },
      { status: 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

function formDataValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function optionalFormDataValue(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" && value.trim() ? value : null;
}

function toAuditContext(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return {
    ipAddress: forwardedFor && isIP(forwardedFor) ? forwardedFor : null,
    userAgent: request.headers.get("user-agent"),
  };
}

function toDocumentResponse(document: {
  id: string | null;
  documentType: string;
  description: string | null;
  targetType: string;
  targetId: string;
  orderNumber: string | null;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  checksumSha256: string | null;
  accessClassification: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: document.id,
    documentType: document.documentType,
    description: document.description,
    targetType: document.targetType,
    targetId: document.targetId,
    orderNumber: document.orderNumber,
    originalFileName: document.originalFileName,
    contentType: document.contentType,
    fileSizeBytes: document.fileSizeBytes,
    checksumSha256: document.checksumSha256,
    accessClassification: document.accessClassification,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}

function errorResponse(error: unknown) {
  if (error instanceof ActiveContextRequiredError) {
    return jsonError(error.message, 401);
  }

  if (
    error instanceof DocumentStorageValidationError ||
    error instanceof ObjectStorageValidationError
  ) {
    return NextResponse.json(
      { error: "validation_error", issues: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof DocumentEvidenceAuthorizationError) {
    return jsonError(error.message, 403);
  }

  if (error instanceof DocumentEvidenceNotFoundError) {
    return jsonError(error.message, 404);
  }

  if (
    error instanceof EnvironmentConfigError ||
    error instanceof ObjectStorageConfigError
  ) {
    return jsonError("Object storage is not configured for document uploads.", 503);
  }

  if (error instanceof ObjectStorageRuntimeError) {
    return jsonError("Object storage request failed.", 502);
  }

  return jsonError("Document upload failed.", 500);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
