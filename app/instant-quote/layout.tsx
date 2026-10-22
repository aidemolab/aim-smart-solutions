import type { Metadata } from "next";

// The page itself is a client component, so its title and description live here.
export const metadata: Metadata = {
  alternates: { canonical: "/instant-quote/" },
  title: "Request a Quote",
  description: "Request a tailored quote from AIM Smart Solutions: choose the services you need and describe the outcome you want. We reply within 24 hours.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
