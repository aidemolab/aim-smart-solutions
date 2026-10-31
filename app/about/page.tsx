import type { Metadata } from "next";
import Link from "next/link";
import { withBase } from "@/lib/base-path";
import { pillars } from "@/lib/site";
import { BookingButton, CtaBand, HowWeWork } from "../components/Blocks";

export const metadata: Metadata = {
  alternates: { canonical: "/about/" },
  title: "About AIM",
  description: "AIM Smart Solutions builds AI for solo traders and small businesses, then teaches them to use it. Founded by Alaa Mostafa (PhD, Semiconductor Physics).",
};

const principles = [
  { title: "Understand the real problem", body: "Every project starts with the business problem, the cost of the current process and the outcome you want, not with a tool." },
  { title: "Build the smallest useful solution", body: "Many improvements connect or simplify the tools you already use. The simplest answer that works is considered first, and sometimes that is not AI at all." },
  { title: "Support people to use it confidently", body: "A solution only helps if your team uses it. Training and clear guidance are part of the work, not an extra." },
];

export default function About() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">About AIM</p>
        <h1>We build AI for small businesses. <em>Then we teach them to use it.</em></h1>
        <p>AIM Smart Solutions helps solo traders and small businesses win more customers, save time, make better decisions and train their teams, with AI built around their business and training that makes it stick.</p>
        <BookingButton />
      </section>

      <section className="about funnel-about">
        <div className="about-photo"><img src={withBase("/alaa-mostafa.webp")} alt="Alaa Mostafa, founder of AIM Smart Solutions" width={760} height={1059} loading="lazy" /></div>
        <div className="about-copy">
          <p className="kicker">The founder</p>
          <h2>Alaa Mostafa</h2>
          <p className="role">Founder &amp; AI and Automation Consultant</p>
          <p className="about-lead">You need someone who can understand the technology and explain what it will actually change for your business.</p>
          <p>Alaa combines experience in data analysis, business intelligence, dashboards, automation, AI and professional education. With a PhD in Semiconductor Physics and a career built around analytical problem-solving and teaching, he makes complex possibilities understandable and usable.</p>
          <p>That mix of analysis and teaching shapes how AIM works: find the real bottleneck, build something useful, and make sure the people using it understand it.</p>
        </div>
      </section>

      <section className="section about-principles" aria-labelledby="principles-title">
        <div className="section-intro"><div><p className="kicker">How AIM approaches every project</p><h2 id="principles-title">Three <em>principles.</em></h2></div><p>You will not be sold AI for its own sake. These principles decide what gets recommended and what does not.</p></div>
        <div className="benefit-cards">{principles.map((item) => <article key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
      </section>

      <section className="section about-who" aria-labelledby="who-title">
        <div className="fit-copy">
          <p className="kicker">Who AIM works with</p>
          <h2 id="who-title">Solo traders and <em>small businesses.</em></h2>
          <p>AIM works with solo traders and small businesses, particularly training, education, professional and local services, that depend on enquiries, quotations, appointments and good communication, and want hands-on support without employing an in-house data, automation or AI specialist.</p>
        </div>
        <div className="fit-checklist">
          <h3>What AIM helps with</h3>
          {pillars.map((pillar) => <p key={pillar.id}><Link href={`/services/${pillar.id}/`}><strong>{pillar.name}:</strong> {pillar.promise.charAt(0).toLowerCase() + pillar.promise.slice(1)}</Link></p>)}
        </div>
      </section>

      <div className="section"><HowWeWork /></div>

      <CtaBand title="Talk to us" body="Book a free AI Opportunity Call to talk through your business and the first improvement worth exploring." />
    </main>
  );
}
