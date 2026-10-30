import type { Metadata } from "next";
import Link from "next/link";
import { BOOKING_CTA, CONTACT_EMAIL, LOCATION } from "@/lib/site";
import { BookingButton } from "../components/Blocks";

export const metadata: Metadata = {
  alternates: { canonical: "/contact/" },
  title: "Contact",
  description: "Contact AIM Smart Solutions in Bolton: book a free AI Opportunity Call, send an enquiry, request a quote or email enquiry@aimsmartsolutions.tech.",
};

const routes = [
  { title: BOOKING_CTA.label, body: "The best place to start. Choose a time that suits you for a free, no-obligation conversation about your business.", href: BOOKING_CTA.href, cta: "Choose a time", primary: true },
  { title: "Send an enquiry", body: "Tell us what you need in a few lines. You will receive an instant confirmation and a reply within 24 hours.", href: "/business-enquiry/", cta: "Send an enquiry" },
  { title: "Request a quote", body: "Already know which services you need? Answer a few guided questions so we can prepare a quote.", href: "/instant-quote/", cta: "Request a quote" },
];

// Moved from the homepage: answers people want before they book.
const faqs = [
  ["Do I need to know which technology I need?", "No. The conversation begins with the business problem, the cost of the current process and the outcome you want. AIM recommends technology only when it is useful."],
  ["Will this replace my existing systems?", "Not necessarily. Many improvements can connect or simplify the tools you already use. The smallest practical solution is considered first."],
  ["Is AI suitable for every problem?", "No. Sometimes a clearer process, a simple automation or a dashboard is the better answer. You will not be sold AI for its own sake."],
  ["Will the first call cost anything?", "No. The AI Opportunity Call is free and carries no obligation. You will leave with a clearer view of the first opportunity worth exploring."],
  ["Can you work with a small team?", "Yes. AIM is designed for small and growing service businesses that need practical support without employing an in-house data, automation or AI specialist."],
];

export default function Contact() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">Contact AIM</p>
        <h1>Let&apos;s solve your next <em>business challenge.</em></h1>
        <p>Tell us about your requirements for AI applications, voice agents, automation, dashboards or training. Choose whichever way suits you best.</p>
      </section>

      <section className="contact-routes" aria-label="Ways to get in touch">
        {routes.map((route) => (
          <article key={route.href} className={route.primary ? "is-primary" : undefined}>
            <h2>{route.title}</h2>
            <p>{route.body}</p>
            <Link className={route.primary ? "button primary" : "button secondary"} href={route.href}>{route.cta} <span aria-hidden="true">→</span></Link>
          </article>
        ))}
      </section>

      <section className="section faq-section" id="faq" aria-labelledby="faq-title"><div className="faq-intro"><p className="kicker">Before you book</p><h2 id="faq-title">Clear answers. <em>No hard sell.</em></h2><p>The first conversation is designed to establish whether there is a useful opportunity, not to push technology your business does not need.</p></div><div className="faq-list">{faqs.map(([question, answer]) => <details key={question}><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

      <section className="contact-details" aria-labelledby="details-title">
        <div>
          <p className="kicker">Contact details</p>
          <h2 id="details-title">Prefer email?</h2>
          <p><a className="contact-email" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p>
          <p>We reply to enquiries within 24 hours.</p>
        </div>
        <div>
          <p className="kicker">Location</p>
          <h2>{LOCATION}</h2>
          <p>Based in Bolton, supporting businesses across the UK.</p>
        </div>
      </section>

      <section className="services-cta">
        <h2>Not sure what to ask?</h2>
        <p>You do not need to know which technology you need. Start with the problem, and we will work out the rest together.</p>
        <BookingButton />
      </section>
    </main>
  );
}
