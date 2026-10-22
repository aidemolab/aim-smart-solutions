import type { Metadata } from "next";
import Link from "next/link";
import { pillars } from "@/lib/site";
import { demoById } from "@/lib/demos";
import { serviceBySlug } from "./data";
import { BookingButton, pillarNumber } from "../components/Blocks";
import DemoBadge from "../components/DemoBadge";

export const metadata: Metadata = {
  alternates: { canonical: "/services/" },
  title: "Services",
  description: "AI and automation services for UK service businesses, grouped by the pain they solve: win more customers, save time and decide better.",
};

export default function Services() {
  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="kicker">Our services</p>
        <h1>Practical technology for <em>three business pains.</em></h1>
        <p>Seven services, grouped by what they change for your business. Each one starts with the pain and uses the smallest practical solution.</p>
        <nav className="pillar-jump" aria-label="Jump to a pillar">
          {pillars.map((pillar) => <a key={pillar.id} href={`#${pillar.id}`}>{pillar.name}</a>)}
        </nav>
      </section>

      {pillars.map((pillar) => (
        <section className="pillar-section" id={pillar.id} key={pillar.id} aria-labelledby={`${pillar.id}-title`}>
          <div className="pillar-section-head">
            <p className="pillar-number">{pillarNumber(pillar)}</p>
            <div>
              <h2 id={`${pillar.id}-title`}>{pillar.name}</h2>
              <p className="pillar-promise">{pillar.promise}</p>
              <p>{pillar.intro}</p>
            </div>
            <ul className="pillar-problems" aria-label="Sounds familiar?">
              {pillar.problems.map((problem) => <li key={problem}>{problem}</li>)}
            </ul>
          </div>
          <div className="services-list">
            {pillar.services.map((slug) => {
              const service = serviceBySlug(slug);
              if (!service) return null;
              const badges = Array.from(new Set(service.demos.map((id) => demoById(id)?.badge).filter((badge) => badge !== undefined)));
              return (
                <article className="services-list-card" key={slug}>
                  {badges.length > 0 && <p className="card-badges">{badges.map((badge) => <DemoBadge key={badge} kind={badge} />)}<span>Demo available</span></p>}
                  <h3>{service.name}</h3>
                  <p>{service.tagline}</p>
                  <Link href={`/services/${slug}/`}>Explore {service.name} <span aria-hidden="true">→</span></Link>
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
