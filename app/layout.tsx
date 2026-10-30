import type { Metadata, Viewport } from "next";
import { withBase } from "@/lib/base-path";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import BackToTop from "./components/BackToTop";
import ScrollToTop from "./components/ScrollToTop";
import "./globals.css";
import "./site.css";
import "./demos.css";

const description = "AI that grows your business, built for you and taught to you. AIM fixes missed calls, repetitive admin, scattered data and tools nobody knows how to use, for solo traders and small businesses. Bolton, UK.";

export const metadata: Metadata = {
  metadataBase: new URL("https://aimsmartsolutions.tech"),
  title: { default: "AIM Smart Solutions | AI for Solo Traders and Small Businesses", template: "%s | AIM Smart Solutions" },
  description,
  openGraph: { siteName: "AIM Smart Solutions", title: "AIM Smart Solutions", description, type: "website", locale: "en_GB", images: [{ url: "/og-v3.png", width: 1200, height: 630, alt: "AIM Smart Solutions: AI that grows your business. Built for you. Taught to you." }] },
  twitter: { card: "summary_large_image", title: "AIM Smart Solutions", description, images: ["/og-v3.png"] },
  icons: {
    icon: [
      { url: withBase("/favicon.ico"), sizes: "any" },
      { url: withBase("/icon-32.png"), sizes: "32x32", type: "image/png" },
    ],
    shortcut: withBase("/favicon.ico"),
    apple: { url: withBase("/apple-touch-icon.png"), sizes: "180x180", type: "image/png" },
  },
};

export const viewport: Viewport = { themeColor: "#0B1F33" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // data-scroll-behavior: Next.js turns off the smooth scrolling in globals.css during page changes,
    // so every new page opens at the very top instead of under the sticky header.
    <html lang="en-GB" data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
        <BackToTop />
        <ScrollToTop />
      </body>
    </html>
  );
}
