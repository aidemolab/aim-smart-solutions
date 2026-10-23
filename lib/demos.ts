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
  pain?: string; // one-line problem the app solves (shown on /live-demos)
  video?: string; // versioned file name in public/assets/videos (no extension), shown on the service page
  videoLabel?: string; // short name for a video link when a card has more than one
};

// The pharma video sits at the top of the AI Smart Apps demo section rather than in its card.
export const PHARMA_VIDEO = "pharma-demo-v5";

export const demos: Demo[] = [
  {
    id: "content-generator",
    title: "AI Content & Keyword Generator",
    summary: "Describe your business and get three social posts, a 7-day content plan and local keyword ideas in under a minute. AI-generated, so review before posting.",
    href: "/services/sales-marketing/#demo",
    badge: "Live",
    video: "keywords-demo-v1",
    videoLabel: "keyword generator",
    tryLabel: "Generate content",
    service: "sales-marketing",
  },
  {
    id: "ai-opportunity-score",
    title: "AI Opportunity Score",
    summary: "Answer seven quick questions about how your business runs and get a score out of 100, a short explanation and your top three recommended services.",
    href: "/services/ai-consultancy/#demo",
    badge: "Live",
    video: "consultancy-demo-v1",
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
    service: "business-automation",
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
    id: "ai-skills-taster",
    title: "5-minute AI Skills Taster",
    summary: "A short lesson on writing better AI prompts for your business, with a before-and-after example and a three-question quiz with instant feedback.",
    href: "/services/training/#demo",
    badge: "Live",
    video: "training-demo-v1",
    tryLabel: "Start the taster",
    service: "training",
  },
  {
    id: "supplier-risk",
    pain: "Spot risky suppliers before a delay or price rise hits your business.",
    title: "Supplier Risk Scoring Dashboard",
    summary: "Stress-test a fictional supplier portfolio with what-if sliders (risk weights, currency, delay, tariffs), then add and edit your own suppliers. Your changes are kept for 24 hours. Sample data is fictional.",
    href: "https://aidemolab.github.io/aim-supplier-risk-demo/",
    external: true,
    badge: "Live",
    video: "supplier-risk-v2",
    tryLabel: "Try it",
    service: "data-analytics",
  },
  {
    id: "sales-lead-scoring",
    pain: "Know which leads to call first instead of guessing.",
    title: "Sales Lead Scoring Dashboard",
    summary: "Tune a fictional sales pipeline with what-if sliders (scoring weights, hot threshold, win rate, calls), then add and edit your own leads. Your changes are kept for 24 hours. Sample data is fictional.",
    href: "https://aidemolab.github.io/aim-sales-lead-scoring-demo/",
    external: true,
    badge: "Live",
    video: "sales-leads-v2",
    videoLabel: "lead scoring dashboard",
    tryLabel: "Try it",
    service: "sales-marketing",
  },
  {
    id: "property-investment",
    pain: "Check whether a property's numbers stack up before you commit.",
    title: "Property Investment Analysis Dashboard",
    summary: "Run the numbers on fictional properties with what-if sliders (mortgage rate, deposit, rent, empty months), or add your own. Your changes are kept for 24 hours. Fictional data and addresses. Not investment advice.",
    href: "https://aidemolab.github.io/aim-property-investment-demo/",
    external: true,
    badge: "Live",
    video: "property-v2",
    videoLabel: "property dashboard",
    tryLabel: "Try it",
    service: "smart-apps",
  },
  {
    id: "pharma-market-intelligence",
    pain: "Decide which product to pilot, and at what price, from field survey data.",
    title: "Pharmaceutical market intelligence app",
    summary: "Explore market analysis, product ranking, pricing simulations and AI explanations in a purpose-built decision tool.",
    href: "https://aidemolab.github.io/aim-pharmaceutical-ai-demo/",
    external: true,
    badge: "Illustrative data",
    videoLabel: "pharma app",
    tryLabel: "Try it",
    service: "smart-apps",
  },
];

// The standalone demo apps (each opens in the same tab and carries the shared demo bar).
export const appDemos = demos.filter((demo) => demo.external);

export const demoById = (id: string) => demos.find((demo) => demo.id === id);
