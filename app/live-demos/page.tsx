import type { Metadata } from "next";
import Link from "next/link";
import { serviceVideos, sharedServiceVideo } from "@/lib/demos";
import { pillars } from "@/lib/site";
import { serviceBySlug } from "../services/data";
import { BookingButton } from "../components/Blocks";
import DemoBadge from "../components/DemoBadge";
import VideoModalLink from "../components/VideoModalLink";

export const metadata: Metadata = {
  alternates: { canonical: "/live-demos/" },
  title: "Live AI Demos",
  description: "Watch a short video of every AIM Smart Solutions demo, grouped by service, then try the interactive demos on each service page.",
};

const groups = pillars.map((pillar) => ({
  pillar,
  services: pillar.services.map(serviceBySlug).filter((service) => service !== undefined),
}));

// One card per demo video: title, one short line, "Watch the demo video" (same pop-up player as
// the rest of the site). The interactive demos live on the service pages.
export default function LiveDemos() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">Live demos</p>
        <h1>Don&apos;t just read about AI. <em>See it working.</em></h1>
        <p>Watch a short video of each demo, then go to its service page to try it yourself. Each one is labelled so you know exactly what you are looking at.</p>
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
            const shared = sharedServiceVideo[service.slug] ? serviceBySlug(sharedServiceVideo[service.slug]) : undefined;
            const cards = serviceVideos[service.slug] ?? [];
            return (
              <section className="lab-service" id={`demos-${service.slug}`} key={service.slug} aria-labelledby={`lab-${service.slug}`}>
                <h2 id={`lab-${service.slug}`}><Link href={`/services/${service.slug}/`}>{service.name}</Link></h2>
                <p className="lab-go"><Link href={`/services/${service.slug}/#demo`}>Go to {service.name} <span aria-hidden="true">→</span></Link></p>
                {shared ? (
                  <>
                    <p className="lab-shared">Course design is shown through the 5-minute AI Skills Taster, under <a href={`#demos-${shared.slug}`}>{shared.name}</a>.</p>
                    <div className="lab-watch lab-shared-watch"><VideoModalLink video={serviceVideos[shared.slug][0].video} title={serviceVideos[shared.slug][0].title} label="Watch the demo video" /></div>
                  </>
                ) : (
                  <div className="lab-grid">
                    {cards.map((card) => (
                      // Cards that record a demo carry its badge; explainers and examples do not.
                      <article className={card.badge ? "demo-tile" : "demo-tile lab-video-tile"} key={card.video}>
                        {card.badge && <DemoBadge kind={card.badge} />}
                        <h3>{card.title}</h3>
                        <p>{card.line}</p>
                        <div className="lab-watch"><VideoModalLink video={card.video} title={card.title} label="Watch the demo video" /></div>
                      </article>
                    ))}
                  </div>
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
