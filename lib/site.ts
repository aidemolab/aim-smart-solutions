// Shared site facts and the single main call to action. Change wording here, not in pages.

export const SITE_NAME = "AIM Smart Solutions";
export const SITE_URL = "https://aimsmartsolutions.tech";
export const CONTACT_EMAIL = "enquiry@aimsmartsolutions.tech";
export const FOUNDER = "Alaa Mostafa";
export const LOCATION = "Bolton, Greater Manchester";

// The one main call to action used across the whole site.
export const BOOKING_CTA = {
  label: "Book a Free AI Opportunity Call",
  href: "/book-appointment/",
} as const;

export type PillarId = "win-more-customers" | "save-time" | "decide-better";

export type Pillar = {
  id: PillarId;
  name: string;
  promise: string;
  intro: string;
  problems: string[];
  services: string[]; // service slugs, in display order
};

export const pillars: Pillar[] = [
  {
    id: "win-more-customers",
    name: "Win More Customers",
    promise: "Never miss a lead or a call again",
    intro: "Respond to every enquiry and call promptly, capture the right details first time and keep promising opportunities moving.",
    problems: ["Calls go unanswered while you are busy", "Enquiries wait in an inbox", "Follow-up depends on someone remembering", "Customers cannot see what you actually do"],
    services: ["ai-voice-agents", "sales-marketing", "video-production"],
  },
  {
    id: "save-time",
    name: "Save Time",
    promise: "Hand the repetitive admin to AI",
    intro: "Automate the quoting, booking, reminders and routine steps your team repeats every day, and give people tools that make complex work simpler.",
    problems: ["The same emails and forms, every day", "Quotes held up by missing details", "Diary chasing and manual reminders"],
    services: ["business-automation", "smart-apps"],
  },
  {
    id: "decide-better",
    name: "Decide Better",
    promise: "Turn your data into clear decisions",
    intro: "Bring scattered figures into one clear view, build your team's confidence with AI and data, and choose the technology that is worth your investment.",
    problems: ["Figures spread across spreadsheets and systems", "A team unsure how to use AI well", "Not knowing where AI would genuinely help", "Training that does not fit how your team works"],
    services: ["data-analytics", "training", "course-design", "ai-consultancy"],
  },
];

export const howIWork = [
  { step: "01", title: "Free call", body: "A relaxed conversation about your business, where time or customers are being lost, and what a good result would look like." },
  { step: "02", title: "Assessment", body: "A closer look at the process and data involved, so we agree on the first improvement worth making and what it will involve." },
  { step: "03", title: "Build", body: "The smallest useful solution is built around the tools you already use, then tested with you before it goes live." },
  { step: "04", title: "Train your team", body: "Your team learns how to use it with confidence, with clear guidance and support while it beds in." },
];

// The AI call-back needs Turnstile, so it is only on when a site key is built in.
export const CALLS_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
