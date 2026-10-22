import type { Metadata } from "next";

// The page itself is a client component, so its title and description live here.
export const metadata: Metadata = {
  alternates: { canonical: "/book-appointment/" },
  title: "Book a Free AI Opportunity Call",
  description: "Choose a time for a free, no-obligation AI Opportunity Call with Alaa Mostafa and find the first improvement worth making in your business.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
