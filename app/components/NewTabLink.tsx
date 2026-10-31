// A link that opens in a new tab, with a small ↗ and a hidden "(opens in a new tab)" for screen
// readers. Used for links to other websites, and for links in or directly under a form
// (className "form-link") so a visitor never loses what they typed. Other links to our pages
// and demo apps use a plain <a> or <Link> and stay in the same tab.
export default function NewTabLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className ? `external-link ${className}` : "external-link"}>
      {children}<span className="external-icon" aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
