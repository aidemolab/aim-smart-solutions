import type { Metadata } from "next";
import Link from "next/link";
import { pillars } from "@/lib/site";
import { serviceVideos, sharedServiceVideo } from "@/lib/demos";
import { serviceBySlug } from "./data";
import { BookingButton, pillarNumber } from "../components/Blocks";
import VideoModalLink from "../components/VideoModalLink";

export const metadata: Metadata = {
  alternates: { canonical: "/services/" },
  title: "Services",
  description: "AI and automation services for UK solo traders and small businesses, grouped by the four everyday pains they fix, each with a short demo video.",
};

// The single overview page: the four pillars, their services, and a short demo video for each.
// No try buttons or badges here; the interactive demos stay on each service page.
export default function Services() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">Our services</p>
        <h1>AI for four everyday pains, <em>and a team ready to use it.</em></h1>
        <p>Nine services, grouped by what they change for your business. Watch a short demo of each one, then explore the service to try it yourself.</p>
        <nav className="pillar-jump" aria-label="Jump to a pillar">
          {pillars.map((pillar) => <a key={pillar.id} href={`#${pillar.id}`}>{pillar.name}</a>)}
        </nav>
      </section>

      {pillars.map((pillar) => (
        <section className="pillar-section" id={pillar.id} key={pillar.id} aria-labelledby={`${pillar.id}-title`}>
          <div className="pillar-section-head">
            <p className="pillar-number">{pillarNumber(pillar)}</p>
            <div>
              <h2 id={`${pillar.id}-title`}><Link className="pillar-heading-link" href={`/services/${pillar.id}/`}>{pillar.name}</Link></h2>
              <p className="pillar-promise">{pillar.promise}</p>
            </div>
            <ul className="pillar-problems" aria-label="Sounds familiar?">
              {pillar.problems.map((problem) => <li key={problem}>{problem}</li>)}
            </ul>
          </div>
          <div className="services-list">
            {pillar.services.map((slug) => {
              const service = serviceBySlug(slug);
              if (!service) return null;
              const shared = sharedServiceVideo[slug] ? serviceBySlug(sharedServiceVideo[slug]) : undefined;
              const videos = serviceVideos[slug] ?? [];
              return (
                <article className="services-list-card service-video-card" id={`service-${slug}`} key={slug}>
                  <h3>{service.name}</h3>
                  <p>{service.tagline}</p>
                  {shared ? (
                    <p className="service-video-shared">Shown through the 5-minute AI Skills Taster: <a href={`#service-${shared.slug}`}>see its video under {shared.name}</a>.</p>
                  ) : (
                    <ul className="service-videos">
                      {videos.map((video) => (
                        <li key={video.video}>
                          {videos.length > 1 && <span className="service-video-name">{video.title}</span>}
                          <VideoModalLink video={video.video} title={video.title} label="Watch the demo video" />
                        </li>
                      ))}
                    </ul>
                  )}
                  <Link className="service-explore" href={`/services/${slug}/`}>Explore {service.name} <span aria-hidden="true">→</span></Link>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <section className="services-cta">
        <h2>Not sure which service fits?</h2>
        <p>That is what the free call is for. We will start with your business and find the first improvement worth making.</p>
        <BookingButton />
      </section>
    </main>
  );
}
