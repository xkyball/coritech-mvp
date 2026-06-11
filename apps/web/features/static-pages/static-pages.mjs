// @ts-check

export const STATIC_PAGE_SLUGS = /** @type {const} */ ([
  "privacy",
  "terms",
  "imprint",
  "contact",
  "data-access",
]);

export const STATIC_PAGES = Object.freeze([
  page({
    slug: "privacy",
    href: "/privacy",
    title: "Privacy Policy",
    eyebrow: "Legal review required",
    summary:
      "Placeholder privacy notice for the CoriTech Phase 1 MVP. Final legal text must be approved before production use.",
    sections: [
      section(
        "Current status",
        "This page is a product placeholder and does not replace a lawyer-approved privacy policy.",
      ),
      section(
        "Data handled in Phase 1",
        "CoriTech handles account, organization, order, shipment, evidence document, proof, audit, notification and payment-reference metadata for controlled workflows.",
      ),
      section(
        "Legal review",
        "Lawful basis, retention, controller/processor allocation and data subject request process remain pending legal review.",
      ),
    ],
  }),
  page({
    slug: "terms",
    href: "/terms",
    title: "Terms of Use",
    eyebrow: "Legal review required",
    summary:
      "Placeholder terms page for MVP review. Final terms must be approved before production or external customer use.",
    sections: [
      section(
        "Current status",
        "These terms are not final legal terms and should not be presented as a signed customer agreement.",
      ),
      section(
        "MVP use",
        "Phase 1 supports controlled breeder, breeding-station and Platform Admin workflows only.",
      ),
      section(
        "Excluded features",
        "The MVP does not include AI claims, blockchain/token proof, unrestricted buyer access, real card payment processing or full external logistics automation.",
      ),
    ],
  }),
  page({
    slug: "imprint",
    href: "/imprint",
    title: "Imprint and Company Details",
    eyebrow: "Company details pending",
    summary:
      "Placeholder imprint page for company and regulatory details once approved for publication.",
    sections: [
      section(
        "Company details",
        "CoriTech legal entity, registration, address and authorized representative details are pending confirmation.",
      ),
      section(
        "Publication status",
        "No private founder, operator or support contact details are exposed here until approved.",
      ),
      section(
        "Due diligence",
        "Company ownership and vendor/account ownership evidence is tracked in the documentation pack, not on this public placeholder page.",
      ),
    ],
  }),
  page({
    slug: "contact",
    href: "/contact",
    title: "Contact and Support",
    eyebrow: "Support placeholder",
    summary:
      "Placeholder support page for MVP users. Production contact channels must be approved before publication.",
    sections: [
      section(
        "Support route",
        "Authenticated users can use order-linked support request workflows where available.",
      ),
      section(
        "Public contact",
        "A public support email, phone number or address is pending approval and is not exposed in this placeholder.",
      ),
      section(
        "Operational scope",
        "Support requests do not grant unrestricted buyer access, database access or external vendor access.",
      ),
    ],
  }),
  page({
    slug: "data-access",
    href: "/data-access",
    title: "Data Access Note",
    eyebrow: "Legal review required",
    summary:
      "Placeholder note explaining that data access is permissioned and subject to role, organization and object context.",
    sections: [
      section(
        "Access model",
        "CoriTech uses managed authentication, active role context, RBAC, object permissions and document classifications before showing protected records.",
      ),
      section(
        "Buyer view",
        "Buyer view is not active in Phase 1. Future buyer access must be generated, permissioned, read-only and audited.",
      ),
      section(
        "Requests",
        "Formal data subject request and legal-access procedures remain pending legal review.",
      ),
    ],
  }),
]);

export function listStaticPages() {
  return STATIC_PAGES;
}

export function listPublicFooterLinks() {
  return STATIC_PAGES.map(({ href, title }) => Object.freeze({ href, label: title }));
}

/**
 * @param {string} slug
 */
export function getStaticPageViewModel(slug) {
  return STATIC_PAGES.find((pageViewModel) => pageViewModel.slug === slug) ?? null;
}

function page(input) {
  return Object.freeze({
    ...input,
    legalReviewRequired: true,
  });
}

function section(title, body) {
  return Object.freeze({ title, body });
}
