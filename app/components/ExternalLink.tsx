// A link to another website: opens in a new tab, with a small ↗ and a hidden
// "(opens in a new tab)" for screen readers. Links to aimsmartsolutions.tech and to our
// demo apps (aidemolab.github.io) use a plain <a> or <Link> and stay in the same tab.
export default function ExternalLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ? `external-link ${className}` : "external-link"}>
      {children}<span className="external-icon" aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
