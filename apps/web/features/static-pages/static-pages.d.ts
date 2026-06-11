export type StaticPageSlug =
  | "privacy"
  | "terms"
  | "imprint"
  | "contact"
  | "data-access";

export interface StaticPageSection {
  title: string;
  body: string;
}

export interface StaticPageViewModel {
  slug: StaticPageSlug;
  href: string;
  title: string;
  eyebrow: string;
  summary: string;
  legalReviewRequired: boolean;
  sections: readonly StaticPageSection[];
}

export declare const STATIC_PAGE_SLUGS: readonly StaticPageSlug[];
export declare const STATIC_PAGES: readonly StaticPageViewModel[];
export declare function listStaticPages(): readonly StaticPageViewModel[];
export declare function listPublicFooterLinks(): readonly { href: string; label: string }[];
export declare function getStaticPageViewModel(slug: string): StaticPageViewModel | null;
