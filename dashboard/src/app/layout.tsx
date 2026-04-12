import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Peec — AI Visibility",
  description: "Track your brand in AI responses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ display: "flex", minHeight: "100vh" }}>
        <Sidebar />
        <main style={{
          flex: 1,
          marginLeft: 220,
          padding: "40px 48px",
          maxWidth: 1200,
        }}>
          {children}
        </main>
      </body>
    </html>
  );
}
