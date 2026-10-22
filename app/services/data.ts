import type { PillarId } from "@/lib/site";

export type Service = {
  slug: string;
  name: string; // short name for menus and cards
  title: string; // page heading
  pillar: PillarId;
  tagline: string;
  description: string;
  explanation: string[];
  benefits: { title: string; body: string }[];
  useCases: string[];
  features: string[];
  demos: string[]; // demo ids from lib/demos.ts, shown on the page
  metaDescription: string;
};

export const services: Service[] = [
  {
    slug: "ai-voice-agents",
    name: "AI Voice Agents",
    title: "AI Voice Agents and Virtual Assistants",
    pillar: "win-more-customers",
    tagline: "Give customers a responsive way to reach you, even when you are busy.",
    description: "AI voice agents and assistants can answer routine questions, collect enquiry details and support callbacks and appointment requests.",
    explanation: [
      "When you are on a job, with a customer or out of hours, calls and enquiries can go unanswered. A voice agent gives callers a prompt, polite response, captures what they need and passes the details to you.",
      "It is set up around your business: the questions it asks, what it can answer, when it hands over to a person and how the information reaches you.",
    ],
    benefits: [
      { title: "Prompt response", body: "Callers and urgent enquiries get an answer straight away instead of a voicemail." },
      { title: "Complete details", body: "The agent asks the questions you would ask, so you can act on the enquiry without chasing." },
      { title: "Less interruption", body: "Routine questions are handled for you, so your team can stay focused on the work in front of them." },
    ],
    useCases: [
      "Answering calls while you are on site or with a customer",
      "Calling back an urgent web enquiry within moments of it arriving",
      "Taking appointment requests and common questions out of hours",
    ],
    features: ["Customer call handling", "Lead and enquiry capture", "Common questions and guided conversations", "Callback and appointment workflows"],
    demos: ["enquiry-journey"],
    metaDescription: "AI voice agents and virtual assistants for UK service businesses: answer calls, capture enquiry details and support callbacks and appointment requests.",
  },
  {
    slug: "sales-marketing",
    name: "AI Sales & Marketing",
    title: "AI Sales and Marketing Automation",
    pillar: "win-more-customers",
    tagline: "Build a consistent follow-up process so promising leads do not go cold.",
    description: "Connect lead capture, customer communication and simple sales workflows so promising opportunities are easier to manage.",
    explanation: [
      "Most small businesses do not lose leads because of a poor offer. They lose them because a reply came too late or follow-up slipped during a busy week.",
      "Sales and marketing automation makes the first response instant and the next steps reliable: acknowledgements, alerts, follow-up emails and a clear view of every open opportunity.",
    ],
    benefits: [
      { title: "Every lead acknowledged", body: "New enquiries receive an immediate, professional reply, day or night." },
      { title: "Nothing forgotten", body: "Follow-up steps run on time without relying on someone's memory." },
      { title: "Clear pipeline", body: "See which opportunities are new, in progress or waiting for a reply." },
    ],
    useCases: [
      "Instant acknowledgement and owner alert for every website enquiry",
      "Follow-up emails when a quote has not had a reply",
      "Capturing leads into a simple CRM or spreadsheet automatically",
    ],
    features: ["Lead capture and qualification", "Customer email workflows", "CRM and contact management integration", "Sales reporting and follow-up processes"],
    demos: ["enquiry-journey"],
    metaDescription: "AI sales and marketing automation for small businesses: instant enquiry replies, owner alerts, reliable follow-up and a clear view of every lead.",
  },
  {
    slug: "business-automation",
    name: "Business Process Automation",
    title: "Business Process Automation",
    pillar: "save-time",
    tagline: "Connect the steps your team repeats every day.",
    description: "We simplify and automate the routine work surrounding enquiries, quotations, confirmations, reminders and customer communications.",
    explanation: [
      "Copying details between systems, chasing missing information, sending the same confirmation emails: this work matters, but it does not need a person every time.",
      "Automation connects the tools you already use so these steps happen reliably in the background, and your team handles the exceptions that need judgement.",
    ],
    benefits: [
      { title: "Fewer repetitive tasks", body: "Routine steps run automatically, freeing time for customers and delivery." },
      { title: "Fewer errors", body: "Information is captured once and passed on accurately, without retyping." },
      { title: "A smoother customer journey", body: "Confirmations and reminders go out on time, every time." },
    ],
    useCases: [
      "Guided quote requests that arrive with every detail you need",
      "Online booking with automatic confirmation and reminder emails",
      "Passing enquiry details into your calendar, CRM or spreadsheet",
    ],
    features: ["Customer enquiry workflows", "Automated information collection for quotations", "Appointment confirmations and reminders", "Email notifications and follow-up"],
    demos: ["instant-quote", "booking"],
    metaDescription: "Business process automation for UK SMEs: automate quotes, bookings, confirmations, reminders and routine admin using the tools you already have.",
  },
  {
    slug: "smart-apps",
    name: "AI Smart Apps",
    title: "AI Smart Apps",
    pillar: "save-time",
    tagline: "Purpose-built applications that make complex decisions easier.",
    description: "We design interactive AI-powered applications for sector-specific challenges, combining reliable calculations, visual analysis and helpful AI explanations.",
    explanation: [
      "Some decisions depend on pulling together figures, rules and scenarios that live in different places. A smart app brings them into one simple tool your team can use.",
      "Calculations stay transparent and checkable, and AI explanations help people understand the result rather than replacing their judgement.",
    ],
    benefits: [
      { title: "Faster answers", body: "Run scenarios and comparisons in moments instead of rebuilding spreadsheets." },
      { title: "Consistent decisions", body: "Everyone works from the same logic and the same data." },
      { title: "Easy to understand", body: "Visual results and plain-English explanations make complex information usable." },
    ],
    useCases: [
      "Market and pricing analysis for a specialist sector",
      "Calculators and scenario planners for quotes or proposals",
      "Internal tools that guide staff through a complex process",
    ],
    features: ["Industry-specific decision tools", "Interactive calculators and scenario planning", "AI-powered explanations with human-checkable results", "Practical implementation and ongoing improvements"],
    demos: ["pharma-market-intelligence"],
    metaDescription: "AI smart apps: purpose-built decision tools with transparent calculations, scenario planning and plain-English AI explanations. Try the pharma demo.",
  },
  {
    slug: "data-analytics",
    name: "Data & Dashboards",
    title: "Data Analytics, Dashboards and Reporting",
    pillar: "decide-better",
    tagline: "Turn business data into clear decisions.",
    description: "We transform spreadsheets and operational data into focused analysis, practical dashboards and KPI reporting suited to the needs of smaller organisations.",
    explanation: [
      "Many businesses have the data they need, but it is spread across spreadsheets, systems and inboxes, and pulling it together takes hours.",
      "A focused dashboard shows the handful of numbers that matter, updated for you, so you can spot trends early and plan with confidence.",
    ],
    benefits: [
      { title: "One clear view", body: "Key figures from different sources in one place." },
      { title: "Less manual reporting", body: "Reports refresh from the data instead of being rebuilt every month." },
      { title: "Earlier warnings", body: "See changes in demand, sales or response times while there is still time to act." },
    ],
    useCases: [
      "Monthly sales and enquiry dashboards by service line",
      "KPI reports for owners, managers or boards",
      "Cleaning and combining spreadsheets into a reliable data source",
    ],
    features: ["Data preparation and quality checks", "Business dashboards and KPIs", "Sales and operating performance reports", "Decision-support analysis"],
    demos: [],
    metaDescription: "Data analytics, dashboards and KPI reporting for small businesses: bring scattered figures into one clear view and plan with confidence.",
  },
  {
    slug: "training",
    name: "AI & Data Training",
    title: "AI and Data Training",
    pillar: "decide-better",
    tagline: "Help your team use AI and data with confidence.",
    description: "Practical workshops and tailored training in AI tools, data analytics, Excel, SQL, Power BI and business automation.",
    explanation: [
      "AI tools are only useful when people know how to use them well and safely. Many teams have tried them once, got a vague answer and moved on.",
      "Training is hands-on and built around your team's real tasks, so people leave with skills and habits they can use the next day.",
    ],
    benefits: [
      { title: "Practical skills", body: "Exercises based on your own work, not abstract examples." },
      { title: "Safer use of AI", body: "Clear guidance on checking outputs and protecting sensitive information." },
      { title: "Confident teams", body: "People understand what the tools can and cannot do." },
    ],
    useCases: [
      "Writing better prompts for everyday business tasks",
      "Excel, SQL and Power BI skills for reporting",
      "Introducing AI tools across a team with agreed good practice",
    ],
    features: ["Hands-on AI workshops", "Excel and data analysis training", "SQL and reporting skills", "Team-specific training programmes"],
    demos: [],
    metaDescription: "Practical AI and data training for UK teams: hands-on workshops in AI tools, prompting, Excel, SQL, Power BI and business automation.",
  },
  {
    slug: "ai-consultancy",
    name: "AI Consultancy",
    title: "AI and Digital Transformation Consultancy",
    pillar: "decide-better",
    tagline: "Choose technology that solves the right problem.",
    description: "We assess your business workflows, identify suitable AI opportunities and shape an achievable implementation plan.",
    explanation: [
      "There is no shortage of AI tools. The hard part is knowing which problem to solve first and whether AI is the right answer at all.",
      "Consultancy starts with your processes and goals, not the technology. You get a clear, prioritised plan, and sometimes the answer is a simpler fix.",
    ],
    benefits: [
      { title: "Clear priorities", body: "Know which opportunity is worth tackling first and why." },
      { title: "Sound investment", body: "Avoid tools and subscriptions that do not fit your business." },
      { title: "A practical plan", body: "Achievable steps, sized for a small team." },
    ],
    useCases: [
      "An AI opportunity assessment across your customer journey",
      "Reviewing processes and data before choosing new tools",
      "Planning and supporting the adoption of a new system",
    ],
    features: ["AI opportunity assessments", "Process and data reviews", "Tool selection and solution design", "Implementation guidance and adoption support"],
    demos: [],
    metaDescription: "AI and digital transformation consultancy for SMEs: assess your workflows, find the AI opportunities worth pursuing and plan practical next steps.",
  },
];

export const serviceBySlug = (slug: string) => services.find((service) => service.slug === slug);
