import type { Metadata } from "next";
import Link from "next/link";
import { BookingButton, CtaBand, PillarCards } from "./components/Blocks";

export const metadata: Metadata = { alternates: { canonical: "/" } };

const faqs = [
  ["Do I need to know which technology I need?", "No. The conversation begins with the business problem, the cost of the current process and the outcome you want. AIM recommends technology only when it is useful."],
  ["Will this replace my existing systems?", "Not necessarily. Many improvements can connect or simplify the tools you already use. The smallest practical solution is considered first."],
  ["Is AI suitable for every problem?", "No. Sometimes a clearer process, a simple automation or a dashboard is the better answer. You will not be sold AI for its own sake."],
  ["Will the first call cost anything?", "No. The AI Opportunity Call is free and carries no obligation. You will leave with a clearer view of the first opportunity worth exploring."],
  ["Can you work with a small team?", "Yes. AIM is designed for small and growing service businesses that need practical support without employing an in-house data, automation or AI specialist."],
];

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

      <section className="authority-strip" aria-label="Reasons to trust AIM Smart Solutions"><span><b>Working solutions</b> you can test now</span><span><b>Clear, practical analysis</b> without the jargon</span><span><b>Data, AI &amp; automation</b> in one practical service</span><span><b>Bolton-based</b> with UK-wide support</span></section>

      <section className="section pillars-section" id="services" aria-labelledby="pillars-title">
        <div className="section-intro"><div><p className="kicker">What AIM helps with</p><h2 id="pillars-title">Three business pains, <em>and a team ready to use the fix.</em></h2></div><p>Every service starts with a business pain, not a technology: win more customers, save time and decide better, then train your team to use it. Choose the one that sounds most like your week.</p></div>
        <PillarCards />
        <p className="specialist-line"><Link href="/services/">Explore all services →</Link> &nbsp;·&nbsp; <Link href="/live-demos/">Try the live AI demos →</Link></p>
      </section>

      <section className="section fit-section" id="fit"><div className="fit-copy"><p className="kicker">A strong fit?</p><h2>Built for service businesses where <em>follow-up matters.</em></h2><p>AIM initially works with small and growing service businesses, particularly training, education, professional and local services, that depend on enquiries, quotations, appointments and good communication.</p><BookingButton /></div><div className="fit-checklist"><h3>This conversation is worth having if…</h3><p>✓ Leads sometimes wait or disappear into an inbox</p><p>✓ Your team repeats the same emails, booking steps or reports</p><p>✓ Quotations are delayed by missing customer information</p><p>✓ Important business information lives in separate files or systems</p><p>✓ You want to explore AI without hiring a technical team</p><p>✓ You value a practical result more than technology hype</p></div></section>

      <section className="section faq-section" id="faq"><div className="faq-intro"><p className="kicker">Before you book</p><h2>Clear answers. <em>No hard sell.</em></h2><p>The first conversation is designed to establish whether there is a useful opportunity, not to push technology your business does not need.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

      <CtaBand />
    </main>
  );
}
