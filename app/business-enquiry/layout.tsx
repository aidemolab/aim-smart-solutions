import type { Metadata } from "next";

// The page itself is a client component, so its title and description live here.
export const metadata: Metadata = {
  title: "Send an Enquiry",
  description: "Send AIM Smart Solutions an enquiry and get an instant email confirmation. A live demo of automated enquiry handling for service businesses.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
