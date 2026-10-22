import Link from "next/link";
import type { Demo } from "@/lib/demos";
import DemoBadge from "./DemoBadge";

export default function DemoCard({ demo, headingLevel = 3 }: { demo: Demo; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <article className="demo-tile">
      <DemoBadge kind={demo.badge} />
      <Heading>{demo.title}</Heading>
      {demo.pain && <p className="demo-pain">{demo.pain}</p>}
      <p>{demo.summary}</p>
      {demo.external
        ? <a className="demo-try" href={demo.href}>{demo.tryLabel} <span aria-hidden="true">→</span></a>
        : <Link className="demo-try" href={demo.href}>{demo.tryLabel} <span aria-hidden="true">→</span></Link>}
    </article>
  );
}
