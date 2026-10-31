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
          <p className="eyebrow"><span /> AI for solo traders and small businesses</p>
          <h1>AI that grows your business. <em>Built for you. Taught to you.</em></h1>
          <p className="hero-lede">We fix four everyday pains, from missed calls and repetitive admin to tools nobody knows how to use. We understand your pain, build the solution, and teach you to use it.</p>
          <div className="hero-actions"><BookingButton /><Link className="button secondary" href="/services/">Watch our demos <span aria-hidden="true">→</span></Link></div>
          <div className="risk-reversal"><span>✓ Free initial call</span><span>✓ No technical knowledge needed</span><span>✓ No obligation</span></div>
        </div>
      </section>

      <section className="section pillars-section" id="services" aria-labelledby="pillars-title">
        <div className="section-intro"><div><p className="kicker">What AIM helps with</p><h2 id="pillars-title">Four everyday pains, <em>and a team ready to use the fix.</em></h2></div><p>Every service starts with a business pain, not a technology: win more customers, save time, decide better and train your team to use it. Choose the one that sounds most like your week.</p></div>
        <PillarCards />
      </section>
    </main>
  );
}
