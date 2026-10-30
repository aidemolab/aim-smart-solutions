import type { Metadata } from "next";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import RedirectTo from "../components/RedirectTo";

// The Live demos page has moved into /services/. This page only sends old links there.
export const metadata: Metadata = {
  alternates: { canonical: "/services/" },
  title: "Demos have moved to Services",
  description: "AIM Smart Solutions' demo videos are now on the Services page, next to each service.",
  robots: { index: false, follow: true },
};

export default function LiveDemosMoved() {
  return (
    <main id="main" className="services-main">
      {/* React places this in <head>: an instant redirect for visitors without JavaScript. */}
      <meta httpEquiv="refresh" content={`0; url=${withBase("/services/")}`} />
      <RedirectTo to="/services/" />
      <section className="services-hero">
        <p className="kicker">Demos have moved</p>
        <h1>Our demo videos are now on <em>the Services page.</em></h1>
        <p>Taking you there now. If nothing happens, <Link href="/services/">go to Services</Link>.</p>
      </section>
    </main>
  );
}
