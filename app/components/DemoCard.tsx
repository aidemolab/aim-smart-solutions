import Link from "next/link";
import type { Demo } from "@/lib/demos";
import DemoBadge from "./DemoBadge";

export default function DemoCard({ demo, headingLevel = 3 }: { demo: Demo; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="demo-tile">
      <DemoBadge kind={demo.badge} />
      <Heading>{demo.title}</Heading>
      <p>{demo.summary}</p>
      {demo.external
        ? <a className="demo-try" href={demo.href} target="_blank" rel="noopener noreferrer">{demo.tryLabel} <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a>
        : <Link className="demo-try" href={demo.href}>{demo.tryLabel} <span aria-hidden="true">→</span></Link>}
    </article>
  );
}
