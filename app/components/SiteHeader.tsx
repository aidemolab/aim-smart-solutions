"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { withBase } from "@/lib/base-path";
import { BOOKING_CTA, pillars } from "@/lib/site";
import { appDemos } from "@/lib/demos";
import { serviceBySlug } from "../services/data";
import { CONTACT_SECTION } from "./ContactCrumbs";

const links = [
  { href: "/about/", label: "About AIM" },
  { href: "/contact/", label: "Contact" },
];

function ServicesMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "/";
  return (
    <div className="services-menu">
      {pillars.map((pillar) => (
        <div key={pillar.id} className="services-menu-group">
          <Link className="services-menu-pillar" href={`/services/${pillar.id}/`} onClick={onNavigate} aria-current={pathname.startsWith(`/services/${pillar.id}`) ? "page" : undefined}>{pillar.name}</Link>
          {pillar.services.map((slug) => (
            <Link key={slug} href={`/services/${slug}/`} onClick={onNavigate} aria-current={pathname.startsWith(`/services/${slug}`) ? "page" : undefined}>{serviceBySlug(slug)?.name}</Link>
          ))}
        </div>
      ))}
    </div>
  );
}

// The standalone demo apps open in the same tab so the browser Back button returns here.
function DemosMenu({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="demos-menu">
      {appDemos.map((demo) => <a key={demo.id} href={demo.href} onClick={onNavigate}>{demo.title}</a>)}
      <Link className="demos-menu-all" href="/live-demos/" onClick={onNavigate}>All demos →</Link>
    </div>
  );
}

export default function SiteHeader() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  // Booking, enquiry and quote pages belong to the Contact section, so Contact stays highlighted there.
  const isCurrent = (href: string) => pathname === href || pathname === href.replace(/\/$/, "")
    || (href === "/contact/" && CONTACT_SECTION.some((path) => pathname.startsWith(path)));
  const close = () => setOpen(false);

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="AIM Smart Solutions home">
        <img src={withBase("/aim-logo.webp")} alt="AIM Smart Solutions" width={320} height={208} />
      </Link>

      <nav className="main-nav" aria-label="Main navigation">
        <Link href="/" aria-current={isCurrent("/") ? "page" : undefined}>Home</Link>
        <div className="nav-dropdown">
          <Link href="/services/" aria-current={pathname.startsWith("/services") ? "page" : undefined} aria-haspopup="true">Services <span aria-hidden="true">▾</span></Link>
          <div className="nav-dropdown-panel"><ServicesMenu /></div>
        </div>
        <div className="nav-dropdown">
          <Link href="/live-demos/" aria-current={isCurrent("/live-demos/") ? "page" : undefined} aria-haspopup="true">Live demos <span aria-hidden="true">▾</span></Link>
          <div className="nav-dropdown-panel"><DemosMenu /></div>
        </div>
        {links.map((link) => <Link key={link.href} href={link.href} aria-current={isCurrent(link.href) ? "page" : undefined}>{link.label}</Link>)}
      </nav>

      <Link className="nav-cta" href={BOOKING_CTA.href}>{BOOKING_CTA.label}</Link>

      <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="mobile-menu" onClick={() => setOpen((value) => !value)}>
        <span className="menu-toggle-bars" aria-hidden="true" />
        <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
      </button>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Mobile navigation">
          <Link href="/" onClick={close} aria-current={isCurrent("/") ? "page" : undefined}>Home</Link>
          <Link href="/services/" onClick={close} aria-current={isCurrent("/services/") ? "page" : undefined}>All services</Link>
          <ServicesMenu onNavigate={close} />
          <Link href="/live-demos/" onClick={close} aria-current={isCurrent("/live-demos/") ? "page" : undefined}>Live demos</Link>
          <DemosMenu onNavigate={close} />
          {links.map((link) => <Link key={link.href} href={link.href} onClick={close} aria-current={isCurrent(link.href) ? "page" : undefined}>{link.label}</Link>)}
          <Link className="button primary" href={BOOKING_CTA.href} onClick={close}>{BOOKING_CTA.label}</Link>
        </nav>
      </div>
    </header>
  );
}
