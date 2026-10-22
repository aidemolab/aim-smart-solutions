"use client";

// AI Content & Keyword Generator (live demo). One AI call creates three social posts, a 7-day plan and
// ten local keyword ideas. Runs through the content-generator Edge Function in the demo Supabase project;
// nothing the visitor types is stored.
import { FormEvent, useId, useState } from "react";
import DemoBadge from "../DemoBadge";
import { BookingButton } from "../Blocks";
import PrivacyNote from "../PrivacyNote";

const ENDPOINT = "https://xlxyphqzdzhipmllhxaq.supabase.co/functions/v1/content-generator";
const TONES = [
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
  { id: "bold", label: "Bold" },
] as const;
const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
] as const;
type PlatformId = (typeof PLATFORMS)[number]["id"];
type Post = { text: string; hashtags: string[] };
type Result = {
  posts: Record<PlatformId, Post>;
  plan: { day: string; idea: string; format: string }[];
  keywords: { urgent: string[]; research: string[]; comparison: string[] };
};
type Inputs = { businessType: string; town: string; targetCustomer: string; tone: string };

const LIMITS = { businessType: [2, 60], town: [2, 40], targetCustomer: [2, 80] } as const;

async function callAi(body: Record<string, unknown>) {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  } catch {
    throw new Error("We could not reach the AI service. Please check your connection and try again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.");
  return data;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button type="button" className="gen-btn" onClick={copy} aria-label={`Copy the ${label} post`} data-action="copy">
      {copied ? "Copied ✓" : "Copy"}
    </button>
  );
}

export default function ContentGenerator() {
  const uid = useId();
  const [inputs, setInputs] = useState<Inputs>({ businessType: "", town: "", targetCustomer: "", tone: "friendly" });
  const [errors, setErrors] = useState<Partial<Record<keyof Inputs, string>>>({});
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [used, setUsed] = useState<Inputs | null>(null);
  const [regenerating, setRegenerating] = useState<PlatformId | null>(null);
  const [postError, setPostError] = useState("");

  const set = (key: keyof Inputs, value: string) => { setInputs((prev) => ({ ...prev, [key]: value })); setErrors((prev) => ({ ...prev, [key]: undefined })); };

  const validate = () => {
    const next: Partial<Record<keyof Inputs, string>> = {};
    const names = { businessType: "your type of business", town: "a town or city", targetCustomer: "your target customer" };
    (Object.keys(LIMITS) as (keyof typeof LIMITS)[]).forEach((key) => {
      const [min, max] = LIMITS[key];
      const v = inputs[key].trim();
      if (v.length < min || v.length > max) next[key] = `Enter ${names[key]} (${min} to ${max} characters).`;
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const generate = async (e: FormEvent) => {
    e.preventDefault();
    if (status === "loading" || !validate()) return;
    setStatus("loading");
    setMessage("");
    setPostError("");
    const sent = { ...inputs, businessType: inputs.businessType.trim(), town: inputs.town.trim(), targetCustomer: inputs.targetCustomer.trim() };
    try {
      const data = await callAi({ ...sent, mode: "all" });
      setResult(data.result);
      setUsed(sent);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  };

  const regenerate = async (platform: PlatformId) => {
    if (!result || !used || regenerating) return;
    setRegenerating(platform);
    setPostError("");
    try {
      const data = await callAi({ ...used, mode: "post", platform, previous: result.posts[platform].text });
      setResult({ ...result, posts: { ...result.posts, [platform]: data.post } });
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Could not regenerate that post.");
    } finally {
      setRegenerating(null);
    }
  };

  const field = (key: keyof typeof LIMITS, label: string, placeholder: string) => (
    <div className="gen-field">
      <label htmlFor={`${uid}-${key}`}>{label}</label>
      <input id={`${uid}-${key}`} name={key} type="text" value={inputs[key]} placeholder={placeholder} maxLength={LIMITS[key][1]}
        onChange={(e) => set(key, e.target.value)} aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${uid}-${key}-err` : undefined} />
      {errors[key] && <p className="gen-error" id={`${uid}-${key}-err`}>{errors[key]}</p>}
    </div>
  );

  return (
    <div className="demo-app gen" aria-labelledby={`${uid}-title`} id="content-generator">
      <div className="demo-app-head">
        <DemoBadge kind="Live" />
        <h3 id={`${uid}-title`}>AI Content &amp; Keyword Generator</h3>
        <p>Tell the AI about your business and get three ready-to-edit social posts, a week of content ideas and local keyword ideas, usually in 10 to 30 seconds.</p>
      </div>

      <form className="gen-form" onSubmit={generate} noValidate>
        {field("businessType", "Type of business", "For example: plumber, dog groomer, accountant")}
        {field("town", "Town or city", "For example: Bolton")}
        {field("targetCustomer", "Target customer", "For example: homeowners with older boilers")}
        <fieldset className="gen-tone">
          <legend>Tone</legend>
          {TONES.map((t) => (
            <label key={t.id} className={inputs.tone === t.id ? "is-selected" : undefined}>
              <input type="radio" name={`${uid}-tone`} value={t.id} checked={inputs.tone === t.id} onChange={() => set("tone", t.id)} />
              {t.label}
            </label>
          ))}
        </fieldset>
        <div className="gen-submit">
          <button type="submit" className="button primary" disabled={status === "loading"} id="gen-submit">
            {status === "loading" ? "Generating…" : result ? "Generate again" : "Generate my content"}
          </button>
          <PrivacyNote text="Your answers are sent to an AI service to create the content and are not stored. Up to 10 generations a day." />
        </div>
      </form>

      {status === "loading" && <p className="gen-loading" role="status">Writing your posts, plan and keyword ideas. This usually takes 10 to 30 seconds…</p>}
      {status === "error" && <p className="gen-alert" role="alert">{message}</p>}

      {result && (
        <div className="gen-results" aria-live="polite">
          <p className="gen-label">AI-generated — review before posting</p>

          <h4>Social posts</h4>
          {postError && <p className="gen-alert" role="alert">{postError}</p>}
          <div className="gen-posts">
            {PLATFORMS.map((p) => (
              <article key={p.id} className="gen-post" data-platform={p.id}>
                <header><strong>{p.label}</strong></header>
                <p className="gen-post-text">{result.posts[p.id].text}</p>
                <p className="gen-tags">{result.posts[p.id].hashtags.join(" ")}</p>
                <div className="gen-post-actions">
                  <CopyButton label={p.label} text={`${result.posts[p.id].text}\n\n${result.posts[p.id].hashtags.join(" ")}`} />
                  <button type="button" className="gen-btn" onClick={() => regenerate(p.id)} disabled={Boolean(regenerating)} data-action="regenerate">
                    {regenerating === p.id ? "Regenerating…" : "Regenerate this post"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <h4>Your 7-day content plan</h4>
          <ol className="gen-plan">
            {result.plan.map((d, i) => <li key={i}><strong>{d.day}</strong><span>{d.idea}</span>{d.format && <em>{d.format}</em>}</li>)}
          </ol>

          <h4>Local keyword ideas</h4>
          <p className="gen-label is-soft">AI-suggested ideas — check search volumes in a keyword tool before relying on them</p>
          <div className="gen-keywords">
            {([["urgent", "Urgent: needs help now"], ["research", "Research: exploring options"], ["comparison", "Comparison: choosing a provider"]] as const).map(([k, label]) => (
              <div key={k}>
                <h5>{label}</h5>
                <ul>{result.keywords[k].map((w) => <li key={w}>{w}</li>)}</ul>
              </div>
            ))}
          </div>

          <div className="gen-cta">
            <h4>Want this done automatically every week?</h4>
            <p>AIM can set up a workflow that drafts your posts and content plan every week, ready for you to review and approve.</p>
            <BookingButton />
          </div>
        </div>
      )}
    </div>
  );
}
