import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton, PillarCards } from "./components/Blocks";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main id="main">
      <section className="funnel-hero">
        <div className="funnel-hero-copy">
          <p className="eyebrow"><span /> Practical AI &amp; automation for service businesses</p>
          <h1>Win more customers. Serve them faster. <em>Give your team hours back.</em></h1>
          <p className="hero-lede">When enquiries wait, follow-up slips and administration takes over, growth becomes harder. AIM Smart Solutions turns those costly bottlenecks into practical, automated customer journeys.</p>
          <div className="hero-actions"><BookingButton /><Link className="button secondary" href="/services/ai-voice-agents/#demo">See the solutions working <span aria-hidden="true">→</span></Link></div>
          <div className="risk-reversal"><span>✓ Free initial call</span><span>✓ No technical knowledge needed</span><span>✓ No obligation</span></div>
        </div>
        <aside className="opportunity-panel" aria-label="What you receive from the free call">
          <p className="panel-label">Your free AI Opportunity Call</p><h2>Find the first improvement worth making.</h2>
          <ol><li><span>01</span><div><strong>Expose the costly bottleneck</strong><p>Identify where leads, time or useful information are being lost.</p></div></li><li><span>02</span><div><strong>Estimate the business value</strong><p>Connect the problem to customer experience, capacity or revenue.</p></div></li><li><span>03</span><div><strong>Choose a practical next step</strong><p>Leave with one focused opportunity, not a list of unnecessary tools.</p></div></li></ol>
          <Link href="/book-appointment/">Choose a convenient time →</Link>
        </aside>
      </section>

      <section className="section pillars-section" id="services" aria-labelledby="pillars-title">
        <div className="section-intro"><div><p className="kicker">What AIM helps with</p><h2 id="pillars-title">Three business pains, <em>and a team ready to use the fix.</em></h2></div><p>Every service starts with a business pain, not a technology: win more customers, save time and decide better, then train your team to use it. Choose the one that sounds most like your week.</p></div>
        <PillarCards />
      </section>
    </main>
  );
}
