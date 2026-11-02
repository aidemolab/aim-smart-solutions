"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import FieldError from "../components/FieldError";
import { checkFields, fieldProps, focusFirstError, type FieldErrors } from "@/lib/form-errors";
import PrivacyNote from "../components/PrivacyNote";
import ContactCrumbs from "../components/ContactCrumbs";
import { BOOKING_CTA } from "@/lib/site";
import { callFunction, CONTACT_EMAIL, HONEYPOT_FIELD } from "@/lib/supabase-functions";
import "./booking.css";

type BookingState = "loading" | "slow" | "ready" | "slotsError" | "submitting" | "success" | "error";

// The calendar is kept warm (.github/workflows/warm-booking.yml), but if times take over 8 seconds
// the page says they are still loading and offers the email address; they appear when they arrive.
// Only a failed request shows the "couldn't load" message and a "Try again" button.
const SLOW_AFTER_MS = 8000;
const SLOTS_FAILED = `We couldn't load the available times. Please try again or email ${CONTACT_EMAIL}.`;

const formatSlot = (slot: string) => new Intl.DateTimeFormat("en-GB", {
  weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/London",
}).format(new Date(slot));

async function fetchSlots(): Promise<string[]> {
  const { status, result } = await callFunction("appointment-booking", { action: "availability" });
  if (status >= 400 || !result?.ok) throw new Error(result?.message || "Available times could not be loaded.");
  return Array.isArray(result.slots) ? result.slots : [];
}

export default function BookAppointmentPage() {
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [state, setState] = useState<BookingState>("loading");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const formRef = useRef<HTMLFormElement>(null);

  // State is only set once the request settles, never synchronously inside the effect.
  function showSlots(request: Promise<string[]>) {
    const timer = window.setTimeout(() => setState((current) => (current === "loading" ? "slow" : current)), SLOW_AFTER_MS);
    request.then(
      (loaded) => { window.clearTimeout(timer); setSlots(loaded); setState("ready"); setMessage(""); },
      () => { window.clearTimeout(timer); setState("slotsError"); setMessage(SLOTS_FAILED); },
    );
  }

  function loadSlots() {
    setState("loading");
    setMessage("");
    showSlots(fetchSlots());
  }

  useEffect(() => { showSlots(fetchSlots()); }, []);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "submitting") return;
    const form = new FormData(event.currentTarget);
    const found = checkFields(Object.fromEntries(form), [
      { name: "name", empty: "Enter your name." },
      { name: "email", empty: "Enter your email address.", kind: "email" },
      { name: "mobile", empty: "Enter your UK mobile number.", kind: "mobile" },
      { name: "jobDescription", empty: "Tell us the biggest bottleneck in your business, in a sentence or two." },
    ]);
    if (!selectedSlot) found.slot = state === "ready" && slots.length === 0
      ? `No times are free right now. Email ${CONTACT_EMAIL} and we will find a time with you.`
      : "Choose one of the available times above.";
    setErrors(found);
    if (Object.keys(found).length) { focusFirstError(formRef.current, found); return; }
    setState("submitting");
    setMessage("");
    try {
      const { status, result } = await callFunction("appointment-booking", { action: "book", name: form.get("name"), businessName: form.get("businessName"), email: form.get("email"), mobile: form.get("mobile"), jobDescription: form.get("jobDescription"), appointmentAt: selectedSlot, website: String(form.get(HONEYPOT_FIELD) ?? "") });
      if (status >= 400 || !result?.ok) throw new Error(result?.message || "Your appointment could not be booked.");
      setState("success");
      setMessage(`Your appointment is confirmed for ${formatSlot(String(result.appointmentAt ?? selectedSlot))}. A confirmation email has been sent.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Your appointment could not be booked.");
    }
  }

  return (
    <main id="main">
      <section className="section booking-page">
        <div className="booking-copy">
          <ContactCrumbs name={BOOKING_CTA.label} path="/book-appointment/" />
          <h1>Find the first improvement worth making.</h1>
          <p>Choose an available consultation. We will discuss one costly bottleneck, connect it to a business outcome and identify a clear next step. There is no fee and no obligation.</p>
          <ul className="booking-value"><li>✓ Bring one process that is losing time, customers or clarity</li><li>✓ Talk directly with the person who builds your solution, not a sales team</li><li>✓ Leave with a focused next step, even if we do not work together</li></ul>
        </div>

        <form ref={formRef} className="contact-form booking-form" onSubmit={submitBooking} noValidate>
          {state !== "success" && <>
            <div className="form-row">
              <div className="field"><label htmlFor="booking-name">Name<input id="booking-name" name="name" autoComplete="name" required {...fieldProps("name", errors)} /></label><FieldError name="name" errors={errors} /></div>
              <div className="field"><label htmlFor="booking-business">Business name <span className="optional">(optional)</span><input id="booking-business" name="businessName" autoComplete="organization" /></label></div>
            </div>
            <div className="form-row">
              <div className="field"><label htmlFor="booking-email">Email address<input id="booking-email" name="email" type="email" autoComplete="email" placeholder="name@business.co.uk" required {...fieldProps("email", errors)} /></label><FieldError name="email" errors={errors} /></div>
              <div className="field"><label htmlFor="booking-mobile">Mobile number<input id="booking-mobile" name="mobile" type="tel" inputMode="tel" autoComplete="tel" placeholder="07 or +44 7" required {...fieldProps("mobile", errors)} /></label><FieldError name="mobile" errors={errors} /></div>
            </div>
            <div className="field"><label htmlFor="booking-job">What is the biggest bottleneck in your business?<textarea id="booking-job" name="jobDescription" rows={4} placeholder="For example: slow enquiry follow-up, repeated quotation work, appointment administration or unclear reporting." required {...fieldProps("jobDescription", errors)} /></label><FieldError name="jobDescription" errors={errors} /></div>
            <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}><label htmlFor="booking-website">Website<input id="booking-website" name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" /></label></div>
            <fieldset className="slot-field">
              <legend>Available appointment times</legend>
              {state === "loading" && <><p className="slot-loading" role="status">Loading available times…</p><div className="slot-grid slot-placeholders" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <span key={i} />)}</div></>}
              {state === "slow" && <div className="slot-slow" role="status"><p className="slot-loading">Still loading available times…</p><p className="slot-fallback">If they do not appear, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will find a time with you.</p></div>}
              {state === "ready" && slots.length === 0 && <p className="slot-loading">No appointment times are currently available.</p>}
              <div className="slot-grid" data-field="slot" tabIndex={-1} aria-describedby={errors.slot ? "slot-error" : undefined}>{slots.map((slot) => <button key={slot} type="button" className={selectedSlot === slot ? "selected" : ""} aria-pressed={selectedSlot === slot} onClick={() => { setSelectedSlot(slot); setErrors((current) => { const next = { ...current }; delete next.slot; return next; }); }}>{formatSlot(slot)}</button>)}</div>
              <FieldError name="slot" errors={errors} />
            </fieldset>
            <p className="booking-reassurance">Your details are used only to arrange and prepare for this conversation.</p>
            <button type="submit" disabled={state === "submitting"}>{state === "submitting" ? "Booking…" : "Book my free AI Opportunity Call"}</button>
          </>}
          {message && <p className={`submission-message ${state === "slotsError" ? "error" : state}`} role="status" aria-live="polite">{message}</p>}
          {state === "slotsError" && <button className="retry-button" type="button" onClick={loadSlots}>Try again</button>}
          {state === "error" && <button className="retry-button" type="button" onClick={loadSlots}>Reload available times</button>}
          <PrivacyNote text="We use your details only to arrange and prepare for this call." />
        </form>
      </section>
    </main>
  );
}
