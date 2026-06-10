import { Badge, ButtonLink } from "../../../components/ui";
import { AUTH_ROUTES } from "../../../features/auth/auth-routes.mjs";

export default function AuthVerificationPage() {
  return (
    <main className="ct-auth" aria-labelledby="verification-title">
      <section className="ct-auth__intro">
        <p className="ct-eyebrow">Email verification</p>
        <h1 id="verification-title">Verification is managed by the auth provider</h1>
        <p>
          CoriTech does not create local verification tokens. If a provider asks for email
          verification, follow the provider-hosted instructions and then return to login.
        </p>
        <div className="ct-page-header__meta">
          <Badge tone="info">Provider-managed verification</Badge>
        </div>
        <div className="ct-form-actions">
          <ButtonLink href={AUTH_ROUTES.loginPage} variant="primary">
            Back to login
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
