import { StaticPageView } from "../../features/static-pages/StaticPageView";
import { getStaticPageViewModel } from "../../features/static-pages/static-pages.mjs";

export default function ContactPage() {
  return <StaticPageView page={getStaticPageViewModel("contact")!} />;
}
