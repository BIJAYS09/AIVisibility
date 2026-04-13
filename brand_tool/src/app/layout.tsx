import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Brand Visibility — AI Search Analytics",
  description: "Track your brand across AI models",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
