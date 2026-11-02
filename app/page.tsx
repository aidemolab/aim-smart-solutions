import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton, PillarCards } from "./components/Blocks";

// The homepage uses the site-wide description, title and share image from app/layout.tsx.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main id="main">
      {/* Text-only hero: the promo video slot was left out until an up-to-date video is checked. */}
      <section className="funnel-hero hero-text-only">
        <div className="funnel-hero-copy">
          <p className="eyebrow"><span /> Smart AI solutions that help businesses grow</p>
          <h1>AI that grows your business. Built for you. Taught to you.</h1>
          <p className="hero-lede">We fix four everyday pains, from missed calls and repetitive admin to tools nobody knows how to use. We understand your pain, build the solution, and teach you to use it.</p>
          <div className="hero-actions"><BookingButton /><Link className="button secondary" href="/services/">Watch our demos</Link></div>
          <div className="risk-reversal"><span>✓ Free initial call</span><span>✓ No technical knowledge needed</span><span>✓ No obligation</span></div>
        </div>
      </section>

      <section className="section pillars-section" id="services" aria-labelledby="pillars-title">
        <div className="section-intro"><div><h2 id="pillars-title">Four everyday pains, and a team ready to use the fix.</h2></div><p>Every service starts with a business pain, not a technology: win more customers, save time, decide better and train your team to use it. Choose the one that sounds most like your week.</p></div>
        <PillarCards />
      </section>
    </main>
  );
}
