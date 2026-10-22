import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pillars } from "@/lib/site";
import { demoById } from "@/lib/demos";
import { services, serviceBySlug, type Service } from "../data";
import { BookingButton, CtaBand, EnquiryJourney } from "../../components/Blocks";
import DemoCard from "../../components/DemoCard";
import OpportunityScore from "../../components/demos/OpportunityScore";
import SkillsTaster from "../../components/demos/SkillsTaster";
import ContentGenerator from "../../components/demos/ContentGenerator";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return services.map((service) => ({ slug: service.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const service = serviceBySlug((await params).slug);
  if (!service) return {};
  return {
    title: service.title,
    alternates: { canonical: `/services/${service.slug}/` },
    description: service.metaDescription,
    openGraph: { title: `${service.title} | AIM Smart Solutions`, description: service.metaDescription, images: [{ url: "/og.png", width: 1200, height: 630, alt: "AIM Smart Solutions" }] },
  };
}

// The demo shown on each service page: an optional featured built-in demo, then cards for the others.
const FEATURED: Record<string, { id: string; render: () => React.ReactNode }> = {
  "sales-marketing": { id: "content-generator", render: () => <ContentGenerator /> },
  "business-automation": { id: "enquiry-journey", render: () => <EnquiryJourney /> },
  "ai-consultancy": { id: "ai-opportunity-score", render: () => <OpportunityScore /> },
  training: { id: "ai-skills-taster", render: () => <SkillsTaster /> },
};

function ServiceDemo({ service }: { service: Service }) {
  const featured = FEATURED[service.slug];
  const list = service.demos.filter((id) => id !== featured?.id).map(demoById).filter((demo) => demo !== undefined);
  if (!featured && list.length === 0) {
    return (
      <div className="demo-placeholder">
        <h3>See it for your business</h3>
        <p>On the free call we can walk through a relevant example using the kind of data and processes you work with.</p>
        <BookingButton />
      </div>
    );
  }
  return (
    <>
      {featured?.render()}
      {list.length > 0 && <div className={`demo-tiles${featured ? " demo-tiles-after" : ""}`}>{list.map((demo) => <DemoCard key={demo.id} demo={demo} />)}</div>}
    </>
  );
}

export default async function ServicePage({ params }: Params) {
  const service = serviceBySlug((await params).slug);
  if (!service) notFound();
  const pillar = pillars.find((item) => item.id === service.pillar)!;
  const siblings = pillar.services.filter((slug) => slug !== service.slug).map(serviceBySlug).filter((item) => item !== undefined);

  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <p className="part-of">Part of: <Link href={`/services/#${pillar.id}`}>{pillar.name}</Link></p>
        <h1>{service.title}</h1>
        <p className="service-tagline">{service.tagline}</p>
        <p>{service.description}</p>
        <div className="service-hero-actions">
          <BookingButton />
          <a className="button secondary" href="#demo">See the demo <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <section className="service-explain">
        <div>
          <p className="kicker">How it helps</p>
          <h2>What this means <em>for your business.</em></h2>
        </div>
        <div className="service-explain-copy">{service.explanation.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
      </section>

      <section className="service-benefits" aria-labelledby="benefits-title">
        <p className="kicker">Business benefits</p>
        <h2 id="benefits-title" className="sr-only">Business benefits</h2>
        <div className="benefit-cards">
          {service.benefits.map((benefit) => <article key={benefit.title}><h3>{benefit.title}</h3><p>{benefit.body}</p></article>)}
        </div>
      </section>

      <section className="services-detail">
        <div>
          <p className="kicker">Use cases</p>
          <h2>Where it fits.</h2>
          <ul className="services-feature-list">{service.useCases.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <aside className="services-benefit">
          <p className="kicker">What&apos;s included</p>
          <ul className="included-list">{service.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
          <p>Every solution is tailored to your requirements and budget.</p>
        </aside>
      </section>

      <section className="service-demo" id="demo" aria-labelledby="demo-title">
        <p className="kicker">Try it</p>
        <h2 id="demo-title">See it <em>working.</em></h2>
        <ServiceDemo service={service} />
      </section>

      {siblings.length > 0 && (
        <section className="related-services" aria-labelledby="related-title">
          <h2 id="related-title">Also in {pillar.name}</h2>
          <ul>{siblings.map((item) => <li key={item.slug}><Link href={`/services/${item.slug}/`}><strong>{item.name}</strong><span>{item.tagline}</span></Link></li>)}</ul>
        </section>
      )}

      <CtaBand title={`Could ${service.name} help your business?`} body="Book a free AI Opportunity Call. We will look at where it fits and whether it is the right first step." />
    </main>
  );
}
