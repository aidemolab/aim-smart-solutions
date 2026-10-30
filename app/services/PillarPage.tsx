// A pillar page: the pillar's promise and pain lines, then a card for each of its services.
// Copy comes from lib/site.ts and app/services/data.ts, shared with the homepage and /services/.
import Link from "next/link";
import { SITE_URL, type Pillar } from "@/lib/site";
import { serviceBySlug } from "./data";
import { CtaBand, pillarNumber } from "../components/Blocks";

export default function PillarPage({ pillar }: { pillar: Pillar }) {
  const services = pillar.services.map(serviceBySlug).filter((service) => service !== undefined);
  return (
    <main id="main" className="services-main">
      <section className="services-hero pillar-hero">
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li aria-current="page">{pillar.name}</li>
          </ol>
        </nav>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: pillar.name, item: `${SITE_URL}/services/${pillar.id}/` },
          ],
        }) }} />
        <div className="pillar-section-head">
          <p className="pillar-number">{pillarNumber(pillar)}</p>
          <div>
            <h1>{pillar.name}</h1>
            <p className="pillar-promise">{pillar.promise}</p>
            <p>{pillar.intro}</p>
          </div>
          <ul className="pillar-problems" aria-label="Sounds familiar?">
            {pillar.problems.map((problem) => <li key={problem}>{problem}</li>)}
          </ul>
        </div>
      </section>

      <section className="pillar-page-services" aria-labelledby="pillar-services-title">
        <h2 id="pillar-services-title" className="sr-only">{pillar.name} services</h2>
        <ul className="pillar-service-cards">
          {services.map((service) => (
            <li key={service.slug}>
              <Link className="pillar-service-card" href={`/services/${service.slug}/`}>
                <h3>{service.name}</h3>
                <p>{service.tagline}</p>
                <span className="pillar-service-more">Explore {service.name} <span aria-hidden="true">→</span></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="pillar-page-all"><Link href="/services/">See all nine services</Link></p>
      </section>

      <CtaBand title="Not sure which service fits?" body="That is what the free call is for. We will start with your business and find the first improvement worth making." />
    </main>
  );
}
