import type { Metadata } from "next";
import "./globals.css";
import "../components/ui/ui.css";
import { PublicFooter } from "../features/static-pages/PublicFooter";

export const metadata: Metadata = {
  title: "CoriTech MVP",
  description: "Phase 1 semen ordering, tracking and documentation foundation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="ct-root">
          {children}
          <PublicFooter />
        </div>
      </body>
    </html>
  );
}
