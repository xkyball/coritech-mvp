import type { Metadata } from "next";
import "./globals.css";
import "../features/breeder-dashboard/breeder-dashboard.css";
import "../features/breeder-order-detail/breeder-order-detail.css";
import "../features/catalog/semen-catalog.css";
import "../features/order-creation/semen-order-creation.css";

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
      <body>{children}</body>
    </html>
  );
}
