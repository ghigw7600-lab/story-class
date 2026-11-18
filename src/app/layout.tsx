import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = { title: "STORY Korean · TOPIK Online", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
