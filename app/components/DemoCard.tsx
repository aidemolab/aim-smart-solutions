import Link from "next/link";
import type { Demo } from "@/lib/demos";
import { basePath } from "@/lib/base-path";
import DemoBadge from "./DemoBadge";

export default function DemoCard({ demo, headingLevel = 3, showVideo = false }: { demo: Demo; headingLevel?: 2 | 3; showVideo?: boolean }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const video = showVideo ? demo.video : undefined;
  return (
    <article className="demo-tile">
      <DemoBadge kind={demo.badge} />
      <Heading>{demo.title}</Heading>
      {demo.pain && <p className="demo-pain">{demo.pain}</p>}
      <p>{demo.summary}</p>
      {video && (
        <figure className="demo-video demo-video-card">
          <h4>Watch the 1-minute demo</h4>
          <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${video}-poster.jpg`} aria-label={`Narrated 1-minute video demo of the ${demo.title}, with captions`}>
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
