// Reusable page sections: pillar cards, "Start here", "How I work", the enquiry
// journey demo and the booking call to action.
import Link from "next/link";
import { BOOKING_CTA, CALLS_ENABLED, howIWork, pillars, type Pillar } from "@/lib/site";
import { serviceBySlug } from "../services/data";
import DemoBadge from "./DemoBadge";

export function BookingButton({ className = "button primary" }: { className?: string }) {
  return <Link className={className} href={BOOKING_CTA.href}>{BOOKING_CTA.label} <span aria-hidden="true">→</span></Link>;
}

export const pillarNumber = (pillar: Pillar) => String(pillars.indexOf(pillar) + 1).padStart(2, "0");

export function PillarCards() {
  return (
    <div className="pillar-grid">
      {pillars.map((pillar) => (
        <article className="pillar-card" id={pillar.id} key={pillar.id}>
          <h3>
            <Link className="pillar-title-link" href={`/services/${pillar.id}/`}>
              <span className="pillar-number">{pillarNumber(pillar)}</span>
              <span className="pillar-name">{pillar.name}</span>
            </Link>
          </h3>
          <p className="pillar-promise">{pillar.promise}</p>
          <p>{pillar.intro}</p>
          <ul className="pillar-services">
            {pillar.services.map((slug) => {
              const service = serviceBySlug(slug);
              return service && <li key={slug}>{service.name}</li>;
            })}
          </ul>
        </article>
      ))}
    </div>
  );
}

export function StartHere() {
  return (
    <section className="start-here" aria-labelledby="start-here-title">
      <div className="start-here-copy">
        <p className="kicker">Start here</p>
        <h2 id="start-here-title">The AI Receptionist <em>package</em></h2>
        <p>Not sure where to begin? For most service businesses, the quickest win is making sure no enquiry or call goes unanswered. The AI Receptionist combines two services into one practical starting point.</p>
        <div className="hero-actions"><BookingButton /><Link className="button secondary" href="/services/ai-voice-agents/">How the voice agent works</Link></div>
      </div>
      <ul className="start-here-list">
        <li><strong>AI voice agent</strong><span>Answers calls and urgent enquiries, captures the details and passes them to you.</span></li>
        <li><strong>Automatic enquiry follow-up</strong><span>Every website enquiry gets an instant acknowledgement, you get an alert, and follow-up happens on time.</span></li>
        <li><strong>Set up around your business</strong><span>Your questions, your tone, your hand-over rules, connected to the tools you already use.</span></li>
      </ul>
    </section>
  );
}

export function HowIWork({ dark = false }: { dark?: boolean }) {
  return (
    <section className={`how-i-work${dark ? " is-dark" : ""}`} aria-labelledby="how-i-work-title">
      <div className="section-intro">
        <div><p className={`kicker${dark ? " light" : ""}`}>How I work</p><h2 id="how-i-work-title">From first conversation to <em>confident team.</em></h2></div>
        <p>Four clear steps, with a decision point after each one. You only move forward when the next step makes sense for your business.</p>
      </div>
      <ol className="steps">
        {howIWork.map((item) => <li key={item.step}><span>{item.step}</span><h3>{item.title}</h3><p>{item.body}</p></li>)}
      </ol>
    </section>
  );
}

export function EnquiryJourney({ callsEnabled = CALLS_ENABLED }: { callsEnabled?: boolean }) {
  const steps = [
    { title: "Enquiry", body: "A customer fills in your website form, at any hour." },
    { title: "Instant acknowledgement", body: "They receive a professional confirmation email within moments." },
    { title: "Owner alert", body: "You receive an email with the full details, ready to reply." },
    { title: "AI call", body: callsEnabled ? "For urgent enquiries, an AI assistant calls the customer straight away." : "For urgent enquiries, an AI assistant can call the customer straight away. This step is not switched on in this demo yet." },
  ];
  return (
    <div className="journey">
      <div className="journey-head"><DemoBadge kind="Live" /><h3>The enquiry journey</h3></div>
      <ol className="journey-steps">
        {steps.map((step, index) => (
          <li key={step.title} className={!callsEnabled && index === 3 ? "is-off" : undefined}>
            <span>{index + 1}</span><strong>{step.title}{!callsEnabled && index === 3 ? " (when enabled)" : ""}</strong><p>{step.body}</p>
          </li>
        ))}
      </ol>
      <Link className="button primary" href="/business-enquiry/">Try the enquiry journey <span aria-hidden="true">→</span></Link>
      <p className="journey-note">This is a real form: your enquiry reaches AIM and the emails are sent for real.</p>
    </div>
  );
}

export function CtaBand({ title = "Where is your business losing customers, time or clarity?", body = "Book a free AI Opportunity Call and identify the first practical improvement worth exploring." }: { title?: string; body?: string }) {
  return (
    <section className="final-cta">
      <p className="kicker light">One useful conversation</p>
      <h2>{title}</h2>
      <p>{body}</p>
      <BookingButton />
      <small>Free initial conversation · No technical knowledge required · No obligation</small>
    </section>
  );
}
