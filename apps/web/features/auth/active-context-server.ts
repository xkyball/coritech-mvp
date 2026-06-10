import { cookies, headers } from "next/headers";

import type { UserOrganizationRoleLike } from "@coritech/domain/identity/role-model.d.ts";

import {
  ACTIVE_CONTEXT_COOKIE_NAME,
  parseActiveContextCookie,
} from "./active-context-runtime.mjs";
import { resolveActiveRoleContext } from "./role-routing.mjs";
import type {
  ResolvedActiveContext,
  SupportedRoleCode,
} from "./role-routing.d.ts";
import { readManagedAuthSessionFromCookieHeader } from "./server-session";

export type ActiveContextActor = {
  userId: string;
  organizationId: string;
  organizationName: string;
  roleCode: SupportedRoleCode;
  roles: UserOrganizationRoleLike[];
};

export class ActiveContextRequiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ActiveContextRequiredError";
  }
}

export async function requireActiveContextActor(
  requiredRoleCode?: SupportedRoleCode,
): Promise<ActiveContextActor> {
  const cookieStore = await cookies();
  const session = await readManagedAuthSessionFromCookieHeader(
    (await headers()).get("cookie"),
  );
  const resolution = resolveActiveRoleContext({
    session,
    activeContext: parseActiveContextCookie(
      cookieStore.get(ACTIVE_CONTEXT_COOKIE_NAME)?.value,
    ),
  });

  if (resolution.status !== "resolved") {
    throw new ActiveContextRequiredError("A validated active organization and role context is required.");
  }

  if (requiredRoleCode && resolution.activeContext.roleCode !== requiredRoleCode) {
    throw new ActiveContextRequiredError(`Active context must be ${requiredRoleCode}.`);
  }

  return contextToActor(session!.user.id, resolution.activeContext);
}

function contextToActor(
  userId: string,
  context: ResolvedActiveContext,
): ActiveContextActor {
  return {
    userId,
    organizationId: context.organizationId,
    organizationName: context.organizationName,
    roleCode: context.roleCode,
    roles: [
      {
        userId,
        organizationId: context.organizationId,
        roleCode: context.roleCode,
        revokedAt: null,
      },
    ],
  };
}
