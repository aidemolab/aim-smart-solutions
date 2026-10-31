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

export type PillarId = "win-more-customers" | "save-time" | "decide-better" | "train-your-team";

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
    intro: "Answer every call, get found by the customers searching for you, and show them clearly what you do.",
    problems: ["Calls go unanswered while you are busy", "Customers cannot find you online", "Social posts go quiet during busy weeks", "Customers cannot see what you actually do"],
    services: ["ai-voice-agents", "sales-marketing", "video-production"],
  },
  {
    id: "save-time",
    name: "Save Time",
    promise: "Hand the repetitive admin to AI",
    intro: "Automate the quoting, booking, reminders and routine steps your team repeats every day, and give people tools that make complex work simpler.",
    problems: ["The same emails and forms, every day", "Quotes held up by missing details", "Diary chasing and manual reminders", "Time lost looking things up or asking the one person who knows"],
    services: ["business-automation", "smart-apps"],
  },
  {
    id: "decide-better",
    name: "Decide Better",
    promise: "Turn your data into clear decisions",
    intro: "Bring scattered figures into one clear view and choose the technology that is worth your investment.",
    problems: ["Figures spread across spreadsheets and systems", "Not knowing where AI would genuinely help"],
    services: ["data-analytics", "ai-consultancy"],
  },
  {
    id: "train-your-team",
    name: "Train Your Team",
    promise: "Help your team use AI with confidence",
    intro: "Build your team's confidence with AI and data, with training and courses designed around how your team works.",
    problems: ["A team unsure how to use AI well", "Training that does not fit how your team works"],
    services: ["training", "course-design"],
  },
];

export const howIWork = [
  { step: "01", title: "Free call", body: "We start with your business problem, not a tool: where time or customers are being lost, and what a good result looks like." },
  { step: "02", title: "Assessment", body: "A closer look at the process and data involved, so we agree the first improvement worth making." },
  { step: "03", title: "Build", body: "We build the smallest useful solution around the tools you already use. Sometimes the best answer is not AI at all." },
  { step: "04", title: "Train your team", body: "Training is part of the work, not an extra. Your team learns to use it with confidence." },
];

// The AI call-back needs Turnstile, so it is only on when a site key is built in.
export const CALLS_ENABLED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

// Social profiles, shown as icons in the site footer. They open in a new tab.
export const SOCIAL = [
  { id: "linkedin", href: "https://www.linkedin.com/company/aimsmartsolutionsuk/", label: "AIM Smart Solutions on LinkedIn" },
  { id: "facebook", href: "https://www.facebook.com/aimsmartsolutions.tech", label: "AIM Smart Solutions on Facebook" },
] as const;
