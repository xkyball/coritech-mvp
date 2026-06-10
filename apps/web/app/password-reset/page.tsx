import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  Field,
  Input,
} from "../../components/ui";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";
import { getManagedAuthRuntime } from "../../features/auth/auth-runtime.mjs";

type SearchParams = Record<string, string | string[] | undefined>;

const resetMessages: Record<string, { title: string; body: string; tone: "success" | "warning" | "danger" | "info" }> = {
  "provider-managed": {
    title: "Password reset is provider-managed",
    body:
      "CoriTech prepared the provider-managed reset request. The selected auth provider owns reset delivery and password update screens.",
    tone: "success",
  },
  "provider-not-configured": {
    title: "Hosted reset is not configured",
    body:
      "The reset path exists, but the managed auth provider environment must be configured before reset delivery can be requested.",
    tone: "warning",
  },
  "invalid-email": {
    title: "Enter a valid email address",
    body: "The auth provider needs a work email address before it can manage reset delivery.",
    tone: "danger",
  },
};

export default async function PasswordResetPage({
  searchParams,
}: Readonly<{
  searchParams?: Promise<SearchParams>;
}>) {
  const params = (await searchParams) ?? {};
  const runtime = getManagedAuthRuntime();
  const status = readParam(params.status);
  const message = status ? resetMessages[status] : null;

  return (
    <main className="ct-auth" aria-labelledby="reset-title">
      <section className="ct-auth__intro">
        <p className="ct-eyebrow">Access recovery</p>
        <h1 id="reset-title">Reset access through the managed provider</h1>
        <p>
          CoriTech does not create password reset tokens or collect replacement passwords. Recovery
          stays inside the hosted auth provider.
        </p>
        <div className="ct-page-header__meta">
          <Badge tone="info">Provider-owned reset</Badge>
        </div>
      </section>

      <section className="ct-auth__panel" aria-label="Password reset entry point">
        {message ? (
          <Alert title={message.title} tone={message.tone}>
            <p>{message.body}</p>
          </Alert>
        ) : null}

        <form action={AUTH_ROUTES.passwordResetAction} className="ct-auth__form" method="post">
          <Field
            hint="Only the managed provider handles reset delivery and password update screens."
            htmlFor="email"
            label="Work email"
          >
            <Input autoComplete="email" id="email" name="email" required type="email" />
          </Field>
          <div className="ct-form-actions">
            <Button disabled={!runtime.enabled} type="submit">
              Request provider reset
            </Button>
            <ButtonLink href={AUTH_ROUTES.loginPage} variant="secondary">
              Back to login
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
