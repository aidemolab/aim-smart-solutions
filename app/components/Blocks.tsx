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

// The offer on the AI Voice Agents page: the AI Receptionist package. The page above already
// explains the voice agent, so this names what the package adds rather than repeating it.
export function StartHere() {
  return (
    <section className="start-here" aria-labelledby="start-here-title">
      <div className="start-here-copy">
        <p className="kicker">The offer</p>
        <h2 id="start-here-title">The AI Receptionist <em>package</em></h2>
        <p>For most service businesses, the quickest win is making sure no enquiry or call goes unanswered. The AI Receptionist combines two services into one practical starting point.</p>
        <div className="hero-actions"><BookingButton /><a className="button secondary" href="#demo">Test it below <span aria-hidden="true">↓</span></a></div>
      </div>
      <ul className="start-here-list">
        <li><strong>The AI voice agent</strong><span>Everything described above, answering calls and urgent enquiries while you are busy.</span></li>
        <li><strong>Automatic enquiry follow-up</strong><span>Every website enquiry gets an instant acknowledgement, you get an alert, and follow-up happens on time.</span></li>
        <li><strong>Set up around your business</strong><span>Connected to the tools you already use.</span></li>
      </ul>
    </section>
  );
}

// The pain on the AI Voice Agents page.
export function CostOfWaiting() {
  const items = [
    ["Missed revenue", "from enquiries that receive a faster answer elsewhere."],
    ["Restricted capacity", "while skilled people repeat avoidable administration."],
    ["Weaker decisions", "when important information remains scattered and unclear."],
  ];
  return (
    <section className="cost-section" aria-labelledby="cost-title">
      <div><p className="kicker light">The cost of waiting</p><h2 id="cost-title">Every slow response gives the customer another reason to look elsewhere.</h2></div>
      {/* Each row is number + one text block, so the text keeps the wide column. */}
      <div className="cost-list">{items.map(([title, body], index) => <p key={title}><span>{String(index + 1).padStart(2, "0")}</span><span><strong>{title}</strong> {body}</span></p>)}</div>
    </section>
  );
}

// The three live customer journeys (the proof). Shown on the AI Voice Agents page and, by demo id,
// on Business Process Automation and /live-demos/.
export const journeys = [
  {
    id: "enquiry-journey",
    title: "A new lead receives an instant response",
    problem: "A new enquiry arrives while the owner is busy.",
    solution: CALLS_ENABLED
      ? "The customer receives confirmation straight away and can request an immediate AI voice response."
      : "The customer receives confirmation straight away and the owner gets an alert with every detail.",
    href: "/business-enquiry/",
    cta: "Try the live enquiry",
  },
  { id: "instant-quote", title: "A service request arrives quotation-ready", problem: "Missing details cause repeated emails and slow down the quotation.", solution: "A guided request captures the relevant information for every selected service.", href: "/instant-quote/", cta: "Try the service request" },
  { id: "booking", title: "A meeting books without diary chasing", problem: "Finding a time and sending reminders consumes valuable administration.", solution: "The customer selects an available appointment and receives confirmation and reminders.", href: "/book-appointment/", cta: "View live availability" },
];

export function ProofJourneys({ children }: { children?: React.ReactNode }) {
  return (
    <section className="proof-section" id="demo" aria-labelledby="proof-title">
      <div className="section proof-inner">
        <div className="proof-heading">
          <div><p className="kicker light">Evidence before promises</p><h2 id="proof-title">Do not imagine the solution. <em>Test it.</em></h2></div>
          <p>These are working customer journeys, not illustrations. Use them to experience how faster response, better information and simpler booking can feel.</p>
        </div>
        {children}
        <div className="proof-grid">
          {journeys.map((item, index) => (
            <article key={item.id}>
              <div className="proof-card-top"><span>{String(index + 1).padStart(2, "0")}</span><DemoBadge kind="Live" /></div>
              <h3>{item.title}</h3>
              <dl><dt>Without improvement</dt><dd>{item.problem}</dd><dt>With AIM</dt><dd>{item.solution}</dd></dl>
              <Link href={item.href}>{item.cta} <span aria-hidden="true">→</span></Link>
            </article>
          ))}
        </div>
      </div>
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
