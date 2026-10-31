import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { BOOKING_CTA, CONTACT_EMAIL, LOCATION, SOCIAL, pillars } from "@/lib/site";
import { serviceBySlug } from "../services/data";

// Simple Icons paths (CC0), drawn in the current text colour.
const ICONS: Record<(typeof SOCIAL)[number]["id"], string> = {
  linkedin: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zM7.119 20.452H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
};

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-brand">
        <Link href="/" className="footer-logo" aria-label="AIM Smart Solutions home">
          <img src={withBase("/aim-logo.webp")} alt="AIM Smart Solutions" width={320} height={208} loading="lazy" />
        </Link>
        <p>AI, automation and data solutions for UK solo traders and small businesses.</p>
        <p className="footer-contact"><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br />{LOCATION} · Supporting businesses across the UK</p>
        <ul className="footer-social" aria-label="Follow AIM Smart Solutions">
          {SOCIAL.map((s) => (
            <li key={s.id}>
              <a className="footer-social-link" href={s.href} target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" d={ICONS[s.id]} /></svg>
                <span className="sr-only">{`${s.label} (opens in a new tab)`}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
      {pillars.map((pillar) => (
        <nav key={pillar.id} aria-label={pillar.name}>
          <h2><Link href={`/services/${pillar.id}/`}>{pillar.name}</Link></h2>
          {pillar.services.map((slug) => <Link key={slug} href={`/services/${slug}/`}>{serviceBySlug(slug)?.name}</Link>)}
        </nav>
      ))}
      <nav aria-label="Company">
        <h2>AIM</h2>
        <Link href="/about/">About AIM</Link>
        <Link href="/contact/">Contact</Link>
        <Link href="/privacy/">Privacy policy</Link>
        <Link href={BOOKING_CTA.href}>{BOOKING_CTA.label}</Link>
      </nav>
      <small>© {new Date().getFullYear()} AIM Smart Solutions. All rights reserved.</small>
    </footer>
  );
}
