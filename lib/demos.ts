// Every demo on the site, with its badge. "Live" means it works for real;
// "Illustrative data" means it runs on fictional sample data.

export type DemoBadgeKind = "Live" | "Illustrative data";

export type Demo = {
  id: string;
  title: string;
  summary: string;
  href: string;
  external?: boolean;
  badge: DemoBadgeKind;
  tryLabel: string;
  service: string; // slug of the service page that features it
};

export const demos: Demo[] = [
  {
    id: "ai-opportunity-score",
    title: "AI Opportunity Score",
    summary: "Answer seven quick questions about how your business runs and get a score out of 100, a short explanation and your top three recommended services.",
    href: "/services/ai-consultancy/#demo",
    badge: "Live",
    tryLabel: "Get your score",
    service: "ai-consultancy",
  },
  {
    id: "enquiry-journey",
    title: "Enquiry journey",
    summary: "Send an enquiry and receive an instant acknowledgement by email while the business owner gets an alert. An AI call-back for urgent enquiries can be added.",
    href: "/business-enquiry/",
    badge: "Live",
    tryLabel: "Try the enquiry journey",
    service: "sales-marketing",
  },
  {
    id: "instant-quote",
    title: "Instant quote request",
    summary: "Choose the services you need and answer a few guided questions, so the request arrives with everything needed to prepare a quote.",
    href: "/instant-quote/",
    badge: "Live",
    tryLabel: "Try the quote request",
    service: "business-automation",
  },
  {
    id: "booking",
    title: "Online booking",
    summary: "Pick a time from live availability and receive an email confirmation, with no back-and-forth emails to agree a slot.",
    href: "/book-appointment/",
    badge: "Live",
    tryLabel: "See live availability",
    service: "business-automation",
  },
  {
    id: "business-dashboard",
    title: "Business Performance Dashboard",
    summary: "Explore 12 months of figures for a fictional UK service business: revenue, enquiries, conversion rate and response time, filtered by month and service line.",
    href: "/services/data-analytics/#demo",
    badge: "Illustrative data",
    tryLabel: "Explore the dashboard",
    service: "data-analytics",
  },
  {
    id: "ai-skills-taster",
    title: "5-minute AI Skills Taster",
    summary: "A short lesson on writing better AI prompts for your business, with a before-and-after example and a three-question quiz with instant feedback.",
    href: "/services/training/#demo",
    badge: "Live",
    tryLabel: "Start the taster",
    service: "training",
  },
  {
    id: "pharma-market-intelligence",
    title: "Pharmaceutical market intelligence app",
    summary: "Explore market analysis, product ranking, pricing simulations and AI explanations in a purpose-built decision tool.",
    href: "https://aidemolab.github.io/aim-pharmaceutical-ai-demo/",
    external: true,
    badge: "Illustrative data",
    tryLabel: "Open the app",
    service: "smart-apps",
  },
];

export const demoById = (id: string) => demos.find((demo) => demo.id === id);
