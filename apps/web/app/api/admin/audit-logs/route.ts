import { NextRequest, NextResponse } from "next/server";

import {
  AuditLogAuthorizationError,
  AuditLogValidationError,
  listAuditLogsForAdmin,
} from "@coritech/domain/audit/audit-log.mjs";

import {
  ActiveContextRequiredError,
  requireActiveContextActor,
} from "../../../../features/auth/active-context-server";
import { normalizeAuditLogFilters } from "../../../../features/audit-logs/audit-log-viewer.mjs";
import { createPrismaAuditLogRepository } from "../../../../features/audit-logs/prisma-audit-log-repository";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const actor = await requireActiveContextActor("PLATFORM_ADMIN");
    const filters = normalizeAuditLogFilters({
      action: request.nextUrl.searchParams.get("action"),
      actorOrganizationId: request.nextUrl.searchParams.get("actorOrganizationId"),
      actorUserId: request.nextUrl.searchParams.get("actorUserId"),
      fromOccurredAt: request.nextUrl.searchParams.get("fromOccurredAt"),
      limit: request.nextUrl.searchParams.get("limit"),
      objectId: request.nextUrl.searchParams.get("objectId"),
      objectType: request.nextUrl.searchParams.get("objectType"),
      page: request.nextUrl.searchParams.get("page"),
      toOccurredAt: request.nextUrl.searchParams.get("toOccurredAt"),
    });
    const auditLogs = await listAuditLogsForAdmin({
      actor,
      repository: createPrismaAuditLogRepository(),
      filters,
    });

    return NextResponse.json({
      auditLogs,
      filters,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

function errorResponse(error: unknown) {
  if (error instanceof ActiveContextRequiredError) {
    return jsonError(error.message, 401);
  }

  if (error instanceof AuditLogAuthorizationError) {
    return jsonError(error.message, 403);
  }

  if (error instanceof AuditLogValidationError) {
    return NextResponse.json(
      { error: "validation_error", issues: error.issues },
      { status: 400 },
    );
  }

  return jsonError("Audit log query failed.", 500);
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
