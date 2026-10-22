import type { DemoBadgeKind } from "@/lib/demos";

// Every demo must show one of these two badges (see CLAUDE.md).
export default function DemoBadge({ kind }: { kind: DemoBadgeKind }) {
  return <span className={`demo-badge ${kind === "Live" ? "is-live" : "is-illustrative"}`}>{kind}</span>;
}
