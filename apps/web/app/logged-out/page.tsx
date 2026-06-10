import { Badge, ButtonLink } from "../../components/ui";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";

export default function LoggedOutPage() {
  return (
    <main className="ct-auth" aria-labelledby="logged-out-title">
      <section className="ct-auth__intro">
        <p className="ct-eyebrow">Session ended</p>
        <h1 id="logged-out-title">You are signed out</h1>
        <p>
          CoriTech has cleared local session state. If your provider keeps a browser session, use
          managed login to choose or confirm the account again.
        </p>
        <div className="ct-page-header__meta">
          <Badge tone="success">Local session cleared</Badge>
        </div>
        <div className="ct-form-actions">
          <ButtonLink href={AUTH_ROUTES.loginPage} variant="primary">
            Sign in again
          </ButtonLink>
        </div>
      </section>
    </main>
  );
}
