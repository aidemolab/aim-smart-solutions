"use client";

import { withBase } from "@/lib/base-path";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { callFunction } from "@/lib/supabase-functions";
import "./booking.css";

type BookingState = "loading" | "ready" | "submitting" | "success" | "error";

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

  // State is only set once the request settles, never synchronously inside the effect.
  function showSlots(request: Promise<string[]>) {
    request.then(
      (loaded) => { setSlots(loaded); setState("ready"); },
      (error: unknown) => { setState("error"); setMessage(error instanceof Error ? error.message : "Available times could not be loaded."); },
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
    if (!selectedSlot || state === "submitting") return;
    const form = new FormData(event.currentTarget);
    setState("submitting");
    setMessage("");
    try {
      const { status, result } = await callFunction("appointment-booking", { action: "book", name: form.get("name"), businessName: form.get("businessName"), email: form.get("email"), mobile: form.get("mobile"), jobDescription: form.get("jobDescription"), appointmentAt: selectedSlot });
      if (status >= 400 || !result?.ok) throw new Error(result?.message || "Your appointment could not be booked.");
      setState("success");
      setMessage(`Your appointment is confirmed for ${formatSlot(String(result.appointmentAt ?? selectedSlot))}. A confirmation email has been sent.`);
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Your appointment could not be booked.");
    }
  }

  return (
    <main id="top">
      <header className="site-header">
        <Link className="brand" href="/" aria-label="AIM Smart Solutions home"><img src={withBase("/aim-smart-solutions-logo.png")} alt="AIM Smart Solutions — Business Growth & Automation" /></Link>
        <nav aria-label="Main navigation"><Link href="/#outcomes">Outcomes</Link><Link href="/#solutions">Solutions</Link><Link href="/#proof">Proof</Link><Link href="/#fit">Is this for you?</Link><Link href="/#about">Why AIM</Link><Link href="/#faq">Questions</Link></nav>
        <Link className="nav-cta" href="/book-appointment" aria-current="page">Book your free call</Link>
      </header>

      <section className="section booking-page">
        <div className="booking-copy">
          <p className="kicker">Free AI Opportunity Call</p>
          <h1>Find the first improvement <em>worth making.</em></h1>
          <p>Choose an available consultation. We will discuss one costly bottleneck, connect it to a business outcome and identify a practical next step. There is no fee and no obligation.</p>
          <ul className="booking-value"><li>✓ Bring one process that is losing time, customers or clarity</li><li>✓ Talk directly with Alaa—not a sales team</li><li>✓ Leave with a focused next step, even if we do not work together</li></ul>
        </div>

        <form className="contact-form booking-form" onSubmit={submitBooking}>
          {state !== "success" && <>
            <div className="form-row">
              <label htmlFor="booking-name">Name<input id="booking-name" name="name" autoComplete="name" required /></label>
              <label htmlFor="booking-business">Business Name<input id="booking-business" name="businessName" autoComplete="organization" /></label>
            </div>
            <div className="form-row">
              <label htmlFor="booking-email">Email Address<input id="booking-email" name="email" type="email" autoComplete="email" required /></label>
              <label htmlFor="booking-mobile">Mobile Number<input id="booking-mobile" name="mobile" type="tel" autoComplete="tel" required /></label>
            </div>
            <label htmlFor="booking-job">What is the biggest bottleneck in your business?<textarea id="booking-job" name="jobDescription" rows={4} placeholder="For example: slow enquiry follow-up, repeated quotation work, appointment administration or unclear reporting." required /></label>
            <fieldset className="slot-field">
              <legend>Available appointment times</legend>
              {state === "loading" && <p className="slot-loading">Loading available times…</p>}
              {state !== "loading" && slots.length === 0 && <p className="slot-loading">No appointment times are currently available.</p>}
              <div className="slot-grid">{slots.map((slot) => <button key={slot} type="button" className={selectedSlot === slot ? "selected" : ""} onClick={() => setSelectedSlot(slot)}>{formatSlot(slot)}</button>)}</div>
            </fieldset>
            <p className="booking-reassurance">Your details are used only to arrange and prepare for this conversation.</p>
            <button type="submit" disabled={!selectedSlot || state === "submitting"}>{state === "submitting" ? "Booking…" : "Book my free AI Opportunity Call"}<span>→</span></button>
          </>}
          {message && <p className={`submission-message ${state}`} role="status" aria-live="polite">{message}</p>}
          {state === "error" && <button className="retry-button" type="button" onClick={loadSlots}>Reload available times</button>}
        </form>
      </section>

      <footer>
        <Link className="footer-brand" href="/"><img src={withBase("/aim-smart-solutions-logo.png")} alt="AIM Smart Solutions" /></Link>
        <p>Practical AI and automation that helps service businesses win more opportunities, serve customers faster and release capacity for growth.</p>
        <nav aria-label="Footer navigation"><Link href="/#outcomes">Outcomes</Link><Link href="/#solutions">Solutions</Link><Link href="/#proof">Proof</Link><Link href="/instant-quote">Request a proposal</Link><Link href="/business-enquiry">Live enquiry demo</Link></nav>
        <small>© {new Date().getFullYear()} AIM Smart Solutions. All rights reserved.</small>
      </footer>
    </main>
  );
}
