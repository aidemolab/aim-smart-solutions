import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pillars, type Pillar } from "@/lib/site";
import { basePath } from "@/lib/base-path";
import { demoById, serviceVideos } from "@/lib/demos";
import { services, serviceBySlug, type Service } from "../data";
import { BookingButton, CostOfWaiting, CtaBand, StartHere } from "../../components/Blocks";
import DemoCard from "../../components/DemoCard";
import OpportunityScore from "../../components/demos/OpportunityScore";
import SkillsTaster from "../../components/demos/SkillsTaster";
import ContentGenerator from "../../components/demos/ContentGenerator";
import VoiceReceptionist from "../../components/demos/VoiceReceptionist";
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
      openGraph: { title: `${pillar.name} | AIM Smart Solutions`, description, images: [{ url: "/og-v3.png", width: 1200, height: 630, alt: "AIM Smart Solutions" }] },
    };
  }
  const service = serviceBySlug(slug);
  if (!service) return {};
  return {
    title: service.title,
    alternates: { canonical: `/services/${service.slug}/` },
    description: service.metaDescription,
    openGraph: { title: `${service.title} | AIM Smart Solutions`, description: service.metaDescription, images: [{ url: "/og-v3.png", width: 1200, height: 630, alt: "AIM Smart Solutions" }] },
  };
}

// Interactive demos built into the page (the rest are standalone apps shown as cards).
const FEATURED: Record<string, { id: string; render: () => React.ReactNode }> = {
  "sales-marketing": { id: "content-generator", render: () => <ContentGenerator /> },
  "ai-consultancy": { id: "ai-opportunity-score", render: () => <OpportunityScore /> },
  training: { id: "ai-skills-taster", render: () => <SkillsTaster /> },
  "course-design": { id: "ai-skills-taster", render: () => <SkillsTaster /> },
};

// The page's demo section. Every demo gets the same card: text and Try button on the left,
// its video (the same one as on /services/, from serviceVideos) on the right. A built-in tool's
// button says "Start the demo" and jumps to the tool, which sits under the card.
// Video-only pages show their video on its own.
function ServiceDemo({ service }: { service: Service }) {
  const videos = serviceVideos[service.slug] ?? [];
  const featured = FEATURED[service.slug];
  const cards = service.demos.map(demoById).filter((demo) => demo !== undefined);
  const videoFor = (id: string) => videos.find((v) => v.demoId === id)?.video ?? (videos.length === 1 && cards.length === 1 ? videos[0].video : undefined);
  const used = new Set(cards.map((demo) => videoFor(demo.id)));
  const top = videos.filter((v) => !used.has(v.video));
  return (
    <>
      {top.map((v) => (
        <figure className="demo-video" key={v.video}>
          <h3>{v.buttonLabel ?? (top.length > 1 ? `Watch the demo video: ${v.title}` : "Watch the demo video")}</h3>
          <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${v.video}-poster.jpg`} aria-label={`${v.title} video`} data-video={v.video}>
            <source src={`${basePath}/assets/videos/${v.video}.mp4`} type="video/mp4" />
          </video>
        </figure>
      ))}
      {cards.length > 0 && (
        <div className="demo-tiles demo-tiles-rows">
          {cards.map((demo) => demo.id === "voice-receptionist"
            // The voice demo runs inside its card: "Start talking" starts the call right there.
            ? <DemoCard key={demo.id} demo={demo} video={videoFor(demo.id)} row action={<VoiceReceptionist videoAnchor={`video-${demo.id}`} />} />
            : demo.id === featured?.id
            ? <DemoCard key={demo.id} demo={demo} video={videoFor(demo.id)} row tryHref="#demo-tool" tryText="Start the demo" />
            : <DemoCard key={demo.id} demo={demo} video={videoFor(demo.id)} row />)}
        </div>
      )}
      {featured && <div className="demo-tool" id="demo-tool">{featured.render()}</div>}
      {top.length === 0 && !featured && cards.length === 0 && (
        <div className="demo-placeholder">
          <h3>See it for your business</h3>
          <p>On the free call we can walk through a relevant example using the kind of data and processes you work with.</p>
          <BookingButton />
        </div>
      )}
    </>
  );
}

// Pages with something to try say "Try the live demo"; video-only pages say "Watch the demo".
// Either way the hero button scrolls to this page's own #demo section.
const hasTryable = (service: Service) => Boolean(FEATURED[service.slug]) || service.demos.length > 0;
// Video-only pages can name their video, e.g. "Watch our showreel" on Video Production.
const watchLabel = (service: Service) => serviceVideos[service.slug]?.[0]?.buttonLabel ?? "Watch the demo";

function TryDemoButton({ service }: { service: Service }) {
  return <a className="button secondary try-live-demo" href="#demo">{hasTryable(service) ? "Try the live demo" : watchLabel(service)} <span aria-hidden="true">↓</span></a>;
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
  // AI Voice Agents opens with the cost of missed calls and adds the AI Receptionist offer
  // before its demo; otherwise every service page has the same sections in the same order.
  const story = service.slug === "ai-voice-agents";
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

      <section className="service-demo" id="demo" aria-labelledby="demo-title">
        <p className="kicker">{hasTryable(service) ? "Try it" : "Watch it"}</p>
        <h2 id="demo-title">See it <em>working.</em></h2>
        <ServiceDemo service={service} />
      </section>

      {ctaBand}

      {siblings.length > 0 && (
        <section className="related-services" aria-labelledby="related-title">
          <h2 id="related-title">Also in {pillar.name}</h2>
          <ul>{siblings.map((item) => <li key={item.slug}><Link href={`/services/${item.slug}/`}><strong>{item.name}</strong><span>{item.tagline}</span></Link></li>)}</ul>
        </section>
      )}

      <nav className="service-pager" aria-label="More services">
        <Link className="pager-link" href={`/services/${prev.slug}/`} rel="prev"><span>← Previous service</span><strong>{prev.name}</strong></Link>
        <a className="button secondary pager-demo" href="#demo">{hasTryable(service) ? "Try the demo" : watchLabel(service)} <span aria-hidden="true">↑</span></a>
        <Link className="pager-link is-next" href={`/services/${next.slug}/`} rel="next"><span>Next service →</span><strong>{next.name}</strong></Link>
      </nav>
    </main>
  );
}
