import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { BOOKING_CTA, CONTACT_EMAIL, LOCATION, pillars } from "@/lib/site";
import { serviceBySlug } from "../services/data";

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <Link href="/" className="footer-logo" aria-label="AIM Smart Solutions home">
          <img src={withBase("/aim-logo.webp")} alt="AIM Smart Solutions" width={320} height={208} loading="lazy" />
        </Link>
        <p>Practical AI, automation and data solutions for UK small and growing businesses.</p>
        <p className="footer-contact"><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />{LOCATION} · Supporting businesses across the UK</p>
      </div>
      {pillars.map((pillar) => (
        <nav key={pillar.id} aria-label={pillar.name}>
          <h2><Link href={`/services/${pillar.id}/`}>{pillar.name}</Link></h2>
          {pillar.services.map((slug) => <Link key={slug} href={`/services/${slug}/`}>{serviceBySlug(slug)?.name}</Link>)}
        </nav>
      ))}
      <nav aria-label="Company">
        <h2>AIM</h2>
        <Link href="/live-demos/">Live AI Demos</Link>
        <Link href="/about/">About AIM</Link>
        <Link href="/contact/">Contact</Link>
        <Link href="/privacy/">Privacy policy</Link>
        <Link href={BOOKING_CTA.href}>{BOOKING_CTA.label}</Link>
      </nav>
      <small>© {new Date().getFullYear()} AIM Smart Solutions. All rights reserved.</small>
    </footer>
  );
}
