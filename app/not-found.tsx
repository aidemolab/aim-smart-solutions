import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton } from "./components/Blocks";

export const metadata: Metadata = {
  title: "Page not found",
  description: "Sorry, this page could not be found on the AIM Smart Solutions website.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero not-found">
        <p className="kicker">Error 404</p>
        <h1>Sorry, we could not find <em>that page.</em></h1>
        <p>The link may be out of date, or the page may have moved. These are good places to start:</p>
        <ul className="not-found-links">
          <li><Link href="/">Home</Link></li>
          <li><Link href="/services/">Services</Link></li>
          <li><Link href="/live-demos/">Live AI Demos</Link></li>
          <li><Link href="/contact/">Contact</Link></li>
        </ul>
        <BookingButton />
      </section>
    </main>
  );
}
