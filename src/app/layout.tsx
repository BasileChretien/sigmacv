import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SigmaCV",
  description:
    "Auto-generate clean, customizable academic CVs from open research data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
