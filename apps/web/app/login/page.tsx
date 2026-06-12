import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Field,
  Input,
} from "../../components/ui";
import {
  AUTH_ROUTES,
  getAuthErrorDisplay,
  sanitizeReturnTo,
} from "../../features/auth/auth-routes.mjs";
import { getManagedAuthRuntime } from "../../features/auth/auth-runtime.mjs";
import { readManagedAuthSessionFromCookieHeader } from "../../features/auth/server-session";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function LoginPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<SearchParams>;
}>) {
  const params = (await searchParams) ?? {};
  const returnTo = sanitizeReturnTo(readParam(params.returnTo));
  const cookieHeader = (await headers()).get("cookie");

  if (await readOptionalSession(cookieHeader)) {
    redirect(returnTo);
  }

  const runtime = getManagedAuthRuntime();
  const errorCode = readParam(params.error);
  const error = errorCode ? getAuthErrorDisplay(errorCode) : null;
  const onboarding = readParam(params.onboarding);
  const loginHint = readParam(params.loginHint);

  return (
    <main className="ct-auth" aria-labelledby="login-title">
      <section className="ct-auth__intro">
        <p className="ct-eyebrow">CoriTech access</p>
        <h1 id="login-title">Sign in to the verified equine workflow</h1>
        <p>
          Managed login connects breeder, station and platform roles without CoriTech storing
          passwords.
        </p>
        <div className="ct-page-header__meta">
          <Badge tone="info">Provider-managed auth</Badge>
          <Badge tone="accent">No custom password handling</Badge>
        </div>
      </section>

      <section className="ct-auth__panel" aria-label="Managed login">
        {error ? (
          <Alert title={error.title} tone="danger">
            <p>{error.message}</p>
          </Alert>
        ) : null}

        {onboarding === "accepted" ? (
          <Alert title="Invitation accepted" tone="success">
            <p>
              Sign in with the invited email to open the assigned CoriTech workspace.
            </p>
          </Alert>
        ) : null}

        {!runtime.enabled ? (
          <Alert title="Hosted login is not configured for this environment" tone="warning">
            <p>
              The login route is available, but provider redirects remain disabled until the
              managed auth environment values are configured.
            </p>
            {runtime.issues.length > 0 ? (
              <ul>
                {runtime.issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : null}
          </Alert>
        ) : null}

        <form action={AUTH_ROUTES.loginAction} className="ct-auth__form" method="get">
          <input name="returnTo" type="hidden" value={returnTo} />
          <Field
            hint="This is passed as a provider login hint only. CoriTech does not collect passwords."
            htmlFor="loginHint"
            label="Work email"
          >
            <Input
              autoComplete="email"
              defaultValue={loginHint ?? ""}
              id="loginHint"
              name="loginHint"
              placeholder="name@example.com"
              type="email"
            />
          </Field>
          <div className="ct-form-actions">
            <Button disabled={!runtime.enabled} type="submit">
              Continue with managed login
            </Button>
            <ButtonLink href={AUTH_ROUTES.passwordResetPage} variant="secondary">
              Reset access
            </ButtonLink>
          </div>
        </form>
      </section>
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

async function readOptionalSession(cookieHeader: string | null) {
  try {
    return await readManagedAuthSessionFromCookieHeader(cookieHeader);
  } catch {
    return null;
  }
}
