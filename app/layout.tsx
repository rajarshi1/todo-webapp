import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Todo — React + Node SSR",
  description: "A full-featured Todo webapp built with Next.js (React + Node) and server-side rendering.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
