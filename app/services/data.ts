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
    description: "AI voice agents answer your calls when you cannot, handle routine questions, take caller details and appointment requests, and call new leads back.",
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
    features: ["Customer call handling", "Caller details captured and passed to you", "Common questions and guided conversations", "Call-backs and appointment requests"],
    demos: ["voice-receptionist"],
    metaDescription: "AI voice agents for solo traders and small businesses: answer calls when you cannot, take caller details and appointment requests, and call new leads back.",
  },
  {
    slug: "sales-marketing",
    name: "AI Sales & Marketing",
    title: "AI Sales and Marketing: Get Found Online",
    pillar: "win-more-customers",
    tagline: "Get found by the customers already searching for what you do.",
    description: "AI tools that turn what people are searching for into social posts, a content plan and local keyword ideas, ready for you to review.",
    explanation: [
      "Customers search before they call. If your business does not show up, or your posts go quiet during a busy week, they find someone else.",
      "AI helps you keep showing up. It finds what people across the UK are searching for, then drafts social posts, a 7-day content plan and local keyword ideas around those searches, ready for you to review and post.",
    ],
    benefits: [
      { title: "Real demand", body: "Content is built around what people are actually searching for, not guesswork." },
      { title: "Ready-made content", body: "Social posts and a content plan drafted in minutes, ready for you to review." },
      { title: "Consistent presence", body: "Keep posting during busy weeks instead of going quiet." },
    ],
    useCases: [
      "Drafting social posts and local keyword ideas with AI, ready to review",
      "Planning a week of content around real searches",
      "Finding the words local customers use to look for your service",
    ],
    features: ["Search trend and keyword research", "AI-drafted social posts", "Weekly content planning", "Local keyword ideas for your website"],
    demos: ["content-generator"],
    metaDescription: "AI sales and marketing for solo traders and small businesses: get found with social posts, a content plan and local keyword ideas built around real searches.",
  },
  {
    slug: "video-production",
    name: "Video Production",
    title: "Video Production for Business",
    pillar: "win-more-customers",
    tagline: "Show customers what you do in a minute they will actually watch.",
    description: "Promo, demo and explainer videos that show what your business does, made with AI-assisted editing, voiceover and captions, and ready for your website, LinkedIn and social media.",
    explanation: [
      "Customers decide quickly whether a business looks right for them. A short video can explain what you do, show how it works and answer the obvious questions faster than a page of text. But filming and editing usually take time you do not have, so the video never gets made.",
      "We plan the video around the question your customers keep asking, write the script with you, and use AI-assisted editing, voiceover and captions to keep production manageable. You review it before it goes anywhere, then receive versions for your website, LinkedIn and social media.",
    ],
    benefits: [
      { title: "Clear at a glance", body: "Visitors see what you do and how it works without reading a long page." },
      { title: "Ready for every channel", body: "One video, cut to suit your website, LinkedIn and social media, with captions for viewers watching on mute." },
      { title: "Quick to produce", body: "AI-assisted editing and voiceover keep the process quick, and you approve the script and the final cut." },
    ],
    useCases: [
      "A promo video that introduces your business and what you offer",
      "A demo that shows a service or product working",
      "An explainer that walks customers through a process or a common question",
      "Short captioned versions for LinkedIn and social media",
    ],
    features: ["Promo, demo and explainer videos", "Script and storyboard written with you", "AI-assisted editing, voiceover and captions", "Versions for website, LinkedIn and social media"],
    demos: [],
    metaDescription: "Video production for solo traders and small businesses: promo, demo and explainer videos with AI-assisted editing, voiceover and captions, in versions for your website, LinkedIn and social media.",
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
      "Instant acknowledgement and owner alert for every website enquiry",
      "Guided quote requests that arrive with every detail you need",
      "Online booking with automatic confirmation and reminder emails",
      "Passing enquiry details into your calendar, CRM or spreadsheet",
    ],
    features: ["Customer enquiry workflows", "Automated information collection for quotations", "Appointment confirmations and reminders", "Email notifications and follow-up"],
    demos: [],
    metaDescription: "Business process automation for solo traders and small businesses: automate quotes, bookings, confirmations, reminders and routine admin using the tools you already have.",
  },
  {
    slug: "smart-apps",
    name: "AI Smart Apps",
    title: "AI Smart Apps",
    pillar: "save-time",
    tagline: "Purpose-built tools that save your team time with instant answers and guided processes.",
    description: "We build AI-powered apps around your own figures, rules and know-how, so your team gets instant answers and step-by-step guidance instead of searching, asking or rebuilding spreadsheets.",
    explanation: [
      "Time goes on looking things up, asking the one person who knows and rebuilding the same spreadsheet. A smart app brings your figures, rules and know-how into one simple tool your team can use.",
      "Answers come straight away and calculations stay transparent and checkable. AI explanations help people understand the result rather than replacing their judgement.",
    ],
    benefits: [
      { title: "Faster answers", body: "Get answers in moments instead of searching or rebuilding spreadsheets." },
      { title: "Guided processes", body: "Step-by-step guidance takes staff through a complex task the same way every time." },
      { title: "Easy to understand", body: "Visual results and plain-English explanations make complex information usable." },
    ],
    useCases: [
      "Internal tools that guide staff through a complex process",
      "Calculators that answer pricing and quoting questions straight away",
      "Market and pricing analysis for a specialist sector",
    ],
    features: ["Purpose-built tools for your business", "Instant answers from your own information", "Guided step-by-step processes", "AI explanations with human-checkable results"],
    demos: ["pharma-market-intelligence"],
    metaDescription: "AI smart apps for solo traders and small businesses: purpose-built tools that save your team time with instant answers, guided processes and clear AI explanations.",
  },
  {
    slug: "data-analytics",
    name: "Data & Dashboards",
    title: "Data Analytics, Dashboards and Reporting",
    pillar: "decide-better",
    tagline: "Turn business data into clear decisions.",
    description: "We transform spreadsheets and operational data into focused analysis, clear dashboards and KPI reporting suited to the needs of smaller organisations.",
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
      "Scoring and ranking sales leads so the best get the first call",
      "Checking whether an investment's numbers stack up before you commit",
    ],
    features: ["Data preparation and quality checks", "Business dashboards and KPIs", "Sales and operating performance reports", "Decision-support analysis"],
    demos: ["supplier-risk", "sales-lead-scoring", "property-investment"],
    metaDescription: "Data analytics, dashboards and KPI reporting for solo traders and small businesses: bring scattered figures into one clear view and plan with confidence.",
  },
  {
    slug: "training",
    name: "AI & Data Training",
    title: "AI and Data Training",
    pillar: "train-your-team",
    tagline: "Help your team use AI and data with confidence.",
    description: "Hands-on workshops and tailored training in AI tools, data analytics, Excel, SQL, Power BI and business automation.",
    explanation: [
      "AI tools are only useful when people know how to use them well and safely. Many teams have tried them once, got a vague answer and moved on.",
      "Training is hands-on and built around your team's real tasks, so people leave with skills and habits they can use the next day.",
    ],
    benefits: [
      { title: "Hands-on skills", body: "Exercises based on your own work, not abstract examples." },
      { title: "Safer use of AI", body: "Clear guidance on checking outputs and protecting sensitive information." },
      { title: "Confident teams", body: "People understand what the tools can and cannot do." },
    ],
    useCases: [
      "Writing better prompts for everyday business tasks",
      "Excel, SQL and Power BI skills for reporting",
      "Introducing AI tools across a team with agreed good practice",
    ],
    features: ["Hands-on AI workshops", "Excel and data analysis training", "SQL and reporting skills", "Team-specific training programmes"],
    demos: ["ai-skills-taster"],
    metaDescription: "AI and data training for solo traders, small businesses and their teams: hands-on workshops in AI tools, prompting, Excel, SQL, Power BI and business automation.",
  },
  {
    slug: "course-design",
    name: "Course Design & Build",
    title: "Course Design and Build",
    pillar: "train-your-team",
    tagline: "From a trainer who understands your pain, builds the solution, and teaches you to use it.",
    description: "Courses, workshops and training materials designed and built around your business: outlines, sessions, slides, activities, and learner and trainer guides.",
    explanation: [
      "Off-the-shelf training rarely fits. It teaches the general idea rather than how your team actually works, so people finish the course and go back to doing things the old way. Good training starts with what your people need to be able to do, and works backwards from there.",
      "AIM is led by a trainer with more than 20 years in education and training, who understands your pain, builds the solution and teaches you to use it. You receive complete, ready-to-deliver materials, and we can show your own trainers how to run them.",
    ],
    benefits: [
      { title: "Built around your business", body: "Examples, activities and language come from your own work, not a generic syllabus." },
      { title: "Ready to deliver", body: "Outlines, session plans, slides, activities and guides are produced as a complete set." },
      { title: "Yours to keep running", body: "Trainer guides and support mean your own people can deliver the course again." },
    ],
    useCases: [
      "Turning what your best people know into a course others can follow",
      "An onboarding programme for new staff",
      "A workshop series that builds a specific skill across a team",
      "Refreshing training that no longer matches how you work",
    ],
    features: ["Course and workshop outlines", "Session plans, slides and activities", "Learner workbooks and trainer guides", "Delivery support and guidance for your own trainers"],
    demos: ["ai-skills-taster"],
    metaDescription: "Course design and build for solo traders and small businesses: tailored courses, workshops and training materials with slides, activities, and learner and trainer guides, from an experienced trainer.",
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
      { title: "A realistic plan", body: "Achievable steps, sized for a small team." },
    ],
    useCases: [
      "An AI opportunity assessment across your customer journey",
      "Reviewing processes and data before choosing new tools",
      "Planning and supporting the adoption of a new system",
    ],
    features: ["AI opportunity assessments", "Process and data reviews", "Tool selection and solution design", "Implementation guidance and adoption support"],
    demos: ["ai-opportunity-score"],
    metaDescription: "AI and digital transformation consultancy for solo traders and small businesses: assess your workflows, find the AI opportunities worth pursuing and plan clear next steps.",
  },
];

export const serviceBySlug = (slug: string) => services.find((service) => service.slug === slug);
