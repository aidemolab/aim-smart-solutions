// Reusable page sections: pillar cards, the AI Receptionist offer, the cost of waiting,
// "How we work" and the booking call to action.
import Link from "next/link";
import { BOOKING_CTA, howIWork, pillars, type Pillar } from "@/lib/site";
import { serviceBySlug } from "../services/data";

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

// The offer on the AI Voice Agents page: the AI Receptionist package. The page above already
// explains the voice agent, so this names what the package adds rather than repeating it.
export function StartHere() {
  return (
    <section className="start-here" aria-labelledby="start-here-title">
      <div className="start-here-copy">
        <p className="kicker">The offer</p>
        <h2 id="start-here-title">The AI Receptionist <em>package</em></h2>
        <p>For most solo traders and small businesses, the quickest win is making sure no call or enquiry goes unanswered. The AI Receptionist combines two services into one simple starting point.</p>
        <div className="hero-actions"><BookingButton /><a className="button secondary" href="#demo">Watch the demo <span aria-hidden="true">↓</span></a></div>
      </div>
      <ul className="start-here-list">
        <li><strong>The AI voice agent</strong><span>Everything described above, answering and returning calls while you are busy.</span></li>
        <li><strong>Automatic enquiry follow-up</strong><span>Every website enquiry gets an instant acknowledgement, you get an alert, and follow-up happens on time.</span></li>
        <li><strong>Set up around your business</strong><span>Connected to the tools you already use.</span></li>
      </ul>
    </section>
  );
}

// The pain on the AI Voice Agents page: all about calls.
export function CostOfWaiting() {
  const items = [
    ["Missed calls", "from customers who ring the next business when you cannot pick up."],
    ["Callers who will not leave a voicemail", "and simply try someone else instead."],
    ["Interruptions on the job", "when you stop work to answer routine questions."],
  ];
  return (
    <section className="cost-section" aria-labelledby="cost-title">
      <div><p className="kicker light">The cost of waiting</p><h2 id="cost-title">Every missed call gives the customer another reason to look elsewhere.</h2></div>
      {/* Each row is number + one text block, so the text keeps the wide column. */}
      <div className="cost-list">{items.map(([title, body], index) => <p key={title}><span>{String(index + 1).padStart(2, "0")}</span><span><strong>{title}</strong> {body}</span></p>)}</div>
    </section>
  );
}

export function HowWeWork({ dark = false }: { dark?: boolean }) {
  return (
    <section className={`how-i-work${dark ? " is-dark" : ""}`} aria-labelledby="how-we-work-title">
      <div className="section-intro">
        <div><p className={`kicker${dark ? " light" : ""}`}>How we work</p><h2 id="how-we-work-title">From first conversation to <em>confident team.</em></h2></div>
        <p>AIM works in four clear steps, with a decision point after each one. You only move forward when the next step makes sense for your business.</p>
      </div>
      <ol className="steps">
        {howIWork.map((item) => <li key={item.step}><span>{item.step}</span><h3>{item.title}</h3><p>{item.body}</p></li>)}
      </ol>
    </section>
  );
}

export function CtaBand({ title = "Where is your business losing customers, time or clarity?", body = "Book a free AI Opportunity Call and identify the first improvement worth exploring." }: { title?: string; body?: string }) {
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
