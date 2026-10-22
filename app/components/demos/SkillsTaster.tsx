"use client";

// 5-minute AI Skills Taster: a mini-lesson and a 3-question quiz with instant
// feedback. Runs in the browser; nothing is stored.
import Link from "next/link";
import { useId, useState } from "react";
import { BOOKING_CTA } from "@/lib/site";
import DemoBadge from "../DemoBadge";

const PARTS = [
  { name: "Role", body: "Who should the AI act as?", example: "You are the customer service manager at a small kitchen-fitting company." },
  { name: "Task", body: "What exactly do you want?", example: "Write an apology email about a delayed worktop delivery." },
  { name: "Context", body: "What does it need to know?", example: "The supplier is a week behind. Offer to rebook the fitting at the customer's convenience." },
  { name: "Format", body: "How should the answer look?", example: "Warm and professional, under 120 words, British English, signed off by Sam." },
];

const BEFORE = "Write an email to a customer about a late delivery.";
const AFTER = "You are the customer service manager at a small kitchen-fitting company in Manchester. Write a short apology email to a customer whose worktop delivery is delayed by one week because our supplier is behind. Offer to rebook the fitting date at their convenience. Keep it warm and professional, under 120 words, in British English, and sign off as Sam.";

const QUIZ = [
  {
    q: "Which prompt is most likely to give you a useful answer first time?",
    options: [
      "Write a social media post.",
      "Write a LinkedIn post about our opening hours.",
      "Write a friendly 80-word LinkedIn post announcing our new Saturday opening hours at our Bolton dental practice, ending with a question to invite comments.",
    ],
    answer: 2,
    why: "It covers the task, the context (Saturday hours, a Bolton dental practice) and the format (friendly, 80 words, ending with a question).",
  },
  {
    q: "Which part of a prompt tells the AI how you want the answer laid out?",
    options: ["Role", "Task", "Context", "Format"],
    answer: 3,
    why: "Format covers length, tone and structure, such as \"three bullet points\" or \"under 120 words\".",
  },
  {
    q: "Before you send an AI-drafted email to a customer, what should you do?",
    options: [
      "Send it straight away: AI tools are always accurate.",
      "Check the facts, names and tone, and make sure nothing confidential was included.",
      "Ask the AI whether its own answer is correct.",
    ],
    answer: 1,
    why: "AI can sound confident and still be wrong. A quick human check protects your customers and your reputation.",
  },
];

export default function SkillsTaster() {
  const uid = useId();
  const [picked, setPicked] = useState<(number | null)[]>(QUIZ.map(() => null));
  const done = picked.every((p) => p !== null);
  const correct = picked.filter((p, i) => p === QUIZ[i].answer).length;

  return (
    <div className="demo-app taster" aria-labelledby={`${uid}-title`}>
      <div className="demo-app-head">
        <DemoBadge kind="Live" />
        <h3 id={`${uid}-title`}>5-minute AI Skills Taster: write a better AI prompt for your business</h3>
        <p>AI tools give generic answers to generic questions. The fix is simple: give them the same briefing you would give a new member of staff.</p>
      </div>

      <div className="lesson-step">
        <h4><span>1</span> The four parts of a good prompt</h4>
        <div className="prompt-parts">
          {PARTS.map((part) => <div key={part.name}><strong>{part.name}</strong><span>{part.body}</span><em>{part.example}</em></div>)}
        </div>
      </div>

      <div className="lesson-step">
        <h4><span>2</span> Before and after</h4>
        <div className="before-after">
          <figure><figcaption>Before</figcaption><blockquote>{BEFORE}</blockquote><p>The AI has to guess the business, the reason, the tone and the length, so the answer is generic and needs heavy editing.</p></figure>
          <figure className="is-after"><figcaption>After</figcaption><blockquote>{AFTER}</blockquote><p>Role, task, context and format are all there, so the first draft is close to ready. You still check it before sending.</p></figure>
        </div>
      </div>

      <div className="lesson-step">
        <h4><span>3</span> Quick quiz</h4>
        <ol className="quiz-list">
          {QUIZ.map((item, qi) => {
            const choice = picked[qi];
            return (
              <li key={item.q}>
                <fieldset>
                  <legend><span>{qi + 1}.</span> {item.q}</legend>
                  <div className="option-grid is-stacked">
                    {item.options.map((option, oi) => {
                      const state = choice === null ? "" : oi === item.answer ? " is-correct" : oi === choice ? " is-wrong" : "";
                      return (
                        <label key={option} className={`${choice === oi ? "is-selected" : ""}${state}`}>
                          <input type="radio" name={`${uid}-q${qi}`} checked={choice === oi} disabled={choice !== null} onChange={() => setPicked(picked.map((p, i) => i === qi ? oi : p))} />
                          {option}
                        </label>
                      );
                    })}
                  </div>
                  {choice !== null && (
                    <p className={`quiz-feedback ${choice === item.answer ? "is-correct" : "is-wrong"}`} role="status">
                      <strong>{choice === item.answer ? "Correct." : "Not quite."}</strong> {item.why}
                    </p>
                  )}
                </fieldset>
              </li>
            );
          })}
        </ol>
        {done && (
          <div className="taster-result" role="status">
            <p><strong>You scored {correct} out of {QUIZ.length}.</strong> {correct === QUIZ.length ? "Great work: you already have the habits that make AI useful." : "Try the four-part structure on your next real task and you will see the difference straight away."}</p>
            <div className="demo-app-actions">
              <Link className="button primary" href={BOOKING_CTA.href}>{BOOKING_CTA.label} <span aria-hidden="true">→</span></Link>
              <button type="button" className="button secondary" onClick={() => setPicked(QUIZ.map(() => null))}>Try the quiz again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
