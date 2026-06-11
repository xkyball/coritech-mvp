import { cookies, headers } from "next/headers";

import {
  Badge,
  Button,
} from "../../components/ui";
import {
  ACTIVE_CONTEXT_COOKIE_NAME,
  buildActiveContextSelectionKey,
  createDashboardContextOptions,
  parseActiveContextCookie,
} from "./active-context-runtime.mjs";
import { AUTH_ROUTES } from "./auth-routes.mjs";
import {
  resolveActiveRoleContext,
  resolveRequiredRoleContext,
} from "./role-routing.mjs";
import type { SupportedRoleCode } from "./role-routing.d.ts";
import { readManagedAuthSessionFromCookieHeader } from "./server-session";

type ActiveContextBarProps = Readonly<{
  requiredRoleCode?: SupportedRoleCode;
}>;

export async function ActiveContextBar({
  requiredRoleCode,
}: ActiveContextBarProps = {}) {
  const cookieStore = await cookies();
  const session = await readManagedAuthSessionFromCookieHeader(
    (await headers()).get("cookie"),
  );

  if (!session) {
    return null;
  }

  const input = {
    session,
    activeContext: parseActiveContextCookie(
      cookieStore.get(ACTIVE_CONTEXT_COOKIE_NAME)?.value,
    ),
  };
  const resolution = requiredRoleCode
    ? resolveRequiredRoleContext({
      ...input,
      requiredRoleCode,
    })
    : resolveActiveRoleContext(input);

  if (resolution.status !== "resolved") {
    return null;
  }

  const activeContext = resolution.activeContext;
  const activeContextKey = buildActiveContextSelectionKey(activeContext);
  const contextOptions = createDashboardContextOptions(resolution.availableContexts);
  const hasMultipleContexts = contextOptions.length > 1;

  return (
    <section className="ct-active-context-bar" aria-label="Active workspace context">
      <div className="ct-active-context-bar__summary">
        <span className="ct-active-context-bar__label">Active context</span>
        <strong>{activeContext.organizationName}</strong>
        <span>
          {activeContext.userLabel} / {activeContext.roleLabel}
        </span>
      </div>
      <div className="ct-active-context-bar__actions">
        {hasMultipleContexts ? (
          <form
            action={`${AUTH_ROUTES.appHome}/context/switch`}
            className="ct-context-switcher"
            method="post"
          >
            <label htmlFor="appShellActiveContextKey">Switch context</label>
            <select
              defaultValue={activeContextKey}
              id="appShellActiveContextKey"
              name="activeContextKey"
            >
              {contextOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="secondary">
              Switch
            </Button>
          </form>
        ) : (
          <Badge tone="info">{activeContext.roleLabel}</Badge>
        )}
      </div>
    </section>
  );
}
