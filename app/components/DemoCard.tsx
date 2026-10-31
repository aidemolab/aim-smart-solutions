import Link from "next/link";
import type { Demo } from "@/lib/demos";
import { basePath } from "@/lib/base-path";
import DemoBadge from "./DemoBadge";

type Props = {
  demo: Demo;
  headingLevel?: 2 | 3;
  video?: string;
  // Service pages: text on the left, video on the right (stacked on phones), with the
  // Try button straight under the bold one-line description.
  row?: boolean;
  // Built-in tools: the button jumps to the tool further down the page instead.
  tryHref?: string;
  tryText?: string;
};

function TryLink({ demo, tryHref, tryText }: Pick<Props, "demo" | "tryHref" | "tryText">) {
  if (tryHref) return <a className="demo-try" href={tryHref}>{tryText} <span aria-hidden="true">↓</span></a>;
  return demo.external
    ? <a className="demo-try" href={demo.href}>{demo.tryLabel} <span aria-hidden="true">→</span></a>
    : <Link className="demo-try" href={demo.href}>{demo.tryLabel} <span aria-hidden="true">→</span></Link>;
}

function DemoVideo({ demo, video }: { demo: Demo; video: string }) {
  return (
    <figure className="demo-video demo-video-card">
      <h4>Watch the demo video</h4>
      <video controls preload="none" playsInline poster={`${basePath}/assets/videos/${video}-poster.jpg`} aria-label={`${demo.title} video`} data-video={video}>
        <source src={`${basePath}/assets/videos/${video}.mp4`} type="video/mp4" />
      </video>
    </figure>
  );
}

// A demo card: badge, title, summary, optionally its demo video, and the "Try it" link.
export default function DemoCard({ demo, headingLevel = 3, video, row, tryHref, tryText }: Props) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  if (row) {
    return (
      <article className="demo-tile demo-tile-row">
        <div className="demo-tile-text">
          <DemoBadge kind={demo.badge} />
          <Heading>{demo.title}</Heading>
          {demo.pain && <p className="demo-pain">{demo.pain}</p>}
        </div>
        <TryLink demo={demo} tryHref={tryHref} tryText={tryText} />
        {video && <DemoVideo demo={demo} video={video} />}
        <p className="demo-summary">{demo.summary}</p>
      </article>
    );
  }
  return (
    <article className="demo-tile">
      <div className="demo-tile-text">
        <DemoBadge kind={demo.badge} />
        <Heading>{demo.title}</Heading>
        {demo.pain && <p className="demo-pain">{demo.pain}</p>}
        <p>{demo.summary}</p>
      </div>
      {video && <DemoVideo demo={demo} video={video} />}
      <TryLink demo={demo} tryHref={tryHref} tryText={tryText} />
    </article>
  );
}
