import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://aimsmartsolutions.tech"),
  title: "AIM Smart Solutions | Win Customers, Save Time, Work Smarter",
  description: "Practical AI and automation for service businesses that want to respond faster, win more opportunities and release capacity for growth.",
  keywords: ["Small Business Automation Bolton", "AI Consultant Greater Manchester", "Lead Follow-up Automation", "Appointment Booking Automation", "Business Dashboards", "Power BI Consultant", "AI Voice Agent", "Practical AI for SMEs"],
  openGraph: { title: "AIM Smart Solutions", description: "Win more customers, serve them faster and give your team hours back with practical AI and automation.", type: "website", images: [{ url: "/og.png", width: 1200, height: 630, alt: "AIM Smart Solutions" }] },
  twitter: { card: "summary_large_image", title: "AIM Smart Solutions", description: "Win more customers, serve them faster and give your team hours back with practical AI and automation.", images: ["/og.png"] },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  other: { "codex-preview": "development" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en-GB"><body>{children}</body></html>;
}
