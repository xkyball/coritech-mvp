import { Alert, ButtonLink } from "../../../components/ui";
import {
  AUTH_ROUTES,
  getAuthErrorDisplay,
  sanitizeReturnTo,
} from "../../../features/auth/auth-routes.mjs";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AuthErrorPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<SearchParams>;
}>) {
  const params = (await searchParams) ?? {};
  const error = getAuthErrorDisplay(readParam(params.code));
  const returnTo = sanitizeReturnTo(readParam(params.returnTo));
  const loginHref = `${AUTH_ROUTES.loginPage}?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="ct-auth" aria-labelledby="auth-error-title">
      <section className="ct-auth__panel">
        <Alert title={error.title} tone="danger">
          <p>{error.message}</p>
        </Alert>
        <div className="ct-form-actions">
          <ButtonLink href={loginHref} variant="primary">
            Try login again
          </ButtonLink>
          <ButtonLink href="/" variant="secondary">
            Return home
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}

function readParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
