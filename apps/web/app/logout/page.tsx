import { Badge, Button, ButtonLink } from "../../components/ui";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";

export default function LogoutPage() {
  return (
    <main className="ct-auth" aria-labelledby="logout-title">
      <section className="ct-auth__intro">
        <p className="ct-eyebrow">End session</p>
        <h1 id="logout-title">Sign out of CoriTech</h1>
        <p>
          This clears the CoriTech session cookie and, when configured, continues to the managed
          provider logout flow.
        </p>
        <div className="ct-page-header__meta">
          <Badge tone="info">Provider-managed logout</Badge>
        </div>
      </section>

      <section className="ct-auth__panel" aria-label="Logout action">
        <form action={AUTH_ROUTES.logoutAction} className="ct-auth__form" method="post">
          <div className="ct-form-actions">
            <Button type="submit" variant="danger">
              Sign out
            </Button>
            <ButtonLink href={AUTH_ROUTES.appHome} variant="secondary">
              Return to workspace
            </ButtonLink>
          </div>
        </form>
      </section>
    </main>
  );
}
