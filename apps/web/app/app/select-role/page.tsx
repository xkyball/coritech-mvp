import {
  Badge,
  ButtonLink,
  Card,
  PageHeader,
  SectionHeader,
} from "../../../components/ui";
import { AUTH_ROUTES } from "../../../features/auth/auth-routes.mjs";

const roleRoutes = [
  { href: AUTH_ROUTES.breederApp, label: "Breeder workspace" },
  { href: AUTH_ROUTES.stationApp, label: "Station workspace" },
  { href: AUTH_ROUTES.adminApp, label: "Admin workspace" },
] as const;

export default function SelectRolePage() {
  return (
    <main className="ct-main" aria-labelledby="select-role-title">
      <PageHeader
        eyebrow="Role selection"
        meta={<Badge tone="info">Multiple roles</Badge>}
        subtitle="Choose the active organization and role context before opening protected workflow pages."
        title="Select workspace context"
      />
      <Card>
        <SectionHeader
          id="select-role-title"
          subtitle="The context persistence and switch action are implemented by the active organization role context ticket."
          title="Available role routes"
        />
        <div className="ct-detail-grid">
          {roleRoutes.map((route) => (
            <ButtonLink href={route.href} key={route.href}>
              {route.label}
            </ButtonLink>
          ))}
        </div>
      </Card>
    </main>
  );
}
