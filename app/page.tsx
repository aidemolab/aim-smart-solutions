import type { Metadata } from "next";
import { BookingButton, PillarCards } from "./components/Blocks";
import DemoBadge from "./components/DemoBadge";
import DemoCall from "./components/demos/DemoCall";

// The homepage uses the site-wide description, title and share image from app/layout.tsx.
export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return (
    <main id="main">
      {/* Hero: the main promise beside the live AI receptionist demo, the most characteristic thing AIM does.
          The header booking button fades while .hero-actions .button.primary is on screen (SiteHeader). */}
      <section className="funnel-hero voice-hero" aria-labelledby="hero-title">
        <div className="voice-hero-copy">
          <h1 id="hero-title">Smart AI solutions that help businesses grow</h1>
          <p className="voice-hero-sub">AI that grows your business. Built for you. Taught to you.</p>
          <p className="hero-lede">We fix four everyday pains, from missed calls and repetitive admin to tools nobody knows how to use. We understand your pain, build the solution, and teach you to use it.</p>
        </div>
        <div className="voice-hero-book">
          <div className="hero-actions"><span>Rather talk it through with a person?</span><BookingButton /></div>
          <div className="risk-reversal"><span>✓ Free initial call</span><span>✓ No technical knowledge needed</span><span>✓ No obligation</span></div>
        </div>
        <div className="voice-hero-demo">
          <p className="voice-hero-try">Try it now: our AI receptionist calls you in seconds.</p>
          <div className="voice-panel">
            <div className="voice-panel-ring">
              <span className="voice-panel-dot" aria-hidden="true" />
              <p><strong>Incoming call</strong><span>Aim Smart Solutions AI receptionist</span></p>
              <DemoBadge kind="Live" />
            </div>
            <DemoCall variant="inline" />
          </div>
        </div>
      </section>

      <section className="section pillars-section" id="services" aria-labelledby="pillars-title">
        <div className="section-intro"><div><h2 id="pillars-title">Four everyday pains, and a team ready to use the fix.</h2></div><p>Every service starts with a business pain, not a technology: win more customers, save time, decide better and train your team to use it. Choose the one that sounds most like your week.</p></div>
        <PillarCards />
      </section>
    </main>
  );
}
