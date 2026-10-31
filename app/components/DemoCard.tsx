import Link from "next/link";
import type { Demo } from "@/lib/demos";
import { basePath } from "@/lib/base-path";
import DemoBadge from "./DemoBadge";

// A demo card: badge, title, summary, optionally its demo video, and the "Try it" link.
export default function DemoCard({ demo, headingLevel = 3, video }: { demo: Demo; headingLevel?: 2 | 3; video?: string }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="demo-tile">
      <div className="demo-tile-text">
        <DemoBadge kind={demo.badge} />
        <Heading>{demo.title}</Heading>
        {demo.pain && <p className="demo-pain">{demo.pain}</p>}
        <p>{demo.summary}</p>
      </div>
      {video && (
        <figure className="demo-video demo-video-card">
          <h4>Watch the demo video</h4>
          <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${video}-poster.jpg`} aria-label={`${demo.title} video`} data-video={video}>
            <source src={`${basePath}/assets/videos/${video}.mp4`} type="video/mp4" />
          </video>
        </figure>
      )}
      {demo.external
        ? <a className="demo-try" href={demo.href}>{demo.tryLabel} <span aria-hidden="true">→</span></a>
        : <Link className="demo-try" href={demo.href}>{demo.tryLabel} <span aria-hidden="true">→</span></Link>}
    </article>
  );
}
