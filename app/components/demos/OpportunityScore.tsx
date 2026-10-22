"use client";

// AI Opportunity Score: seven quick questions, scored entirely in the browser.
// Nothing is stored or sent anywhere.
import Link from "next/link";
import { useId, useState } from "react";
import { BOOKING_CTA } from "@/lib/site";
import { serviceBySlug } from "@/app/services/data";
import DemoBadge from "../DemoBadge";

type Option = { label: string; points: number };
type Question = { id: string; text: string; options: Option[]; services: string[] };

// Points measure how much room there is for AI and automation to help.
// Each question also says which services it points towards.
const QUESTIONS: Question[] = [
  { id: "enquiries", text: "How many new enquiries do you receive in a typical week?", services: ["ai-voice-agents", "sales-marketing"],
    options: [{ label: "Fewer than 5", points: 0 }, { label: "5 to 20", points: 1 }, { label: "21 to 50", points: 2 }, { label: "More than 50", points: 3 }] },
  { id: "response", text: "How quickly do you usually reply to a new enquiry?", services: ["sales-marketing", "ai-voice-agents"],
    options: [{ label: "Within an hour", points: 0 }, { label: "The same day", points: 1 }, { label: "The next working day", points: 2 }, { label: "It varies, sometimes longer", points: 3 }] },
  { id: "quotes", text: "How are your quotes produced?", services: ["business-automation", "smart-apps"],
    options: [{ label: "We do not send quotes", points: 0 }, { label: "Generated from our system", points: 1 }, { label: "Written by hand in Word or Excel", points: 2 }, { label: "By hand, after emails to get the details", points: 3 }] },
  { id: "bookings", text: "How do customers book appointments or calls with you?", services: ["business-automation", "ai-voice-agents"],
    options: [{ label: "We do not take bookings", points: 0 }, { label: "Online booking, already automated", points: 0 }, { label: "A mix of online and phone or email", points: 2 }, { label: "Phone or email back-and-forth", points: 3 }] },
  { id: "admin", text: "Roughly how many hours a week does your team spend on routine admin?", services: ["business-automation"],
    options: [{ label: "Fewer than 5", points: 0 }, { label: "5 to 10", points: 1 }, { label: "11 to 20", points: 2 }, { label: "More than 20", points: 3 }] },
  { id: "data", text: "Where does your business data mostly live?", services: ["data-analytics"],
    options: [{ label: "One system with reports we trust", points: 0 }, { label: "A few spreadsheets", points: 1 }, { label: "Spread across many spreadsheets and systems", points: 2 }, { label: "Mostly in inboxes and people's heads", points: 3 }] },
  { id: "confidence", text: "How confident is your team with AI tools?", services: ["training", "ai-consultancy"],
    options: [{ label: "We use them confidently every day", points: 0 }, { label: "We have tried them a few times", points: 1 }, { label: "Curious, but not really started", points: 2 }, { label: "Not confident at all", points: 3 }] },
];

const MAX = QUESTIONS.reduce((sum, q) => sum + Math.max(...q.options.map((o) => o.points)), 0);

const BANDS = [
  { min: 0, name: "Fine-tuning", text: "Your answers suggest your processes are already in good shape. AI is most useful here for targeted improvements, such as sharper reporting or upskilling your team, rather than big changes." },
  { min: 35, name: "Clear opportunities", text: "Your answers suggest a few clear places where automation and AI could save time and help you respond faster. Starting with one of them usually brings the quickest benefit." },
  { min: 65, name: "Strong opportunity", text: "Your answers suggest that a lot of time goes into manual work, and that enquiries may be waiting longer than customers expect. There is plenty of room for practical automation to help." },
];

export default function OpportunityScore() {
  const uid = useId();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResult, setShowResult] = useState(false);
  const answered = Object.keys(answers).length;
  const complete = answered === QUESTIONS.length;

  const total = QUESTIONS.reduce((sum, q) => sum + (answers[q.id] !== undefined ? q.options[answers[q.id]].points : 0), 0);
  const score = Math.round((total / MAX) * 100);
  const band = [...BANDS].reverse().find((b) => score >= b.min)!;

  // Rank services by the points from the questions that point towards them.
  const weights: Record<string, number> = { "ai-consultancy": 0.5 };
  for (const q of QUESTIONS) {
    const points = answers[q.id] !== undefined ? q.options[answers[q.id]].points : 0;
    q.services.forEach((slug, index) => { weights[slug] = (weights[slug] ?? 0) + points * (index === 0 ? 1 : 0.6); });
  }
  const top = Object.entries(weights).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([slug]) => serviceBySlug(slug)).filter((s) => s !== undefined);

  const reset = () => { setAnswers({}); setShowResult(false); };

  return (
    <div className="demo-app" aria-labelledby={`${uid}-title`}>
      <div className="demo-app-head">
        <DemoBadge kind="Live" />
        <h3 id={`${uid}-title`}>AI Opportunity Score</h3>
        <p>Seven quick questions about how your business runs today. Your score and recommendations appear instantly. Nothing you enter is stored or sent anywhere.</p>
      </div>

      {!showResult ? (
        <form onSubmit={(e) => { e.preventDefault(); if (complete) setShowResult(true); }}>
          <ol className="quiz-list">
            {QUESTIONS.map((q, qi) => (
              <li key={q.id}>
                <fieldset>
                  <legend><span>{qi + 1}.</span> {q.text}</legend>
                  <div className="option-grid">
                    {q.options.map((option, oi) => (
                      <label key={option.label} className={answers[q.id] === oi ? "is-selected" : undefined}>
                        <input type="radio" name={`${uid}-${q.id}`} checked={answers[q.id] === oi} onChange={() => setAnswers({ ...answers, [q.id]: oi })} />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
          <div className="demo-app-actions">
            <button type="submit" className="button primary" disabled={!complete}>See my score</button>
            <p className="progress-note" aria-live="polite">{answered} of {QUESTIONS.length} answered</p>
          </div>
        </form>
      ) : (
        <div className="score-result" aria-live="polite">
          <div className="score-dial" style={{ "--score": score } as React.CSSProperties}>
            <span className="score-number">{score}</span><span className="score-out-of">out of 100</span>
          </div>
          <div>
            <p className="kicker">{band.name}</p>
            <p className="score-text">{band.text}</p>
            <h4>Your top 3 recommended services</h4>
            <ol className="score-services">
              {top.map((service) => <li key={service.slug}><Link href={`/services/${service.slug}/`}><strong>{service.name}</strong><span>{service.tagline}</span></Link></li>)}
            </ol>
            <div className="demo-app-actions">
              <Link className="button primary" href={BOOKING_CTA.href}>Book a call to discuss your results <span aria-hidden="true">→</span></Link>
              <button type="button" className="button secondary" onClick={reset}>Start again</button>
            </div>
            <p className="demo-small">This quick self-assessment is a starting point for a conversation, not a guarantee of results.</p>
          </div>
        </div>
      )}
    </div>
  );
}
