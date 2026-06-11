import {
  Badge,
  ButtonLink,
  Card,
  PageHeader,
  SectionHeader,
} from "../../components/ui";
import type { StaticPageViewModel } from "./static-pages.d.ts";

export function StaticPageView({
  page,
}: Readonly<{
  page: StaticPageViewModel;
}>) {
  return (
    <main className="ct-static-page" aria-labelledby="static-page-title">
      <PageHeader
        actions={<ButtonLink href="/login">Sign in</ButtonLink>}
        eyebrow={page.eyebrow}
        meta={<Badge tone="warning">Placeholder</Badge>}
        subtitle={page.summary}
        title={page.title}
      />
      <div className="ct-static-page__content">
        {page.sections.map((section, index) => (
          <Card key={section.title}>
            <SectionHeader id={`${page.slug}-section-${index + 1}`} title={section.title} />
            <p>{section.body}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
