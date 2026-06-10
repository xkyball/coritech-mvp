import { Badge, ButtonLink, PageHeader } from "../../components/ui";
import { AUTH_ROUTES } from "../../features/auth/auth-routes.mjs";

export default function UnauthorizedPage() {
  return (
    <main className="ct-main" aria-labelledby="unauthorized-title">
      <PageHeader
        actions={<ButtonLink href={AUTH_ROUTES.appHome}>Return to app home</ButtonLink>}
        eyebrow="Access denied"
        meta={<Badge tone="danger">Unauthorized role route</Badge>}
        subtitle="The active organization and role context for this session is not allowed to open that workspace."
        title="This route is not available for your active role"
      />
    </main>
  );
}
