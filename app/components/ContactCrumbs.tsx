// "← Back to Contact", the breadcrumb (Home › Contact › page) and matching BreadcrumbList data,
// for the pages in the Contact section: booking, enquiry and quote. Their URLs stay unchanged.
import Link from "next/link";
import { SITE_URL } from "@/lib/site";

export const CONTACT_SECTION = ["/contact", "/book-appointment", "/business-enquiry", "/instant-quote"];

export default function ContactCrumbs({ name, path }: { name: string; path: string }) {
  return (
    <div className="contact-crumbs">
      <Link className="back-to-contact" href="/contact/"><span aria-hidden="true">←</span> Back to Contact</Link>
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <ol>
          <li><Link href="/">Home</Link></li>
          <li><Link href="/contact/">Contact</Link></li>
          <li aria-current="page">{name}</li>
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Contact", item: `${SITE_URL}/contact/` },
          { "@type": "ListItem", position: 3, name, item: `${SITE_URL}${path}` },
        ],
      }) }} />
    </div>
  );
}
