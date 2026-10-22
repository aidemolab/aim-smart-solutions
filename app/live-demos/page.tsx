import type { Metadata } from "next";
import { demos } from "@/lib/demos";
import { BookingButton } from "../components/Blocks";
import DemoBadge from "../components/DemoBadge";
import DemoCard from "../components/DemoCard";

export const metadata: Metadata = {
  alternates: { canonical: "/live-demos/" },
  title: "Live AI Demos: the AI Lab",
  description: "Try AIM Smart Solutions' AI and automation demos yourself: enquiry handling, instant quotes, online booking and a smart decision app.",
};

export default function LiveDemos() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">The AI Lab</p>
        <h1>Don&apos;t just read about AI. <em>Try it.</em></h1>
        <p>Every demo here is something you can use right now. Each one is labelled so you know exactly what you are looking at.</p>
        <dl className="badge-key">
          <div><dt><DemoBadge kind="Live" /></dt><dd>Works for real. Forms send real emails; the data apps keep your own records for 24 hours.</dd></div>
          <div><dt><DemoBadge kind="Illustrative data" /></dt><dd>Runs on fictional sample data to show what is possible.</dd></div>
        </dl>
      </section>

      <section className="lab-grid" aria-label="Demos">
        {demos.map((demo) => <DemoCard key={demo.id} demo={demo} headingLevel={2} />)}
      </section>

      <section className="services-cta">
        <h2>Want this for your business?</h2>
        <p>Every demo here can be adapted to your services, your customers and the tools you already use. Start with a free conversation.</p>
        <BookingButton />
      </section>
    </main>
  );
}
