import { StaticPageView } from "../../features/static-pages/StaticPageView";
import { getStaticPageViewModel } from "../../features/static-pages/static-pages.mjs";

export default function TermsPage() {
  return <StaticPageView page={getStaticPageViewModel("terms")!} />;
}
