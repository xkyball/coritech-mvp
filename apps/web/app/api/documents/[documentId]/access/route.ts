import { isIP } from "node:net";

import { NextRequest, NextResponse } from "next/server";

import { EnvironmentConfigError } from "@coritech/config/environment";
import {
  DocumentEvidenceAuthorizationError,
  DocumentEvidenceNotFoundError,
} from "@coritech/domain/documents/document-evidence.mjs";
import { createControlledDocumentAccessUrl, DocumentStorageValidationError } from "@coritech/domain/documents/document-storage.mjs";
import {
  ObjectStorageConfigError,
  ObjectStorageRuntimeError,
  ObjectStorageValidationError,
} from "@coritech/domain/storage/object-storage.mjs";

import { requireActiveContextActor, ActiveContextRequiredError } from "../../../../../features/auth/active-context-server";
import { getDocumentObjectStorageProvider } from "../../../../../features/documents/object-storage-runtime";
import { createPrismaDocumentRepository } from "../../../../../features/documents/prisma-document-repository";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ documentId: string }> },
) {
  try {
    const actor = await requireActiveContextActor();
    const { documentId } = await context.params;
    const result = await createControlledDocumentAccessUrl({
      actor,
      repository: createPrismaDocumentRepository(),
      storageProvider: getDocumentObjectStorageProvider(),
      auditContext: toAuditContext(request),
      documentId,
      expiresInSeconds: request.nextUrl.searchParams.get("expiresInSeconds"),
    });

    return NextResponse.json({
      document: {
        id: result.body.document.id,
        documentType: result.body.document.documentType,
        originalFileName: result.body.document.originalFileName,
        contentType: result.body.document.contentType,
        accessClassification: result.body.document.accessClassification,
        status: result.body.document.status,
      },
      accessUrl: result.body.accessUrl,
      expiresInSeconds: result.body.expiresInSeconds,
      expiresAt: result.body.expiresAt,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function toAuditContext(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();

  return {
    ipAddress: forwardedFor && isIP(forwardedFor) ? forwardedFor : null,
    userAgent: request.headers.get("user-agent"),
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
    return jsonError("Object storage is not configured for document access.", 503);
  }

  if (error instanceof ObjectStorageRuntimeError) {
    return jsonError("Object storage request failed.", 502);
  }

  return jsonError("Document access failed.", 500);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
