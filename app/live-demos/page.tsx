import type { Metadata } from "next";
import Link from "next/link";
import { demoById, VOICE_AGENTS_VIDEO, videoExamples } from "@/lib/demos";
import { pillars } from "@/lib/site";
import { serviceBySlug } from "../services/data";
import { BookingButton } from "../components/Blocks";
import DemoBadge from "../components/DemoBadge";
import DemoCard from "../components/DemoCard";
import VideoModalLink from "../components/VideoModalLink";

export const metadata: Metadata = {
  alternates: { canonical: "/live-demos/" },
  title: "Live AI Demos",
  description: "Try AIM Smart Solutions' AI and automation demos yourself: enquiry handling, instant quotes, online booking and a smart decision app.",
};

// One heading per service, in pillar order. Each service shows the demos in its own "Try it"
// section (service.demos in app/services/data.ts, the same list the service page uses).
// Services that share a demo point to where it is shown instead of repeating it.
const SHARED: Record<string, string> = { "course-design": "training" };

const groups = pillars.map((pillar) => ({
  pillar,
  services: pillar.services.map(serviceBySlug).filter((service) => service !== undefined),
}));

export default function LiveDemos() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">Live demos</p>
        <h1>Don&apos;t just read about AI. <em>Try it.</em></h1>
        <p>Every demo here is something you can use right now. Each one is labelled so you know exactly what you are looking at.</p>
        <dl className="badge-key">
          <div><dt><DemoBadge kind="Live" /></dt><dd>Works for real. Forms send real emails; the data apps keep your own records for 24 hours.</dd></div>
          <div><dt><DemoBadge kind="Illustrative data" /></dt><dd>Runs on fictional sample data to show what is possible.</dd></div>
        </dl>
        <nav className="lab-jump" aria-label="Jump to a service">
          <p>Go straight to a service</p>
          <ul>
            {groups.flatMap(({ services }) => services).map((service) => <li key={service.slug}><a href={`#demos-${service.slug}`}>{service.name}</a></li>)}
          </ul>
        </nav>
      </section>

      {groups.map(({ pillar, services }) => (
        <div className="lab-pillar" key={pillar.id}>
          <p className="lab-pillar-label"><Link href={`/services/${pillar.id}/`}>{pillar.name}</Link></p>
          {services.map((service) => {
            const shared = SHARED[service.slug] ? serviceBySlug(SHARED[service.slug]) : undefined;
            const list = shared ? [] : service.demos.map(demoById).filter((demo) => demo !== undefined);
            return (
              <section className="lab-service" id={`demos-${service.slug}`} key={service.slug} aria-labelledby={`lab-${service.slug}`}>
                <h2 id={`lab-${service.slug}`}><Link href={`/services/${service.slug}/`}>{service.name}</Link></h2>
                {service.slug === "ai-voice-agents" && (
                  <div className="card-videos lab-videos"><VideoModalLink video={VOICE_AGENTS_VIDEO} title="AI Voice Agents explainer" label="Watch the 1-minute explainer" /></div>
                )}
                {shared && (
                  <p className="lab-shared">Course design is shown through the 5-minute AI Skills Taster. <a href={`#demos-${shared.slug}`}>Try it under {shared.name} <span aria-hidden="true">↑</span></a></p>
                )}
                {service.slug === "video-production" ? (
                  <div className="lab-grid">
                    {videoExamples.map((item) => (
                      <article className="demo-tile lab-video-tile" key={item.video}>
                        <p className="demo-pain">{item.kind}</p>
                        <h3>{item.title}</h3>
                        <p>{item.summary}</p>
                        <div className="card-videos"><VideoModalLink video={item.video} title={item.title} label="Watch example" /></div>
                      </article>
                    ))}
                  </div>
                ) : list.length > 0 && (
                  <div className="lab-grid">{list.map((demo) => <DemoCard key={demo.id} demo={demo} />)}</div>
                )}
              </section>
            );
          })}
        </div>
      ))}

      <section className="services-cta">
        <h2>Want this for your business?</h2>
        <p>Every demo here can be adapted to your services, your customers and the tools you already use. Start with a free conversation.</p>
        <BookingButton />
      </section>
    </main>
  );
}
