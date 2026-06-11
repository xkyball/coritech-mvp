import { StaticPageView } from "../../features/static-pages/StaticPageView";
import { getStaticPageViewModel } from "../../features/static-pages/static-pages.mjs";

export default function DataAccessPage() {
  return <StaticPageView page={getStaticPageViewModel("data-access")!} />;
}
