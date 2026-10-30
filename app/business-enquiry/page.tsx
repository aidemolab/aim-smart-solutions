"use client";

import ContactCrumbs from "../components/ContactCrumbs";
import { FormEvent, useState } from "react";
import PrivacyNote from "../components/PrivacyNote";
import { callFunction, HONEYPOT_FIELD, NETWORK_ERROR_MESSAGE, toUkE164 } from "@/lib/supabase-functions";
import Turnstile from "../components/Turnstile";
import DemoBadge from "../components/DemoBadge";
import { CALL_CONSENT_TEXT, CALL_CONSENT_VERSION } from "@/lib/consent";

type SubmissionState = "ready" | "submitting" | "success" | "error";

// AI calls need the CAPTCHA, so they are only offered when Turnstile is set up.
// The function also reports callsEnabled, which overrides this after a submission.
const CALLS_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
const PRIORITY_NOTE = "Need us quickly? Mention it in your message and we'll contact you as a priority.";

export default function BusinessEnquiryPage() {
  const [state, setState] = useState<SubmissionState>("ready");
  const [message, setMessage] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [callsEnabled, setCallsEnabled] = useState(CALLS_CONFIGURED);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    const data = new FormData(event.currentTarget);
    const urgency = callsEnabled && data.get("urgency") === "urgent" ? "urgent" : "normal";
    const consent = urgency === "urgent" && data.get("consent") === "yes";
    const text = (key: string) => String(data.get(key) ?? "").trim();
    const mobile = toUkE164(data.get("mobile"));
    setMessage("");
    if (!mobile) {
      setState("error");
      setMessage("Enter a valid UK mobile number beginning 07 or +44 7.");
      return;
    }
    if (urgency === "urgent" && !consent) {
      setState("error");
      setMessage("Please confirm you agree to receive an automated call, or choose Normal.");
      return;
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setState("error");
      setMessage("Please complete the security check.");
      return;
    }
    setState("submitting");

    try {
      // submit-enquiry saves the enquiry, sends the acknowledgement email and, for
      // urgent enquiries with consent, starts the AI call server-side.
      const { status, result } = await callFunction("submit-enquiry", {
        name: text("firstName"),
        businessName: text("businessName"),
        email: text("email"),
        mobile,
        enquiry: text("enquiry"),
        urgency,
        consent,
        consentVersion: consent ? CALL_CONSENT_VERSION : undefined,
        turnstileToken,
        website: text(HONEYPOT_FIELD),
      });
      if (result?.callsEnabled === false) { setCallsEnabled(false); setUrgent(false); }
      // Turnstile tokens are single-use, so get a fresh one for any retry.
      setTurnstileToken("");
      setTurnstileKey((key) => key + 1);
      if (status < 400 && result?.ok) {
        setState("success");
        setMessage(urgency !== "urgent"
          ? "Thank you. Your enquiry has been submitted and we will get back to you within 24 hours."
          : result.callStarted === true
            ? "Thank you. Your urgent enquiry has been submitted and our AI assistant is calling you now."
            : "Thank you. Your urgent enquiry has been submitted and we will contact you as a priority.");
        return;
      }
      setState("error");
      setMessage(result?.message || "We could not submit your enquiry. Please check your details and try again.");
    } catch {
      setState("error");
      setMessage(NETWORK_ERROR_MESSAGE);
    }
  }

  return (
    <main id="main">
      <section className="section enquiry-page" aria-labelledby="enquiry-title">
        <div className="enquiry-copy">
          <ContactCrumbs name="Send an enquiry" path="/business-enquiry/" />
          <p className="kicker"><DemoBadge kind="Live" /> Live working demonstration</p>
          <h1 id="enquiry-title">Experience a faster <em>enquiry response.</em></h1>
          <p>{callsEnabled
            ? "This working demonstration shows how a business can capture an enquiry, confirm it immediately and offer an optional AI voice response for urgent requests."
            : "This working demonstration shows how a business can capture an enquiry and confirm it immediately by email."}</p>
          <ol className="demo-flow" aria-label="What happens next">
            <li><span>1</span>Tell us what you need</li>
            <li><span>2</span>Submit your enquiry</li>
            <li><span>3</span>{callsEnabled ? "Receive a call if your enquiry is urgent" : "Receive an instant email confirmation"}</li>
          </ol>
        </div>
        <form className="contact-form enquiry-form" onSubmit={submitEnquiry}>
          <div className="form-row">
            <label htmlFor="first-name">First Name<input id="first-name" name="firstName" type="text" autoComplete="given-name" required /></label>
            <label htmlFor="business-name">Business Name<input id="business-name" name="businessName" type="text" autoComplete="organization" required /></label>
          </div>
          <label htmlFor="email-address">Email Address<input id="email-address" name="email" type="email" autoComplete="email" required /></label>
          <label htmlFor="mobile-number">Mobile Number<input id="mobile-number" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="Enter your UK mobile number" aria-describedby="mobile-help enquiry-status" required /></label>
          <p className="field-help" id="mobile-help">Enter a UK mobile number beginning 07 or +44 7.</p>
          <label htmlFor="enquiry">Your Enquiry<textarea id="enquiry" name="enquiry" rows={7} required /></label>
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}><label htmlFor="enquiry-website">Website<input id="enquiry-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" /></label></div>
          {callsEnabled ? <>
          <fieldset className="urgency-field" style={{ margin: "0 0 12px", padding: 0, border: 0 }}>
            <legend style={{ marginBottom: 12, color: "var(--navy-2)", fontSize: 10, fontWeight: 800, letterSpacing: ".11em", textTransform: "uppercase" }}>How urgent is your enquiry?</legend>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 9, margin: "0 28px 0 0", fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input style={{ width: 18, height: 18, margin: 0 }} name="urgency" type="radio" value="normal" defaultChecked onChange={() => setUrgent(false)} /> Normal</label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 9, margin: 0, fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input style={{ width: 18, height: 18, margin: 0 }} name="urgency" type="radio" value="urgent" onChange={() => setUrgent(true)} /> Urgent</label>
          </fieldset>
          <p className="field-help urgency-help" style={{ margin: "0 0 16px" }}>Select Urgent if you need a prompt response. Our AI assistant will call the mobile number you provided.</p>
          {urgent && <label htmlFor="call-consent" style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "0 0 20px", fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input id="call-consent" style={{ width: 18, height: 18, margin: "2px 0 0", flex: "none" }} name="consent" type="checkbox" value="yes" required /> {CALL_CONSENT_TEXT}</label>}
          </> : <p className="field-help urgency-help" style={{ margin: "0 0 20px" }}>{PRIORITY_NOTE}</p>}
          <Turnstile onToken={setTurnstileToken} resetKey={turnstileKey} />
          <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Submitting…" : "Try the enquiry journey"}<span>→</span></button>
          {message && <p id="enquiry-status" className={`submission-message ${state}`} role="status" aria-live="polite">{message}</p>}
          <PrivacyNote text="We use your details only to reply to your enquiry." />
        </form>
      </section>

      <section className="demo-benefits" aria-labelledby="demo-benefits-title">
        <div>
          <p className="kicker">What happens next</p>
          <h2 id="demo-benefits-title">A faster response to your enquiry.</h2>
        </div>
        <div className="benefit-grid">
          <article><span>01</span><h3>Tell us about your business</h3><p>Share your contact details and a short description of the support you need.</p></article>
          <article><span>02</span><h3>We review your enquiry</h3><p>For normal enquiries, we will get back to you within 24 hours.</p></article>
          {callsEnabled
            ? <article><span>03</span><h3>Urgent support</h3><p>If you select Urgent, our AI assistant will also call the UK mobile number you provide.</p></article>
            : <article><span>03</span><h3>Priority support</h3><p>{PRIORITY_NOTE}</p></article>}
        </div>
      </section>
    </main>
  );
}
