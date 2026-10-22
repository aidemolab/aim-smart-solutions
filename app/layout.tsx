import type { Metadata, Viewport } from "next";
import { withBase } from "@/lib/base-path";
import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import "./globals.css";
import "./site.css";
import "./demos.css";

const description = "Practical AI and automation for UK service businesses: win more customers, save time on admin and turn your data into clear decisions. Based in Bolton.";

export const metadata: Metadata = {
  metadataBase: new URL("https://aimsmartsolutions.tech"),
  title: { default: "AIM Smart Solutions | Practical AI and Automation for UK Service Businesses", template: "%s | AIM Smart Solutions" },
  description,
  openGraph: { siteName: "AIM Smart Solutions", title: "AIM Smart Solutions", description, type: "website", locale: "en_GB", images: [{ url: "/og.png", width: 1200, height: 630, alt: "AIM Smart Solutions" }] },
  twitter: { card: "summary_large_image", title: "AIM Smart Solutions", description, images: ["/og.png"] },
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
    <html lang="en-GB">
      <body>
        <a className="skip-link" href="#main">Skip to main content</a>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
