import { StaticPageView } from "../../features/static-pages/StaticPageView";
import { getStaticPageViewModel } from "../../features/static-pages/static-pages.mjs";

export default function PrivacyPage() {
  return <StaticPageView page={getStaticPageViewModel("privacy")!} />;
}
