import { listPublicFooterLinks } from "./static-pages.mjs";

export function PublicFooter() {
  const links = listPublicFooterLinks();

  return (
    <footer className="ct-public-footer" aria-label="Legal and support links">
      <span>CoriTech MVP</span>
      <nav aria-label="Static pages">
        {links.map((link) => (
          <a href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
