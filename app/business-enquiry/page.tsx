"use client";

import ContactCrumbs from "../components/ContactCrumbs";
import { FormEvent, useRef, useState } from "react";
import FieldError from "../components/FieldError";
import { checkFields, fieldProps, focusFirstError, type FieldErrors } from "@/lib/form-errors";
import PrivacyNote from "../components/PrivacyNote";
import { callFunction, HONEYPOT_FIELD, NETWORK_ERROR_MESSAGE, toUkE164 } from "@/lib/supabase-functions";
import Turnstile from "../components/Turnstile";
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  async function submitEnquiry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    const data = new FormData(event.currentTarget);
    const urgency = callsEnabled && data.get("urgency") === "urgent" ? "urgent" : "normal";
    const consent = urgency === "urgent" && data.get("consent") === "yes";
    const text = (key: string) => String(data.get(key) ?? "").trim();
    const mobile = toUkE164(data.get("mobile"));
    setMessage("");
    const found = checkFields(Object.fromEntries(data), [
      { name: "firstName", empty: "Enter your first name." },
      { name: "businessName", empty: "Enter your business name." },
      { name: "email", empty: "Enter your email address.", kind: "email" },
      { name: "mobile", empty: "Enter your UK mobile number.", kind: "mobile" },
      { name: "enquiry", empty: "Tell us briefly what you need." },
    ]);
    if (urgency === "urgent" && !consent) found.consent = "Tick the box to agree to an automated call, or choose Normal.";
    setErrors(found);
    if (Object.keys(found).length || !mobile) {
      setState("ready");
      focusFirstError(formRef.current, found);
      return;
    }
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setState("error");
      setMessage("Complete the security check above, then send your enquiry again.");
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
          <h1 id="enquiry-title">Tell us what you need.</h1>
          <p>{callsEnabled
            ? "Send your enquiry and you will receive an instant email confirmation. If it is urgent, our AI assistant can call you back."
            : "Send your enquiry and you will receive an instant email confirmation and a reply within 24 hours."}</p>
          <ol className="demo-flow" aria-label="What happens next">
            <li><span>1</span>Tell us what you need</li>
            <li><span>2</span>Submit your enquiry</li>
            <li><span>3</span>{callsEnabled ? "Receive a call if your enquiry is urgent" : "Receive an instant email confirmation"}</li>
          </ol>
        </div>
        <form ref={formRef} className="contact-form enquiry-form" onSubmit={submitEnquiry} noValidate>
          <p className="form-note">All fields are required.</p>
          <div className="form-row">
            <div className="field"><label htmlFor="first-name">First name<input id="first-name" name="firstName" type="text" autoComplete="given-name" required {...fieldProps("firstName", errors)} /></label><FieldError name="firstName" errors={errors} /></div>
            <div className="field"><label htmlFor="business-name">Business name<input id="business-name" name="businessName" type="text" autoComplete="organization" required {...fieldProps("businessName", errors)} /></label><FieldError name="businessName" errors={errors} /></div>
          </div>
          <div className="field"><label htmlFor="email-address">Email address<input id="email-address" name="email" type="email" autoComplete="email" placeholder="name@business.co.uk" required {...fieldProps("email", errors)} /></label><FieldError name="email" errors={errors} /></div>
          <div className="field"><label htmlFor="mobile-number">Mobile number<input id="mobile-number" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="07 or +44 7" required {...fieldProps("mobile", errors, "mobile-help")} /></label><FieldError name="mobile" errors={errors} /><p className="field-help" id="mobile-help">A UK mobile number beginning 07 or +44 7.</p></div>
          <div className="field"><label htmlFor="enquiry">Your enquiry<textarea id="enquiry" name="enquiry" rows={7} required {...fieldProps("enquiry", errors)} /></label><FieldError name="enquiry" errors={errors} /></div>
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}><label htmlFor="enquiry-website">Website<input id="enquiry-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" /></label></div>
          {callsEnabled ? <>
          <fieldset className="urgency-field" style={{ margin: "0 0 12px", padding: 0, border: 0 }}>
            <legend style={{ marginBottom: 12, color: "var(--navy-2)", fontSize: 14, fontWeight: 700 }}>How urgent is your enquiry?</legend>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 9, margin: "0 28px 0 0", fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input style={{ width: 18, height: 18, margin: 0 }} name="urgency" type="radio" value="normal" defaultChecked onChange={() => setUrgent(false)} /> Normal</label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: 9, margin: 0, fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input style={{ width: 18, height: 18, margin: 0 }} name="urgency" type="radio" value="urgent" onChange={() => setUrgent(true)} /> Urgent</label>
          </fieldset>
          <p className="field-help urgency-help" style={{ margin: "0 0 16px" }}>Select Urgent if you need a prompt response. Our AI assistant will call the mobile number you provided.</p>
          {urgent && <label htmlFor="call-consent" style={{ display: "flex", alignItems: "flex-start", gap: 10, margin: "0 0 20px", fontSize: 14, letterSpacing: 0, textTransform: "none", cursor: "pointer" }}><input id="call-consent" style={{ width: 18, height: 18, margin: "2px 0 0", flex: "none" }} name="consent" type="checkbox" value="yes" required {...fieldProps("consent", errors)} /> {CALL_CONSENT_TEXT}</label>}
          {urgent && <FieldError name="consent" errors={errors} />}
          </> : <p className="field-help urgency-help" style={{ margin: "0 0 20px" }}>{PRIORITY_NOTE}</p>}
          <Turnstile onToken={setTurnstileToken} resetKey={turnstileKey} />
          <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Sending…" : "Send my enquiry"}</button>
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
