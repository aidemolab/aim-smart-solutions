import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pillars, type Pillar } from "@/lib/site";
import { basePath } from "@/lib/base-path";
import { demoById, PHARMA_VIDEO, VOICE_AGENTS_VIDEO, videoExamples } from "@/lib/demos";
import { services, serviceBySlug, type Service } from "../data";
import { BookingButton, CostOfWaiting, CtaBand, EnquiryJourney, ProofJourneys, StartHere } from "../../components/Blocks";
import DemoCard from "../../components/DemoCard";
import OpportunityScore from "../../components/demos/OpportunityScore";
import SkillsTaster from "../../components/demos/SkillsTaster";
import ContentGenerator from "../../components/demos/ContentGenerator";
import PillarPage from "../PillarPage";

type Params = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return [...pillars.map((pillar) => ({ slug: pillar.id })), ...services.map((service) => ({ slug: service.slug }))];
}

const pillarBySlug = (slug: string): Pillar | undefined => pillars.find((pillar) => pillar.id === slug);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const slug = (await params).slug;
  const pillar = pillarBySlug(slug);
  if (pillar) {
    const description = `${pillar.promise}. ${pillar.intro}`;
    return {
      title: `${pillar.name}: ${pillar.promise}`,
      alternates: { canonical: `/services/${pillar.id}/` },
      description,
      openGraph: { title: `${pillar.name} | AIM Smart Solutions`, description, images: [{ url: "/og-v2.png", width: 1200, height: 630, alt: "AIM Smart Solutions" }] },
    };
  }
  const service = serviceBySlug(slug);
  if (!service) return {};
  return {
    title: service.title,
    alternates: { canonical: `/services/${service.slug}/` },
    description: service.metaDescription,
    openGraph: { title: `${service.title} | AIM Smart Solutions`, description: service.metaDescription, images: [{ url: "/og-v2.png", width: 1200, height: 630, alt: "AIM Smart Solutions" }] },
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
  const featuredDemo = featured ? demoById(featured.id) : undefined;
  return (
    <>
      {featuredDemo?.video && (
        <figure className="demo-video">
          <h3>Watch the 1-minute demo</h3>
          <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${featuredDemo.video}-poster.jpg`} aria-label={`Narrated 1-minute video demo of the ${featuredDemo.title}, with captions`}>
            <source src={`${basePath}/assets/videos/${featuredDemo.video}.mp4`} type="video/mp4" />
          </video>
        </figure>
      )}
      {featured?.render()}
      {list.length > 0 && <div className={`demo-tiles${featured ? " demo-tiles-after" : ""}`}>{list.map((demo) => <DemoCard key={demo.id} demo={demo} showVideo />)}</div>}
    </>
  );
}

// "Try the live demo": straight to the app when the page features exactly one demo
// and it is a standalone app; otherwise to the demo section on this page.
function TryDemoButton({ service }: { service: Service }) {
  const featured = FEATURED[service.slug];
  const all = service.demos.map(demoById).filter((demo) => demo !== undefined);
  if (!featured && all.length === 0) return <a className="button secondary" href="#demo">{service.slug === "video-production" ? "Watch examples" : "See the demo"} <span aria-hidden="true">↓</span></a>;
  const only = !featured && all.length === 1 && all[0].external ? all[0] : undefined;
  return <a className="button secondary try-live-demo" href={only ? only.href : "#demo"}>Try the live demo <span aria-hidden="true">{only ? "→" : "↓"}</span></a>;
}

export default async function ServicePage({ params }: Params) {
  const slug = (await params).slug;
  const pillarPage = pillarBySlug(slug);
  if (pillarPage) return <PillarPage pillar={pillarPage} />;
  const service = serviceBySlug(slug);
  if (!service) notFound();
  const pillar = pillars.find((item) => item.id === service.pillar)!;
  const siblings = pillar.services.filter((slug) => slug !== service.slug).map(serviceBySlug).filter((item) => item !== undefined);
  // Previous / next service across all pillars, wrapping round so there is never a dead end.
  const ordered = pillars.flatMap((p) => p.services).map(serviceBySlug).filter((item) => item !== undefined);
  const index = ordered.findIndex((item) => item.slug === service.slug);
  const prev = ordered[(index - 1 + ordered.length) % ordered.length];
  const next = ordered[(index + 1) % ordered.length];
  // AI Voice Agents tells one story: pain → explanation → offer → proof → book a call.
  const story = service.slug === "ai-voice-agents";
  const voiceVideo = (
    <figure className="demo-video">
      <h3>Watch the 1-minute explainer</h3>
      <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${VOICE_AGENTS_VIDEO}-poster.jpg`} aria-label="Narrated 1-minute explainer video of AI Voice Agents answering calls and calling new leads, with captions">
        <source src={`${basePath}/assets/videos/${VOICE_AGENTS_VIDEO}.mp4`} type="video/mp4" />
      </video>
    </figure>
  );
  const ctaBand = <CtaBand title={`Could ${service.name} help your business?`} body="Book a free AI Opportunity Call. We will look at where it fits and whether it is the right first step." />;

  return (
    <main id="main" className="services-main">
      <section className="services-hero">
        <nav aria-label="Breadcrumb" className="breadcrumbs">
          <ol>
            <li><Link href="/">Home</Link></li>
            <li><Link href={`/services/${pillar.id}/`}>{pillar.name}</Link></li>
            <li aria-current="page">{service.name}</li>
          </ol>
        </nav>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org", "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: "https://aimsmartsolutions.tech/" },
            { "@type": "ListItem", position: 2, name: pillar.name, item: `https://aimsmartsolutions.tech/services/${pillar.id}/` },
            { "@type": "ListItem", position: 3, name: service.name, item: `https://aimsmartsolutions.tech/services/${service.slug}/` },
          ],
        }) }} />
        <h1>{service.title}</h1>
        <p className="service-tagline">{service.tagline}</p>
        <p>{service.description}</p>
        <div className="service-hero-actions">
          <BookingButton />
          <TryDemoButton service={service} />
        </div>
      </section>

      {story && <CostOfWaiting />}

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

      {story && <div className="section start-here-wrap service-offer"><StartHere /></div>}

      {story && <ProofJourneys>{voiceVideo}</ProofJourneys>}
      {story && ctaBand}

      {!story && <section className="service-demo" id="demo" aria-labelledby="demo-title">
        <p className="kicker">Try it</p>
        <h2 id="demo-title">See it <em>working.</em></h2>
        {service.slug === "smart-apps" && (
          <figure className="demo-video">
            <h3>Watch the 1-minute demo</h3>
            <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${PHARMA_VIDEO}-poster.jpg`} aria-label="Narrated 1-minute video demo of the pharmaceutical market intelligence app, with captions">
              <source src={`${basePath}/assets/videos/${PHARMA_VIDEO}.mp4`} type="video/mp4" />
            </video>
          </figure>
        )}
        {service.slug === "video-production" && (
          <>
            <p className="kicker">Examples of our work</p>
            <div className="demo-tiles">
              {videoExamples.map((item) => (
                <article className="demo-tile" key={item.video}>
                  <h3>{item.title}</h3>
                  <p className="demo-pain">{item.kind}</p>
                  <p>{item.summary}</p>
                  <figure className="demo-video demo-video-card">
                    <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${item.video}-poster.jpg`} aria-label={`Narrated 1-minute video: ${item.title}, with captions`}>
                      <source src={`${basePath}/assets/videos/${item.video}.mp4`} type="video/mp4" />
                    </video>
                  </figure>
                </article>
              ))}
            </div>
          </>
        )}
        {service.slug !== "video-production" && <ServiceDemo service={service} />}
      </section>}

      {siblings.length > 0 && (
        <section className="related-services" aria-labelledby="related-title">
          <h2 id="related-title">Also in {pillar.name}</h2>
          <ul>{siblings.map((item) => <li key={item.slug}><Link href={`/services/${item.slug}/`}><strong>{item.name}</strong><span>{item.tagline}</span></Link></li>)}</ul>
        </section>
      )}

      <nav className="service-pager" aria-label="More services">
        <Link className="pager-link" href={`/services/${prev.slug}/`} rel="prev"><span>← Previous service</span><strong>{prev.name}</strong></Link>
        <a className="button secondary pager-demo" href="#demo">Try the demo <span aria-hidden="true">↑</span></a>
        <Link className="pager-link is-next" href={`/services/${next.slug}/`} rel="next"><span>Next service →</span><strong>{next.name}</strong></Link>
      </nav>

      {!story && ctaBand}
    </main>
  );
}
