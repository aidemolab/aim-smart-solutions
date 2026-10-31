import type { Metadata } from "next";
import { withBase } from "@/lib/base-path";
import { BookingButton, CtaBand, HowWeWork } from "../components/Blocks";

export const metadata: Metadata = {
  alternates: { canonical: "/about/" },
  title: "About AIM",
  description: "AIM Smart Solutions builds AI for solo traders and small businesses, then teaches them to use it. Founded by Alaa Mostafa (PhD, Semiconductor Physics).",
};

export default function About() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">About AIM</p>
        <h1>We build AI for small businesses. <em>Then we teach them to use it.</em></h1>
        <p>AIM Smart Solutions helps solo traders and small businesses win more customers, save time, make better decisions and train their teams, with AI built around their business and training that makes it stick.</p>
        <BookingButton />
      </section>

      <div className="section"><HowWeWork /></div>

      <section className="about funnel-about">
        <div className="about-photo"><img src={withBase("/alaa-mostafa.webp")} alt="Alaa Mostafa, founder of AIM Smart Solutions" width={760} height={1059} loading="lazy" /></div>
        <div className="about-copy">
          <p className="kicker">The founder</p>
          <h2>Alaa Mostafa</h2>
          <p className="role">Founder &amp; AI and Automation Consultant</p>
          <p>A trainer first, with more than 20 years in technology, education and training.</p>
          <p>A PhD in Semiconductor Physics.</p>
          <p>He understands your pain, builds the solution and teaches you to use it.</p>
        </div>
      </section>

      <CtaBand title="Talk to us" body="Book a free AI Opportunity Call to talk through your business and the first improvement worth exploring." />
    </main>
  );
}
